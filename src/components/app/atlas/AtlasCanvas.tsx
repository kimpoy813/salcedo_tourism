"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Check,
  ChevronDown,
  CloudSun,
  Crosshair,
  Layers,
  LocateFixed,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useMobileApp } from "../MobileAppContext";
import type {
  FieldData,
  MapBarangayItem,
  MapHit,
  MappedPlace,
} from "@/lib/geo/atlas";
import {
  findSalcedoBarangayForPoint,
  isInsideSalcedo,
  SALCEDO_CENTER,
  type LatLngTuple,
} from "@/lib/geo/salcedo-boundary";
import {
  addBoundaries,
  addFieldLines,
  addMunicipalMask,
  addPinsAndLabels,
  municipalBounds,
  node,
} from "./cartography";
import { RELIEF } from "@/lib/geo/relief";
import { MAP_LAYERS, type LayerId } from "./layers";

export type CameraTarget =
  | { point: LatLngTuple; lift?: boolean }
  | { points: LatLngTuple[]; autoKey?: string };
function frame(map: L.Map, camera: CameraTarget, compact: boolean) {
  const size = map.getSize();
  if (!size.x || !size.y) return;
  map.stop();
  if ("point" in camera) {
    // Keep the pin above the selection card (including on small phones).
    const zoom = Math.max(15.5, map.getZoom());
    const center = map.unproject(
      map
        .project(camera.point, zoom)
        .add([0, camera.lift === false ? 0 : Math.min(78, size.y * 0.17)]),
      zoom,
    );
    map.setView(center, zoom, { animate: false });
    return;
  }
  const bounds = camera.points.length
    ? L.latLngBounds(camera.points)
    : municipalBounds();
  const x = Math.min(65, Math.round(size.x * 0.135)),
    y = Math.min(62, Math.round(size.y * 0.13));
  map.fitBounds(bounds, {
    paddingTopLeft: [x, Math.max(y, 40)],
    paddingBottomRight: [x, compact ? y : Math.max(y, 64)],
    maxZoom: 16,
    animate: false,
  });
}
const GEBCO_CREDIT =
  '<a href="https://doi.org/10.5285/a29c5465-b138-234d-e053-6c86abc040b9">GEBCO 2020</a>';
// The generalized surface is useful at valley scale, not street or trail scale.
// Ramp opacity instead of switching it at a threshold: a hard cut reads as a
// flash of the whole map when a pinch crosses it.
function ramp(zoom: number, from: number, to: number, a: number, b: number) {
  if (zoom <= from) return a;
  if (zoom >= to) return b;
  return a + ((b - a) * (zoom - from)) / (to - from);
}
const reliefOpacityAt = (zoom: number) =>
  zoom <= 13.5
    ? 0.88
    : zoom <= 14.5
      ? ramp(zoom, 13.5, 14.5, 0.88, 0.6)
      : ramp(zoom, 14.5, 15.5, 0.6, 0);
// The plate is transparent on flat ground, so ordinary alpha compositing can
// carry it: a blend mode here would form a second blend group beside Leaflet's
// plus-lighter tiles and flicker while the map is panned or zoomed.
const shadeOpacityAt = (zoom: number, field: boolean) =>
  ramp(zoom, 13.5, 14.5, field ? 0.25 : 0.8, field ? 0.16 : 0.5) *
  ramp(zoom, 14.5, 15.5, 1, 0);
function CompassRose() {
  return (
    <div className="atlas-north" aria-label="North is up">
      <b>N</b>
      <svg
        width="17"
        height="27"
        viewBox="0 0 17 27"
        fill="none"
        aria-hidden="true"
      >
        <path d="M8.5 1 15.7 22 8.5 17Z" fill="#d9c8a2" />
        <path d="M8.5 1 1.3 22l7.2-5Z" fill="#274535" />
        <path
          d="M8.5 1 1.3 22l7.2-5 7.2 5Z"
          stroke="#274535"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
export function MapKey() {
  return (
    <div className="atlas-key">
      <span>
        <i className="line-road" />
        Road
      </span>
      <span>
        <i className="line-water" />
        Waterway
      </span>
      <span>
        <i className="line-area" />
        Boundary
      </span>
    </div>
  );
}
export function AtlasCanvas({
  pins,
  selected,
  areas,
  area,
  onArea,
  onPlace,
  onStack,
  onFit,
  onLocate,
  camera,
  landmark,
  fieldData,
  fieldLines,
  fieldFailed,
  retry,
  online,
  compact = false,
  weather,
  children,
}: {
  pins: MappedPlace[];
  selected?: MappedPlace;
  areas: MapBarangayItem[];
  area: string;
  onArea?: (area: string) => void;
  onPlace: (p: MappedPlace) => void;
  onStack: (pins: MappedPlace[], openIndex: boolean) => void;
  onFit: () => void;
  onLocate: (pos: LatLngTuple) => void;
  camera: CameraTarget;
  landmark: MapHit | null;
  fieldData: FieldData | null;
  fieldLines: MapHit[];
  fieldFailed: boolean;
  retry: () => void;
  online: boolean;
  compact?: boolean;
  weather: { temperatureC: number; condition: string } | null;
  children?: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null),
    mapRef = useRef<L.Map | null>(null),
    previousExtent = useRef<string | undefined>(undefined),
    cameraRef = useRef(camera),
    compactRef = useRef(compact),
    gpsLayer = useRef<L.LayerGroup | null>(null);
  const { showToast } = useMobileApp();
  const [zoom, setZoom] = useState(13),
    [style, setStyle] = useState<LayerId>("field"),
    [borders, setBorders] = useState(true),
    [labels, setLabels] = useState(true),
    [shade, setShade] = useState(true),
    [isolate, setIsolate] = useState(true),
    [options, setOptions] = useState(false),
    [locating, setLocating] = useState(false),
    [tileNotice, setTileNotice] = useState("");
  const layerId = online ? style : "field",
    isField = layerId === "field",
    // A tile warning belongs to an online basemap, never to the offline field map.
    layerNotice = online ? tileNotice : "";
  // Marker and boundary callbacks can change without tearing down a focused map.
  const events = useRef({ onPlace, onStack, onArea, onLocate });
  useEffect(() => {
    events.current = { onPlace, onStack, onArea, onLocate };
  }, [onPlace, onStack, onArea, onLocate]);
  useEffect(() => {
    const el = container.current!;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const map = L.map(el, {
      center: SALCEDO_CENTER,
      zoom: 13,
      minZoom: 11,
      maxZoom: 19,
      zoomSnap: 0.25,
      maxBounds: municipalBounds().pad(0.33),
      maxBoundsViscosity: 1,
      scrollWheelZoom: true,
      dragging: !window.matchMedia("(pointer: coarse)").matches,
      zoomControl: false,
      attributionControl: false,
      // Scaled old tiles during the zoom animation keep the map from going
      // blank while the new level loads; without it every wheel step flashed
      // an empty background until the tiles arrived.
      zoomAnimation: !reducedMotion,
      markerZoomAnimation: !reducedMotion,
    });
    mapRef.current = map;
    previousExtent.current = undefined;
    for (const [name, z] of [
      ["atlasRelief", 220],
      ["atlasShade", 240],
      ["atlasAreas", 260],
      ["atlasLines", 295],
      ["atlasMask", 300],
      ["atlasBoundary", 315],
      ["atlasLabels", 365],
    ] as const) {
      const pane = map.createPane(name);
      pane.style.zIndex = String(z);
      if (name !== "atlasAreas") pane.style.pointerEvents = "none";
    }
    L.control
      .attribution({ prefix: false, position: "bottomright" })
      .addTo(map)
      .addAttribution("PSA / NAMRIA");
    L.control.scale({ imperial: false, maxWidth: 80 }).addTo(map);
    gpsLayer.current = L.layerGroup().addTo(map);
    map.on("zoomend", () => setZoom(map.getZoom()));
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (!el.clientWidth) return;
      map.invalidateSize({ pan: false });
      // Reframe on orientation/breakpoint changes, not when the keyboard opens.
      if (Math.abs(width - el.clientWidth) > 80)
        frame(map, cameraRef.current, compactRef.current);
      width = el.clientWidth;
    });
    ro.observe(el);
    // Compact is applied by the effect below: rebuilding the map on a shell
    // change dropped every overlay and reset the visitor's view.
    return () => {
      ro.disconnect();
      map.remove();
      gpsLayer.current = null;
      mapRef.current = null;
    };
  }, []);
  useEffect(() => {
    compactRef.current = compact;
    const map = mapRef.current;
    if (!map) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!compact || !coarse) map.dragging.enable();
    else map.dragging.disable();
    if (compact) map.scrollWheelZoom.disable();
    else map.scrollWheelZoom.enable();
    map.invalidateSize({ pan: false });
  }, [compact]);
  useEffect(() => {
    const m = mapRef.current;
    cameraRef.current = camera;
    const key = "points" in camera ? camera.autoKey : undefined;
    if (m && (!key || previousExtent.current !== key))
      frame(m, camera, compact);
    previousExtent.current = key;
  }, [camera, compact]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const cfg = MAP_LAYERS[layerId];
    if (layerId === "field") {
      map.attributionControl.addAttribution(cfg.credit);
      return () => {
        map.attributionControl.removeAttribution(cfg.credit);
      };
    }
    const tiles = L.tileLayer(cfg.url, {
      maxNativeZoom: cfg.max,
      maxZoom: 19,
      attribution: cfg.credit,
      // maxBounds already limits panning; a tight tile bounds left grey gaps
      // around the municipality at the overview zoom.
      keepBuffer: 3,
      updateWhenIdle: false,
      // Fetch the incoming zoom during the animation too, so the scaled old
      // tiles are never left covering only part of the viewport.
      updateWhenZooming: true,
    });
    let loaded = 0,
      errors = 0,
      timer: number | undefined;
    function fallback() {
      if (loaded || !map?.hasLayer(tiles)) return;
      setStyle("field");
      setTileNotice(`${cfg.name} tiles couldn’t load. Showing the field map.`);
    }
    tiles.on("loading", () => {
      loaded = 0;
      errors = 0;
      setTileNotice("");
      window.clearTimeout(timer);
      timer = window.setTimeout(fallback, 9000);
    });
    tiles.on("tileload", () => {
      loaded++;
      setTileNotice("");
    });
    tiles.on("tileerror", () => {
      errors++;
    });
    tiles.on("load", () => {
      window.clearTimeout(timer);
      if (errors && !loaded) fallback();
    });
    tiles.addTo(map);
    return () => {
      window.clearTimeout(timer);
      tiles.remove();
      tiles.off();
    };
  }, [layerId]);
  useEffect(() => {
    if (!tileNotice) return;
    const timer = window.setTimeout(() => setTileNotice(""), 12000);
    return () => window.clearTimeout(timer);
  }, [tileNotice]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isolate) return;
    const mask = addMunicipalMask(map, isField);
    return () => {
      mask.remove();
    };
  }, [isolate, isField]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const part = addBoundaries(
      map,
      isField,
      borders,
      area,
      compact ? undefined : (slug) => events.current.onArea?.(slug),
    );
    return () => {
      part.remove();
    };
  }, [isField, borders, area, compact]);
  const reliefRef = useRef<L.ImageOverlay | null>(null),
    // Stop at deep zoom where the plate is already invisible: a 1024 px image
    // blown up to tens of thousands of pixels is a needless compositor layer.
    mountedRelief = isField && zoom < 17;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mountedRelief) return;
    const relief = L.imageOverlay(
      "/app/maps/salcedo-relief.webp",
      [
        [RELIEF.south, RELIEF.west],
        [RELIEF.north, RELIEF.east],
      ],
      {
        pane: "atlasRelief",
        opacity: reliefOpacityAt(map.getZoom()),
        interactive: false,
        alt: "",
        attribution: GEBCO_CREDIT,
      },
    ).addTo(map);
    reliefRef.current = relief;
    // Follow the live zoom, not React state that only settles on zoomend: a
    // pinch must not leave the plate enlarged after it stops being meaningful.
    const sync = () => {
      const opacity = reliefOpacityAt(map.getZoom());
      relief.setOpacity(opacity);
      const el = relief.getElement();
      if (el) el.style.display = opacity ? "" : "none";
    };
    sync();
    map.on("zoom zoomend viewreset", sync);
    return () => {
      map.off("zoom zoomend viewreset", sync);
      reliefRef.current = null;
      relief.remove();
    };
  }, [mountedRelief]);
  const hillshadeRef = useRef<L.ImageOverlay | null>(null),
    mountedShade = shade && zoom <= 16;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mountedShade) return;
    const hill = L.imageOverlay(
      "/app/maps/salcedo-hillshade.webp",
      [
        [RELIEF.south, RELIEF.west],
        [RELIEF.north, RELIEF.east],
      ],
      {
        pane: "atlasShade",
        opacity: shadeOpacityAt(map.getZoom(), isField),
        interactive: false,
        alt: "",
        className: "atlas-hillshade",
        attribution: GEBCO_CREDIT,
      },
    ).addTo(map);
    hillshadeRef.current = hill;
    const sync = () => {
      const opacity = shadeOpacityAt(map.getZoom(), isField);
      hill.setOpacity(opacity);
      const el = hill.getElement();
      if (el) el.style.display = opacity ? "" : "none";
    };
    sync();
    map.on("zoom zoomend viewreset", sync);
    return () => {
      map.off("zoom zoomend viewreset", sync);
      hillshadeRef.current = null;
      hill.remove();
    };
    // Keep the layer mounted across zoom thresholds so it never pops in and
    // out mid-pinch; only a deliberate turn-off or deep zoom removes it.
  }, [mountedShade, isField]);
  const detail = zoom >= 14.5,
    fieldLinesRef = useRef<ReturnType<typeof addFieldLines> | null>(null);
  useEffect(() => {
    if (!mapRef.current || !isField || !fieldData) return;
    const drawn = addFieldLines(mapRef.current, fieldData, detail);
    fieldLinesRef.current = drawn;
    return () => {
      fieldLinesRef.current = null;
      drawn.remove();
    };
    // `detail` is applied by the effect below; rebuilding the canvas layer on
    // every threshold crossing caused a visible zoom hitch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isField, fieldData]);
  useEffect(() => {
    fieldLinesRef.current?.setDetail(detail);
  }, [detail]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    return addPinsAndLabels(
      map,
      pins,
      selected,
      areas,
      isField ? fieldLines : [],
      zoom,
      labels,
      (p) => events.current.onPlace(p),
      (members, openIndex) => events.current.onStack(members, openIndex),
    );
  }, [pins, selected, areas, fieldLines, zoom, labels, isField]);
  useEffect(() => {
    if (!landmark || !mapRef.current) return;
    const marker = L.marker([landmark.latitude, landmark.longitude], {
      icon: L.divIcon({
        className: "atlas-found-marker",
        html: node("span", "", "◆"),
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
      title: landmark.label,
      keyboard: false,
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(mapRef.current);
    return () => {
      marker.remove();
    };
  }, [landmark]);
  const locate = useCallback(() => {
    const map = mapRef.current;
    if (!map || locating) return;
    if (!navigator.geolocation) {
      showToast("Location is unavailable in this browser.", { tone: "info" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (mapRef.current !== map) return;
        setLocating(false);
        gpsLayer.current?.clearLayers();
        if (!isInsideSalcedo(coords.latitude, coords.longitude)) {
          showToast(
            "You’re outside Salcedo. The map stays focused on the municipality.",
            { tone: "info" },
          );
          return;
        }
        const pos: LatLngTuple = [coords.latitude, coords.longitude];
        const group = gpsLayer.current!;
        L.circle(pos, {
          radius: coords.accuracy,
          interactive: false,
          color: "#367caa",
          weight: 1,
          fillOpacity: 0.12,
        }).addTo(group);
        L.marker(pos, {
          title: "Your location",
          icon: L.divIcon({
            className: "atlas-gps",
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
          keyboard: false,
          interactive: false,
          zIndexOffset: 1000,
        }).addTo(group);
        events.current.onLocate(pos);
        const brgy = findSalcedoBarangayForPoint(...pos);
        showToast(
          `You’re in ${brgy ? "Brgy. " + brgy.name : "Salcedo"} · accuracy about ${Math.round(coords.accuracy)} m`,
          { tone: "info" },
        );
      },
      (err) => {
        if (mapRef.current !== map) return;
        setLocating(false);
        showToast(
          err.code === 1
            ? "Location permission denied. You can still search or browse places."
            : err.code === 3
              ? "Location timed out. Try again outdoors."
              : "Your device couldn’t determine a location.",
          { tone: "info" },
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }, [locating, showToast]);
  return (
    <div className={"atlas-stage" + (compact ? " is-embedded" : "")}>
      <div
        ref={container}
        role="region"
        aria-label="Interactive map of Salcedo"
        /* Leaflet adds its own classes here. Keep this prop constant so React
           never wipes them when the base map changes. */
        className="atlas-surface"
        data-basemap={isField ? "field" : "online"}
      />
      <button
        className="atlas-layers-button"
        type="button"
        onClick={() => setOptions(true)}
        aria-haspopup="dialog"
        aria-expanded={options}
      >
        <span className={"layer-swatch " + layerId} aria-hidden="true">
          <Layers size={18} />
        </span>
        <span>
          <small>Map layers </small>
          <b>{MAP_LAYERS[layerId].name}</b>
        </span>
        <ChevronDown size={14} />
      </button>
      <CompassRose />
      <div className="atlas-tools">
        <div>
          <button
            type="button"
            title="Zoom in"
            aria-label="Zoom in"
            disabled={zoom >= 19}
            onClick={() => mapRef.current?.zoomIn()}
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            title="Zoom out"
            aria-label="Zoom out"
            disabled={zoom <= 11}
            onClick={() => mapRef.current?.zoomOut()}
          >
            <Minus size={18} />
          </button>
        </div>
        <div>
          <button
            type="button"
            title="Fit visible places"
            aria-label="Fit visible places"
            onClick={onFit}
          >
            <Crosshair size={17} />
          </button>
          <button
            type="button"
            title="Find my location"
            aria-label="Find my location"
            aria-busy={locating}
            disabled={locating}
            onClick={locate}
          >
            <LocateFixed size={18} />
          </button>
        </div>
      </div>
      {!compact && (isField || weather) && (
        <div className="atlas-corner">
          {isField && <MapKey />}
          {weather && (
            <span
              className="atlas-weather"
              title="Town-plaza weather via Open-Meteo"
            >
              <CloudSun size={13} />
              {weather.temperatureC}°C · {weather.condition}
            </span>
          )}
        </div>
      )}
      {(layerNotice || (fieldFailed && isField)) && (
        <div className="atlas-layer-notice" role="status">
          {fieldFailed && isField ? (
            <>
              Local road detail is unavailable.{" "}
              <button onClick={retry}>Retry</button>
            </>
          ) : (
            <>
              {layerNotice}
              <button
                aria-label="Dismiss layer message"
                onClick={() => setTileNotice("")}
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      )}
      {children}
      {options && (
        <Modal label="Map layers" onClose={() => setOptions(false)}>
          <div className="atlas-dialog">
            <div className="atlas-dialog-head">
              <div>
                <span className="atlas-eyebrow">Map settings</span>
                <h2>Map layers</h2>
              </div>
              <button
                className="atlas-icon"
                aria-label="Close map layers"
                onClick={() => setOptions(false)}
              >
                <X size={18} />
              </button>
            </div>
            <fieldset className="atlas-layer-choices">
              <legend>Base map</legend>
              {(Object.keys(MAP_LAYERS) as LayerId[]).map((id) => (
                <label key={id} className={layerId === id ? "chosen" : ""}>
                  <input
                    type="radio"
                    name="atlas-basemap"
                    checked={id === layerId}
                    disabled={!online && id !== "field"}
                    onChange={() => {
                      setStyle(id);
                      setTileNotice("");
                    }}
                  />
                  <span className={"layer-swatch " + id} aria-hidden="true">
                    <Layers size={16} />
                  </span>
                  <span>
                    <b>{MAP_LAYERS[id].name}</b>
                    <small>
                      {!online && id !== "field"
                        ? "Needs a connection"
                        : MAP_LAYERS[id].note}
                    </small>
                  </span>
                  {id === layerId && <Check size={17} />}
                </label>
              ))}
            </fieldset>
            <div className="atlas-switches">
              <label>
                <input
                  type="checkbox"
                  checked={borders}
                  onChange={(e) => setBorders(e.target.checked)}
                />
                Barangay boundaries
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={labels}
                  onChange={(e) => setLabels(e.target.checked)}
                />
                Map labels
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={shade}
                  onChange={(e) => setShade(e.target.checked)}
                />
                3D relief
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={isolate}
                  onChange={(e) => setIsolate(e.target.checked)}
                />
                Isolate Salcedo
              </label>
            </div>
            <MapKey />
            <p className="atlas-source-note">
              Select a numbered circle to explore its places. “Isolate Salcedo”
              papers out neighboring towns so only the municipality remains.
              The field map is for orientation, not turn-by-turn navigation.
              Generalized relief: GEBCO 2020.{" "}
              <a href="/app/maps/salcedo-field.geojson" download>
                Local OSM extract
              </a>{" "}
              ·{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
              >
                ODbL
              </a>
              .
            </p>
            <button
              className="primary-button"
              onClick={() => setOptions(false)}
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
