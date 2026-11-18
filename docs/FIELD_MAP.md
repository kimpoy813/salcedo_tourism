# Salcedo field atlas

The full map (`/app/map`, optionally `?place=<published-slug>`) and the Discover map (`/app/discover?view=map`) use the same Leaflet renderer. The field map is local data, not a cache of third-party raster tiles. Use it to locate a place; **Directions** deliberately opens Google Maps rather than implying that a drawn road is a verified visitor route.

## Data and attribution

- Municipal and barangay polygons: the existing PSA / NAMRIA boundary source is documented in `src/lib/geo/salcedo-boundary.ts`. Destination coordinates come from the published guide. Bookmark, draft-stop and device-location data are not part of the basemap.
- Roads, trails, watercourses and water polygons: **© OpenStreetMap contributors**. The derived database [`public/app/maps/salcedo-field.geojson`](../public/app/maps/salcedo-field.geojson) is distributed under the [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/); individual contents are available under the [Database Contents License](https://opendatacommons.org/licenses/dbcl/1-0/). See [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright). The map credits OSM on the map and links to the extract in **Map layers**.
- Source: HOT Raw Data API Philippines exports, **2026-05-05**, including the timestamp/license `Readme.txt` inside each ZIP. The exact input files are in [this pinned data mirror](https://github.com/yowmamasita/philippines-map-data/tree/a055ffeed598efda09844ad8c5ba60f1bf020221/data/infrastructure): `hdx-osm-roads/hotosm_phl_roads_lines_geojson.zip.partaa` and `.partab`, and `hdx-osm-waterways/hotosm_phl_waterways_{lines,polygons}_geojson.zip`.

To regenerate, download the inputs outside the repository, concatenate the road ZIP parts in `aa`, `ab` order, install Python 3.10+ and Shapely, then run:

```sh
python scripts/build-field-map.py /tmp/roads.zip /tmp/water-lines.zip /tmp/water-polygons.zip
```

The script clips/simplifies WGS84 geometry, retains only name and cartographic class, and rounds coordinates to five decimals. Minor roads and streams use the local extent; major roads and water extend a little farther for context. The output is under 400 KiB uncompressed. No Python, GIS service, API key or geography download is needed to build or run the app. When changing the local extract, bump the public service-worker cache in `public/app/sw.js`.

## Behavior and checks

- Nearby places group in **screen space**. Select a group to zoom; coincident pins have a chooser. The accessible place index can always select an individual place. The same preview offers details, directions, bookmarks and trip actions in both views.
- Typing searches the local place, barangay and named road/water index. Online OpenStreetMap search is explicit, not live autocomplete. The installed production PWA precaches the field geometry and map code. Optional tiles, live weather/elevation, and external navigation require a connection. A lost tile provider does not disable pins or browsing.
- GPS runs only when **Find my location** is pressed. The fix stays in the browser; out-of-municipality fixes are not plotted. Optional Open-Meteo requests use the public town/destination coordinates instead.

For regression tests, use a local guide with seeded data; do not point browser tests at a live visitor deployment:

```sh
npm test                          # includes geography, search, filtering and clustering
npx playwright install chromium   # add --with-deps on Linux if needed
npm run dev                       # in another terminal
npm run test:map                  # desktop + touch-phone Chromium
# For cold offline navigation, stop dev, then build and start the production guide:
npm run build && npm start         # in another terminal
MAP_TEST_OFFLINE=1 npm run test:map
```

The browser suite uses a temporary browser profile and local drafts. It exercises deep links, keyboard and touch pins, overlays, filters, place actions, provider failure, and permitted/denied/outside GPS. Network-provider successes and failures are simulated deterministically; cold offline tests use the **real service worker**. Set `CHROMIUM_PATH` only if using a preinstalled Chromium binary, or `MAP_TEST_URL` for a different local port.
