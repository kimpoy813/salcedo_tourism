import { test as base, expect, type Page } from "@playwright/test";
const test = base.extend<{ runtimeCheck: void }>({
  runtimeCheck: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
const falls = "/app/map?place=baluarte-falls-agila-falls";
const preview = (p: Page) =>
  p.getByRole("region", { name: "Selected map location" });
async function openFilters(p: Page) {
  await p.getByRole("button", { name: "Filter map places" }).click();
  return p.getByRole("dialog", { name: "Filter map places" });
}
async function settle(p: Page) {
  await expect(p.locator(".atlas-marker").first()).toBeAttached();
  await expect(p.locator(".atlas-surface canvas")).toBeAttached();
}
async function index(p: Page) {
  const browse = p.getByRole("button", { name: /Browse \d+ places?/ });
  if (await browse.isVisible()) {
    await browse.click();
    return p.getByRole("dialog", { name: "Place index" });
  }
  return p.locator(".atlas-panel");
}

test("zoom a group, activate a pin with the keyboard and fit results again", async ({
  page,
}) => {
  await page.goto("/app/map");
  await settle(page);
  const cluster = page
    .getByRole("button", { name: /^Explore \d+ nearby places/ })
    .first();
  const scale = page.locator(".leaflet-control-scale-line");
  const before = await scale.textContent();
  await cluster.focus();
  await cluster.press("Enter");
  await expect(scale).not.toHaveText(before!);
  await page.getByRole("button", { name: "Fit visible places" }).click();
  await expect(scale).toHaveText(before!);
  const single = page.getByRole("button", {
    name: /^Show Baluarte Falls.*on map$/,
  });
  await single.focus();
  await single.press("Space");
  await expect(preview(page).getByRole("heading")).toHaveText("Baluarte Falls");
  await expect(preview(page).getByRole("heading")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(preview(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Fit visible places" }).click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(scale).not.toHaveText(before!);
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await expect(scale).toHaveText(before!);
});

test("rank, filter and search the local place, barangay and waterway index", async ({
  page,
}) => {
  let live = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/geo/search")) live++;
  });
  await page.goto("/app/map");
  await settle(page);
  const list = await index(page);
  await list.getByLabel("Sort map places").selectOption("top_rated");
  await list.locator(".atlas-index button").first().click();
  await expect(preview(page)).toBeVisible();
  let f = await openFilters(page);
  await f.getByLabel("Place type").selectOption("resort");
  await f.getByRole("button", { name: "Apply filters" }).click();
  await expect(preview(page)).toHaveCount(0);
  const search = page.getByRole("combobox", { name: "Search the Salcedo map" });
  await search.fill("Baluarte Falls");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(preview(page).getByRole("heading")).toHaveText("Baluarte Falls");
  await expect(page.getByLabel("Remove type filter")).toHaveCount(0);
  await search.fill("Buaya River");
  await search.press("Enter");
  await expect(preview(page).getByRole("heading")).toHaveText("Buaya River");
  await expect(page.locator(".atlas-found-marker")).toHaveCount(1);
  await search.fill("Ubbog");
  await search.press("Enter");
  await expect(page.getByLabel("Remove barangay filter")).toHaveText("Ubbog");
  await expect(preview(page)).toHaveCount(0);
  f = await openFilters(page);
  await f.getByLabel("Collection").selectOption("saved");
  await f.getByRole("button", { name: "Apply filters" }).click();
  await expect(
    page.getByRole("heading", { name: "No saved pins here" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all places" }).click();
  await expect(page.locator(".atlas-marker").first()).toBeAttached();
  expect(live).toBe(0);
});

test("deep links, directions, bookmarks and local trip stops agree", async ({
  page,
}) => {
  await page.goto(falls);
  const card = preview(page);
  await expect(card.getByRole("heading")).toHaveText("Baluarte Falls");
  await expect(
    card.getByRole("link", { name: /Directions in Google/ }),
  ).toHaveAttribute(
    "href",
    "https://www.google.com/maps/dir/?api=1&destination=17.0958,120.5262",
  );
  await card.getByRole("button", { name: /^Save Baluarte/ }).click();
  await expect(
    card.getByRole("button", { name: /^Unsave Baluarte/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await card.getByRole("button", { name: "Add to trip" }).click();
  await expect(card.getByRole("link", { name: "In my trip" })).toBeVisible();
  await page.reload();
  await expect(card.getByRole("link", { name: "In my trip" })).toBeVisible();
  await expect(
    card.getByRole("button", { name: /^Unsave Baluarte/ }),
  ).toBeVisible();
  await card.getByRole("link", { name: "In my trip" }).click();
  await expect(page).toHaveURL(/\/app\/trips/);
  await expect(page.getByText(/Baluarte Falls/).first()).toBeVisible();
  await page.goBack();
  await expect(card.getByRole("heading")).toHaveText("Baluarte Falls");
  await card.getByRole("link", { name: "View place" }).click();
  await expect(page).toHaveURL(/\/app\/places\/baluarte-falls-agila-falls/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Baluarte Falls",
  );
});

test("layers, explicit online lookup, failure fallback and local-only mode", async ({
  page,
  context,
}) => {
  await page.route("https://tile.openstreetmap.org/**", (r) =>
    r.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1cAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.route("https://*.tile.opentopomap.org/**", (r) => r.abort());
  await page.route("**/api/geo/search?**", (r) =>
    r.fulfill({
      json: {
        osmEnabled: true,
        results: [
          {
            id: "sample",
            label: "Online landmark",
            kind: "osm",
            latitude: 17.151,
            longitude: 120.536,
            subtitle: "OpenStreetMap result",
          },
        ],
      },
    }),
  );
  await page.goto("/app/map");
  await settle(page);
  await page.getByRole("button", { name: /Map layers\s*Field map/i }).click();
  const d = page.getByRole("dialog", { name: "Map layers" });
  // Only key-free basemaps are offered: the CARTO "Light" style was removed.
  await expect(d.getByRole("radio")).toHaveCount(4);
  await expect(d.getByRole("radio", { name: /^Light/ })).toHaveCount(0);
  await expect(d.getByLabel("3D relief")).toBeChecked();
  await d.getByLabel("Barangay boundaries").uncheck();
  await d.getByLabel("Map labels").uncheck();
  await d.getByRole("radio", { name: /^Street/ }).check();
  await d.getByRole("button", { name: "Done" }).click();
  // The map keeps Leaflet's container classes when the base map changes, and
  // real tiles must occupy space: a 1x1 fixture still reports as "loaded".
  await expect(page.locator(".atlas-surface")).toHaveClass(/leaflet-container/);
  const tile = page.locator(".leaflet-tile-loaded").first();
  await expect(tile).toBeAttached();
  // Fractional zoom scales tiles below 256px, but they must never collapse.
  await expect
    .poll(() => tile.evaluate((el) => el.getBoundingClientRect().width))
    .toBeGreaterThan(100);
  await expect(page.locator(".atlas-hillshade")).toBeAttached();
  const edge = page.locator(".atlas-municipal-edge").first();
  await expect(edge).toBeAttached();
  await expect
    .poll(() =>
      edge.evaluate((el) => parseFloat(getComputedStyle(el).strokeWidth)),
    )
    .toBeGreaterThan(2.4);
  await expect(page.locator(".atlas-lettering")).toHaveCount(0);
  await page.getByRole("button", { name: /Map layers\s*Street/i }).click();
  await d.getByRole("radio", { name: /^Terrain/ }).click();
  await d.getByRole("button", { name: "Done" }).click();
  await expect(
    page.getByRole("button", { name: /Map layers\s*Field map/i }),
  ).toBeVisible();
  await expect(page.getByText(/Terrain tiles couldn’t load/)).toBeVisible();
  await page.getByLabel("Dismiss layer message").click();
  const s = page.getByRole("combobox", { name: "Search the Salcedo map" });
  await s.fill("map fixture point");
  await page
    .getByRole("button", { name: "Search OpenStreetMap online" })
    .click();
  await page.getByRole("option", { name: /Online landmark/ }).click();
  await expect(preview(page).getByRole("heading")).toHaveText(
    "Online landmark",
  );
  await context.setOffline(true);
  await page.getByRole("button", { name: /Map layers\s*Field map/i }).click();
  await expect(d.getByRole("radio", { name: /^Satellite/ })).toBeDisabled();
  await page.keyboard.press("Escape");
  await s.fill("Buaya River");
  await expect(page.getByText("Offline · using the field index")).toBeVisible();
  await s.press("Enter");
  await expect(preview(page).getByRole("heading")).toHaveText("Buaya River");
});

test("device location is opt-in, bounded and remains local to the browser", async ({
  page,
  context,
}) => {
  const geo = { latitude: 17.15082, longitude: 120.53677, accuracy: 12 };
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(geo);
  await page.goto(falls);
  await expect(preview(page)).toBeVisible();
  const locate = page.getByRole("button", { name: "Find my location" });
  await locate.click();
  await expect(page.locator(".atlas-gps")).toBeAttached();
  await expect(page.locator(".guide-toast")).toContainText(
    "accuracy about 12 m",
  );
  await expect(preview(page)).toHaveCount(0);
  await context.setGeolocation({ latitude: 14.6, longitude: 121 });
  await locate.click();
  await expect(page.locator(".guide-toast")).toContainText("outside Salcedo");
  await expect(page.locator(".atlas-gps")).toHaveCount(0);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (_: unknown, err: (e: object) => void) =>
          err({ code: 1 }),
      },
    }),
  );
  await locate.click();
  await expect(page.locator(".guide-toast")).toContainText(
    "Location permission denied",
  );
  expect(urls.some((url) => url.includes(String(geo.latitude)))).toBe(false);
});

test("Discover shares its search results and preview actions with the embedded map", async ({
  page,
  isMobile,
}) => {
  await page.goto("/app/discover?view=map");
  await settle(page);
  const s = page.getByRole("searchbox", {
    name: "Search places and barangays",
  });
  await s.fill("Bago Resort");
  await expect(page.locator(".atlas-embed-head")).toContainText("1 mapped");
  const marker = page.getByRole("button", {
    name: /^Show Bago Resort.*on map$/,
  });
  if (isMobile) await marker.tap();
  else await marker.click();
  await expect(preview(page).getByRole("heading")).toHaveText("Bago Resort");
  await preview(page).getByRole("button", { name: "Add to trip" }).click();
  await expect(
    preview(page).getByRole("link", { name: "In my trip" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Full explorer" }),
  ).toHaveAttribute("href", "/app/map?place=bago-resort-spring-water");
  await s.fill("no matching place here");
  await expect(
    page.getByRole("heading", { name: "No places found" }),
  ).toBeVisible();
  await expect(preview(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Show all places" }).click();
  await page.getByRole("button", { name: /Place index/ }).click();
  const list = page.getByRole("dialog", { name: "Place index" });
  await list.getByRole("button", { name: /Baluarte Falls/ }).click();
  await page.getByRole("link", { name: "Full explorer" }).click();
  await expect(page).toHaveURL(/\/app\/map\?place=baluarte-falls/);
  await expect(preview(page).getByRole("heading")).toHaveText("Baluarte Falls");
});

test("a tapped boundary filters the map; unavailable detail and search services are recoverable", async ({
  page,
}) => {
  await page.route("**/app/maps/salcedo-field.geojson", (r) =>
    r.fulfill({ status: 503, body: "Unavailable" }),
  );
  await page.route("**/api/geo/search?**", (r) => r.fulfill({ status: 503 }));
  await page.goto("/app/map?place=not-a-mapped-place");
  await expect(page.getByText(/This place is not on the map/)).toBeVisible();
  await expect(
    page.getByText(/Local road detail is unavailable/),
  ).toBeVisible();
  await page.unroute("**/app/maps/salcedo-field.geojson");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await settle(page);
  // Lettering is pointer-transparent. Tap through it to the actual polygon.
  const label = page
    .locator(".barangay-name")
    .filter({ hasText: "Calangcuasan" });
  await expect(label).toBeVisible();
  const rect = (await label.boundingBox())!;
  await page.mouse.click(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await expect(page.getByLabel("Remove barangay filter")).toBeVisible();
  await page.getByLabel("Remove barangay filter").click();
  const s = page.getByRole("combobox", { name: "Search the Salcedo map" });
  await s.fill("missing-map-feature");
  await page
    .getByRole("button", { name: "Search OpenStreetMap online" })
    .click();
  await expect(
    page.getByText("Online search is unavailable. Local results still work."),
  ).toBeVisible();
  await s.fill("Baluarte Falls");
  await s.press("Enter");
  await expect(preview(page).getByRole("heading")).toHaveText("Baluarte Falls");
});
