"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Crosshair,
  Layers,
  MapPin,
  Navigation,
  Plus,
  X,
} from "lucide-react";
import {
  SALCEDO_BARANGAY_POLYGONS,
  SALCEDO_BOUNDS,
  SALCEDO_CENTER,
  SALCEDO_MUNICIPAL_POLYGON,
  WORLD_OUTER_RING,
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
];

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
  const barangaysLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const { addPlaceToActiveDraft } = useMobileApp();

  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("all");
  const [showBarangayBorders, setShowBarangayBorders] = useState(true);
  const [activePlace, setActivePlace] = useState<PlaceCardData | null>(null);
  const [locating, setLocating] = useState(false);

  const visiblePlaces = useMemo(() => {
    return places.filter((p) => {
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
  }, [places, selectedType, selectedBarangay]);

  // Initialize Leaflet Map locked & isolated to Municipality of Salcedo
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const salcedoBounds = L.latLngBounds(
      [SALCEDO_BOUNDS.south, SALCEDO_BOUNDS.west],
      [SALCEDO_BOUNDS.north, SALCEDO_BOUNDS.east]
    );

    const map = L.map(mapContainerRef.current, {
      center: SALCEDO_CENTER,
      zoom: 12,
      minZoom: 11,
      maxZoom: 17,
      maxBounds: salcedoBounds.pad(0.55),
      maxBoundsViscosity: 0.85,
      scrollWheelZoom: true,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.attribution({ position: "bottomleft", prefix: false }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OSM • Salcedo Boundary (PSA)",
      maxZoom: 18,
    }).addTo(map);

    // Custom panes so the outer municipality veil sits cleanly over tiles and under markers
    const maskPane = map.createPane("salcedoMaskPane");
    maskPane.style.zIndex = "260";
    maskPane.style.pointerEvents = "none";

    const boundaryPane = map.createPane("salcedoBoundaryPane");
    boundaryPane.style.zIndex = "340";

    // Inverse world mask — veils surrounding municipalities so ONLY Salcedo stands out vividly
    L.polygon([WORLD_OUTER_RING, SALCEDO_MUNICIPAL_POLYGON], {
      pane: "salcedoMaskPane",
      stroke: false,
      fillColor: "#EAE6DC",
      fillOpacity: 0.84,
      interactive: false,
    }).addTo(map);

    // Subtle soft glow + crisp municipal perimeter of Salcedo
    L.polygon(SALCEDO_MUNICIPAL_POLYGON, {
      pane: "salcedoBoundaryPane",
      color: "#164237",
      weight: 7,
      opacity: 0.14,
      fill: false,
      lineJoin: "round",
      interactive: false,
    }).addTo(map);

    L.polygon(SALCEDO_MUNICIPAL_POLYGON, {
      pane: "salcedoBoundaryPane",
      color: "#164237",
      weight: 2.6,
      opacity: 0.95,
      fillColor: "#164237",
      fillOpacity: 0.03,
      lineJoin: "round",
      interactive: false,
    }).addTo(map);

    const brgyLayer = L.layerGroup().addTo(map);
    const markerLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    barangaysLayerRef.current = brgyLayer;
    markersLayerRef.current = markerLayer;

    // Fit tightly to Salcedo municipality silhouette
    map.fitBounds(salcedoBounds, {
      paddingTopLeft: mode === "fullscreen" ? [24, 112] : [22, 22],
      paddingBottomRight: mode === "fullscreen" ? [24, 108] : [22, 22],
    });

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapRef.current = null;
      barangaysLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, [mode]);

  // Render interactive 21 official barangay polygons inside Salcedo
  useEffect(() => {
    const map = mapRef.current;
    const brgyLayer = barangaysLayerRef.current;
    if (!map || !brgyLayer) return;

    brgyLayer.clearLayers();

    if (!showBarangayBorders && selectedBarangay === "all") return;

    for (const brgy of SALCEDO_BARANGAY_POLYGONS) {
      const isSelected = selectedBarangay === brgy.slug;
      if (!showBarangayBorders && !isSelected) continue;

      const poly = L.polygon(brgy.coordinates, {
        pane: "salcedoBoundaryPane",
        color: "#164237",
        weight: isSelected ? 2.2 : 1,
        opacity: isSelected ? 0.92 : 0.3,
        dashArray: isSelected ? undefined : "3 4",
        fillColor: isSelected ? "#1D7874" : "#164237",
        fillOpacity: isSelected ? 0.16 : 0.01,
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
          paddingTopLeft: mode === "fullscreen" ? [32, 120] : [28, 28],
          paddingBottomRight: mode === "fullscreen" ? [32, 120] : [28, 28],
          maxZoom: 15,
          animate: true,
        });
      }
    }
  }, [selectedBarangay, showBarangayBorders, mode]);

  // Render crisp custom place pins
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    for (const p of visiblePlaces) {
      if (p.latitude == null || p.longitude == null) continue;
      const color = TYPE_COLORS[p.placeType] || "#164237";
      const isSelected = activePlace?.id === p.id;
      const size = isSelected ? 26 : 18;

      const icon = L.divIcon({
        className: "salcedo-div-pin",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:${
          isSelected ? "3px" : "2.5px"
        } solid #FFFFFF;box-shadow:0 ${isSelected ? "6px 16px" : "3px 8px"} rgba(16,50,42,${
          isSelected ? "0.38" : "0.26"
        });display:flex;align-items:center;justify-content:center;transition:transform 150ms ease;"><span style="width:${
          isSelected ? "7px" : "5px"
        };height:${isSelected ? "7px" : "5px"};border-radius:9999px;background:#FFFFFF;opacity:0.95;"></span></div>`,
      });

      const marker = L.marker([p.latitude, p.longitude], {
        icon,
        zIndexOffset: isSelected ? 500 : 10,
      });

      marker.bindTooltip(p.name, {
        direction: "top",
        offset: [0, -10],
        className: "salcedo-map-tooltip",
      });

      marker.on("click", () => {
        setActivePlace(p);
        map.panTo([p.latitude!, p.longitude!], { animate: true });
      });

      marker.addTo(layer);
    }
  }, [visiblePlaces, activePlace]);

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
      paddingTopLeft: mode === "fullscreen" ? [24, 112] : [22, 22],
      paddingBottomRight: mode === "fullscreen" ? [24, 108] : [22, 22],
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
    if (p.latitude != null && p.longitude != null) {
      mapRef.current?.setView([p.latitude, p.longitude], 15, { animate: true });
    }
  };

  const selectedBrgyLabel =
    selectedBarangay === "all"
      ? "Salcedo (All 21)"
      : `Brgy. ${
          barangays.find((b) => b.slug === selectedBarangay)?.name ||
          SALCEDO_BARANGAY_POLYGONS.find((b) => b.slug === selectedBarangay)?.name ||
          selectedBarangay
        }`;

  // FULLSCREEN NATIVE APP MAP MODE (/app/map)
  if (mode === "fullscreen") {
    return (
      <div className="relative w-full h-full bg-[#EAE6DC] overflow-hidden select-none">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Native Top Overlay: Municipality Pill + Filter Chips */}
        <div className="absolute top-[max(12px,env(safe-area-inset-top))] left-3 right-3 z-[420] space-y-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-2xl bg-white/92 backdrop-blur-md border border-[#EAE7E0] px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#164237] shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-xs font-bold text-[#1A2421] truncate">
                  {selectedBrgyLabel}
                </p>
                <p className="text-[10px] text-[#616E69] tabular-nums">
                  {visiblePlaces.length} verified spots in Salcedo
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
                    paddingTopLeft: [24, 112],
                    paddingBottomRight: [24, 108],
                    animate: true,
                  });
                }
              }}
              aria-label="Select Salcedo Barangay"
              className="rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-semibold text-[#1A2421] max-w-[140px] truncate cursor-pointer"
            >
              <option value="all">All 21 Barangays</option>
              {SALCEDO_BARANGAY_POLYGONS.map((b) => (
                <option key={b.slug} value={b.slug}>
                  Brgy. {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedType(t.id);
                  setActivePlace(null);
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer ${
                  selectedType === t.id
                    ? "bg-[#164237] text-white"
                    : "bg-white/92 backdrop-blur-md text-[#1A2421] border border-[#EAE7E0]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Right Circular Map Controls */}
        <div className="absolute right-3 top-32 z-[420] flex flex-col gap-2">
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Center on Salcedo"
            title="Center on Salcedo"
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#EAE7E0] flex items-center justify-center text-[#164237] shadow-sm active:scale-90 transition cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            aria-label="My current location"
            title="Near Me"
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#EAE7E0] flex items-center justify-center text-[#1D7874] shadow-sm active:scale-90 transition cursor-pointer disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowBarangayBorders((v) => !v)}
            aria-label="Toggle 21 barangay borders"
            title="Toggle Barangay Borders"
            className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center shadow-sm active:scale-90 transition cursor-pointer ${
              showBarangayBorders
                ? "bg-[#164237] text-white border-[#164237]"
                : "bg-white/95 text-[#616E69] border-[#EAE7E0]"
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>

        {/* Native Bottom Overlay: Selected Pin Sheet OR Horizontal Spot Strip */}
        <div className="absolute bottom-3 left-3 right-3 z-[440]">
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
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1D7874]">
                      {TYPE_LABELS[activePlace.placeType] || "Salcedo"}
                      {activePlace.barangay ? ` • Brgy. ${activePlace.barangay.name}` : ""}
                    </p>
                    <p className="font-display font-bold text-sm text-[#1A2421] truncate">
                      {activePlace.name}
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
                    Open Guide
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
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-0.5">
                {visiblePlaces.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleFocusPlace(p)}
                    className="w-[216px] shrink-0 snap-start rounded-2xl bg-white/95 backdrop-blur-md border border-[#EAE7E0] p-2 shadow-md flex items-center gap-2.5 text-left active:scale-[0.97] transition cursor-pointer"
                  >
                    <img
                      src={p.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
                      alt={p.name}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-xs text-[#1A2421] truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-[#616E69] truncate">
                        {p.barangay ? `Brgy. ${p.barangay.name}` : TYPE_LABELS[p.placeType]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>
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

      <div className="relative rounded-2xl overflow-hidden border border-[#EAE7E0] bg-[#EAE6DC]">
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
            onClick={() => setShowBarangayBorders((v) => !v)}
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
              <p className="inline-flex items-center gap-1 text-[11px] text-[#616E69] truncate">
                <MapPin className="w-3 h-3 text-[#1D7874]" />
                {activePlace.barangay ? `Brgy. ${activePlace.barangay.name}` : activePlace.address}
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
