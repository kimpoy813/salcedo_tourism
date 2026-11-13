import { getDb } from "./index";
import { seedDatabase, seedSampleActivityData } from "./seed-core";

async function main() {
  const ifDbOnly = process.argv.includes("--if-db");
  const connectionString =
    process.env.DATABASE_URL?.trim() ||
    process.env.DATABASE_URL_UNPOOLED?.trim();

  if (
    ifDbOnly &&
    (!connectionString ||
      (!connectionString.startsWith("postgres://") &&
        !connectionString.startsWith("postgresql://")))
  ) {
    console.log("[db:seed] No PostgreSQL DATABASE_URL set; skipping remote Neon seed.");
    process.exit(0);
  }

  console.log("[db:seed] Seeding Project CEDO: Turi App database...");
  const db = await getDb();
  await seedDatabase(db);
  await seedSampleActivityData(db);
  console.log("[db:seed] Seed completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[db:seed] Seed failed:", err);
  process.exit(1);
});
