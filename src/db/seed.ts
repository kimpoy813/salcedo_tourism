import { getDb } from "./index";
import { seedDatabase } from "./seed-core";

async function main() {
  console.log("[db:seed] Seeding Project CEDO: Turi App database...");
  const db = await getDb();
  await seedDatabase(db);
  console.log("[db:seed] Seed completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[db:seed] Seed failed:", err);
  process.exit(1);
});
