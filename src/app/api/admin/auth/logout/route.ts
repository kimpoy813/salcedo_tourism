import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, getAdminSession, recordAuditLog } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const principal = await getAdminSession();
  if (principal) {
    await recordAuditLog({
      principal,
      action: "admin.logout",
      targetType: "admin_user",
      targetId: principal.id,
      summary: `Administrator '${principal.username}' signed out.`,
    });
  }

  const res = NextResponse.json({ loggedOut: true });
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
