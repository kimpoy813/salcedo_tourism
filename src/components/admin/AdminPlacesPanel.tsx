"use client";

import React, { useState } from "react";
import { CheckCircle2, Edit3, Plus, Search } from "lucide-react";

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

  // Form fields
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
  const [sourceReference, setSourceReference] = useState("Salcedo Municipal Tourism Office (CEDO)");

  // Specialized café/resort/restaurant quick fields
  const [cafeDrinks, setCafeDrinks] = useState("");
  const [cafeWifi, setCafeWifi] = useState(false);
  const [resortPools, setResortPools] = useState("");
  const [resortCottages, setResortCottages] = useState("");
  const [resortRates, setResortRates] = useState("");
  const [restaurantCuisine, setRestaurantCuisine] = useState("");
  const [restaurantDishes, setRestaurantDishes] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    setMsg(null);
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
    setMsg(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
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
        setMsg(data.error || "Failed to save place.");
        return;
      }
      setShowForm(false);
      await onReload();
    } catch {
      setMsg("Network error saving place.");
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
      alert(data.error || "Status change rejected.");
      return;
    }
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
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E5E0D5] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#5A6B66] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destinations..."
              className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] pl-9 pr-3 py-2 text-xs sm:text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-xs sm:text-sm font-medium"
          >
            <option value="all">All Statuses ({places.length})</option>
            <option value="published">Published</option>
            <option value="pending_review">Pending Review</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#123F35] text-white px-4 py-2 text-xs sm:text-sm font-bold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Place / Establishment
        </button>
      </div>

      {/* Create / Edit Modal Drawer */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl border-2 border-[#123F35] p-6 space-y-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-[#202B28]">
              {editingId ? "Edit Destination Record" : "Create New Salcedo Destination"}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-bold text-[#5A6B66] hover:text-[#202B28] cursor-pointer"
            >
              Cancel ✕
            </button>
          </div>

          {msg && (
            <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
              {msg}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-[#202B28]">Name *</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#202B28]">Slug (URL)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-from-name"
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#202B28]">Place Type *</label>
              <select
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value)}
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
              >
                <option value="attraction">Attraction</option>
                <option value="nature">Nature / Waterfall</option>
                <option value="heritage">Heritage</option>
                <option value="resort">Resort</option>
                <option value="cafe">Café</option>
                <option value="restaurant">Restaurant / Eatery</option>
                <option value="accommodation">Accommodation</option>
                <option value="business">Local Business / Producer</option>
                <option value="service">Municipal / Health Service</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#202B28]">Barangay</label>
              <select
                value={barangayId}
                onChange={(e) => setBarangayId(e.target.value)}
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
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
              <label className="text-xs font-bold text-[#202B28]">Primary Category</label>
              <select
                value={primaryCategoryId}
                onChange={(e) => setPrimaryCategoryId(e.target.value)}
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
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
              <label className="text-xs font-bold text-[#202B28]">Workflow Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as "draft" | "pending_review" | "published" | "archived"
                  )
                }
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
                <option value="published" disabled={!canPublish}>
                  Published {!canPublish ? "(Requires Tourism/Super Admin)" : ""}
                </option>
                <option value="archived" disabled={!canPublish}>
                  Archived
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-[#202B28]">Address *</label>
              <input
                required
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#202B28]">Latitude (Optional)</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="17.1507"
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#202B28]">Longitude (Optional)</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="120.5361"
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#202B28]">Featured Image URL</label>
              <input
                type="text"
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#202B28]">Source Attribution *</label>
              <input
                required
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#202B28]">Short Summary *</label>
            <input
              required
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#202B28]">Full Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
            />
          </div>

          {/* Conditional Specialized Fields */}
          {placeType === "cafe" && (
            <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#202B28]">
                  Featured Drinks (comma separated)
                </label>
                <input
                  type="text"
                  value={cafeDrinks}
                  onChange={(e) => setCafeDrinks(e.target.value)}
                  placeholder="Tablea Hot Chocolate, Iced Americano"
                  className="w-full rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold pt-4">
                <input
                  type="checkbox"
                  checked={cafeWifi}
                  onChange={(e) => setCafeWifi(e.target.checked)}
                />
                Wi-Fi Available
              </label>
            </div>
          )}

          {placeType === "resort" && (
            <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#202B28]">Pools Summary</label>
                <input
                  type="text"
                  value={resortPools}
                  onChange={(e) => setResortPools(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#202B28]">Cottages Summary</label>
                <input
                  type="text"
                  value={resortCottages}
                  onChange={(e) => setResortCottages(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#202B28]">Entrance Fee Note</label>
                <input
                  type="text"
                  value={resortRates}
                  onChange={(e) => setResortRates(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {placeType === "restaurant" && (
            <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#202B28]">Cuisine Type</label>
                <input
                  type="text"
                  value={restaurantCuisine}
                  onChange={(e) => setRestaurantCuisine(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#202B28]">
                  Featured Dishes (comma separated)
                </label>
                <input
                  type="text"
                  value={restaurantDishes}
                  onChange={(e) => setRestaurantDishes(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Feature on Home
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPlaceholder}
                  onChange={(e) => setIsPlaceholder(e.target.checked)}
                />
                Admin Placeholder (keep hidden from public /app)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#123F35] text-white px-5 py-2.5 text-sm font-bold cursor-pointer"
            >
              {saving ? "Saving..." : "Save Destination"}
            </button>
          </div>
        </form>
      )}

      {/* Places Table */}
      <div className="bg-white rounded-3xl border border-[#E5E0D5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-[#F8F7F2] border-b border-[#E5E0D5] text-xs uppercase tracking-wider text-[#5A6B66]">
              <tr>
                <th className="p-4">Destination</th>
                <th className="p-4">Type</th>
                <th className="p-4">Barangay</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D5]">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[#F8F7F2]/60">
                  <td className="p-4">
                    <p className="font-bold text-[#202B28]">{p.name}</p>
                    <p className="text-xs text-[#5A6B66] truncate max-w-xs">
                      {p.isPlaceholder ? "[ADMIN PLACEHOLDER] " : ""}
                      {p.shortDescription}
                    </p>
                  </td>
                  <td className="p-4 capitalize text-xs font-semibold text-[#168A8A]">
                    {p.placeType}
                  </td>
                  <td className="p-4 text-xs text-[#5A6B66]">{p.barangayName || "—"}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                        p.status === "published"
                          ? "bg-emerald-100 text-emerald-900"
                          : p.status === "pending_review"
                          ? "bg-amber-100 text-amber-900"
                          : p.status === "draft"
                          ? "bg-slate-100 text-slate-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E5E0D5] px-2.5 py-1 text-xs font-semibold hover:bg-[#F8F7F2] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    {canPublish && p.status !== "published" && !p.isPlaceholder && (
                      <button
                        type="button"
                        onClick={() => void quickStatusChange(p.id, "published")}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#123F35] text-white px-2.5 py-1 text-xs font-bold cursor-pointer"
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
    </div>
  );
}
