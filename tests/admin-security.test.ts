import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isKnownSetupPassword,
  seedPasswordFor,
  seedUsernameFor,
} from "../src/lib/admin-security";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("administrator bootstrap security", () => {
  it("recognises published setup passwords and env placeholders", () => {
    expect(isKnownSetupPassword("SalcedoAdmin2026!")).toBe(true);
    expect(isKnownSetupPassword("SalcedoTourism2026!")).toBe(true);
    expect(isKnownSetupPassword("ChangeMe-StrongPassword-2026!")).toBe(true);
    expect(isKnownSetupPassword("a genuinely new 12+ character password")).toBe(false);
  });

  it("does not invent a production seed password", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(seedPasswordFor("ADMIN_PASSWORD", "SalcedoAdmin2026!")).toBeNull();
  });

  it("keeps the documented development fallback outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "");
    expect(seedPasswordFor("ADMIN_PASSWORD", "SalcedoAdmin2026!")).toBe("SalcedoAdmin2026!");
  });

  it("uses a configured password and username when supplied", () => {
    vi.stubEnv("ADMIN_PASSWORD", "another strong password");
    vi.stubEnv("ADMIN_USERNAME", "tourism_lead");
    expect(seedPasswordFor("ADMIN_PASSWORD", "SalcedoAdmin2026!")).toBe("another strong password");
    expect(seedUsernameFor("ADMIN_USERNAME", "cedo_superadmin")).toBe("tourism_lead");
  });

  it("ignores a configured password shorter than 12 characters", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ADMIN_PASSWORD", "short");
    expect(seedPasswordFor("ADMIN_PASSWORD", "SalcedoAdmin2026!")).toBe("SalcedoAdmin2026!");
  });
});
