import { test, expect } from "@playwright/test";

test("search from the cover, save a directory entry and open its location", async ({ page }) => {
  await page.goto("/app/");
  await expect(page.getByRole("heading", { name: "Salcedo", exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search the place directory" }).fill("Baluarte Falls");
  await page.getByRole("button", { name: "Search destinations" }).click();
  const entry = page.locator(".directory-entries article");
  await expect(entry).toHaveCount(1);
  await entry.getByRole("button", { name: /^Save Baluarte/ }).click();
  await expect(entry.getByRole("button", { name: /^Unsave Baluarte/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await entry.getByRole("button", { name: /^Add to trip: Baluarte/ }).click();
  await expect(entry.getByRole("link", { name: "In my trip" })).toBeVisible();
  await entry.getByRole("heading").getByRole("link").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Baluarte Falls");
  // Seed data contains only representative artwork. Never present it as a site photo.
  await expect(page.getByRole("button", { name: "View photos fullscreen" })).toHaveCount(0);
  await page.locator(".place-locator").getByRole("link", { name: "Open map" }).click();
  await expect(page.locator(".atlas-preview h2")).toHaveText("Baluarte Falls");
  await expect(
    page.locator(".atlas-preview").getByRole("link", { name: "In my trip" }),
  ).toBeVisible();
});
