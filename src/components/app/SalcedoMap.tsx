"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ChevronUp,
  Crosshair,
  Eye,
  Flame,
  Layers,
  MapPin,
  Navigation,
  Plus,
  Star,
  Tag,
  X,
} from "lucide-react";
import {
  SALCEDO_BARANGAY_POLYGONS,
  SALCEDO_BOUNDS,
  SALCEDO_CENTER,
  SALCEDO_MASK_OUTER_RING,
  SALCEDO_MUNICIPAL_POLYGON,
  type LatLngTuple,
} from "@/lib/geo/salcedo-boundary";
import type { PlaceCardData } from "./PlaceCard";
import { useMobileApp } from "./MobileAppContext";

const TYPE_COLORS: Record<string, string> = {
  attraction: "#164237",
  nature: "#164237",
  heritage: "#B88A44",
  resort: "#1D7874",
  restaurant: "#9E6340",
  cafe: "#7A5842",
  accommodation: "#3C5E57",
  business: "#4D5E59",
  service: "#5E6B67",
};

const TYPE_LABELS: Record<string, string> = {
  attraction: "Attraction",
  nature: "Nature",
  heritage: "Heritage",
  resort: "Resort",
  restaurant: "Dining",
  cafe: "Café",
  accommodation: "Stay",
  business: "Craft",
  service: "Service",
};

const TYPE_OPTIONS = [
  { id: "all", label: "All" },
  { id: "nature", label: "Nature" },
  { id: "resort", label: "Resorts" },
  { id: "cafe", label: "Cafés" },
  { id: "restaurant", label: "Dining" },
  { id: "accommodation", label: "Stays" },
  { id: "heritage", label: "Heritage" },
  { id: "business", label: "Crafts" },
];

type BasemapStyle = "street" | "terrain" | "satellite";
type MapRankMode = "explore" | "most_visited" | "top_rated";

const BASEMAP_CONFIG: Record<
  BasemapStyle,
  { label: string; url: string; attribution: string; maxZoom: number }
> = {
  street: {
    label: "Map",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OSM • Carto • Salcedo PSA",
    maxZoom: 18,
  },
  terrain: {
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap • Salcedo PSA",
    maxZoom: 17,
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri • Salcedo PSA",
    maxZoom: 18,
  },
};

// Simple SVG glyphs rendered inside Leaflet DivIcon pins so categories are visually distinct on mobile
const TYPE_PIN_SVG: Record<string, string> = {
  nature:
    '<path d="M12 3l-5 7h3l-3 5h10l-3-5h3zM12 15v6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  attraction:
    '<path d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.3 6.8 19l1-5.8L3.6 9.1l5.8-.8z" stroke="#fff" stroke-width="1.8" fill="none" stroke-linejoin="round"/>',
  resort:
    '<path d="M3 15c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 10c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
  cafe:
    '<path d="M5 9h10v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9zm10 1h2a2 2 0 0 1 0 4h-2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
  restaurant:
    '<path d="M7 3v18M11 3v6a2 2 0 0 1-4 0V3M17 3v18M17 3a3 3 0 0 1 3 3v4h-3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
  accommodation:
    '<path d="M3 17V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M3 14h18M7 10v4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
  heritage:
    '<path d="M4 20h16M6 20V10M10 20V10M14 20V10M18 20V10M3 10l9-6 9 6z" stroke="#fff" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  business:
    '<path d="M6 8h12l1 12H5L6 8zm3 0V6a3 3 0 0 1 6 0v2" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
  service:
    '<path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
};

function computeCentroid(coords: LatLngTuple[]): LatLngTuple {
  let latSum = 0;
  let lngSum = 0;
  for (const [lat, lng] of coords) {
    latSum += lat;
    lngSum += lng;
  }
  return [latSum / coords.length, lngSum / coords.length];
}

export interface MapBarangayItem {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  publishedPlacesCount: number;
}

export function SalcedoMap({
  places,
  barangays = [],
  mode = "embedded",
  heightClass = "h-[58vh] min-h-[380px]",
}: {
  places: PlaceCardData[];
  barangays?: MapBarangayItem[];
  mode?: "fullscreen" | "embedded";
  heightClass?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const barangaysLayerRef = useRef<L.LayerGroup | null>(null);
  const barangayLabelsLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const { addPlaceToActiveDraft } = useMobileApp();

  const [basemap, setBasemap] = useState<BasemapStyle>("street");
  const [rankMode, setRankMode] = useState<MapRankMode>("most_visited");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("all");
  const [showBarangayBorders, setShowBarangayBorders] = useState(true);
  const [showBarangayNames, setShowBarangayNames] = useState(true);
  const [rankingDrawerOpen, setRankingDrawerOpen] = useState(false);
  const [activePlace, setActivePlace] = useState<PlaceCardData | null>(null);
  const [locating, setLocating] = useState(false);

  const visiblePlaces = useMemo(() => {
    const filtered = places.filter((p) => {
      if (p.latitude == null || p.longitude == null) return false;
      if (selectedType !== "all") {
        if (selectedType === "nature") {
          if (!["nature", "attraction"].includes(p.placeType)) return false;
        } else if (p.placeType !== selectedType) {
          return false;
        }
      }
      if (selectedBarangay !== "all" && p.barangay?.slug !== selectedBarangay) {
        return false;
      }
      return true;
    });

    if (rankMode === "most_visited") {
      return [...filtered].sort(
        (a, b) => (a.mostVisitedRank ?? 99) - (b.mostVisitedRank ?? 99)
      );
    }
    if (rankMode === "top_rated") {
      return [...filtered].sort(
        (a, b) => (a.topRatedRank ?? 99) - (b.topRatedRank ?? 99)
      );
    }
    return [...filtered].sort(
      (a, b) => (a.categoryRank ?? 99) - (b.categoryRank ?? 99)
    );
  }, [places, selectedType, selectedBarangay, rankMode]);

  // Initialize Leaflet Map strictly centered & isolated to Salcedo, Ilocos Sur
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    const salcedoBounds = L.latLngBounds(
      [SALCEDO_BOUNDS.south, SALCEDO_BOUNDS.west],
      [SALCEDO_BOUNDS.north, SALCEDO_BOUNDS.east]
    );

    const map = L.map(container, {
      center: SALCEDO_CENTER,
      zoom: 12,
      minZoom: 12,
      maxZoom: 17,
      maxBounds: salcedoBounds.pad(0.18),
      maxBoundsViscosity: 0.92,
      scrollWheelZoom: true,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    const initialBase = BASEMAP_CONFIG.street;
    const tiles = L.tileLayer(initialBase.url, {
      attribution: initialBase.attribution,
      maxZoom: initialBase.maxZoom,
    }).addTo(map);
    tileLayerRef.current = tiles;

    // Dedicated panes: tiles < mask < boundary < markers
    const maskPane = map.createPane("salcedoMaskPane");
    maskPane.style.zIndex = "260";
    maskPane.style.pointerEvents = "none";

    const boundaryPane = map.createPane("salcedoBoundaryPane");
    boundaryPane.style.zIndex = "340";

    const labelPane = map.createPane("salcedoLabelPane");
    labelPane.style.zIndex = "360";
    labelPane.style.pointerEvents = "none";

    // Localized inverse mask with fillRule:"evenodd" — cleanly fades neighboring towns so ONLY Salcedo pops
    L.polygon([SALCEDO_MASK_OUTER_RING, SALCEDO_MUNICIPAL_POLYGON], {
      pane: "salcedoMaskPane",
      stroke: false,
      fillColor: "#F2EFE9",
      fillOpacity: 0.96,
      fillRule: "evenodd",
      interactive: false,
    }).addTo(map);

    // Soft outer shadow + bold Salcedo municipal perimeter border
    L.polygon(SALCEDO_MUNICIPAL_POLYGON, {
      pane: "salcedoBoundaryPane",
      color: "#164237",
      weight: 8,
      opacity: 0.16,
      fill: false,
      lineJoin: "round",
      interactive: false,
    }).addTo(map);

    L.polygon(SALCEDO_MUNICIPAL_POLYGON, {
      pane: "salcedoBoundaryPane",
      color: "#164237",
      weight: 3,
      opacity: 0.98,
      fillColor: "#164237",
      fillOpacity: 0.02,
      lineJoin: "round",
      interactive: false,
    }).addTo(map);

    const brgyLayer = L.layerGroup().addTo(map);
    const brgyLabelsLayer = L.layerGroup().addTo(map);
    const markerLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    barangaysLayerRef.current = brgyLayer;
    barangayLabelsLayerRef.current = brgyLabelsLayer;
    markersLayerRef.current = markerLayer;

    const topPad = mode === "fullscreen" ? 136 : 24;
    const bottomPad = mode === "fullscreen" ? 116 : 24;
    map.fitBounds(salcedoBounds, {
      paddingTopLeft: [20, topPad],
      paddingBottomRight: [20, bottomPad],
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    resizeObserver.observe(container);

    const settleTimer = window.setTimeout(() => {
      map.invalidateSize({ animate: false });
    }, 150);

    return () => {
      window.clearTimeout(settleTimer);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      barangaysLayerRef.current = null;
      barangayLabelsLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, [mode]);

  // Swap Basemap Tile Layer (Map / Terrain / Satellite)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const cfg = BASEMAP_CONFIG[basemap];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    }).addTo(map);
    tileLayerRef.current.bringToBack();
  }, [basemap]);

  // Render interactive 21 official Salcedo barangays + clean centroid labels
  useEffect(() => {
    const map = mapRef.current;
    const brgyLayer = barangaysLayerRef.current;
    const labelLayer = barangayLabelsLayerRef.current;
    if (!map || !brgyLayer || !labelLayer) return;

    brgyLayer.clearLayers();
    labelLayer.clearLayers();

    for (const brgy of SALCEDO_BARANGAY_POLYGONS) {
      const isSelected = selectedBarangay === brgy.slug;

      if (showBarangayBorders || isSelected) {
        const poly = L.polygon(brgy.coordinates, {
          pane: "salcedoBoundaryPane",
          color: basemap === "satellite" ? "#FFFFFF" : "#164237",
          weight: isSelected ? 2.6 : 1.1,
          opacity: isSelected ? 0.98 : basemap === "satellite" ? 0.55 : 0.34,
          dashArray: isSelected ? undefined : "3 4",
          fillColor: isSelected ? "#1D7874" : "#164237",
          fillOpacity: isSelected ? 0.2 : 0.015,
          lineJoin: "round",
        });

        poly.bindTooltip(`Brgy. ${brgy.name}`, {
          sticky: true,
          direction: "top",
          className: "salcedo-map-tooltip",
        });

        poly.on("click", () => {
          setActivePlace(null);
          setSelectedBarangay((prev) => (prev === brgy.slug ? "all" : brgy.slug));
        });

        poly.addTo(brgyLayer);

        if (isSelected) {
          map.fitBounds(poly.getBounds(), {
            paddingTopLeft: [28, mode === "fullscreen" ? 140 : 28],
            paddingBottomRight: [28, mode === "fullscreen" ? 120 : 28],
            maxZoom: 15,
            animate: true,
          });
        }
      }

      // Show readable centroid pills for key barangays or selected barangay
      if (showBarangayNames || isSelected) {
        const center = computeCentroid(brgy.coordinates);
        const labelIcon = L.divIcon({
          className: "salcedo-brgy-label",
          iconSize: [0, 0],
          html: `<span class="salcedo-brgy-label-pill" style="${
            isSelected
              ? "background:#164237;color:#FFFFFF;border-color:#164237;"
              : ""
          }">${brgy.name}</span>`,
        });
        L.marker(center, {
          icon: labelIcon,
          pane: "salcedoLabelPane",
          interactive: false,
        }).addTo(labelLayer);
      }
    }
  }, [selectedBarangay, showBarangayBorders, showBarangayNames, basemap, mode]);

  // Render categorized & ranked custom pins
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    visiblePlaces.forEach((p, listIdx) => {
      if (p.latitude == null || p.longitude == null) return;
      const color = TYPE_COLORS[p.placeType] || "#164237";
      const isSelected = activePlace?.id === p.id;
      const rankNum =
        rankMode === "most_visited"
          ? p.mostVisitedRank ?? listIdx + 1
          : rankMode === "top_rated"
          ? p.topRatedRank ?? listIdx + 1
          : listIdx + 1;

      const showRankedBadge = rankMode !== "explore";
      const size = isSelected ? 36 : showRankedBadge && rankNum <= 3 ? 32 : 28;
      const badgeBg =
        rankNum === 1
          ? "#B88A44"
          : rankNum === 2
          ? "#164237"
          : rankNum === 3
          ? "#1D7874"
          : color;

      const innerContent = showRankedBadge
        ? `<span style="font-size:${
            size >= 32 ? "11px" : "10px"
          };font-weight:800;color:#FFFFFF;line-height:1;">#${rankNum}</span>`
        : `<svg width="14" height="14" viewBox="0 0 24 24">${
            TYPE_PIN_SVG[p.placeType] || TYPE_PIN_SVG.attraction
          }</svg>`;

      const ratingBubble =
        (isSelected || (rankNum <= 3 && (p.averageRating ?? 0) > 0)) && mode === "fullscreen"
          ? `<div style="position:absolute;left:50%;bottom:${
              size + 3
            }px;transform:translateX(-50%);background:rgba(255,255,255,0.96);color:#1A2421;border:1px solid #EAE7E0;border-radius:9999px;padding:1px 6px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.15);pointer-events:none;">${
              p.name.split(" ")[0]
            }${
              (p.averageRating ?? 0) > 0 ? ` ★${p.averageRating?.toFixed(1)}` : ""
            }</div>`
          : "";

      const icon = L.divIcon({
        className: "salcedo-div-pin",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="position:relative;width:${size}px;height:${size}px;">${ratingBubble}<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${
          showRankedBadge ? badgeBg : color
        };border:${
          isSelected ? "3px" : "2.5px"
        } solid #FFFFFF;box-shadow:0 ${
          isSelected ? "6px 16px" : "3px 10px"
        } rgba(16,50,42,${
          isSelected ? "0.42" : "0.28"
        });display:flex;align-items:center;justify-content:center;transition:transform 150ms ease;">${innerContent}</div></div>`,
      });

      const marker = L.marker([p.latitude, p.longitude], {
        icon,
        zIndexOffset: isSelected ? 700 : showRankedBadge ? 400 - rankNum : 100,
      });

      marker.bindTooltip(
        `${showRankedBadge ? `#${rankNum} ` : ""}${p.name}${
          (p.averageRating ?? 0) > 0 ? ` (★${p.averageRating?.toFixed(1)})` : ""
        }`,
        {
          direction: "top",
          offset: [0, -14],
          className: "salcedo-map-tooltip",
        }
      );

      marker.on("click", () => {
        setActivePlace(p);
        setRankingDrawerOpen(false);
        map.panTo([p.latitude!, p.longitude!], { animate: true });
      });

      marker.addTo(layer);
    });
  }, [visiblePlaces, activePlace, rankMode, mode]);

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;
    setSelectedBarangay("all");
    setActivePlace(null);
    const bounds = L.latLngBounds(
      [SALCEDO_BOUNDS.south, SALCEDO_BOUNDS.west],
      [SALCEDO_BOUNDS.north, SALCEDO_BOUNDS.east]
    );
    map.fitBounds(bounds, {
      paddingTopLeft: [20, mode === "fullscreen" ? 136 : 24],
      paddingBottomRight: [20, mode === "fullscreen" ? 116 : 24],
      animate: true,
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        mapRef.current?.setView([latitude, longitude], 14, { animate: true });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleFocusPlace = (p: PlaceCardData) => {
    setActivePlace(p);
    setRankingDrawerOpen(false);
    if (p.latitude != null && p.longitude != null) {
      mapRef.current?.setView([p.latitude, p.longitude], 15, { animate: true });
    }
  };

  const selectedBrgyObj =
    selectedBarangay !== "all"
      ? barangays.find((b) => b.slug === selectedBarangay)
      : null;

  const selectedBrgyLabel =
    selectedBarangay === "all"
      ? "Salcedo, Ilocos Sur"
      : `Brgy. ${
          selectedBrgyObj?.name ||
          SALCEDO_BARANGAY_POLYGONS.find((b) => b.slug === selectedBarangay)?.name ||
          selectedBarangay
        }`;

  // FULLSCREEN NATIVE APP MAP MODE (/app/map)
  if (mode === "fullscreen") {
    return (
      <div className="relative w-full h-full bg-[#ECE9E0] overflow-hidden select-none">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Top Controls: Municipality Context + Basemap Style + Ranking Mode + Categories */}
        <div className="absolute top-[max(10px,env(safe-area-inset-top))] left-3 right-3 z-[420] space-y-1.5 pointer-events-none">
          <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EAE7E0] px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#164237] shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-xs font-bold text-[#1A2421] truncate">
                  {selectedBrgyLabel}
                </p>
                <p className="text-[10px] text-[#616E69] tabular-nums">
                  {visiblePlaces.length} spots • Salcedo-only view
                </p>
              </div>
            </div>

            <select
              value={selectedBarangay}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedBarangay(val);
                setActivePlace(null);
                if (val === "all") {
                  const bounds = L.latLngBounds(
                    [SALCEDO_BOUNDS.south, SALCEDO_BOUNDS.west],
                    [SALCEDO_BOUNDS.north, SALCEDO_BOUNDS.east]
                  );
                  mapRef.current?.fitBounds(bounds, {
                    paddingTopLeft: [20, 136],
                    paddingBottomRight: [20, 116],
                    animate: true,
                  });
                }
              }}
              aria-label="Select Salcedo Barangay"
              className="rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-semibold text-[#1A2421] max-w-[138px] truncate cursor-pointer"
            >
              <option value="all">All 21 Barangays</option>
              {SALCEDO_BARANGAY_POLYGONS.map((b) => (
                <option key={b.slug} value={b.slug}>
                  Brgy. {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Segmented Ranking Mode Toggle + Layer Switcher */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <div className="flex-1 grid grid-cols-3 rounded-full bg-white/95 backdrop-blur-md border border-[#EAE7E0] p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setRankMode("most_visited")}
                className={`rounded-full py-1 text-[10px] font-bold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
                  rankMode === "most_visited"
                    ? "bg-[#164237] text-white"
                    : "text-[#616E69]"
                }`}
              >
                <Flame className="w-3 h-3" />
                Most Visited
              </button>
              <button
                type="button"
                onClick={() => setRankMode("top_rated")}
                className={`rounded-full py-1 text-[10px] font-bold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
                  rankMode === "top_rated"
                    ? "bg-[#B88A44] text-white"
                    : "text-[#616E69]"
                }`}
              >
                <Star className="w-3 h-3" />
                Top Rated
              </button>
              <button
                type="button"
                onClick={() => setRankMode("explore")}
                className={`rounded-full py-1 text-[10px] font-bold inline-flex items-center justify-center gap-1 transition cursor-pointer ${
                  rankMode === "explore"
                    ? "bg-[#1D7874] text-white"
                    : "text-[#616E69]"
                }`}
              >
                <Tag className="w-3 h-3" />
                Categories
              </button>
            </div>
          </div>

          {/* Horizontal Category Filter Pills */}
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedType(t.id);
                  setActivePlace(null);
                }}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer ${
                  selectedType === t.id
                    ? "bg-[#164237] text-white"
                    : "bg-white/95 backdrop-blur-md text-[#1A2421] border border-[#EAE7E0]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Right Map Tool Dock (Recenter, GPS, Basemap Style, Borders, Names) */}
        <div className="absolute right-3 top-40 z-[420] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Center on Salcedo"
            title="Fit Salcedo"
            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border border-[#EAE7E0] flex items-center justify-center text-[#164237] shadow-sm active:scale-90 transition cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            aria-label="My current location"
            title="Near Me"
            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border border-[#EAE7E0] flex items-center justify-center text-[#1D7874] shadow-sm active:scale-90 transition cursor-pointer disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setBasemap((b) =>
                b === "street" ? "terrain" : b === "terrain" ? "satellite" : "street"
              )
            }
            aria-label="Switch map style"
            title={`Style: ${BASEMAP_CONFIG[basemap].label}`}
            className="h-9 px-2.5 rounded-full bg-white/95 backdrop-blur-md border border-[#EAE7E0] flex items-center justify-center text-[10px] font-bold text-[#1A2421] shadow-sm active:scale-90 transition cursor-pointer"
          >
            {BASEMAP_CONFIG[basemap].label}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowBarangayBorders((v) => !v);
              setShowBarangayNames((v) => !v);
            }}
            aria-label="Toggle barangay boundaries and names"
            title="Barangays"
            className={`w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center shadow-sm active:scale-90 transition cursor-pointer ${
              showBarangayBorders
                ? "bg-[#164237] text-white border-[#164237]"
                : "bg-white/95 text-[#616E69] border-[#EAE7E0]"
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Overlay: Active Spot Sheet OR Ranked Carousel + Leaderboard Drawer */}
        <div className="absolute bottom-3 left-3 right-3 z-[440] space-y-2">
          {activePlace ? (
            <div className="bg-white/98 backdrop-blur-md rounded-2xl border border-[#EAE7E0] p-3 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-150">
              <img
                src={
                  activePlace.featuredImageUrl ||
                  "/images/salcedo/hero-salcedo-valley.png"
                }
                alt={activePlace.name}
                className="w-18 h-18 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
                      <span className="rounded-full bg-[#164237]/10 text-[#164237] px-2 py-0.5 tabular-nums">
                        #
                        {rankMode === "top_rated"
                          ? activePlace.topRatedRank ?? 1
                          : activePlace.mostVisitedRank ?? 1}{" "}
                        {rankMode === "top_rated" ? "Rated" : "Visited"}
                      </span>
                      {(activePlace.ratingCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[#1A2421] tabular-nums">
                          <Star className="w-3 h-3 text-[#B88A44]" fill="currentColor" />
                          {activePlace.averageRating?.toFixed(1)} ({activePlace.ratingCount})
                        </span>
                      )}
                      {(activePlace.visitCount ?? 0) > 0 && (
                        <span className="text-[#616E69] tabular-nums">
                          • {activePlace.visitCount} visits
                        </span>
                      )}
                    </div>
                    <p className="font-display font-bold text-sm text-[#1A2421] truncate mt-0.5">
                      {activePlace.name}
                    </p>
                    <p className="text-[10px] text-[#616E69] truncate">
                      {TYPE_LABELS[activePlace.placeType] || "Salcedo"}
                      {activePlace.barangay ? ` • Brgy. ${activePlace.barangay.name}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePlace(null)}
                    aria-label="Close spot preview"
                    className="w-6 h-6 rounded-full bg-[#F3F2EE] flex items-center justify-center text-[#616E69] shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <Link
                    href={`/app/places/${activePlace.slug}`}
                    className="rounded-full bg-[#164237] text-white px-3.5 py-1.5 text-[11px] font-semibold active:scale-95 transition"
                  >
                    Open &amp; Rate
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      void addPlaceToActiveDraft({
                        id: activePlace.id,
                        name: activePlace.name,
                        slug: activePlace.slug,
                        placeType: activePlace.placeType,
                        barangayName: activePlace.barangay?.name ?? null,
                        featuredImageUrl: activePlace.featuredImageUrl ?? null,
                        latitude: activePlace.latitude ?? null,
                        longitude: activePlace.longitude ?? null,
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-1.5 text-[11px] font-semibold text-[#1A2421] active:scale-95 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Trip
                  </button>
                </div>
              </div>
            </div>
          ) : (
            visiblePlaces.length > 0 && (
              <>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setRankingDrawerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#EAE7E0] px-3.5 py-1.5 text-[11px] font-bold text-[#1A2421] shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-[#164237]" />
                    Rankings Leaderboard ({visiblePlaces.length})
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-0.5">
                  {visiblePlaces.map((p, idx) => {
                    const rankNum =
                      rankMode === "most_visited"
                        ? p.mostVisitedRank ?? idx + 1
                        : rankMode === "top_rated"
                        ? p.topRatedRank ?? idx + 1
                        : idx + 1;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleFocusPlace(p)}
                        className="w-[238px] shrink-0 snap-start rounded-2xl bg-white/95 backdrop-blur-md border border-[#EAE7E0] p-2 shadow-md flex items-center gap-2.5 text-left active:scale-[0.97] transition cursor-pointer"
                      >
                        <div className="relative w-12 h-12 shrink-0">
                          <img
                            src={
                              p.featuredImageUrl ||
                              "/images/salcedo/hero-salcedo-valley.png"
                            }
                            alt={p.name}
                            className="w-full h-full rounded-xl object-cover bg-[#F3F2EE]"
                          />
                          <span
                            className={`absolute -top-1 -left-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white shadow-2xs tabular-nums ${
                              rankNum === 1
                                ? "bg-[#B88A44]"
                                : rankNum === 2
                                ? "bg-[#164237]"
                                : rankNum === 3
                                ? "bg-[#1D7874]"
                                : "bg-[#1A2421]"
                            }`}
                          >
                            #{rankNum}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="font-display font-bold text-xs text-[#1A2421] truncate">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#616E69]">
                            {(p.ratingCount ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-0.5 font-semibold text-[#1A2421] tabular-nums">
                                <Star
                                  className="w-2.5 h-2.5 text-[#B88A44]"
                                  fill="currentColor"
                                />
                                {p.averageRating?.toFixed(1)}
                              </span>
                            )}
                            {(p.visitCount ?? 0) > 0 && (
                              <span className="tabular-nums">• {p.visitCount} visits</span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#616E69] truncate">
                            {TYPE_LABELS[p.placeType]}
                            {p.barangay ? ` • Brgy. ${p.barangay.name}` : ""}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )
          )}
        </div>

        {/* Slide-Up Categorized & Ranked Spots Leaderboard Drawer */}
        {rankingDrawerOpen && (
          <div className="absolute inset-0 z-[480] flex items-end bg-black/40 backdrop-blur-[1px]">
            <div className="w-full max-h-[74%] bg-white rounded-t-[28px] border-t border-[#EAE7E0] p-4 pb-5 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
              <div className="w-10 h-1 rounded-full bg-[#D8D3C8] mx-auto shrink-0" />

              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-bold text-[#1A2421]">
                    {rankMode === "top_rated"
                      ? "Top Rated Spots"
                      : rankMode === "most_visited"
                      ? "Most Visited Spots"
                      : "Categorized Rankings"}
                  </h2>
                  <p className="text-[11px] text-[#616E69]">
                    {selectedBrgyLabel} • {visiblePlaces.length} spots
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRankingDrawerOpen(false)}
                  aria-label="Close leaderboard"
                  className="w-8 h-8 rounded-full bg-[#F3F2EE] flex items-center justify-center text-[#616E69] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#EAE7E0]">
                {visiblePlaces.map((p, idx) => {
                  const rankNum =
                    rankMode === "most_visited"
                      ? p.mostVisitedRank ?? idx + 1
                      : rankMode === "top_rated"
                      ? p.topRatedRank ?? idx + 1
                      : idx + 1;
                  return (
                    <div
                      key={p.id}
                      className="py-3 flex items-center gap-3"
                    >
                      <span
                        className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums ${
                          rankNum === 1
                            ? "bg-[#B88A44] text-white"
                            : rankNum === 2
                            ? "bg-[#164237] text-white"
                            : rankNum === 3
                            ? "bg-[#1D7874] text-white"
                            : "bg-[#F3F2EE] text-[#1A2421]"
                        }`}
                      >
                        #{rankNum}
                      </span>

                      <img
                        src={
                          p.featuredImageUrl ||
                          "/images/salcedo/hero-salcedo-valley.png"
                        }
                        alt={p.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-xs text-[#1A2421] truncate">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-[#616E69] mt-0.5">
                          <span className="font-medium text-[#164237]">
                            {TYPE_LABELS[p.placeType]}
                          </span>
                          {(p.ratingCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-0.5 font-semibold text-[#1A2421] tabular-nums">
                              <Star
                                className="w-2.5 h-2.5 text-[#B88A44]"
                                fill="currentColor"
                              />
                              {p.averageRating?.toFixed(1)} ({p.ratingCount})
                            </span>
                          )}
                          {(p.visitCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-0.5 tabular-nums">
                              <Eye className="w-2.5 h-2.5" />
                              {p.visitCount}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleFocusPlace(p)}
                          className="rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-2.5 py-1 text-[10px] font-semibold text-[#1A2421] cursor-pointer"
                        >
                          Pin
                        </button>
                        <Link
                          href={`/app/places/${p.slug}`}
                          className="rounded-full bg-[#164237] text-white px-2.5 py-1 text-[10px] font-semibold"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // EMBEDDED DIRECTORY MAP MODE (/app/discover map toggle)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <select
          value={selectedBarangay}
          onChange={(e) => {
            setSelectedBarangay(e.target.value);
            setActivePlace(null);
          }}
          aria-label="Filter map by Barangay"
          className="flex-1 rounded-full border border-[#EAE7E0] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1A2421]"
        >
          <option value="all">Salcedo (All 21 Barangays)</option>
          {SALCEDO_BARANGAY_POLYGONS.map((b) => (
            <option key={b.slug} value={b.slug}>
              Brgy. {b.name}
            </option>
          ))}
        </select>
        <span className="text-[11px] font-semibold text-[#616E69] shrink-0 tabular-nums px-1">
          {visiblePlaces.length} pins
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-[#EAE7E0] bg-[#ECE9E0]">
        <div ref={mapContainerRef} className={`w-full ${heightClass}`} />

        <div className="absolute top-2.5 right-2.5 z-[400] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Center map on Salcedo"
            className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm border border-[#EAE7E0] px-2.5 py-1.5 text-[11px] font-semibold text-[#1A2421] shadow-xs cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#164237]" />
            Salcedo
          </button>
          <button
            type="button"
            onClick={() =>
              setBasemap((b) =>
                b === "street" ? "terrain" : b === "terrain" ? "satellite" : "street"
              )
            }
            aria-label="Switch map style"
            className="inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm border border-[#EAE7E0] px-2.5 py-1.5 text-[11px] font-semibold text-[#1A2421] shadow-xs cursor-pointer"
          >
            {BASEMAP_CONFIG[basemap].label}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowBarangayBorders((v) => !v);
              setShowBarangayNames((v) => !v);
            }}
            aria-label="Toggle barangay borders"
            className={`inline-flex items-center gap-1 rounded-full backdrop-blur-sm border px-2.5 py-1.5 text-[11px] font-semibold shadow-xs cursor-pointer ${
              showBarangayBorders
                ? "bg-[#164237] text-white border-[#164237]"
                : "bg-white/95 text-[#1A2421] border-[#EAE7E0]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Borders
          </button>
        </div>

        {activePlace && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[450] bg-white rounded-2xl border border-[#EAE7E0] p-3 shadow-lg flex items-center gap-3">
            <img
              src={activePlace.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
              alt={activePlace.name}
              className="w-15 h-15 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-1">
                <p className="font-display font-bold text-sm text-[#1A2421] truncate">
                  {activePlace.name}
                </p>
                <button
                  type="button"
                  onClick={() => setActivePlace(null)}
                  aria-label="Close pin preview"
                  className="text-[#616E69] hover:text-[#1A2421] p-0.5 shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="inline-flex items-center gap-1.5 text-[11px] text-[#616E69] truncate">
                <MapPin className="w-3 h-3 text-[#1D7874]" />
                <span>
                  {activePlace.barangay ? `Brgy. ${activePlace.barangay.name}` : activePlace.address}
                </span>
                {(activePlace.ratingCount ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-[#1A2421]">
                    • ★{activePlace.averageRating?.toFixed(1)}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={`/app/places/${activePlace.slug}`}
                  className="rounded-full bg-[#164237] text-white px-3 py-1 text-[11px] font-semibold"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    void addPlaceToActiveDraft({
                      id: activePlace.id,
                      name: activePlace.name,
                      slug: activePlace.slug,
                      placeType: activePlace.placeType,
                      barangayName: activePlace.barangay?.name ?? null,
                      featuredImageUrl: activePlace.featuredImageUrl ?? null,
                      latitude: activePlace.latitude ?? null,
                      longitude: activePlace.longitude ?? null,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-semibold text-[#1A2421] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Trip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
