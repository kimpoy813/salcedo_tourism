import path from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import ws from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

async function runMigrations() {
  const ifDbOnly = process.argv.includes("--if-db");
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (!connectionString || (!connectionString.startsWith("postgres://") && !connectionString.startsWith("postgresql://"))) {
    if (ifDbOnly) {
      console.log("[db:migrate] No PostgreSQL DATABASE_URL set; skipping remote Neon migration.");
      return;
    }
    console.log("[db:migrate] Initializing local PGlite migration check...");
    const { getDb } = await import("./index");
    await getDb();
    console.log("[db:migrate] Local PGlite schema up to date.");
    return;
  }

  console.log("[db:migrate] Running Drizzle migrations against Neon PostgreSQL...");
  const pool = new Pool({ connectionString });
  try {
    const db = drizzle(pool);
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
    console.log("[db:migrate] Neon PostgreSQL migrations completed successfully.");
  } finally {
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("[db:migrate] Migration failed:", err);
  process.exit(1);
});
