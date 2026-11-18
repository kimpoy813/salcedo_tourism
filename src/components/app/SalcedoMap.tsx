"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Kicker } from "@/components/ui/FieldGuide";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoSearchItem as SearchHit } from "@/app/api/geo/search/route";
import {
  ArrowUpRight, Check, ChevronRight, CloudSun, Crosshair, Layers, List,
  MapPin, Minus, Mountain, Navigation, Plus, Search, Star, X,
} from "lucide-react";
import {
  findSalcedoBarangayForPoint,
  isInsideSalcedo,
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
  heritage: "#8A6527",
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
  { id: "service", label: "Services" },
];

type BasemapStyle = "atlas" | "osm" | "clean" | "terrain" | "satellite";
type MapRankMode = "explore" | "most_visited" | "top_rated";

const BASEMAP_CONFIG: Record<
  BasemapStyle,
  { label: string; url: string; attribution: string; maxZoom: number }
> = {
  atlas: { label: "Field map", url: "", attribution: "Boundaries: PSA / NAMRIA", maxZoom: 19 },
  osm: {
    label: "Street map",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors • Salcedo PSA",
    maxZoom: 19,
  },
  clean: {
    label: "Clean",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OSM • Carto • Salcedo PSA",
    maxZoom: 19,
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
    maxZoom: 19,
  },
};

const BASEMAP_ORDER: BasemapStyle[] = ["atlas", "osm", "clean", "terrain", "satellite"];

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



function textLabel(value: string) {
  const node = document.createElement("span");
  node.textContent = value;
  return node;
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
  initialPlaceSlug,
}: {
  places: PlaceCardData[];
  barangays?: MapBarangayItem[];
  mode?: "fullscreen" | "embedded";
  heightClass?: string;
  initialPlaceSlug?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const barangaysLayerRef = useRef<L.LayerGroup | null>(null);
  const barangayLabelsLayerRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerLayerRef = useRef<L.LayerGroup | null>(null);
  const { draftStopIds, addPlaceToActiveDraft, showToast } = useMobileApp();

  const [basemap, setBasemap] = useState<BasemapStyle>("atlas");
  const [rankMode, setRankMode] = useState<MapRankMode>("most_visited");
  const [zoom, setZoom] = useState(13);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("all");
  const [showBarangayBorders, setShowBarangayBorders] = useState(true);
  const [showBarangayNames, setShowBarangayNames] = useState(true);
  const [rankingDrawerOpen, setRankingDrawerOpen] = useState(false);
  const [activePlace, setActivePlace] = useState<PlaceCardData | null>(() =>
    initialPlaceSlug ? (places.find((p) => p.slug === initialPlaceSlug) ?? null) : null,
  );
  const [locating, setLocating] = useState(false);

  // Live Free Open Geospatial API States
  const [weather, setWeather] = useState<{
    temperatureC: number;
    condition: string;
  } | null>(null);
  const [elevationCache, setElevationCache] = useState<Record<string, number>>({});
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    insideSalcedo: boolean;
    barangayName: string | null;
  } | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [pinnedOsmResult, setPinnedOsmResult] = useState<SearchHit | null>(null);
  const deepLinkAppliedRef = useRef(false);
  const focusedBarangay = useRef<string | null>(null);

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
      return [...filtered].sort((a, b) => (a.mostVisitedRank ?? 99) - (b.mostVisitedRank ?? 99));
    }
    if (rankMode === "top_rated") {
      return [...filtered].sort((a, b) => (a.topRatedRank ?? 99) - (b.topRatedRank ?? 99));
    }
    return [...filtered].sort((a, b) => (a.categoryRank ?? 99) - (b.categoryRank ?? 99));
  }, [places, selectedType, selectedBarangay, rankMode]);

  // Fetch free Open-Meteo current weather for Salcedo on fullscreen mount
  useEffect(() => {
    if (mode !== "fullscreen" || !navigator.onLine) return;
    let cancelled = false;
    fetch("/api/geo/telemetry")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.weather) {
          setWeather({
            temperatureC: data.weather.temperatureC,
            condition: data.weather.condition,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Fetch spot elevation via free Open-Meteo DEM API whenever a spot opens
  useEffect(() => {
    if (
      !navigator.onLine ||
      !activePlace ||
      activePlace.latitude == null ||
      activePlace.longitude == null
    )
      return;
    if (elevationCache[activePlace.id] !== undefined) return;
    let cancelled = false;
    fetch(`/api/geo/telemetry?lat=${activePlace.latitude}&lng=${activePlace.longitude}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.elevationMeters === "number") {
          setElevationCache((prev) => ({
            ...prev,
            [activePlace.id]: data.elevationMeters,
          }));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activePlace, elevationCache]);

  // Show matching directory entries immediately, including when road search is offline.
  const localHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!searchOpen || q.length < 2) return [];
    const hits: SearchHit[] = [];
    for (const p of places) {
      if (
        p.latitude != null &&
        p.longitude != null &&
        `${p.name} ${p.address}`.toLowerCase().includes(q)
      )
        hits.push({
          id: `place-${p.id}`,
          label: p.name,
          subtitle: p.address,
          slug: p.slug,
          kind: "place",
          latitude: p.latitude,
          longitude: p.longitude,
        });
    }
    for (const b of barangays) {
      if (b.name.toLowerCase().includes(q))
        hits.push({
          id: `brgy-${b.id}`,
          label: `Brgy. ${b.name}`,
          subtitle: "Salcedo barangay",
          slug: b.slug,
          kind: "barangay",
          latitude: b.latitude,
          longitude: b.longitude,
        });
    }
    return hits.slice(0, 10);
  }, [places, barangays, searchQuery, searchOpen]);
  const mapHits = [
    ...localHits,
    ...searchResults.filter((hit) => !localHits.some((local) => local.id === hit.id)),
  ].slice(0, 10);

  // Debounced street and landmark search supplements the offline index.
  useEffect(() => {
    if (!searchOpen) return;
    const q = searchQuery.trim();
    if (q.length < 2 || !navigator.onLine) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSearching(true);
      fetch(`/api/geo/search?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data) => {
          if (!cancelled) {
            setSearchResults(data.results || []);
            setSearching(false);
          }
        })
        .catch(() => {
          if (!cancelled) setSearching(false);
        });
    }, 260);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, searchOpen]);

  // Initialize Leaflet Map strictly centered & isolated to Salcedo, Ilocos Sur
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    const salcedoBounds = L.latLngBounds(
      [SALCEDO_BOUNDS.south, SALCEDO_BOUNDS.west],
      [SALCEDO_BOUNDS.north, SALCEDO_BOUNDS.east],
    );

    const map = L.map(container, {
      center: SALCEDO_CENTER,
      zoom: 12,
      minZoom: 11,
      maxZoom: 19,
      maxBounds: salcedoBounds.pad(0.22),
      maxBoundsViscosity: 0.9,
      scrollWheelZoom: mode === "fullscreen",
      zoomSnap: 0.25,
      zoomControl: false,
      attributionControl: false,
    });

    L.control
      .attribution({ position: "bottomright", prefix: false })
      .addTo(map)
      .addAttribution("Boundaries: PSA / NAMRIA");
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
    map.on("zoomend", () => setZoom(map.getZoom()));

    const maskPane = map.createPane("salcedoMaskPane");
    maskPane.style.zIndex = "260";
    maskPane.style.pointerEvents = "none";

    const boundaryPane = map.createPane("salcedoBoundaryPane");
    boundaryPane.style.zIndex = "340";

    const labelPane = map.createPane("salcedoLabelPane");
    labelPane.style.zIndex = "360";
    labelPane.style.pointerEvents = "none";

    L.polygon([SALCEDO_MASK_OUTER_RING, SALCEDO_MUNICIPAL_POLYGON], {
      pane: "salcedoMaskPane",
      stroke: false,
      fillColor: "#f1efe5",
      fillOpacity: 0.49,
      fillRule: "evenodd",
      interactive: false,
    }).addTo(map);

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
    const userLayer = L.layerGroup().addTo(map);
    const markerLayer = L.layerGroup().addTo(map);
    const searchMarkerLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    barangaysLayerRef.current = brgyLayer;
    barangayLabelsLayerRef.current = brgyLabelsLayer;
    userLayerRef.current = userLayer;
    markersLayerRef.current = markerLayer;
    searchMarkerLayerRef.current = searchMarkerLayer;

    const topPad = 36;
    const bottomPad = 40;
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
      userLayerRef.current = null;
      markersLayerRef.current = null;
      searchMarkerLayerRef.current = null;
    };
  }, [mode]);

  // Handle deep links like /app/map?place=<slug> (focus only — directions open in Google Maps)
  useEffect(() => {
    if (!initialPlaceSlug || deepLinkAppliedRef.current || !mapRef.current) return;
    const target = places.find((p) => p.slug === initialPlaceSlug);
    if (!target || target.latitude == null || target.longitude == null) return;
    deepLinkAppliedRef.current = true;
    mapRef.current.setView([target.latitude, target.longitude], 15, { animate: true });
  }, [initialPlaceSlug, places]);

  // Swap Basemap Tile Layer (OSM / Clean / Terrain / Satellite)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = null;
    if (basemap === "atlas") return;
    const cfg = BASEMAP_CONFIG[basemap];
    const layer = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: cfg.maxZoom });
    const fallback = () => {
      setBasemap("atlas");
      showToast("Map tiles are unavailable. Showing local boundaries and places instead.", {
        tone: "info",
      });
    };
    layer.once("tileerror", fallback).addTo(map);
    tileLayerRef.current = layer;
    return () => {
      layer.off("tileerror", fallback);
      layer.remove();
    };
  }, [basemap, showToast]);

  // Render interactive 21 official Salcedo barangays + clean centroid labels
  useEffect(() => {
    const map = mapRef.current;
    const brgyLayer = barangaysLayerRef.current;
    const labelLayer = barangayLabelsLayerRef.current;
    if (!map || !brgyLayer || !labelLayer) return;

    if (selectedBarangay === "all") focusedBarangay.current = null;
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
          fillColor: isSelected
            ? "#55967c"
            : basemap === "atlas"
              ? ["#b7cda8", "#d5dcc2", "#c9d9b7", "#c6d6c4", "#e0d9ba"][
                  Number(brgy.psgc.slice(-3)) % 5
                ]
              : "#164237",
          fillOpacity: basemap === "atlas" ? 0.88 : isSelected ? 0.2 : 0.015,
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

        if (isSelected && focusedBarangay.current !== brgy.slug) {
          focusedBarangay.current = brgy.slug;
          map.fitBounds(poly.getBounds(), {
            paddingTopLeft: [28, 36],
            paddingBottomRight: [28, 40],
            maxZoom: 15,
            animate: true,
          });
        }
      }

      if ((showBarangayNames && zoom >= 13.5) || isSelected) {
        const center = computeCentroid(brgy.coordinates);
        const labelIcon = L.divIcon({
          className: "salcedo-brgy-label",
          iconSize: [0, 0],
          html: `<span class="salcedo-brgy-label-pill" style="${
            isSelected ? "background:#164237;color:#FFFFFF;border-color:#164237;" : ""
          }">${brgy.name}</span>`,
        });
        L.marker(center, {
          icon: labelIcon,
          pane: "salcedoLabelPane",
          interactive: false,
        }).addTo(labelLayer);
      }
    }
  }, [selectedBarangay, showBarangayBorders, showBarangayNames, basemap, mode, zoom]);

  // Render Live User GPS Blue Pulse Dot & Accuracy Ring
  useEffect(() => {
    const layer = userLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!userLocation) return;

    L.circle([userLocation.lat, userLocation.lng], {
      radius: Math.min(Math.max(userLocation.accuracy, 20), 400),
      color: "#2563EB",
      weight: 1,
      fillColor: "#3B82F6",
      fillOpacity: 0.15,
      interactive: false,
    }).addTo(layer);

    const gpsIcon = L.divIcon({
      className: "salcedo-gps-dot",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      html: `<div style="width:18px;height:18px;border-radius:9999px;background:#2563EB;border:3px solid #FFFFFF;box-shadow:0 0 0 4px rgba(37,99,235,0.28);"></div>`,
    });
    L.marker([userLocation.lat, userLocation.lng], {
      icon: gpsIcon,
      zIndexOffset: 900,
    })
      .bindTooltip("Your GPS Location", { direction: "top", className: "salcedo-map-tooltip" })
      .addTo(layer);
  }, [userLocation]);

  // Render Pinned OSM Search Marker
  useEffect(() => {
    const layer = searchMarkerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!pinnedOsmResult) return;

    const pinIcon = L.divIcon({
      className: "salcedo-osm-pin",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      html: `<div style="width:28px;height:28px;border-radius:9999px;background:#D97706;border:2.5px solid #FFFFFF;box-shadow:0 4px 12px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">★</div>`,
    });
    L.marker([pinnedOsmResult.latitude, pinnedOsmResult.longitude], {
      icon: pinIcon,
      zIndexOffset: 850,
    })
      .bindTooltip(textLabel(pinnedOsmResult.label), {
        permanent: true,
        direction: "top",
        offset: [0, -14],
        className: "salcedo-map-tooltip",
      })
      .addTo(layer);
  }, [pinnedOsmResult]);

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
          ? (p.mostVisitedRank ?? listIdx + 1)
          : rankMode === "top_rated"
            ? (p.topRatedRank ?? listIdx + 1)
            : listIdx + 1;

      const showRankedBadge = rankMode !== "explore";
      const size = isSelected ? 36 : showRankedBadge && rankNum <= 3 ? 32 : 28;
      const badgeBg =
        rankNum === 1 ? "#8A6527" : rankNum === 2 ? "#164237" : rankNum === 3 ? "#1D7874" : color;

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
              textLabel(p.name.split(" ")[0]).innerHTML
            }${(p.averageRating ?? 0) > 0 ? ` ★${p.averageRating?.toFixed(1)}` : ""}</div>`
          : "";

      const icon = L.divIcon({
        className: "salcedo-div-pin",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="position:relative;width:${size}px;height:${size}px;">${ratingBubble}<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${
          showRankedBadge ? badgeBg : color
        };border:${isSelected ? "3px" : "2.5px"} solid #FFFFFF;box-shadow:0 ${
          isSelected ? "6px 16px" : "3px 10px"
        } rgba(16,50,42,${
          isSelected ? "0.42" : "0.28"
        });display:flex;align-items:center;justify-content:center;transition:transform 150ms ease;">${innerContent}</div></div>`,
      });

      const marker = L.marker([p.latitude, p.longitude], {
        icon,
        title: p.name,
        alt: p.name,
        zIndexOffset: isSelected ? 700 : showRankedBadge ? 400 - rankNum : 100,
      });

      marker.bindTooltip(
        textLabel(
          `${showRankedBadge ? `#${rankNum} ` : ""}${p.name}${
            (p.averageRating ?? 0) > 0 ? ` (★${p.averageRating?.toFixed(1)})` : ""
          }`,
        ),
        {
          direction: "top",
          offset: [0, -14],
          className: "salcedo-map-tooltip",
        },
      );

      marker.on("click", () => {
        setActivePlace(p);
        setPinnedOsmResult(null);
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
    setPinnedOsmResult(null);
    const bounds = L.latLngBounds(
      [SALCEDO_BOUNDS.south, SALCEDO_BOUNDS.west],
      [SALCEDO_BOUNDS.north, SALCEDO_BOUNDS.east],
    );
    map.fitBounds(bounds, {
      paddingTopLeft: [20, 36],
      paddingBottomRight: [20, 40],
      animate: true,
    });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapRef.current) {
      showToast("GPS geolocation is not supported on this device", { tone: "info" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const inside = isInsideSalcedo(latitude, longitude);
        const brgy = inside ? findSalcedoBarangayForPoint(latitude, longitude) : null;
        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy,
          insideSalcedo: inside,
          barangayName: brgy?.name ?? null,
        });
        if (inside) {
          mapRef.current?.setView([latitude, longitude], 15, { animate: true });
          showToast(brgy ? `Located in Brgy. ${brgy.name}` : "Located inside Salcedo", {
            tone: "info",
          });
        } else {
          showToast("Located outside Salcedo", {
            tone: "info",
          });
          mapRef.current?.setView(SALCEDO_CENTER, 12, { animate: true });
        }
      },
      () => {
        setLocating(false);
        showToast("Allow location access to see where you are on the map", { tone: "info" });
      },
      { enableHighAccuracy: true, timeout: 7000 },
    );
  };

  const handleFocusPlace = (p: PlaceCardData) => {
    setActivePlace(p);
    setPinnedOsmResult(null);
    setRankingDrawerOpen(false);
    if (p.latitude != null && p.longitude != null) {
      mapRef.current?.setView([p.latitude, p.longitude], 16, { animate: true });
    }
  };

  const handleSelectSearchHit = (hit: SearchHit) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);

    if (hit.kind === "place" && hit.slug) {
      const matched = places.find((p) => p.slug === hit.slug);
      if (matched) {
        setSelectedType("all");
        setSelectedBarangay("all");
        handleFocusPlace(matched);
        return;
      }
    }
    if (hit.kind === "barangay" && hit.slug) {
      setActivePlace(null);
      setPinnedOsmResult(null);
      setSelectedBarangay(hit.slug);
      return;
    }

    // Live OpenStreetMap road/landmark inside Salcedo
    setActivePlace(null);
    setPinnedOsmResult(hit);
    mapRef.current?.setView([hit.latitude, hit.longitude], 16, { animate: true });
  };

  const cycleBasemap = () => {
    setBasemap((curr) => {
      const idx = BASEMAP_ORDER.indexOf(curr);
      return BASEMAP_ORDER[(idx + 1) % BASEMAP_ORDER.length];
    });
  };

  const selectedBrgyObj =
    selectedBarangay !== "all" ? barangays.find((b) => b.slug === selectedBarangay) : null;

  const selectedBrgyLabel =
    selectedBarangay === "all"
      ? "Salcedo, Ilocos Sur"
      : `Brgy. ${
          selectedBrgyObj?.name ||
          SALCEDO_BARANGAY_POLYGONS.find((b) => b.slug === selectedBarangay)?.name ||
          selectedBarangay
        }`;

  const resultList = (
    <ol className="map-result-list">
      {visiblePlaces.map((p, i) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => handleFocusPlace(p)}
            aria-pressed={activePlace?.id === p.id}
          >
            <Image
              src={p.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
              alt=""
              width={64}
              height={54}
            />
            <span>
              <small>
                {rankMode !== "explore" &&
                  `#${(rankMode === "top_rated" ? p.topRatedRank : p.mostVisitedRank) ?? i + 1} · `}
                {TYPE_LABELS[p.placeType]}
              </small>
              <strong>{p.name.split(" (")[0]}</strong>
              <small>{p.barangay?.name || "Salcedo"}</small>
            </span>
            <ChevronRight size={15} />
          </button>
        </li>
      ))}
    </ol>
  );
  const locationSearch = searchOpen && searchQuery.trim().length >= 2;
  if (mode === "fullscreen") {
    return (
      <div className="map-workbench">
        <section className="map-sidebar" aria-label="Map explorer controls">
          <div className="map-panel-head">
            <Kicker>Salcedo field atlas</Kicker>
            <h1>Map explorer</h1>
            <p>Explore places across the valley’s 21 barangays.</p>
          </div>
          <div className="map-filter-box">
            <label className="directory-search">
              <Search size={16} />
              <input
                type="search"
                aria-label="Search map places and roads"
                placeholder="Search places, roads, or barangays…"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchOpen(true);
                  setSearching(navigator.onLine && e.target.value.trim().length >= 2);
                  setSearchQuery(e.target.value);
                  setSearchResults([]);
                }}
              />
            </label>
            {locationSearch && (
              <div className="map-search-hits">
                <div>
                  <span role="status">
                    {mapHits.length
                      ? "Search results"
                      : searching
                        ? "Searching…"
                        : navigator.onLine
                          ? "No matching places or roads."
                          : "No saved map matches. Reconnect to search roads."}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    aria-label="Close search results"
                  >
                    <X size={15} />
                  </button>
                </div>
                {mapHits.map((hit) => (
                  <button key={hit.id} type="button" onClick={() => handleSelectSearchHit(hit)}>
                    <MapPin size={15} />
                    <span>
                      {hit.label}
                      <small>{hit.subtitle}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="map-selects">
              <select
                aria-label="Filter by barangay"
                value={selectedBarangay}
                onChange={(e) => {
                  if (e.target.value === "all") handleRecenter();
                  else {
                    setSelectedBarangay(e.target.value);
                    setActivePlace(null);
                  }
                }}
              >
                <option value="all">All barangays</option>
                {SALCEDO_BARANGAY_POLYGONS.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by place type"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setActivePlace(null);
                }}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id === "all" ? "All place types" : t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="map-list-heading">
            <b>{visiblePlaces.length} places</b>
            <select
              aria-label="Rank map places"
              value={rankMode}
              onChange={(e) => setRankMode(e.target.value as MapRankMode)}
            >
              <option value="most_visited">Most visited</option>
              <option value="top_rated">Top rated</option>
              <option value="explore">By category</option>
            </select>
          </div>
          <div className="map-desktop-results">
            {resultList}
            {!visiblePlaces.length && <p className="empty-note">No places match these filters.</p>}
          </div>
        </section>
        <div className="map-stage">
          <div
            ref={mapContainerRef}
            className={`map-surface ${basemap === "atlas" ? "atlas-surface" : ""}`}
            aria-label="Interactive map of Salcedo"
          />
          <div className="map-style-picker">
            <Layers size={15} />
            <select
              aria-label="Map style"
              value={basemap}
              onChange={(e) => setBasemap(e.target.value as BasemapStyle)}
            >
              {BASEMAP_ORDER.map((key) => (
                <option key={key} value={key}>
                  {BASEMAP_CONFIG[key].label}
                </option>
              ))}
            </select>
          </div>
          <div className="map-tool-dock">
            <button title="Zoom in" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
              <Plus size={17} />
            </button>
            <button
              title="Zoom out"
              aria-label="Zoom out"
              onClick={() => mapRef.current?.zoomOut()}
            >
              <Minus size={17} />
            </button>
            <button title="Fit Salcedo" aria-label="Center on Salcedo" onClick={handleRecenter}>
              <Crosshair size={17} />
            </button>
            <button
              title="My location"
              aria-label="Find my location"
              disabled={locating}
              onClick={handleLocateMe}
            >
              <Navigation size={16} />
            </button>
            <button
              title="Barangay boundaries"
              aria-label="Toggle barangay boundaries"
              aria-pressed={showBarangayBorders}
              onClick={() => {
                setShowBarangayBorders(!showBarangayBorders);
                setShowBarangayNames(!showBarangayNames);
              }}
            >
              <Layers size={16} />
            </button>
          </div>
          <div className="map-coordinate-note">
            <span>{selectedBrgyLabel}</span>
            {weather && (
              <span>
                <CloudSun size={12} />
                {weather.temperatureC}°C · {weather.condition}
              </span>
            )}
          </div>
          {activePlace ? (
            <div className="map-preview">
              <button
                className="preview-close"
                aria-label="Close place preview"
                onClick={() => setActivePlace(null)}
              >
                <X size={16} />
              </button>
              <div className="preview-top">
                <Image
                  src={activePlace.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
                  alt=""
                  width={80}
                  height={66}
                />
                <div>
                  <small>
                    {TYPE_LABELS[activePlace.placeType]} · {activePlace.barangay?.name || "Salcedo"}
                  </small>
                  <h2>{activePlace.name.split(" (")[0]}</h2>
                  <span>
                    {!!activePlace.ratingCount && (
                      <>
                        <Star size={12} />
                        {activePlace.averageRating?.toFixed(1)} ({activePlace.ratingCount})
                      </>
                    )}
                    {elevationCache[activePlace.id] !== undefined && (
                      <>
                        <Mountain size={13} />
                        {elevationCache[activePlace.id]} m
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className="map-preview-actions">
                <Link className="primary-button" href={`/app/places/${activePlace.slug}`}>
                  View place
                  <ArrowUpRight size={14} />
                </Link>
                <button
                  className="secondary-button"
                  onClick={() =>
                    void addPlaceToActiveDraft({
                      ...activePlace,
                      barangayName: activePlace.barangay?.name,
                    })
                  }
                >
                  {draftStopIds.includes(activePlace.id) ? (
                    <>
                      <Check size={14} />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Trip
                    </>
                  )}
                </button>
                <a
                  className="text-link"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activePlace.latitude},${activePlace.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Directions
                </a>
              </div>
            </div>
          ) : pinnedOsmResult ? (
            <div className="map-preview">
              <button
                className="preview-close"
                aria-label="Close search pin"
                onClick={() => setPinnedOsmResult(null)}
              >
                <X size={16} />
              </button>
              <Kicker>Map pin</Kicker>
              <h2>{pinnedOsmResult.label}</h2>
              <p>{pinnedOsmResult.subtitle}</p>
            </div>
          ) : (
            <button
              className="map-browse-button primary-button"
              onClick={() => setRankingDrawerOpen(true)}
            >
              <List size={16} />
              Browse {visiblePlaces.length} places
            </button>
          )}
        </div>
        {rankingDrawerOpen && (
          <Modal label="Places on the map" onClose={() => setRankingDrawerOpen(false)}>
            <div className="map-results-dialog">
              <div className="dialog-heading">
                <div>
                  <Kicker>Map explorer</Kicker>
                  <h2>Places on the map</h2>
                </div>
                <button
                  className="icon-button"
                  aria-label="Close places"
                  onClick={() => setRankingDrawerOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              {resultList}
              {!visiblePlaces.length && (
                <p className="empty-note">No places match. Try another barangay or place type.</p>
              )}
            </div>
          </Modal>
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
        <div
          ref={mapContainerRef}
          className={`w-full ${heightClass} ${basemap === "atlas" ? "atlas-surface" : ""}`}
        />

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
            onClick={cycleBasemap}
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
                  {activePlace.barangay
                    ? `Brgy. ${activePlace.barangay.name}`
                    : activePlace.address}
                </span>
                {(activePlace.ratingCount ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-[#1A2421]">
                    • <Star className="w-3 h-3 text-[#B88A44] fill-[#B88A44]" />
                    {activePlace.averageRating?.toFixed(1)}
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
