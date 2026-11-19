/**
 * Rotates one administrator password against the configured PostgreSQL
 * database. Run this before deploying the setup-password block, or whenever a
 * staff account changes hands.
 *
 *   read -s -p "New password: " PW
 *   printf '%s' "$PW" | npm run admin:rotate -- cedo_superadmin --password-stdin
 *
 * The password is never printed. The local PGlite database is used only when
 * --local is passed explicitly.
 */
import { eq } from "drizzle-orm";
import { getDb, schema } from "../src/db";
import { hashPassword } from "../src/lib/crypto";
import { isKnownSetupPassword } from "../src/lib/admin-security";

async function readPassword(): Promise<string> {
  if (process.argv.includes("--password-stdin")) {
    let value = "";
    for await (const chunk of process.stdin) value += chunk.toString();
    return value.trim();
  }
  return process.env.ADMIN_NEW_PASSWORD?.trim() ?? "";
}

async function main() {
  const username = process.argv[2]?.trim();
  if (!username || username.startsWith("--")) {
    throw new Error("Usage: npm run admin:rotate -- <username> [--password-stdin] [--local]");
  }

  const local = process.argv.includes("--local");
  const connection =
    process.env.DATABASE_URL?.trim() || process.env.DATABASE_URL_UNPOOLED?.trim();
  if (!local && !/^postgres(ql)?:\/\//.test(connection ?? "")) {
    throw new Error(
      "Set DATABASE_URL to the production PostgreSQL database before rotating, or pass --local for development."
    );
  }

  const password = await readPassword();
  if (!password) {
    throw new Error("No password supplied. Pipe one with --password-stdin or set ADMIN_NEW_PASSWORD.");
  }
  if (password.length < 12) {
    throw new Error("Use at least 12 characters.");
  }
  if (isKnownSetupPassword(password)) {
    throw new Error("That is a published setup password. Choose a new one.");
  }

  const db = await getDb();
  const [user] = await db
    .select({ id: schema.adminUsers.id, username: schema.adminUsers.username })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.username, username))
    .limit(1);

  if (!user) {
    throw new Error(`No administrator named '${username}'.`);
  }

  await db
    .update(schema.adminUsers)
    .set({ passwordHash: hashPassword(password), updatedAt: new Date() })
    .where(eq(schema.adminUsers.id, user.id));

  console.log(`Password rotated for '${user.username}'.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(`[admin:rotate] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
