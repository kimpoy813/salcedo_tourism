import { test, expect } from "@playwright/test";

test("search from the cover, save a directory entry and open its location", async ({ page }) => {
  await page.goto("/app/");
  await expect(page.getByRole("heading", { name: "Visit Salcedo", exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Find a place" }).fill("Baluarte Falls");
  await page.getByRole("button", { name: "Search places" }).click();
  const entry = page.getByRole("table",{name:"Published destinations"}).locator("tbody tr");
  await expect(entry).toHaveCount(1);
  await entry.getByRole("button", { name: /^Save Baluarte/ }).click();
  await expect(entry.getByRole("button", { name: /^Unsave Baluarte/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await entry.getByRole("button", { name: /^Add to trip: Baluarte/ }).click();
  await expect(entry.getByRole("link", { name: "In my trip" })).toBeVisible();
  await entry.getByRole("rowheader").getByRole("link").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Baluarte Falls");
  await page.getByRole("button", {name:/View gallery/}).click();
  const gallery=page.getByRole("dialog",{name:/Image gallery/});
  await expect(gallery.getByText(/Illustration 1 of/)).toBeVisible();
  await gallery.getByRole("button", {name:"Next image"}).click();
  await expect(gallery.getByText(/Illustration 2 of/)).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(gallery.getByText(/Illustration 1 of/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", {name:/View gallery/})).toBeFocused();
  await page.locator(".place-locator").getByRole("link", { name: "Open map" }).click();
  await expect(page.locator(".atlas-preview h2")).toHaveText("Baluarte Falls");
  await expect(
    page.locator(".atlas-preview").getByRole("link", { name: "In my trip" }),
  ).toBeVisible();
});


test("directory filters and sorting survive a reload, including the phone layout", async ({page}) => {
  await page.goto('/app/discover');
  await page.getByRole('button',{name:'Filters',exact:true}).click();
  const dialog = page.getByRole('dialog',{name:'Filter destinations'});
  await dialog.locator('#filter-interest').selectOption('stays');
  await dialog.getByLabel('Barangay',{exact:true}).selectOption('ubbog');
  await dialog.getByRole('button',{name:'Apply filters'}).click();
  const rows=page.locator('.place-register tbody tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first().getByRole('link',{name:'Bago Resort'})).toBeVisible();
  await page.getByLabel('Sort destinations').selectOption('name');
  await page.reload();
  await expect(rows).toHaveCount(1);
  await expect(page.getByLabel('Sort destinations')).toHaveValue('name');
  await page.getByRole('button',{name:'Remove Brgy. Ubbog filter'}).click();
  await expect(rows.nth(1)).toBeVisible();
});

test("a suggested route retains the named stops and their artwork on this device", async ({page})=>{
  await page.goto('/app/trips');
  const route=page.getByRole('button',{name:/^Falls & springs/});
  await expect(route).toContainText('Baluarte Falls · Kinbandiw Falls · Bago Resort');
  await route.click();
  await expect(page.getByLabel('Itinerary name')).toHaveValue('Salcedo Falls & Springs Day');
  await page.reload();
  for(const slug of ['baluarte-falls-agila-falls','kinbandiw-falls','bago-resort-spring-water']) {
    await expect(page.locator(`.trip-workspace a[href="/app/places/${slug}"]`).first()).toBeVisible();
  }
  const images=page.locator('.stop-thumb');
  await expect(images).toHaveCount(3);
  await expect(images.first()).toHaveAttribute('src','/app/art/baluarte-falls-thumb.webp');
});
