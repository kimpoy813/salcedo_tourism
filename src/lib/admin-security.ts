/**
 * The four accounts created by the seed script used to carry fixed passwords
 * in source. Those values are public, so they must never authenticate a
 * production session. New deployments are seeded only from explicit env vars.
 */
export const SEEDED_ADMIN_ACCOUNTS = [
  {
    usernameEnv: "ADMIN_USERNAME",
    defaultUsername: "cedo_superadmin",
    passwordEnv: "ADMIN_PASSWORD",
    developmentPassword: "SalcedoAdmin2026!",
    roleSlug: "super_admin",
  },
  {
    usernameEnv: "TOURISM_ADMIN_USERNAME",
    defaultUsername: "tourism_officer",
    passwordEnv: "TOURISM_ADMIN_PASSWORD",
    developmentPassword: "SalcedoTourism2026!",
    roleSlug: "tourism_admin",
  },
  {
    usernameEnv: "EDITOR_USERNAME",
    defaultUsername: "cedo_editor",
    passwordEnv: "EDITOR_PASSWORD",
    developmentPassword: "SalcedoEditor2026!",
    roleSlug: "content_editor",
  },
  {
    usernameEnv: "DATA_OFFICER_USERNAME",
    defaultUsername: "data_officer",
    passwordEnv: "DATA_OFFICER_PASSWORD",
    developmentPassword: "SalcedoDPO2026!",
    roleSlug: "visitor_data_officer",
  },
] as const;

const knownSetupPasswords = new Set<string>(
  SEEDED_ADMIN_ACCOUNTS.map((account) => account.developmentPassword)
);

export function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function isKnownSetupPassword(password: string): boolean {
  // Also reject the placeholders copied from .env.example.
  return knownSetupPasswords.has(password) || password.startsWith("ChangeMe-");
}

/** Returns null in production when the operator has not supplied a password. */
export function seedPasswordFor(
  envKey: string,
  developmentPassword: string
): string | null {
  const configured = process.env[envKey]?.trim();
  if (configured && configured.length >= 12) return configured;
  if (configured) {
    console.warn(`[admin] ${envKey} is shorter than 12 characters; ignoring it.`);
  }
  if (isProductionRuntime()) return null;
  return developmentPassword;
}

export function seedUsernameFor(envKey: string, fallback: string): string {
  return process.env[envKey]?.trim() || fallback;
}
