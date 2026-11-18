import L from "leaflet";
import {
  groupPins,
  placeTone,
  shortName,
  TONES,
  type MappedPlace,
  type FieldData,
  type FieldKind,
  type Tone,
  type MapHit,
  type MapBarangayItem,
} from "@/lib/geo/atlas";
import {
  SALCEDO_BARANGAY_POLYGONS,
  SALCEDO_MUNICIPAL_POLYGON,
  SALCEDO_BOUNDS,
  type LatLngTuple,
} from "@/lib/geo/salcedo-boundary";

export const municipalBounds = () =>
  L.latLngBounds(
    [SALCEDO_BOUNDS.south, SALCEDO_BOUNDS.west],
    [SALCEDO_BOUNDS.north, SALCEDO_BOUNDS.east],
  );
export function node(tag: string, cls: string, text?: string) {
  const el = document.createElement(tag);
  el.className = cls;
  if (text) el.textContent = text;
  return el;
}
const GLYPH: Record<Tone, string> = {
  nature: "M3 18l6-12 4 7 2-3 6 8H3zm3-6 3 1 2-2",
  stay: "M2 10q3-4 6 0t6 0t7 0M2 16q3-4 6 0t6 0t7 0",
  food: "M5 4v5c0 4 6 4 6 0V4m-3 0v16M17 4c-3 2-4 6-3 10h3m0-10v16",
  culture: "M2 9l10-6 10 6H2zm2 12h16M6 12v6m6-6v6m6-6v6",
  service: "M12 4v16M4 12h16",
};
function pinGlyph(tone: Tone) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  for (const [k, v] of Object.entries({
    d: GLYPH[tone],
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.9",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }))
    path.setAttribute(k, v);
  svg.append(path);
  return svg;
}
export function addBoundaries(
  map: L.Map,
  field: boolean,
  borders: boolean,
  area: string,
  onArea?: (slug: string) => void,
) {
  const layer = L.layerGroup().addTo(map);
  const b = SALCEDO_BARANGAY_POLYGONS;
  b.forEach((p) => {
    const chosen = p.slug === area;
    const poly = L.polygon(p.coordinates, {
      pane: "atlasAreas",
      stroke: borders || chosen,
      weight: chosen ? 2 : 1.1,
      color: field ? "#76856a" : "#314c3b",
      dashArray: chosen ? undefined : "4 4",
      opacity: chosen ? 0.86 : 0.64,
      fill: true,
      fillColor: chosen ? "#7b9b68" : "#d4ddbb",
      fillOpacity: field ? (chosen ? 0.43 : 0.12) : chosen ? 0.18 : 0.015,
      interactive: !!onArea,
    });
    if (onArea) poly.on("click", () => onArea(chosen ? "" : p.slug));
    poly.addTo(layer);
  });
  L.polygon(SALCEDO_MUNICIPAL_POLYGON, {
    pane: "atlasBoundary",
    fill: false,
    color: field ? "#7a8b6c" : "#42654c",
    weight: 2,
    opacity: 0.85,
    interactive: false,
  }).addTo(layer);
  return layer;
}
/** Non-interactive canvas below pins: paths never steal a tap from a place. */
export function addFieldLines(
  map: L.Map,
  data: FieldData,
  startDetail: boolean,
) {
  const layer = L.layerGroup().addTo(map),
    renderer = L.canvas({ pane: "atlasLines", padding: 0.35 }).addTo(map);
  let detail = startDetail;
  const passes = (d: boolean): [FieldKind[], L.PathOptions][] => [
    [
      ["water"],
      { color: "#82afb4", weight: 1, fillColor: "#acd1d2", fillOpacity: 1 },
    ],
    [["stream"], { color: "#83adae", weight: d ? 1.6 : 1.0 }],
    [["river"], { color: "#6099a4", weight: d ? 3.6 : 2.6 }],
    [["trail"], { color: "#bbad8f", weight: d ? 1.6 : 1, dashArray: "3 3" }],
    [["street"], { color: "#cbc9b4", weight: d ? 4 : 2.4 }],
    [["street"], { color: "#fffdf3", weight: d ? 2.7 : 1.6 }],
    [["highway"], { color: "#c1aa78", weight: d ? 6 : 4.4 }],
    [["highway"], { color: "#f7dfa2", weight: d ? 4.1 : 3 }],
  ];
  const groups = passes(detail).map(([kinds, style]) =>
    L.geoJSON(data, {
      pane: "atlasLines",
      interactive: false,
      filter: (f) => kinds.includes(f.properties.kind),
      style: () => ({
        renderer,
        interactive: false,
        fill: kinds.includes("water"),
        opacity: 1,
        ...style,
      }),
    }).addTo(layer),
  );
  // Crossing into street detail only changes weights, so restyle the existing
  // canvas instead of rebuilding more than a thousand features mid-zoom.
  const setDetail = (next: boolean) => {
    if (next === detail) return;
    detail = next;
    passes(detail).forEach(([kinds, style], i) =>
      groups[i].setStyle(() => ({
        fill: kinds.includes("water"),
        ...style,
      })),
    );
  };
  return {
    setDetail,
    remove() {
      layer.remove();
      renderer.remove();
    },
  };
}

type Box = [left: number, top: number, right: number, bottom: number];
/** Place names, OSM labels and barangay names share one collision pass, so they
 * don't print on top of another pin. Projected pixel positions don't change on pan. */
export function addPinsAndLabels(
  map: L.Map,
  pins: MappedPlace[],
  selected: MappedPlace | undefined,
  areas: MapBarangayItem[],
  fieldLines: MapHit[],
  zoom: number,
  names: boolean,
  onPlace: (p: MappedPlace) => void,
  onStack: (pins: MappedPlace[], openIndex: boolean) => void,
) {
  const layer = L.layerGroup().addTo(map);
  const lettering = L.layerGroup().addTo(layer);
  const groups = groupPins(
    pins,
    (p) => map.project([p.latitude, p.longitude], zoom),
    selected?.id,
    zoom < 14 ? 44 : 38,
  );
  const markers: { marker: L.Marker; name?: string; target: HTMLElement }[] =
    [];
  // Give selected and featured place labels priority at the overview scale.
  const ordered = [...groups].sort(
    (a, b) =>
      Number(b.pins[0].id === selected?.id) -
        Number(a.pins[0].id === selected?.id) ||
      (a.pins[0].mostVisitedRank ?? 999) - (b.pins[0].mostVisitedRank ?? 999),
  );
  for (const { pins: members, center } of ordered) {
    const p = members[0],
      many = members.length > 1,
      active = p.id === selected?.id;
    const el = node(
      "span",
      many ? "atlas-cluster" : "atlas-pin" + (active ? " is-active" : ""),
    );
    const title = many ? `${members.length} nearby places` : shortName(p.name);
    if (many)
      el.append(node("b", "", String(members.length)), node("small", "", "+"));
    else {
      el.style.setProperty("--pin", TONES[placeTone(p)].color);
      el.append(pinGlyph(placeTone(p)));
    }
    const target = node("div", "atlas-pin-target");
    target.append(el);
    const marker = L.marker(center, {
      icon: L.divIcon({
        className: "atlas-marker",
        html: target,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
      title,
      alt: title,
      zIndexOffset: active ? 900 : many ? 400 : 200,
      autoPanOnFocus: false,
    }).addTo(layer);
    marker
      .getElement()
      ?.setAttribute(
        "aria-label",
        many ? `Explore ${title}` : `Show ${p.name} on map`,
      );
    function activate() {
      if (!many) {
        onPlace(p);
        return;
      }
      const bounds = L.latLngBounds(
        members.map((m) => [m.latitude, m.longitude] as LatLngTuple),
      );
      if (
        map.getZoom() >= 18.75 ||
        bounds.getSouthWest().equals(bounds.getNorthEast())
      ) {
        onStack(members, true);
        return;
      }
      onStack(members, false);
      map
        .stop()
        .setView(
          bounds.getCenter(),
          Math.min(
            19,
            Math.max(
              map.getZoom() + 1.5,
              map.getBoundsZoom(bounds, false, L.point(120, 150)),
            ),
          ),
          { animate: false },
        );
    }
    marker.on("click", activate);
    // DivIcon supplies a button role, but Leaflet only binds Enter for popups.
    marker.getElement()?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (many) map.getContainer().focus({ preventScroll: true });
        activate();
      }
    });
    const name = title.length > 27 ? title.split(/ & | – | \/ /)[0] : title;
    markers.push({
      marker,
      target,
      name:
        !many && (active || names)
          ? name.length > 30
            ? name.slice(0, 28).trimEnd() + "…"
            : name
          : undefined,
    });
  }
  // Pan/resize only reposition lettering; keep the actual buttons and focus.
  function labelLayout() {
    if (map.getZoom() !== zoom) return;
    const { x: width, y: height } = map.getSize(),
      occupied: Box[] = [];
    function room(box: Box) {
      if (
        box[0] < 3 ||
        box[2] > width - 3 ||
        box[1] < 2 ||
        box[3] > height - 2 ||
        occupied.some(
          (b) =>
            b[0] < box[2] && b[2] > box[0] && b[1] < box[3] && b[3] > box[1],
        )
      )
        return false;
      occupied.push(box);
      return true;
    }
    const mapRect = map.getContainer().getBoundingClientRect();
    for (const control of map
      .getContainer()
      .parentElement?.querySelectorAll(
        ".atlas-tools,.atlas-layers-button,.atlas-browse,.atlas-north,.atlas-corner,.atlas-preview",
      ) || []) {
      const r = control.getBoundingClientRect();
      if (r.width)
        occupied.push([
          r.left - mapRect.left,
          r.top - mapRect.top,
          r.right - mapRect.left,
          r.bottom - mapRect.top,
        ]);
    }
    const projected = markers.map((item) => {
      const { x, y } = map.latLngToContainerPoint(item.marker.getLatLng());
      occupied.push([x - 19, y - 19, x + 19, y + 18]);
      const el = item.marker.getElement();
      const visible = x >= 0 && x <= width && y >= 0 && y <= height;
      if (el) el.tabIndex = visible ? 0 : -1;
      item.target.querySelector(".atlas-pin-name")?.remove();
      return { ...item, x, y, visible };
    });
    for (const { x, y, visible, name, target } of projected) {
      if (!visible || !name) continue;
      const w = Math.min(width - 12, name.length * 6.2 + 12),
        cx = Math.min(width - 5 - w / 2, Math.max(w / 2 + 5, x));
      for (const offset of [19, -38]) {
        if (room([cx - w / 2, y + offset, cx + w / 2, y + offset + 17])) {
          const el = node("span", "atlas-pin-name", name);
          el.style.left = `${22 + cx - x}px`;
          el.style.top = `${22 + offset}px`;
          target.append(el);
          break;
        }
      }
    }
    lettering.clearLayers();
    if (!names) return;
    function labelAt(pos: LatLngTuple, text: string, cls: string) {
      const { x, y } = map.latLngToContainerPoint(pos),
        w = text.length * 7 + 8;
      if (!room([x - w / 2, y - 8, x + w / 2, y + 8])) return;
      L.marker(pos, {
        icon: L.divIcon({
          className: "atlas-lettering",
          html: node("span", cls, text),
          iconSize: [0, 0],
        }),
        pane: "atlasLabels",
        keyboard: false,
        interactive: false,
      }).addTo(lettering);
    }
    for (const r of fieldLines)
      if (r.kind === "water" || zoom >= 14.75)
        labelAt(
          [r.latitude, r.longitude],
          r.label,
          r.kind === "water" ? "stream-name" : "road-name",
        );
    for (const a of areas)
      labelAt([a.latitude, a.longitude], a.name, "barangay-name");
  }
  labelLayout();
  map.on("moveend resize", labelLayout);
  return () => {
    map.off("moveend resize", labelLayout);
    layer.remove();
  };
}
