import path from "node:path";
import fs from "node:fs";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

export type AppDatabase = NeonDatabase<typeof schema>;

// Configure WebSocket constructor for Neon serverless Pool in Node.js runtimes
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

type GlobalDbState = {
  __cedoPool?: Pool;
  __cedoDb?: AppDatabase;
  __cedoPgliteClient?: unknown;
  __cedoInitPromise?: Promise<AppDatabase>;
  __cedoSeeded?: boolean;
  __cedoSeedPromise?: Promise<void>;
};

const g = globalThis as unknown as GlobalDbState;

async function ensureDatabaseSeeded(db: AppDatabase): Promise<void> {
  if (g.__cedoSeeded || process.env.SKIP_AUTO_SEED === "true") {
    return;
  }
  if (!g.__cedoSeedPromise) {
    g.__cedoSeedPromise = (async () => {
      const [existingBrgy, existingSession] = await Promise.all([
        db.select({ id: schema.barangays.id }).from(schema.barangays).limit(1),
        db.select({ id: schema.anonymousSessions.id }).from(schema.anonymousSessions).limit(1),
      ]);
      const { seedDatabase, seedSampleActivityData } = await import("./seed-core");
      if (existingBrgy.length === 0) {
        await seedDatabase(db);
      }
      if (existingSession.length === 0 && !process.env.VITEST) {
        await seedSampleActivityData(db);
      }
      g.__cedoSeeded = true;
    })();
  }
  await g.__cedoSeedPromise;
}

function getNeonConnectionString(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return undefined;
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return url;
  }
  return undefined;
}

async function createPgliteDb(): Promise<AppDatabase> {
  if (g.__cedoDb) return g.__cedoDb;

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const { migrate: migratePglite } = await import("drizzle-orm/pglite/migrator");

  const dataDir =
    process.env.PGLITE_DATA_DIR ||
    path.join(process.cwd(), ".local-pgdata");

  if (dataDir !== "memory://") {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const client = dataDir === "memory://" ? new PGlite() : new PGlite(dataDir);
  await client.waitReady;

  const pgliteDb = drizzlePglite(client, { schema });
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (fs.existsSync(migrationsFolder)) {
    await migratePglite(pgliteDb, { migrationsFolder });
  }

  g.__cedoPgliteClient = client;
  g.__cedoDb = pgliteDb as unknown as AppDatabase;

  // Idempotent seed on first local PGlite boot if database has no barangays or sample activity yet
  await ensureDatabaseSeeded(g.__cedoDb);

  return g.__cedoDb;
}

export async function getDb(): Promise<AppDatabase> {
  const neonUrl = getNeonConnectionString();
  if (neonUrl) {
    if (!g.__cedoDb) {
      const pool = new Pool({ connectionString: neonUrl });
      g.__cedoPool = pool;
      g.__cedoDb = drizzleNeon(pool, { schema });
    }
    await ensureDatabaseSeeded(g.__cedoDb);
    return g.__cedoDb;
  }

  // Explicitly disallow PGlite in real Vercel production without DATABASE_URL
  if (process.env.VERCEL_ENV === "production" && !process.env.USE_PGLITE) {
    throw new Error(
      "DATABASE_URL is required in production to connect to Neon Serverless PostgreSQL."
    );
  }

  if (!g.__cedoInitPromise) {
    g.__cedoInitPromise = createPgliteDb();
  }
  return g.__cedoInitPromise;
}

export async function resetLocalTestDb(dbInstance: AppDatabase): Promise<void> {
  g.__cedoDb = dbInstance;
  g.__cedoInitPromise = Promise.resolve(dbInstance);
  g.__cedoSeeded = true;
}

export { schema };
