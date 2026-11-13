import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE_NAME,
  authenticateAdminCredentials,
  recordAuditLog,
  signAdminToken,
} from "@/lib/admin-auth";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

export async function POST(req: Request) {
  try {
    const rl = checkRateLimit(getClientThrottleKey(req, "admin_login"), 12, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const principal = await authenticateAdminCredentials(
      parsed.data.username,
      parsed.data.password
    );
    if (!principal) {
      return NextResponse.json(
        { error: "Invalid administrator username or password." },
        { status: 401 }
      );
    }

    const token = await signAdminToken(principal.id, principal.username);
    await recordAuditLog({
      principal,
      action: "admin.login",
      targetType: "admin_user",
      targetId: principal.id,
      summary: `Administrator '${principal.username}' signed in.`,
    });

    const res = NextResponse.json({
      user: {
        id: principal.id,
        username: principal.username,
        email: principal.email,
        fullName: principal.fullName,
        roles: principal.roles,
        permissions: principal.permissions,
      },
    });

    const isHttps =
      req.headers.get("x-forwarded-proto") === "https" ||
      req.url.startsWith("https://");

    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (err) {
    console.error("[POST /api/admin/auth/login]", err);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
