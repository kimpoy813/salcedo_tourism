import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";
import { isKnownSetupPassword } from "@/lib/admin-security";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(100),
});

export async function POST(req: Request) {
  const auth = await requireAdminApiAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const limit = checkRateLimit(getClientThrottleKey(req, "admin_password"), 8, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many password attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const parsed = passwordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter your current password and a new password of at least 12 characters." },
        { status: 400 }
      );
    }
    if (isKnownSetupPassword(parsed.data.newPassword)) {
      return NextResponse.json(
        { error: "Choose a password that is not used by the default setup accounts." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const [user] = await db
      .select({ id: schema.adminUsers.id, passwordHash: schema.adminUsers.passwordHash })
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, auth.principal.id))
      .limit(1);

    if (!user || !verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
    }

    await db
      .update(schema.adminUsers)
      .set({ passwordHash: hashPassword(parsed.data.newPassword), updatedAt: new Date() })
      .where(eq(schema.adminUsers.id, user.id));

    await recordAuditLog({
      principal: auth.principal,
      action: "admin.password.change",
      targetType: "admin_user",
      targetId: user.id,
      summary: `Administrator '${auth.principal.username}' changed their password.`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/admin/auth/password]", error);
    return NextResponse.json({ error: "The password could not be changed." }, { status: 500 });
  }
}
