"use client";

import React, { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Edit3,
  FileText,
  Landmark,
  MapPin,
  Megaphone,
  PhoneCall,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

export type ContentStatus = "draft" | "pending_review" | "published" | "archived";

export interface MunicipalInfoRow {
  id: string;
  key: string;
  title: string;
  category: string;
  content: string;
  sourceReference: string;
  verificationDate: string;
}

export interface HistoricalArticleRow {
  id: string;
  title: string;
  slug: string;
  eraOrYear: string;
  summary: string;
  content: string;
  displayOrder: number;
  status: ContentStatus;
  sourceReference: string;
}

export interface CulturalArticleRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  isFeatured: boolean;
  status: ContentStatus;
  sourceReference: string;
}

export interface TravelGuideRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  tipsJson: string[];
  isFeatured: boolean;
  status: ContentStatus;
  sourceReference: string;
}

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  startDate: string;
  endDate: string | null;
  venueName: string;
  barangayId: string | null;
  scheduleNotes: string | null;
  organizer: string | null;
  isFeatured: boolean;
  status: ContentStatus;
  sourceReference: string;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  traditionNotes: string | null;
  seasonalAvailability: string | null;
  priceNote: string | null;
  barangayId: string | null;
  isFeatured: boolean;
  status: ContentStatus;
  sourceReference: string;
}

export interface AnnouncementRow {
  id: string;
  title: string;
  slug: string;
  priority: string;
  summary: string;
  content: string;
  status: ContentStatus;
  sourceReference: string;
}

export interface EmergencyContactRow {
  id: string;
  agencyName: string;
  category: string;
  phoneNumbers: string[];
  address: string;
  operatingHours: string | null;
  notes: string | null;
  displayOrder: number;
  isActive: boolean;
  sourceReference: string;
}

export interface BarangayRow {
  id: string;
  name: string;
  slug: string;
  district: string;
  population2020: number | null;
  elevationMeters: number | null;
  latitude: number;
  longitude: number;
  summary: string;
  historyNotes: string | null;
  highlights: string[];
  sourceReference: string;
}

type ContentTab =
  | "municipal"
  | "heritage"
  | "guides"
  | "events"
  | "products"
  | "announcements"
  | "hotlines"
  | "barangays";

type EditorState =
  | { kind: "municipal_info"; mode: "create" | "edit"; id?: string }
  | { kind: "historical_article"; mode: "create" | "edit"; id?: string }
  | { kind: "cultural_article"; mode: "create" | "edit"; id?: string }
  | { kind: "guide"; mode: "create" | "edit"; id?: string }
  | { kind: "event"; mode: "create" | "edit"; id?: string }
  | { kind: "product"; mode: "create" | "edit"; id?: string }
  | { kind: "announcement"; mode: "create" | "edit"; id?: string }
  | { kind: "emergency_contact"; mode: "create" | "edit"; id?: string }
  | { kind: "barangay"; mode: "edit"; id: string };

const STATUS_BADGE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-800 border-emerald-200",
  pending_review: "bg-amber-50 text-amber-800 border-amber-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  archived: "bg-rose-50 text-rose-700 border-rose-200",
};

export function AdminContentPanel({
  municipalInfo,
  historicalArticles,
  culturalArticles,
  travelGuides,
  events,
  products,
  announcements,
  contacts,
  barangays,
  canPublish,
  onReload,
}: {
  municipalInfo: MunicipalInfoRow[];
  historicalArticles: HistoricalArticleRow[];
  culturalArticles: CulturalArticleRow[];
  travelGuides: TravelGuideRow[];
  events: EventRow[];
  products: ProductRow[];
  announcements: AnnouncementRow[];
  contacts: EmergencyContactRow[];
  barangays: BarangayRow[];
  canPublish: boolean;
  onReload: () => Promise<void>;
}) {
  const [tab, setTab] = useState<ContentTab>("municipal");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const [saving, setSaving] = useState(false);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  const brgyMap = useMemo(
    () => new Map(barangays.map((b) => [b.id, b.name])),
    [barangays]
  );

  const openEditor = (next: EditorState, initial: Record<string, string | boolean>) => {
    setNotice(null);
    setEditor(next);
    setForm(initial);
  };

  const closeEditor = () => {
    setEditor(null);
    setForm({});
  };

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    setSaving(true);
    setNotice(null);

    try {
      const payload: Record<string, unknown> = { ...form };
      if (editor.kind === "guide") {
        payload.tipsJson = String(form.tipsText || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (editor.kind === "emergency_contact") {
        payload.phoneNumbers = String(form.phonesText || "")
          .split(/[\n,;]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        payload.displayOrder = Number(form.displayOrder || 10);
      }
      if (editor.kind === "historical_article") {
        payload.displayOrder = Number(form.displayOrder || 10);
      }
      if (editor.kind === "barangay") {
        payload.highlights = String(form.highlightsText || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        if (form.population2020 !== "" && form.population2020 !== undefined) {
          payload.population2020 = Number(form.population2020);
        }
        if (form.elevationMeters !== "" && form.elevationMeters !== undefined) {
          payload.elevationMeters = Number(form.elevationMeters);
        }
        if (form.latitude !== "" && form.latitude !== undefined) {
          payload.latitude = Number(form.latitude);
        }
        if (form.longitude !== "" && form.longitude !== undefined) {
          payload.longitude = Number(form.longitude);
        }
      }

      const isCreate = editor.mode === "create";
      const res = await fetch("/api/admin/content", {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isCreate
            ? { entityType: editor.kind, payload }
            : { entityType: editor.kind, id: editor.id, ...payload }
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotice({ text: data.error || "Failed to save municipal content.", tone: "err" });
        setSaving(false);
        return;
      }

      closeEditor();
      setNotice({
        text: isCreate ? "New municipal content created." : "Municipal content updated and published cleanly.",
        tone: "ok",
      });
      await onReload();
    } catch {
      setNotice({ text: "Network error while saving content.", tone: "err" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    entityType: string,
    id: string,
    nextStatus: ContentStatus
  ) => {
    setNotice(null);
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, id, status: nextStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNotice({ text: data.error || "Failed to update status.", tone: "err" });
      return;
    }
    setNotice({ text: `Status updated to ${nextStatus.replace("_", " ")}.`, tone: "ok" });
    await onReload();
  };

  const handleToggleHotlineActive = async (row: EmergencyContactRow) => {
    setNotice(null);
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "emergency_contact",
        id: row.id,
        isActive: !row.isActive,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setNotice({ text: data.error || "Failed to update hotline.", tone: "err" });
      return;
    }
    await onReload();
  };

  const handleDelete = async (entityType: string, id: string, label: string) => {
    if (!window.confirm(`Delete "${label}"? This removes it permanently from municipal content.`)) {
      return;
    }
    setNotice(null);
    const res = await fetch(
      `/api/admin/content?entityType=${encodeURIComponent(entityType)}&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (!res.ok) {
      setNotice({ text: data.error || "Failed to delete content record.", tone: "err" });
      return;
    }
    setNotice({ text: `"${label}" deleted.`, tone: "ok" });
    await onReload();
  };

  const tabs: Array<{ id: ContentTab; label: string; count: number; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "municipal", label: "Municipal Profile", count: municipalInfo.length, icon: Landmark },
    {
      id: "heritage",
      label: "History & Culture",
      count: historicalArticles.length + culturalArticles.length,
      icon: FileText,
    },
    { id: "guides", label: "Travel Guides", count: travelGuides.length, icon: BookOpen },
    { id: "events", label: "Events", count: events.length, icon: CalendarDays },
    { id: "products", label: "Products", count: products.length, icon: ShoppingBag },
    { id: "announcements", label: "Advisories", count: announcements.length, icon: Megaphone },
    { id: "hotlines", label: "Hotlines", count: contacts.length, icon: PhoneCall },
    { id: "barangays", label: "21 Barangays", count: barangays.length, icon: MapPin },
  ];

  const q = search.trim().toLowerCase();

  const renderStatusControl = (entityType: string, id: string, status: ContentStatus) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
          STATUS_BADGE[status] ?? STATUS_BADGE.draft
        }`}
      >
        {status.replace("_", " ")}
      </span>
      {canPublish && status !== "published" && (
        <button
          type="button"
          onClick={() => void handleStatusChange(entityType, id, "published")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 cursor-pointer"
        >
          <CheckCircle2 className="w-3 h-3" />
          Publish
        </button>
      )}
      {canPublish && status === "published" && (
        <button
          type="button"
          onClick={() => void handleStatusChange(entityType, id, "draft")}
          className="text-[11px] font-medium text-[#616E69] hover:text-[#1A2421] px-2 py-0.5 rounded-full border border-[#EAE7E0] cursor-pointer"
        >
          Set Draft
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {notice && (
        <div
          className={`rounded-xl border px-3.5 py-2.5 text-xs flex items-center justify-between ${
            notice.tone === "err"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Horizontal Section Switcher */}
      <div className="bg-white rounded-2xl border border-[#EAE7E0] p-2 flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSearch("");
                closeEditor();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                active
                  ? "bg-[#164237] text-white"
                  : "text-[#616E69] hover:bg-[#F3F2EE] hover:text-[#1A2421]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? "bg-white/20 text-white" : "bg-[#FAF9F6] text-[#616E69]"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline Editor Modal / Card */}
      {editor && (
        <form
          onSubmit={handleSaveEditor}
          className="bg-white rounded-2xl border-2 border-[#164237]/25 p-5 space-y-3 text-xs shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-[#EAE7E0] pb-3">
            <h3 className="font-display text-sm font-bold text-[#1A2421]">
              {editor.mode === "create" ? "Create" : "Edit"}{" "}
              {editor.kind.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </h3>
            <button
              type="button"
              onClick={closeEditor}
              className="text-[#616E69] hover:text-[#1A2421] p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {editor.kind === "municipal_info" && (
              <>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Section Title</label>
                  <input
                    required
                    type="text"
                    value={String(form.title || "")}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Category</label>
                  <select
                    value={String(form.category || "overview")}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="overview">Overview</option>
                    <option value="geography">Geography</option>
                    <option value="economy">Economy</option>
                    <option value="demographics">Demographics</option>
                    <option value="governance">Governance</option>
                    <option value="privacy_policy">Privacy Policy</option>
                  </select>
                </div>
                {editor.mode === "create" && (
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#1A2421] mb-1">
                      Unique Key (optional, auto-generated from title)
                    </label>
                    <input
                      type="text"
                      value={String(form.key || "")}
                      onChange={(e) => updateField("key", e.target.value)}
                      placeholder="e.g. tourism_mission"
                      className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Content</label>
                  <textarea
                    required
                    rows={5}
                    value={String(form.content || "")}
                    onChange={(e) => updateField("content", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Source Reference</label>
                  <input
                    type="text"
                    value={String(form.sourceReference || "")}
                    onChange={(e) => updateField("sourceReference", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
              </>
            )}

            {(editor.kind === "historical_article" || editor.kind === "cultural_article") && (
              <>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Article Title</label>
                  <input
                    required
                    type="text"
                    value={String(form.title || "")}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                {editor.kind === "historical_article" ? (
                  <div>
                    <label className="block font-semibold text-[#1A2421] mb-1">Era / Year</label>
                    <input
                      required
                      type="text"
                      value={String(form.eraOrYear || "")}
                      onChange={(e) => updateField("eraOrYear", e.target.value)}
                      placeholder="e.g. June 20, 1957 (R.A. 1627)"
                      className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-[#1A2421] mb-1">Category</label>
                    <select
                      value={String(form.category || "heritage")}
                      onChange={(e) => updateField("category", e.target.value)}
                      className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                    >
                      <option value="tradition">Tradition</option>
                      <option value="craft">Craft</option>
                      <option value="cuisine">Cuisine</option>
                      <option value="faith">Faith</option>
                      <option value="heritage">Heritage</option>
                    </select>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Summary</label>
                  <input
                    required
                    type="text"
                    value={String(form.summary || "")}
                    onChange={(e) => updateField("summary", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Full Narrative</label>
                  <textarea
                    required
                    rows={5}
                    value={String(form.content || "")}
                    onChange={(e) => updateField("content", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                {editor.kind === "historical_article" && (
                  <div>
                    <label className="block font-semibold text-[#1A2421] mb-1">Display Order</label>
                    <input
                      type="number"
                      value={String(form.displayOrder || "1")}
                      onChange={(e) => updateField("displayOrder", e.target.value)}
                      className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Status</label>
                  <select
                    value={String(form.status || "draft")}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    {canPublish && <option value="published">Published</option>}
                    {canPublish && <option value="archived">Archived</option>}
                  </select>
                </div>
              </>
            )}

            {editor.kind === "guide" && (
              <>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Guide Title</label>
                  <input
                    required
                    type="text"
                    value={String(form.title || "")}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Category</label>
                  <select
                    value={String(form.category || "getting_here")}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="getting_here">Getting Here</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="outdoor_safety">Outdoor Safety</option>
                    <option value="etiquette">Etiquette</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Summary</label>
                  <input
                    required
                    type="text"
                    value={String(form.summary || "")}
                    onChange={(e) => updateField("summary", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Guide Details</label>
                  <textarea
                    required
                    rows={4}
                    value={String(form.content || "")}
                    onChange={(e) => updateField("content", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">
                    Practical Tips (one tip per line)
                  </label>
                  <textarea
                    rows={3}
                    value={String(form.tipsText || "")}
                    onChange={(e) => updateField("tipsText", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Status</label>
                  <select
                    value={String(form.status || "draft")}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    {canPublish && <option value="published">Published</option>}
                    {canPublish && <option value="archived">Archived</option>}
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isFeatured)}
                    onChange={(e) => updateField("isFeatured", e.target.checked)}
                  />
                  <span className="font-semibold text-[#1A2421]">Featured Travel Guide</span>
                </label>
              </>
            )}

            {editor.kind === "event" && (
              <>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Event Title</label>
                  <input
                    required
                    type="text"
                    value={String(form.title || "")}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Category</label>
                  <select
                    value={String(form.category || "festival")}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="festival">Festival</option>
                    <option value="harvest_fair">Harvest Fair</option>
                    <option value="religious">Religious</option>
                    <option value="community">Community</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Start Date</label>
                  <input
                    required
                    type="date"
                    value={String(form.startDate || "")}
                    onChange={(e) => updateField("startDate", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">End Date (optional)</label>
                  <input
                    type="date"
                    value={String(form.endDate || "")}
                    onChange={(e) => updateField("endDate", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Venue Name</label>
                  <input
                    required
                    type="text"
                    value={String(form.venueName || "")}
                    onChange={(e) => updateField("venueName", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Barangay</label>
                  <select
                    value={String(form.barangayId || "")}
                    onChange={(e) => updateField("barangayId", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="">Municipality-wide</option>
                    {barangays.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Schedule Notes</label>
                  <input
                    type="text"
                    value={String(form.scheduleNotes || "")}
                    onChange={(e) => updateField("scheduleNotes", e.target.value)}
                    placeholder="e.g. Annual celebration every March"
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Organizer</label>
                  <input
                    type="text"
                    value={String(form.organizer || "")}
                    onChange={(e) => updateField("organizer", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={String(form.description || "")}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Status</label>
                  <select
                    value={String(form.status || "draft")}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    {canPublish && <option value="published">Published</option>}
                    {canPublish && <option value="archived">Archived</option>}
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isFeatured)}
                    onChange={(e) => updateField("isFeatured", e.target.checked)}
                  />
                  <span className="font-semibold text-[#1A2421]">Featured Event</span>
                </label>
              </>
            )}

            {editor.kind === "product" && (
              <>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Product Name</label>
                  <input
                    required
                    type="text"
                    value={String(form.name || "")}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Category</label>
                  <select
                    value={String(form.category || "delicacy")}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="agriculture">Agriculture</option>
                    <option value="delicacy">Delicacy</option>
                    <option value="handicraft">Handicraft</option>
                    <option value="beverage">Beverage</option>
                    <option value="souvenir">Souvenir</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">
                    Seasonal Availability
                  </label>
                  <input
                    type="text"
                    value={String(form.seasonalAvailability || "")}
                    onChange={(e) => updateField("seasonalAvailability", e.target.value)}
                    placeholder="e.g. August – October or Year-round"
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Price Note</label>
                  <input
                    type="text"
                    value={String(form.priceNote || "")}
                    onChange={(e) => updateField("priceNote", e.target.value)}
                    placeholder="e.g. ₱120 – ₱250 / pack"
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Origin Barangay</label>
                  <select
                    value={String(form.barangayId || "")}
                    onChange={(e) => updateField("barangayId", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="">Municipality-wide</option>
                    {barangays.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Status</label>
                  <select
                    value={String(form.status || "draft")}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    {canPublish && <option value="published">Published</option>}
                    {canPublish && <option value="archived">Archived</option>}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={String(form.description || "")}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">
                    Tradition & Heritage Notes
                  </label>
                  <textarea
                    rows={2}
                    value={String(form.traditionNotes || "")}
                    onChange={(e) => updateField("traditionNotes", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isFeatured)}
                    onChange={(e) => updateField("isFeatured", e.target.checked)}
                  />
                  <span className="font-semibold text-[#1A2421]">Featured Local Product</span>
                </label>
              </>
            )}

            {editor.kind === "announcement" && (
              <>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Title</label>
                  <input
                    required
                    type="text"
                    value={String(form.title || "")}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Priority</label>
                  <select
                    value={String(form.priority || "normal")}
                    onChange={(e) => updateField("priority", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="normal">Normal Advisory</option>
                    <option value="advisory">Travel Advisory</option>
                    <option value="urgent">Urgent Notice</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Summary</label>
                  <input
                    required
                    type="text"
                    value={String(form.summary || "")}
                    onChange={(e) => updateField("summary", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Full Message</label>
                  <textarea
                    required
                    rows={4}
                    value={String(form.content || "")}
                    onChange={(e) => updateField("content", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Status</label>
                  <select
                    value={String(form.status || "draft")}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    {canPublish && <option value="published">Published</option>}
                    {canPublish && <option value="archived">Archived</option>}
                  </select>
                </div>
              </>
            )}

            {editor.kind === "emergency_contact" && (
              <>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Agency / Office Name</label>
                  <input
                    required
                    type="text"
                    value={String(form.agencyName || "")}
                    onChange={(e) => updateField("agencyName", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Category</label>
                  <select
                    value={String(form.category || "municipal")}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  >
                    <option value="mdrrmo">MDRRMO / Rescue</option>
                    <option value="police">Police (PNP)</option>
                    <option value="fire">Fire (BFP)</option>
                    <option value="medical">Medical / Hospital / RHU</option>
                    <option value="municipal">Municipal Office</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">
                    Phone Numbers (comma or line separated)
                  </label>
                  <input
                    required
                    type="text"
                    value={String(form.phonesText || "")}
                    onChange={(e) => updateField("phonesText", e.target.value)}
                    placeholder="0917-000-0000, (077) 604-0000"
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={String(form.operatingHours || "")}
                    onChange={(e) => updateField("operatingHours", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Address / Location</label>
                  <input
                    required
                    type="text"
                    value={String(form.address || "")}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Notes</label>
                  <input
                    type="text"
                    value={String(form.notes || "")}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isActive)}
                    onChange={(e) => updateField("isActive", e.target.checked)}
                  />
                  <span className="font-semibold text-[#1A2421]">Active on Public Directory</span>
                </label>
              </>
            )}

            {editor.kind === "barangay" && (
              <>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Barangay Name</label>
                  <input
                    required
                    type="text"
                    value={String(form.name || "")}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">District / Zone</label>
                  <input
                    type="text"
                    value={String(form.district || "")}
                    onChange={(e) => updateField("district", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">Public Summary</label>
                  <textarea
                    required
                    rows={3}
                    value={String(form.summary || "")}
                    onChange={(e) => updateField("summary", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">
                    Local History & Heritage Notes
                  </label>
                  <textarea
                    rows={3}
                    value={String(form.historyNotes || "")}
                    onChange={(e) => updateField("historyNotes", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#1A2421] mb-1">
                    Local Highlights (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={String(form.highlightsText || "")}
                    onChange={(e) => updateField("highlightsText", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">2020 Population</label>
                  <input
                    type="number"
                    value={String(form.population2020 || "")}
                    onChange={(e) => updateField("population2020", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Elevation (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={String(form.elevationMeters || "")}
                    onChange={(e) => updateField("elevationMeters", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={String(form.latitude || "")}
                    onChange={(e) => updateField("latitude", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A2421] mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={String(form.longitude || "")}
                    onChange={(e) => updateField("longitude", e.target.value)}
                    className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE7E0]">
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-full border border-[#EAE7E0] px-4 py-2 font-semibold text-[#616E69] hover:text-[#1A2421] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#164237] text-white px-5 py-2 font-semibold hover:bg-[#10322A] disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Tab Content */}
      {tab === "municipal" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold text-[#1A2421]">
                Municipal Profile Sections
              </h2>
              <p className="text-[11px] text-[#616E69]">
                Overview, geography, economy, demographics, governance & privacy policy displayed in About Salcedo.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                openEditor(
                  { kind: "municipal_info", mode: "create" },
                  {
                    title: "",
                    category: "overview",
                    key: "",
                    content: "",
                    sourceReference: "Municipality of Salcedo — CEDO",
                  }
                )
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Section
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {municipalInfo.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-[#EAE7E0] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F3F2EE] text-[#164237]">
                      {m.category.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-[#616E69]">Updated {m.verificationDate}</span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-[#1A2421]">{m.title}</h3>
                  <p className="text-xs text-[#616E69] line-clamp-3 leading-relaxed">{m.content}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#EAE7E0]/70">
                  <span className="text-[10px] text-[#616E69] truncate max-w-[60%]">
                    {m.sourceReference}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        openEditor(
                          { kind: "municipal_info", mode: "edit", id: m.id },
                          {
                            title: m.title,
                            category: m.category,
                            content: m.content,
                            sourceReference: m.sourceReference,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-semibold text-[#164237] hover:bg-[#F3F2EE] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    {canPublish && (
                      <button
                        type="button"
                        onClick={() => void handleDelete("municipal_info", m.id, m.title)}
                        className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "heritage" && (
        <div className="space-y-5">
          {/* Historical Timeline Articles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#1A2421]">
                Historical Articles ({historicalArticles.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  openEditor(
                    { kind: "historical_article", mode: "create" },
                    {
                      title: "",
                      eraOrYear: "",
                      summary: "",
                      content: "",
                      displayOrder: String(historicalArticles.length + 1),
                      status: canPublish ? "published" : "draft",
                    }
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New History Article
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {historicalArticles.map((h) => (
                <div
                  key={h.id}
                  className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-[#B88A44] uppercase">
                        {h.eraOrYear}
                      </span>
                      <h3 className="font-display text-sm font-bold text-[#1A2421]">{h.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          openEditor(
                            { kind: "historical_article", mode: "edit", id: h.id },
                            {
                              title: h.title,
                              eraOrYear: h.eraOrYear,
                              summary: h.summary,
                              content: h.content,
                              displayOrder: String(h.displayOrder),
                              status: h.status,
                            }
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-semibold text-[#164237] hover:bg-[#F3F2EE] cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      {canPublish && (
                        <button
                          type="button"
                          onClick={() => void handleDelete("historical_article", h.id, h.title)}
                          className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#616E69] line-clamp-2">{h.summary}</p>
                  {renderStatusControl("historical_article", h.id, h.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Cultural Articles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#1A2421]">
                Cultural & Heritage Articles ({culturalArticles.length})
              </h2>
              <button
                type="button"
                onClick={() =>
                  openEditor(
                    { kind: "cultural_article", mode: "create" },
                    {
                      title: "",
                      category: "heritage",
                      summary: "",
                      content: "",
                      status: canPublish ? "published" : "draft",
                    }
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Culture Article
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {culturalArticles.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-[#1D7874] uppercase">
                        {c.category}
                      </span>
                      <h3 className="font-display text-sm font-bold text-[#1A2421]">{c.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          openEditor(
                            { kind: "cultural_article", mode: "edit", id: c.id },
                            {
                              title: c.title,
                              category: c.category,
                              summary: c.summary,
                              content: c.content,
                              status: c.status,
                            }
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-semibold text-[#164237] hover:bg-[#F3F2EE] cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      {canPublish && (
                        <button
                          type="button"
                          onClick={() => void handleDelete("cultural_article", c.id, c.title)}
                          className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#616E69] line-clamp-2">{c.summary}</p>
                  {renderStatusControl("cultural_article", c.id, c.status)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "guides" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#1A2421]">
              Visitor Travel Guides ({travelGuides.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                openEditor(
                  { kind: "guide", mode: "create" },
                  {
                    title: "",
                    category: "getting_here",
                    summary: "",
                    content: "",
                    tipsText: "",
                    isFeatured: false,
                    status: canPublish ? "published" : "draft",
                  }
                )
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Guide
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {travelGuides.map((g) => (
              <div key={g.id} className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-[#164237] uppercase">
                      {g.category.replace("_", " ")}
                    </span>
                    <h3 className="font-display text-sm font-bold text-[#1A2421]">{g.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        openEditor(
                          { kind: "guide", mode: "edit", id: g.id },
                          {
                            title: g.title,
                            category: g.category,
                            summary: g.summary,
                            content: g.content,
                            tipsText: (g.tipsJson || []).join("\n"),
                            isFeatured: g.isFeatured,
                            status: g.status,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-semibold text-[#164237] hover:bg-[#F3F2EE] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    {canPublish && (
                      <button
                        type="button"
                        onClick={() => void handleDelete("guide", g.id, g.title)}
                        className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#616E69] line-clamp-2">{g.summary}</p>
                {renderStatusControl("guide", g.id, g.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#1A2421]">
              Festivals & Municipal Calendar ({events.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                openEditor(
                  { kind: "event", mode: "create" },
                  {
                    title: "",
                    category: "festival",
                    startDate: new Date().toISOString().slice(0, 10),
                    endDate: "",
                    venueName: "Salcedo Town Plaza",
                    barangayId: "",
                    scheduleNotes: "",
                    organizer: "Municipality of Salcedo",
                    description: "",
                    isFeatured: false,
                    status: canPublish ? "published" : "draft",
                  }
                )
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Event
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {events.map((ev) => (
              <div key={ev.id} className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-[#B88A44] uppercase">
                      {ev.startDate} • {ev.venueName}
                    </span>
                    <h3 className="font-display text-sm font-bold text-[#1A2421]">{ev.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        openEditor(
                          { kind: "event", mode: "edit", id: ev.id },
                          {
                            title: ev.title,
                            category: ev.category,
                            startDate: ev.startDate,
                            endDate: ev.endDate || "",
                            venueName: ev.venueName,
                            barangayId: ev.barangayId || "",
                            scheduleNotes: ev.scheduleNotes || "",
                            organizer: ev.organizer || "",
                            description: ev.description,
                            isFeatured: ev.isFeatured,
                            status: ev.status,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-semibold text-[#164237] hover:bg-[#F3F2EE] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    {canPublish && (
                      <button
                        type="button"
                        onClick={() => void handleDelete("event", ev.id, ev.title)}
                        className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#616E69] line-clamp-2">{ev.description}</p>
                {renderStatusControl("event", ev.id, ev.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#1A2421]">
              Local Harvest & Products ({products.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                openEditor(
                  { kind: "product", mode: "create" },
                  {
                    name: "",
                    category: "delicacy",
                    seasonalAvailability: "",
                    priceNote: "",
                    barangayId: "",
                    description: "",
                    traditionNotes: "",
                    isFeatured: false,
                    status: canPublish ? "published" : "draft",
                  }
                )
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-[#9E6340] uppercase">
                      {p.category}
                      {p.barangayId ? ` • Brgy. ${brgyMap.get(p.barangayId) || ""}` : ""}
                    </span>
                    <h3 className="font-display text-sm font-bold text-[#1A2421]">{p.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        openEditor(
                          { kind: "product", mode: "edit", id: p.id },
                          {
                            name: p.name,
                            category: p.category,
                            seasonalAvailability: p.seasonalAvailability || "",
                            priceNote: p.priceNote || "",
                            barangayId: p.barangayId || "",
                            description: p.description,
                            traditionNotes: p.traditionNotes || "",
                            isFeatured: p.isFeatured,
                            status: p.status,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-semibold text-[#164237] hover:bg-[#F3F2EE] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    {canPublish && (
                      <button
                        type="button"
                        onClick={() => void handleDelete("product", p.id, p.name)}
                        className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#616E69] line-clamp-2">{p.description}</p>
                {renderStatusControl("product", p.id, p.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "announcements" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#1A2421]">
              Municipal Advisories & Notices ({announcements.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                openEditor(
                  { kind: "announcement", mode: "create" },
                  {
                    title: "",
                    priority: "normal",
                    summary: "",
                    content: "",
                    status: canPublish ? "published" : "draft",
                  }
                )
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Post Advisory
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-[#B88A44]">
                      {a.priority}
                    </span>
                    <h3 className="font-display text-sm font-bold text-[#1A2421]">{a.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        openEditor(
                          { kind: "announcement", mode: "edit", id: a.id },
                          {
                            title: a.title,
                            priority: a.priority,
                            summary: a.summary,
                            content: a.content,
                            status: a.status,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-semibold text-[#164237] hover:bg-[#F3F2EE] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    {canPublish && (
                      <button
                        type="button"
                        onClick={() => void handleDelete("announcement", a.id, a.title)}
                        className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#616E69] line-clamp-2">{a.summary}</p>
                {renderStatusControl("announcement", a.id, a.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "hotlines" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#1A2421]">
              Emergency & Response Hotlines ({contacts.length})
            </h2>
            <button
              type="button"
              onClick={() =>
                openEditor(
                  { kind: "emergency_contact", mode: "create" },
                  {
                    agencyName: "",
                    category: "municipal",
                    phonesText: "",
                    address: "Poblacion, Salcedo, Ilocos Sur",
                    operatingHours: "24/7 Emergency Response",
                    notes: "",
                    displayOrder: String(contacts.length + 1),
                    isActive: true,
                  }
                )
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-2 text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Hotline
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contacts.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-rose-700">
                      {c.category}
                    </span>
                    <h3 className="font-display text-sm font-bold text-[#1A2421]">
                      {c.agencyName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        openEditor(
                          { kind: "emergency_contact", mode: "edit", id: c.id },
                          {
                            agencyName: c.agencyName,
                            category: c.category,
                            phonesText: (c.phoneNumbers || []).join(", "),
                            address: c.address,
                            operatingHours: c.operatingHours || "",
                            notes: c.notes || "",
                            displayOrder: String(c.displayOrder),
                            isActive: c.isActive,
                          }
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-semibold text-[#164237] hover:bg-[#F3F2EE] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    {canPublish && (
                      <button
                        type="button"
                        onClick={() => void handleDelete("emergency_contact", c.id, c.agencyName)}
                        className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#164237]">
                  {(c.phoneNumbers || []).join(" • ") || "No phone listed"}
                </p>
                <p className="text-[11px] text-[#616E69]">{c.address}</p>
                <button
                  type="button"
                  onClick={() => void handleToggleHotlineActive(c)}
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer ${
                    c.isActive
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {c.isActive ? "Active in Directory" : "Hidden"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "barangays" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-sm font-bold text-[#1A2421]">
                21 Barangays Directory ({barangays.length})
              </h2>
              <p className="text-[11px] text-[#616E69]">
                Edit barangay profiles, local highlights, population figures, and reference coordinates.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#616E69] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter barangay..."
                className="w-full rounded-full border border-[#EAE7E0] bg-white pl-8 pr-3 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {barangays
              .filter(
                (b) =>
                  !q ||
                  b.name.toLowerCase().includes(q) ||
                  b.summary.toLowerCase().includes(q)
              )
              .map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#1D7874]">
                        {b.district} • Pop. {b.population2020 ?? "—"}
                      </span>
                      <h3 className="font-display text-sm font-bold text-[#1A2421]">
                        Brgy. {b.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openEditor(
                          { kind: "barangay", mode: "edit", id: b.id },
                          {
                            name: b.name,
                            district: b.district,
                            summary: b.summary,
                            historyNotes: b.historyNotes || "",
                            highlightsText: (b.highlights || []).join("\n"),
                            population2020: b.population2020 != null ? String(b.population2020) : "",
                            elevationMeters:
                              b.elevationMeters != null ? String(b.elevationMeters) : "",
                            latitude: String(b.latitude),
                            longitude: String(b.longitude),
                          }
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-semibold text-[#164237] hover:bg-[#F3F2EE] cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <p className="text-xs text-[#616E69] line-clamp-2">{b.summary}</p>
                  <p className="text-[10px] font-mono text-[#616E69]">
                    {b.latitude.toFixed(5)}, {b.longitude.toFixed(5)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
