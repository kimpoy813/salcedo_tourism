import { test, expect } from "@playwright/test";
// Requires the production service worker (disabled by design on next dev).
test.use({ serviceWorkers: "allow" });
test("the installed atlas and Discover map open from a cold offline navigation", async ({
  page,
  context,
}) => {
  test.skip(
    !process.env.MAP_TEST_OFFLINE,
    "Run against npm start with MAP_TEST_OFFLINE=1",
  );
  test.setTimeout(70000);
  await page.goto("/app/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect
    .poll(() =>
      page.evaluate(
        async () => !!(await caches.match("/app/maps/salcedo-field.geojson")),
      ),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.goto("/app/");
  for (const [path, width] of [
    ["/images/salcedo/guide-valley.webp", 1408],
    ["/app/art/baluarte-falls-thumb.webp", 240],
    ["/app/art/baluarte-falls-cover.webp", 1024],
    ["/app/maps/valley-plate.webp", 1440],
    ["/app/maps/salcedo-relief.webp", 1024],
    ["/app/maps/salcedo-locator.webp", 1024],
    ["/images/salcedo/cacao-plate.webp", 500],
    ["/images/salcedo/municipal-seal.webp", 120],
  ] as const) {
    expect(
      await page.evaluate(async (url) => {
        const img = new Image();
        img.src = url;
        await img.decode();
        return img.naturalWidth;
      }, path),
    ).toBe(width);
  }
  await page.goto("/app/map?place=baluarte-falls-agila-falls");
  await expect(page.locator(".atlas-preview h2")).toHaveText("Baluarte Falls");
  await expect(page.locator(".atlas-surface canvas")).toBeAttached();
  const search = page.getByRole("combobox", { name: "Search the Salcedo map" });
  await search.fill("Buaya River");
  await expect(
    page.getByRole("option", { name: /Buaya River Waterway/ }),
  ).toBeVisible();
  await search.press("Enter");
  await expect(page.locator(".atlas-preview h2")).toHaveText("Buaya River");
  await page.goto("/app/discover?view=map");
  await expect(page.locator(".atlas-embed-head")).toBeVisible();
  await expect(page.locator(".atlas-surface canvas")).toBeAttached();
  await page.getByRole("button", { name: /Place index/ }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Place index" })
      .locator(".atlas-index li")
      .first(),
  ).toBeVisible();
});
