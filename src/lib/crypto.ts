import crypto from "node:crypto";

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 chars (no 0/O/1/I ambiguity)

export function generateRandomToken(byteLength = 24): string {
  return crypto.randomBytes(byteLength).toString("base64url");
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const [, salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, "hex");
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

/**
 * Generates a high-entropy private retrieval code formatted as SALCEDO-XXXX-XXXX-XXXX
 * (12 characters from 32-char unambiguous alphabet = 60 bits of CSPRNG entropy).
 */
export function generateRetrievalCode(): string {
  const bytes = crypto.randomBytes(12);
  let chars = "";
  for (let i = 0; i < 12; i++) {
    chars += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `SALCEDO-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export function normalizeRetrievalCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function hashRetrievalCode(code: string, existingSalt?: string): {
  codeHash: string;
  codeSalt: string;
} {
  const normalized = normalizeRetrievalCode(code);
  const codeSalt = existingSalt ?? crypto.randomBytes(16).toString("hex");
  const codeHash = crypto.scryptSync(normalized, codeSalt, 32).toString("hex");
  return { codeHash, codeSalt };
}

export function verifyRetrievalCode(
  candidateCode: string,
  storedHash: string,
  storedSalt: string
): boolean {
  const normalized = normalizeRetrievalCode(candidateCode);
  const derived = crypto.scryptSync(normalized, storedSalt, 32);
  const original = Buffer.from(storedHash, "hex");
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}
