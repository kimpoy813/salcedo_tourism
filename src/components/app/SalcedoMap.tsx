"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass, Layers, MapPin, Navigation } from "lucide-react";

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
  heightClass = "h-[65vh] min-h-[420px]",
}: {
  places: MapPlaceItem[];
  barangays?: MapBarangayItem[];
  heightClass?: string;
}) {
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
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors | Municipality of Salcedo",
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
      const icon = L.divIcon({
        className: "turi-map-pin",
        html: `<div style="width:28px;height:28px;border-radius:9999px;background:${color};border:3px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.28);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">●</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
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
          html: `<div style="padding:2px 7px;border-radius:9999px;background:rgba(248,247,242,0.92);border:1px solid #123F35;color:#123F35;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);">${b.name}</div>`,
          iconSize: [80, 20],
          iconAnchor: [40, 10],
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
  }, [mappablePlaces, barangays, showBarangays]);

  // Explicit user-initiated optional geolocation ONLY — never automatic/forced
  const handleLocateOptional = () => {
    if (!("geolocation" in navigator)) {
      setGeoMessage("Location sharing is unavailable on this browser.");
      return;
    }
    setGeoMessage("Requesting location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoMessage(null);
        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14);
      },
      () => {
        setGeoMessage("Location skipped — centered on Salcedo Town Plaza.");
        mapRef.current?.setView(SALCEDO_CENTER, 13);
      },
      { timeout: 6000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Map Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-2xl border border-[#E5E0D5] p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              typeFilter === "all"
                ? "bg-[#123F35] text-white"
                : "bg-[#F8F7F2] text-[#202B28] hover:bg-[#E5E0D5]/60"
            }`}
          >
            All Pins ({places.filter((p) => p.latitude && p.longitude).length})
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                typeFilter === type
                  ? "bg-[#123F35] text-white"
                  : "bg-[#F8F7F2] text-[#202B28] hover:bg-[#E5E0D5]/60"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {barangays.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBarangays((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                showBarangays
                  ? "bg-[#168A8A] text-white border-[#168A8A]"
                  : "bg-white text-[#202B28] border-[#E5E0D5] hover:bg-[#F8F7F2]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              21 Barangays
            </button>
          )}
          <button
            type="button"
            onClick={() => mapRef.current?.setView(SALCEDO_CENTER, 13)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E5E0D5] text-[#202B28] hover:bg-[#F8F7F2] cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#123F35]" />
            Center Salcedo
          </button>
          <button
            type="button"
            onClick={handleLocateOptional}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E5E0D5] text-[#202B28] hover:bg-[#F8F7F2] cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-[#168A8A]" />
            Near Me (Optional)
          </button>
        </div>
      </div>

      {geoMessage && (
        <p className="text-xs text-[#5A6B66] px-1">{geoMessage}</p>
      )}

      {/* Map Container + Selected Destination Preview Drawer */}
      <div className="relative rounded-2xl overflow-hidden border border-[#E5E0D5] shadow-sm bg-[#E5E0D5]/40">
        <div ref={containerRef} className={`w-full ${heightClass}`} />

        {selectedPlace && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-[400] bg-white rounded-2xl shadow-xl border border-[#E5E0D5] p-3.5 flex gap-3 items-center">
            <img
              src={selectedPlace.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
              alt={selectedPlace.name}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-display font-bold text-sm text-[#202B28] truncate">
                  {selectedPlace.name}
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="text-xs text-[#5A6B66] hover:text-[#202B28] px-1 cursor-pointer"
                  aria-label="Close map card"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-[#168A8A] font-medium flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {selectedPlace.barangay ? `Brgy. ${selectedPlace.barangay.name}` : selectedPlace.address}
              </p>
              <p className="text-xs text-[#5A6B66] line-clamp-2">
                {selectedPlace.shortDescription}
              </p>
              <Link
                href={`/app/places/${selectedPlace.slug}`}
                className="inline-block text-xs font-bold text-[#123F35] hover:underline pt-0.5"
              >
                Open Destination Guide →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
