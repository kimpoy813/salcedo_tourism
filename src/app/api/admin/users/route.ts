import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { hashPassword } from "@/lib/crypto";
import { recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApiAuth("admin.users.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const db = await getDb();
  const [users, roles, assignments] = await Promise.all([
    db
      .select({
        id: schema.adminUsers.id,
        username: schema.adminUsers.username,
        email: schema.adminUsers.email,
        fullName: schema.adminUsers.fullName,
        isActive: schema.adminUsers.isActive,
        lastLoginAt: schema.adminUsers.lastLoginAt,
        createdAt: schema.adminUsers.createdAt,
      })
      .from(schema.adminUsers),
    db.select().from(schema.roles),
    db.select().from(schema.adminRoleAssignments),
  ]);

  const roleMap = new Map(roles.map((r) => [r.id, r]));
  const userRolesMap = new Map<string, Array<{ id: string; slug: string; name: string }>>();
  for (const a of assignments) {
    const role = roleMap.get(a.roleId);
    if (!role) continue;
    const arr = userRolesMap.get(a.adminUserId) ?? [];
    arr.push({ id: role.id, slug: role.slug, name: role.name });
    userRolesMap.set(a.adminUserId, arr);
  }

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      roles: userRolesMap.get(u.id) ?? [],
    })),
    roles,
  });
}

const createAdminSchema = z.object({
  username: z.string().trim().min(3).max(60),
  email: z.string().trim().email(),
  fullName: z.string().trim().min(2).max(120),
  password: z.string().min(8).max(100),
  roleSlug: z.enum(["super_admin", "tourism_admin", "content_editor", "visitor_data_officer"]),
});

export async function POST(req: Request) {
  const auth = await requireAdminApiAuth("admin.users.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = createAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid administrator account fields.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [role] = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.slug, parsed.data.roleSlug))
      .limit(1);

    if (!role) {
      return NextResponse.json({ error: "Selected role not found." }, { status: 400 });
    }

    const created = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(schema.adminUsers)
        .values({
          username: parsed.data.username,
          email: parsed.data.email,
          fullName: parsed.data.fullName,
          passwordHash: hashPassword(parsed.data.password),
          isActive: true,
        })
        .returning({
          id: schema.adminUsers.id,
          username: schema.adminUsers.username,
          email: schema.adminUsers.email,
          fullName: schema.adminUsers.fullName,
        });

      await tx.insert(schema.adminRoleAssignments).values({
        adminUserId: user.id,
        roleId: role.id,
      });

      return user;
    });

    await recordAuditLog({
      principal: auth.principal,
      action: "admin.user.create",
      targetType: "admin_user",
      targetId: created.id,
      summary: `Created admin account '${created.username}' with role '${role.name}'.`,
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/users]", err);
    return NextResponse.json({ error: "Failed to create admin user." }, { status: 500 });
  }
}
