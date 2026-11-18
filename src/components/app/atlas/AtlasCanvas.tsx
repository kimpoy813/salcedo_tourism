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
  addPinsAndLabels,
  municipalBounds,
  node,
} from "./cartography";
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
    gpsLayer = useRef<L.LayerGroup | null>(null);
  const { showToast } = useMobileApp();
  const [zoom, setZoom] = useState(13),
    [style, setStyle] = useState<LayerId>("field"),
    [borders, setBorders] = useState(true),
    [labels, setLabels] = useState(true),
    [options, setOptions] = useState(false),
    [locating, setLocating] = useState(false),
    [tileNotice, setTileNotice] = useState("");
  const layerId = online ? style : "field",
    isField = layerId === "field";
  // Marker and boundary callbacks can change without tearing down a focused map.
  const events = useRef({ onPlace, onStack, onArea, onLocate });
  useEffect(() => {
    events.current = { onPlace, onStack, onArea, onLocate };
  }, [onPlace, onStack, onArea, onLocate]);
  useEffect(() => {
    const el = container.current!;
    const map = L.map(el, {
      center: SALCEDO_CENTER,
      zoom: 13,
      minZoom: 11,
      maxZoom: 19,
      zoomSnap: 0.25,
      maxBounds: municipalBounds().pad(0.33),
      maxBoundsViscosity: 1,
      scrollWheelZoom: !compact,
      dragging: !compact || !window.matchMedia("(pointer: coarse)").matches,
      zoomControl: false,
      attributionControl: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
    });
    mapRef.current = map;
    previousExtent.current = undefined;
    for (const [name, z] of [
      ["atlasAreas", 260],
      ["atlasLines", 295],
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
        frame(map, cameraRef.current, compact);
      width = el.clientWidth;
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      map.remove();
      gpsLayer.current = null;
      mapRef.current = null;
    };
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
      bounds: municipalBounds().pad(0.65),
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
      window.clearTimeout(timer);
      timer = window.setTimeout(fallback, 9000);
    });
    tiles.on("tileload", () => {
      loaded++;
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
  const detail = zoom >= 14.5;
  useEffect(() => {
    if (mapRef.current && isField && fieldData)
      return addFieldLines(mapRef.current, fieldData, detail);
  }, [isField, fieldData, detail]);
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
        className={"atlas-surface" + (isField ? " is-field" : "")}
      />
      <button
        className="atlas-layers-button"
        type="button"
        onClick={() => setOptions(true)}
        aria-haspopup="dialog"
        aria-label={`Map layers: ${MAP_LAYERS[layerId].name}`}
      >
        <span className={"layer-swatch " + layerId} aria-hidden="true">
          <Layers size={18} />
        </span>
        <span>
          <small>Map layers</small>
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
      {!compact && (
        <div className="atlas-corner">
          <span className="atlas-sheet-id">
            SALCEDO <i /> FIELD ATLAS
          </span>
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
      {(tileNotice || (fieldFailed && isField)) && (
        <div className="atlas-layer-notice" role="status">
          {fieldFailed && isField ? (
            <>
              Local road detail is unavailable.{" "}
              <button onClick={retry}>Retry</button>
            </>
          ) : (
            <>
              {tileNotice}
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
            </div>
            <MapKey />
            <p className="atlas-source-note">
              Select a numbered circle to explore its places. The field map is
              for orientation, not turn-by-turn navigation.{" "}
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
