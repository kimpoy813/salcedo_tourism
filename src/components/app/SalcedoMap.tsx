"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Check, Compass, Layers, MapPin, Navigation, Plus, X } from "lucide-react";
import { useMobileApp } from "./MobileAppContext";

export interface MapPlaceItem {
  id: string;
  name: string;
  slug: string;
  placeType: string;
  shortDescription: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  featuredImageUrl?: string | null;
  barangay?: { name: string; slug: string } | null;
}

export interface MapBarangayItem {
  id: string;
  name: string;
  slug: string;
  latitude?: number | null;
  longitude?: number | null;
  population2020: number | null;
  publishedPlacesCount?: number;
}

const SALCEDO_CENTER: [number, number] = [17.1507, 120.5361];

const PIN_COLORS: Record<string, string> = {
  nature: "#168A8A",
  attraction: "#123F35",
  heritage: "#B57E2E",
  resort: "#0EA5E9",
  restaurant: "#D97706",
  cafe: "#78350F",
  accommodation: "#6366F1",
  business: "#15803D",
  service: "#DC2626",
};

export function SalcedoMap({
  places,
  barangays = [],
  heightClass = "h-[calc(100dvh-16.5rem)] min-h-[380px]",
}: {
  places: MapPlaceItem[];
  barangays?: MapBarangayItem[];
  heightClass?: string;
}) {
  const { draftStopIds, addPlaceToActiveDraft } = useMobileApp();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showBarangays, setShowBarangays] = useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<MapPlaceItem | null>(null);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const mappablePlaces = useMemo(
    () =>
      places.filter((p) => {
        if (typeof p.latitude !== "number" || typeof p.longitude !== "number") return false;
        if (typeFilter !== "all" && p.placeType !== typeFilter) return false;
        return true;
      }),
    [places, typeFilter]
  );

  const availableTypes = useMemo(() => {
    const s = new Set(places.map((p) => p.placeType));
    return Array.from(s);
  }, [places]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: SALCEDO_CENTER,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap | Salcedo",
      maxZoom: 18,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    for (const p of mappablePlaces) {
      if (typeof p.latitude !== "number" || typeof p.longitude !== "number") continue;
      const color = PIN_COLORS[p.placeType] || "#123F35";
      const isSelected = selectedPlace?.id === p.id;
      const icon = L.divIcon({
        className: "turi-map-pin",
        html: `<div style="width:${isSelected ? 32 : 26}px;height:${
          isSelected ? 32 : 26
        }px;border-radius:9999px;background:${color};border:3px solid ${
          isSelected ? "#D6A85B" : "#ffffff"
        };box-shadow:0 3px 10px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;">●</div>`,
        iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
        iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
      });

      const marker = L.marker([p.latitude, p.longitude], { icon });
      marker.bindTooltip(p.name, { direction: "top", offset: [0, -10] });
      marker.on("click", () => {
        setSelectedPlace(p);
        map.panTo([p.latitude!, p.longitude!], { animate: true });
      });
      marker.addTo(group);
    }

    if (showBarangays) {
      for (const b of barangays) {
        if (typeof b.latitude !== "number" || typeof b.longitude !== "number") continue;
        const icon = L.divIcon({
          className: "turi-brgy-pin",
          html: `<div style="padding:2px 6px;border-radius:9999px;background:rgba(248,247,242,0.92);border:1px solid #123F35;color:#123F35;font-size:9px;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);">${b.name}</div>`,
          iconSize: [74, 18],
          iconAnchor: [37, 9],
        });
        L.marker([b.latitude, b.longitude], { icon })
          .bindPopup(
            `<strong>Brgy. ${b.name}</strong><br/>2020 Pop: ${
              b.population2020?.toLocaleString() ?? "N/A"
            }<br/>Published spots: ${b.publishedPlacesCount ?? 0}`
          )
          .addTo(group);
      }
    }
  }, [mappablePlaces, barangays, showBarangays, selectedPlace?.id]);

  // Explicit user-initiated optional geolocation ONLY — never automatic/forced
  const handleLocateOptional = () => {
    if (!("geolocation" in navigator)) {
      setGeoMessage("Location sharing unavailable on this browser.");
      return;
    }
    setGeoMessage("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoMessage(null);
        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14);
      },
      () => {
        setGeoMessage("Location skipped — centered on Salcedo Plaza.");
        mapRef.current?.setView(SALCEDO_CENTER, 13);
      },
      { timeout: 6000 }
    );
  };

  const focusPlace = (p: MapPlaceItem) => {
    setSelectedPlace(p);
    if (typeof p.latitude === "number" && typeof p.longitude === "number") {
      mapRef.current?.setView([p.latitude, p.longitude], 15, { animate: true });
    }
  };

  const selectedInDraft = selectedPlace ? draftStopIds.includes(selectedPlace.id) : false;

  return (
    <div className="space-y-2.5">
      {/* Horizontal Swipeable Map Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        <button
          type="button"
          onClick={() => setTypeFilter("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
            typeFilter === "all"
              ? "bg-[#123F35] text-white"
              : "bg-white border border-[#E5E0D5] text-[#202B28]"
          }`}
        >
          All ({places.filter((p) => p.latitude && p.longitude).length})
        </button>
        {availableTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition cursor-pointer ${
              typeFilter === type
                ? "bg-[#123F35] text-white"
                : "bg-white border border-[#E5E0D5] text-[#202B28]"
            }`}
          >
            {type}
          </button>
        ))}
        {barangays.length > 0 && (
          <button
            type="button"
            onClick={() => setShowBarangays((v) => !v)}
            className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
              showBarangays
                ? "bg-[#168A8A] text-white border-[#168A8A]"
                : "bg-white text-[#202B28] border-[#E5E0D5]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            21 Barangays
          </button>
        )}
      </div>

      {/* Map Canvas + Floating Controls + Bottom Pin Preview Sheet */}
      <div className="relative rounded-2xl overflow-hidden border border-[#E5E0D5] shadow-sm bg-[#E5E0D5]/40">
        <div ref={containerRef} className={`w-full ${heightClass}`} />

        {/* Floating Map Utility Pills (Top Left) */}
        <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => mapRef.current?.setView(SALCEDO_CENTER, 13)}
            className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-xs border border-[#E5E0D5] px-2.5 py-1.5 text-[11px] font-bold text-[#123F35] shadow-sm cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            Salcedo Plaza
          </button>
          <button
            type="button"
            onClick={handleLocateOptional}
            className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-xs border border-[#E5E0D5] px-2.5 py-1.5 text-[11px] font-bold text-[#168A8A] shadow-sm cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            Near Me
          </button>
        </div>

        {geoMessage && (
          <div className="absolute top-12 left-3 z-[400] rounded-xl bg-[#0D3029]/90 text-white px-2.5 py-1 text-[11px]">
            {geoMessage}
          </div>
        )}

        {/* Selected Destination Bottom Sheet Card */}
        {selectedPlace && (
          <div className="absolute bottom-3 left-3 right-3 z-[400] bg-white rounded-2xl shadow-xl border border-[#E5E0D5] p-3 space-y-2.5">
            <div className="flex gap-2.5 items-center">
              <img
                src={selectedPlace.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
                alt={selectedPlace.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-display font-bold text-sm text-[#202B28] truncate">
                    {selectedPlace.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedPlace(null)}
                    className="p-0.5 text-[#5A6B66] hover:text-[#202B28] cursor-pointer shrink-0"
                    aria-label="Close map card"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-[#168A8A] font-semibold flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {selectedPlace.barangay
                    ? `Brgy. ${selectedPlace.barangay.name}`
                    : selectedPlace.address}
                </p>
                <p className="text-[11px] text-[#5A6B66] line-clamp-2">
                  {selectedPlace.shortDescription}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/app/places/${selectedPlace.slug}`}
                className="flex-1 text-center rounded-xl bg-[#123F35] text-white py-2 text-xs font-bold"
              >
                Open Guide →
              </Link>
              <button
                type="button"
                onClick={() =>
                  void addPlaceToActiveDraft({
                    id: selectedPlace.id,
                    name: selectedPlace.name,
                    slug: selectedPlace.slug,
                    placeType: selectedPlace.placeType,
                    barangayName: selectedPlace.barangay?.name ?? null,
                    featuredImageUrl: selectedPlace.featuredImageUrl ?? null,
                    latitude: selectedPlace.latitude ?? null,
                    longitude: selectedPlace.longitude ?? null,
                  })
                }
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer ${
                  selectedInDraft
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-[#F8F7F2] border border-[#E5E0D5] text-[#123F35]"
                }`}
              >
                {selectedInDraft ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    In Trip
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Trip
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Quick-Jump Place Chips */}
      {mappablePlaces.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6B66] shrink-0">
            Jump to:
          </span>
          {mappablePlaces.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => focusPlace(p)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold border transition cursor-pointer ${
                selectedPlace?.id === p.id
                  ? "bg-[#D6A85B] text-[#0D3029] border-[#D6A85B] font-bold"
                  : "bg-white text-[#202B28] border-[#E5E0D5]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
