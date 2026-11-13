"use client";

import React, { useState } from "react";
import { CheckCircle2, Edit3, MapPin, Plus, Search, X } from "lucide-react";
import {
  findSalcedoBarangayForPoint,
  isInsideSalcedo,
} from "@/lib/geo/salcedo-boundary";

interface AdminPlaceRow {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  placeType: string;
  primaryCategoryId: string | null;
  barangayId: string | null;
  barangayName: string | null;
  categoryName: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  websiteUrl: string | null;
  featuredImageUrl: string | null;
  status: "draft" | "pending_review" | "published" | "archived";
  isFeatured: boolean;
  isHiddenGem: boolean;
  isPlaceholder: boolean;
  sourceReference: string;
  cafeDetails?: {
    featuredDrinks?: string[];
    foodOfferings?: string[];
    priceRangeNote?: string | null;
    hasWifi?: boolean | null;
    hasParking?: boolean | null;
    brewStyleNote?: string | null;
  } | null;
  resortDetails?: {
    poolsSummary?: string | null;
    cottagesSummary?: string | null;
    roomsSummary?: string | null;
    entranceFeeNote?: string | null;
    cottageRoomRatesNote?: string | null;
    externalInquiryUrl?: string | null;
  } | null;
  restaurantDetails?: {
    cuisineType?: string | null;
    featuredDishes?: string[];
    menuHighlights?: string[];
  } | null;
}

const STATUS_DOT: Record<string, string> = {
  published: "bg-emerald-600",
  pending_review: "bg-amber-500",
  draft: "bg-slate-400",
  archived: "bg-rose-500",
};

export function AdminPlacesPanel({
  places,
  barangays,
  categories,
  canPublish,
  onReload,
}: {
  places: AdminPlaceRow[];
  barangays: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  canPublish: boolean;
  onReload: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [placeType, setPlaceType] = useState("attraction");
  const [primaryCategoryId, setPrimaryCategoryId] = useState("");
  const [barangayId, setBarangayId] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [phone, setPhone] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState(
    "/images/salcedo/hero-salcedo-valley.png"
  );
  const [status, setStatus] = useState<"draft" | "pending_review" | "published" | "archived">(
    "draft"
  );
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [sourceReference, setSourceReference] = useState(
    "Salcedo Municipal Tourism Office (CEDO)"
  );

  const [cafeDrinks, setCafeDrinks] = useState("");
  const [cafeWifi, setCafeWifi] = useState(false);
  const [resortPools, setResortPools] = useState("");
  const [resortCottages, setResortCottages] = useState("");
  const [resortRates, setResortRates] = useState("");
  const [restaurantCuisine, setRestaurantCuisine] = useState("");
  const [restaurantDishes, setRestaurantDishes] = useState("");

  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const parsedLat = latitude ? Number(latitude) : NaN;
  const parsedLng = longitude ? Number(longitude) : NaN;
  const hasValidCoords = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
  const coordsInsideSalcedo = hasValidCoords ? isInsideSalcedo(parsedLat, parsedLng) : null;
  const detectedBarangay = hasValidCoords
    ? findSalcedoBarangayForPoint(parsedLat, parsedLng)
    : null;

  const handleGeocodeSalcedo = async () => {
    const query = [name.trim(), address.trim()].filter(Boolean).join(", ");
    if (!query || query.length < 3) {
      setNotice({ text: "Enter a place name or barangay before looking up coordinates.", tone: "err" });
      return;
    }
    setGeocoding(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const first = (data.results || [])[0];
      if (first && Number.isFinite(first.latitude) && Number.isFinite(first.longitude)) {
        setLatitude(String(Number(first.latitude).toFixed(5)));
        setLongitude(String(Number(first.longitude).toFixed(5)));
        setNotice({
          text: `Matched "${first.label}" (${first.subtitle}). Verify pin placement cleanly before saving.`,
          tone: "ok",
        });
      } else {
        setNotice({ text: "No matching Salcedo coordinates found in OpenStreetMap.", tone: "err" });
      }
    } catch {
      setNotice({ text: "Unable to query geocoder right now.", tone: "err" });
    } finally {
      setGeocoding(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setShortDescription("");
    setDescription("");
    setPlaceType("attraction");
    setPrimaryCategoryId(categories[0]?.id || "");
    setBarangayId(barangays[0]?.id || "");
    setAddress("Salcedo, Ilocos Sur");
    setLatitude("");
    setLongitude("");
    setPhone("");
    setFeaturedImageUrl("/images/salcedo/hero-salcedo-valley.png");
    setStatus("draft");
    setIsFeatured(false);
    setIsPlaceholder(false);
    setSourceReference("Salcedo Municipal Tourism Office (CEDO)");
    setCafeDrinks("");
    setCafeWifi(false);
    setResortPools("");
    setResortCottages("");
    setResortRates("");
    setRestaurantCuisine("");
    setRestaurantDishes("");
    setNotice(null);
    setShowForm(true);
  };

  const openEdit = (p: AdminPlaceRow) => {
    setEditingId(p.id);
    setName(p.name);
    setSlug(p.slug);
    setShortDescription(p.shortDescription);
    setDescription(p.description);
    setPlaceType(p.placeType);
    setPrimaryCategoryId(p.primaryCategoryId || "");
    setBarangayId(p.barangayId || "");
    setAddress(p.address);
    setLatitude(p.latitude ? String(p.latitude) : "");
    setLongitude(p.longitude ? String(p.longitude) : "");
    setPhone(p.phone || "");
    setFeaturedImageUrl(p.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png");
    setStatus(p.status);
    setIsFeatured(p.isFeatured);
    setIsPlaceholder(p.isPlaceholder);
    setSourceReference(p.sourceReference);
    setCafeDrinks(p.cafeDetails?.featuredDrinks?.join(", ") || "");
    setCafeWifi(Boolean(p.cafeDetails?.hasWifi));
    setResortPools(p.resortDetails?.poolsSummary || "");
    setResortCottages(p.resortDetails?.cottagesSummary || "");
    setResortRates(p.resortDetails?.entranceFeeNote || "");
    setRestaurantCuisine(p.restaurantDetails?.cuisineType || "");
    setRestaurantDishes(p.restaurantDetails?.featuredDishes?.join(", ") || "");
    setNotice(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const payload: Record<string, unknown> = {
        name,
        slug:
          slug.trim() ||
          name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        shortDescription,
        description,
        placeType,
        primaryCategoryId: primaryCategoryId || null,
        barangayId: barangayId || null,
        address,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        phone: phone || null,
        featuredImageUrl: featuredImageUrl || null,
        status,
        isFeatured,
        isPlaceholder,
        sourceReference,
      };

      if (placeType === "cafe") {
        payload.cafeDetails = {
          featuredDrinks: cafeDrinks
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          foodOfferings: [],
          hasWifi: cafeWifi,
          seatingOptions: [],
        };
      } else if (placeType === "resort") {
        payload.resortDetails = {
          poolsSummary: resortPools || null,
          cottagesSummary: resortCottages || null,
          entranceFeeNote: resortRates || null,
          recreationalFacilities: [],
          policies: [],
        };
      } else if (placeType === "restaurant") {
        payload.restaurantDetails = {
          cuisineType: restaurantCuisine || null,
          featuredDishes: restaurantDishes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          menuHighlights: [],
          diningOptions: [],
        };
      }

      const url = editingId ? `/api/admin/places/${editingId}` : "/api/admin/places";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ text: data.error || "Failed to save place.", tone: "err" });
        return;
      }
      setShowForm(false);
      setNotice({ text: editingId ? "Destination updated." : "Destination added.", tone: "ok" });
      await onReload();
    } catch {
      setNotice({ text: "Network error saving place.", tone: "err" });
    } finally {
      setSaving(false);
    }
  };

  const quickStatusChange = async (
    id: string,
    nextStatus: "draft" | "pending_review" | "published" | "archived"
  ) => {
    const res = await fetch(`/api/admin/places/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice({ text: data.error || "Status change rejected.", tone: "err" });
      return;
    }
    setNotice({ text: "Status updated to published.", tone: "ok" });
    await onReload();
  };

  const filtered = places.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !(p.barangayName || "").toLowerCase().includes(q) &&
        !p.placeType.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {notice && !showForm && (
        <div
          className={`rounded-xl border px-3.5 py-2 text-xs flex items-center justify-between ${
            notice.tone === "err"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-white border-[#EAE7E0] text-[#164237]"
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[#616E69] hover:text-[#1A2421] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EAE7E0] p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#616E69] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destinations..."
              className="w-full rounded-full border border-[#EAE7E0] bg-[#FAF9F6] pl-9 pr-3 py-1.5 text-xs focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-1.5 text-xs font-medium"
          >
            <option value="all">All ({places.length})</option>
            <option value="published">Published</option>
            <option value="pending_review">Pending Review</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-4 py-1.5 text-xs font-semibold hover:bg-[#10322A] transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Place
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#EAE7E0] pb-3">
            <h3 className="font-display text-base font-bold text-[#1A2421]">
              {editingId ? "Edit Destination" : "Create Destination"}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1 text-[#616E69] hover:text-[#1A2421] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {notice && (
            <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              {notice.text}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-medium text-[#616E69]">Name *</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              />
            </div>
            <div>
              <label className="font-medium text-[#616E69]">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated"
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="font-medium text-[#616E69]">Type *</label>
              <select
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              >
                <option value="attraction">Attraction</option>
                <option value="nature">Nature / Waterfall</option>
                <option value="heritage">Heritage</option>
                <option value="resort">Resort</option>
                <option value="cafe">Café</option>
                <option value="restaurant">Restaurant / Eatery</option>
                <option value="accommodation">Accommodation</option>
                <option value="business">Local Business</option>
                <option value="service">Municipal Service</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-[#616E69]">Barangay</label>
              <select
                value={barangayId}
                onChange={(e) => setBarangayId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              >
                <option value="">Select Barangay</option>
                {barangays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-[#616E69]">Primary Category</label>
              <select
                value={primaryCategoryId}
                onChange={(e) => setPrimaryCategoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-[#616E69]">Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as "draft" | "pending_review" | "published" | "archived"
                  )
                }
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
                <option value="published" disabled={!canPublish}>
                  Published {!canPublish ? "(Tourism Admin only)" : ""}
                </option>
                <option value="archived" disabled={!canPublish}>
                  Archived
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-medium text-[#616E69]">Address *</label>
              <input
                required
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              />
            </div>
            <div>
              <label className="font-medium text-[#616E69]">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="17.1507"
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              />
            </div>
            <div>
              <label className="font-medium text-[#616E69]">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="120.5361"
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              {hasValidCoords && coordsInsideSalcedo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 font-semibold">
                  <MapPin className="w-3 h-3" />
                  Inside Salcedo{detectedBarangay ? ` • Brgy. ${detectedBarangay.name}` : ""} ✓
                </span>
              )}
              {hasValidCoords && !coordsInsideSalcedo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-0.5 font-semibold">
                  Outside Salcedo municipal boundary — verify lat/lng
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={geocoding}
              onClick={() => void handleGeocodeSalcedo()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-1 font-semibold text-[#164237] hover:bg-[#F3F2EE] cursor-pointer"
            >
              <Search className="w-3 h-3" />
              {geocoding ? "Looking up..." : "Lookup in Salcedo (Free OSM)"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-medium text-[#616E69]">Featured Image URL</label>
              <input
                type="text"
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              />
            </div>
            <div>
              <label className="font-medium text-[#616E69]">Source Attribution *</label>
              <input
                required
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="font-medium text-[#616E69]">Short Summary *</label>
              <input
                required
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              />
            </div>

            <div>
              <label className="font-medium text-[#616E69]">Full Description *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
              />
            </div>
          </div>

          {placeType === "cafe" && (
            <div className="rounded-xl bg-[#FAF9F6] border border-[#EAE7E0] p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-medium text-[#616E69]">
                  Featured Drinks (comma separated)
                </label>
                <input
                  type="text"
                  value={cafeDrinks}
                  onChange={(e) => setCafeDrinks(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-white px-3 py-2"
                />
              </div>
              <label className="flex items-center gap-2 font-medium pt-4">
                <input
                  type="checkbox"
                  checked={cafeWifi}
                  onChange={(e) => setCafeWifi(e.target.checked)}
                  className="accent-[#164237]"
                />
                Wi-Fi Available
              </label>
            </div>
          )}

          {placeType === "resort" && (
            <div className="rounded-xl bg-[#FAF9F6] border border-[#EAE7E0] p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-medium text-[#616E69]">Pools</label>
                <input
                  type="text"
                  value={resortPools}
                  onChange={(e) => setResortPools(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="font-medium text-[#616E69]">Cottages</label>
                <input
                  type="text"
                  value={resortCottages}
                  onChange={(e) => setResortCottages(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="font-medium text-[#616E69]">Entrance Fee</label>
                <input
                  type="text"
                  value={resortRates}
                  onChange={(e) => setResortRates(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-white px-3 py-2"
                />
              </div>
            </div>
          )}

          {placeType === "restaurant" && (
            <div className="rounded-xl bg-[#FAF9F6] border border-[#EAE7E0] p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-medium text-[#616E69]">Cuisine Type</label>
                <input
                  type="text"
                  value={restaurantCuisine}
                  onChange={(e) => setRestaurantCuisine(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="font-medium text-[#616E69]">Featured Dishes</label>
                <input
                  type="text"
                  value={restaurantDishes}
                  onChange={(e) => setRestaurantDishes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-white px-3 py-2"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EAE7E0] text-xs">
            <div className="flex flex-wrap gap-4 font-medium">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="accent-[#164237]"
                />
                Feature on Home
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPlaceholder}
                  onChange={(e) => setIsPlaceholder(e.target.checked)}
                  className="accent-[#164237]"
                />
                Admin Placeholder (hidden from public)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#164237] text-white px-5 py-2 font-semibold cursor-pointer"
            >
              {saving ? "Saving..." : "Save Destination"}
            </button>
          </div>
        </form>
      )}

      {/* Places Table */}
      <div className="bg-white rounded-2xl border border-[#EAE7E0] overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#FAF9F6] border-b border-[#EAE7E0] text-[#616E69]">
            <tr>
              <th className="px-4 py-2.5 font-medium">Destination</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Barangay</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE7E0]">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-[#FAF9F6]">
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#1A2421]">{p.name}</p>
                  <p className="text-[11px] text-[#616E69] truncate max-w-xs">
                    {p.isPlaceholder ? "[Placeholder] " : ""}
                    {p.shortDescription}
                  </p>
                </td>
                <td className="px-4 py-3 capitalize text-[#1A2421]">{p.placeType}</td>
                <td className="px-4 py-3 text-[#616E69]">{p.barangayName || "—"}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F2EE] px-2.5 py-0.5 text-[11px] font-medium capitalize text-[#1A2421]">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        STATUS_DOT[p.status] || "bg-slate-400"
                      }`}
                    />
                    {p.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] bg-white px-2.5 py-1 text-[11px] font-medium hover:bg-[#F3F2EE] cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  {canPublish && p.status !== "published" && !p.isPlaceholder && (
                    <button
                      type="button"
                      onClick={() => void quickStatusChange(p.id, "published")}
                      className="inline-flex items-center gap-1 rounded-full bg-[#164237] text-white px-2.5 py-1 text-[11px] font-semibold cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Publish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
