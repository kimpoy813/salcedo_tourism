"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass, Crosshair, MapPin, Navigation, Plus, X } from "lucide-react";
import type { PlaceCardData } from "./PlaceCard";
import { useMobileApp } from "./MobileAppContext";

const SALCEDO_CENTER: [number, number] = [17.1455, 120.5315];

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

const TYPE_OPTIONS = [
  { id: "all", label: "All" },
  { id: "attraction", label: "Attractions" },
  { id: "nature", label: "Nature" },
  { id: "resort", label: "Resorts" },
  { id: "restaurant", label: "Dining" },
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
  heightClass = "h-[60vh] min-h-[380px]",
}: {
  places: PlaceCardData[];
  barangays?: MapBarangayItem[];
  heightClass?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const { addPlaceToActiveDraft } = useMobileApp();

  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("all");
  const [activePlace, setActivePlace] = useState<PlaceCardData | null>(null);
  const [locating, setLocating] = useState(false);

  const visiblePlaces = useMemo(() => {
    return places.filter((p) => {
      if (p.latitude == null || p.longitude == null) return false;
      if (selectedType !== "all") {
        if (selectedType === "attraction") {
          if (!["attraction", "nature", "heritage"].includes(p.placeType)) return false;
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

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: SALCEDO_CENTER,
      zoom: 12,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = layer;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    for (const b of barangays) {
      L.circleMarker([b.latitude, b.longitude], {
        radius: 3.5,
        color: "#616E69",
        weight: 1,
        fillColor: "#FAF9F6",
        fillOpacity: 0.9,
      })
        .bindTooltip(`Brgy. ${b.name}`, { direction: "top" })
        .addTo(layer);
    }

    for (const p of visiblePlaces) {
      if (p.latitude == null || p.longitude == null) continue;
      const color = TYPE_COLORS[p.placeType] || "#164237";
      const isSelected = activePlace?.id === p.id;
      const marker = L.circleMarker([p.latitude, p.longitude], {
        radius: isSelected ? 10.5 : 8,
        color: "#FFFFFF",
        weight: 2.5,
        fillColor: color,
        fillOpacity: 0.95,
      });

      marker.on("click", () => {
        setActivePlace(p);
        map.panTo([p.latitude!, p.longitude!], { animate: true });
      });

      marker.addTo(layer);
    }
  }, [visiblePlaces, barangays, activePlace]);

  const handleRecenter = () => {
    mapRef.current?.setView(SALCEDO_CENTER, 12, { animate: true });
    setActivePlace(null);
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

  return (
    <div className="space-y-3">
      {/* Minimal Filter Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSelectedType(t.id);
                setActivePlace(null);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                selectedType === t.id
                  ? "bg-[#164237] text-white"
                  : "bg-white text-[#1A2421] border border-[#EAE7E0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

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
            <option value="all">All 21 Barangays</option>
            {barangays.map((b) => (
              <option key={b.id} value={b.slug}>
                Brgy. {b.name}
              </option>
            ))}
          </select>

          <span className="text-[11px] font-semibold text-[#616E69] shrink-0 tabular-nums px-1">
            {visiblePlaces.length} pins
          </span>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-[#EAE7E0] bg-white">
        <div ref={mapContainerRef} className={`w-full ${heightClass}`} />

        {/* Quiet Floating Map Controls */}
        <div className="absolute top-2.5 right-2.5 z-[400] flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleRecenter}
            aria-label="Center map on Salcedo"
            className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm border border-[#EAE7E0] px-2.5 py-1.5 text-[11px] font-semibold text-[#1A2421] shadow-xs cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#164237]" />
            Center
          </button>
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            aria-label="Near my location"
            className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm border border-[#EAE7E0] px-2.5 py-1.5 text-[11px] font-semibold text-[#1A2421] shadow-xs cursor-pointer disabled:opacity-60"
          >
            <Navigation className="w-3.5 h-3.5 text-[#1D7874]" />
            {locating ? "..." : "Near Me"}
          </button>
        </div>

        {/* Minimal Selected Pin Sheet */}
        {activePlace && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[450] bg-white rounded-2xl border border-[#EAE7E0] p-3 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <img
              src={
                activePlace.featuredImageUrl ||
                "/images/salcedo/hero-salcedo-valley.png"
              }
              alt={activePlace.name}
              className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
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
                {activePlace.barangay
                  ? `Brgy. ${activePlace.barangay.name}`
                  : activePlace.address}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
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

      {/* Quick Jump Spots */}
      {visiblePlaces.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-[#616E69] inline-flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#164237]" />
            Jump to spot
          </p>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {visiblePlaces.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePlace(p);
                  if (p.latitude != null && p.longitude != null) {
                    mapRef.current?.setView([p.latitude, p.longitude], 15, {
                      animate: true,
                    });
                  }
                }}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium border transition cursor-pointer ${
                  activePlace?.id === p.id
                    ? "bg-[#164237] text-white border-[#164237]"
                    : "bg-white text-[#1A2421] border-[#EAE7E0]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
