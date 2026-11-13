import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { verifyPassword } from "./crypto";

export const ADMIN_COOKIE_NAME = "cedo_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 hours

export interface AdminPrincipal {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

type GlobalSecretState = {
  __cedoDevAuthSecret?: Uint8Array;
};

function getAuthSecret(): Uint8Array {
  const configured = process.env.AUTH_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return new TextEncoder().encode(configured);
  }
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("AUTH_SECRET environment variable must be configured in production.");
  }
  const g = globalThis as unknown as GlobalSecretState;
  if (!g.__cedoDevAuthSecret) {
    g.__cedoDevAuthSecret = new TextEncoder().encode(
      "cedo-turi-local-dev-secret-override-in-production-env"
    );
  }
  return g.__cedoDevAuthSecret;
}

export async function signAdminToken(adminUserId: string, username: string): Promise<string> {
  return new SignJWT({ sub: adminUserId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<{ adminUserId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (!payload.sub || typeof payload.sub !== "string") return null;
    return {
      adminUserId: payload.sub,
      username: typeof payload.username === "string" ? payload.username : "",
    };
  } catch {
    return null;
  }
}

export async function loadAdminPrincipal(adminUserId: string): Promise<AdminPrincipal | null> {
  const db = await getDb();
  const [user] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, adminUserId))
    .limit(1);

  if (!user || !user.isActive) return null;

  const roleRows = await db
    .select({
      roleId: schema.roles.id,
      roleSlug: schema.roles.slug,
    })
    .from(schema.adminRoleAssignments)
    .innerJoin(schema.roles, eq(schema.adminRoleAssignments.roleId, schema.roles.id))
    .where(eq(schema.adminRoleAssignments.adminUserId, user.id));

  const permSet = new Set<string>();
  for (const r of roleRows) {
    const permRows = await db
      .select({ permSlug: schema.permissions.slug })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.rolePermissions.roleId, r.roleId));
    for (const p of permRows) permSet.add(p.permSlug);
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    roles: roleRows.map((r) => r.roleSlug),
    permissions: Array.from(permSet),
  };
}

export async function authenticateAdminCredentials(
  username: string,
  password: string
): Promise<AdminPrincipal | null> {
  const db = await getDb();
  const [user] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.username, username.trim()))
    .limit(1);

  if (!user || !user.isActive) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;

  await db
    .update(schema.adminUsers)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.adminUsers.id, user.id));

  return loadAdminPrincipal(user.id);
}

export async function getAdminSession(): Promise<AdminPrincipal | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    const verified = await verifyAdminToken(token);
    if (!verified) return null;
    return await loadAdminPrincipal(verified.adminUserId);
  } catch {
    return null;
  }
}

export function hasPermission(principal: AdminPrincipal, permission: string): boolean {
  if (principal.roles.includes("super_admin")) return true;
  return principal.permissions.includes(permission);
}

export async function requireAdminApiAuth(
  requiredPermission?: string
): Promise<
  | { ok: true; principal: AdminPrincipal }
  | { ok: false; status: 401 | 403; message: string }
> {
  const principal = await getAdminSession();
  if (!principal) {
    return { ok: false, status: 401, message: "Administrator authentication required." };
  }
  if (requiredPermission && !hasPermission(principal, requiredPermission)) {
    return {
      ok: false,
      status: 403,
      message: `Insufficient permissions: requires '${requiredPermission}'.`,
    };
  }
  return { ok: true, principal };
}

export async function recordAuditLog(params: {
  principal: AdminPrincipal | { id?: string | null; username: string };
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = await getDb();
  await db.insert(schema.auditLogs).values({
    adminUserId: params.principal.id ?? null,
    actorUsername: params.principal.username,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId ?? null,
    summary: params.summary,
    metadataJson: params.metadata ?? {},
  });
}
