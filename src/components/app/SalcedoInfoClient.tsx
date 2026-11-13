"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  MapPin,
  PhoneCall,
  Search,
  Trees,
  Compass,
  Info,
} from "lucide-react";

interface BarangayItem {
  id: string;
  name: string;
  slug: string;
  district: string;
  population2020: number | null;
  population2015: number | null;
  elevationMeters: number | null;
  latitude: number | null;
  longitude: number | null;
  summary: string;
  historyNotes: string | null;
  highlights: string[] | null;
  publishedPlacesCount: number;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  eraOrYear?: string | null;
  category?: string | null;
  sourceReference: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string | null;
  venueName: string;
  barangay?: { name: string } | null;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string | null;
  barangay?: { name: string } | null;
  producers: Array<{
    id: string;
    producerName: string;
    contactInfo: string | null;
    address: string | null;
  }>;
}

interface GuideItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
}

interface ContactItem {
  id: string;
  agencyName: string;
  category: string;
  phoneNumbers: string[];
  address: string;
  operatingHours: string | null;
}

export function SalcedoInfoClient({
  initialTab,
  barangays,
  historicalArticles,
  culturalArticles,
  events,
  products,
  guides,
  contacts,
  municipalInfo,
}: {
  initialTab: string;
  barangays: BarangayItem[];
  historicalArticles: ArticleItem[];
  culturalArticles: ArticleItem[];
  events: EventItem[];
  products: ProductItem[];
  guides: GuideItem[];
  contacts: ContactItem[];
  municipalInfo: Array<{ key: string; title: string; category: string; content: string }>;
}) {
  const [tab, setTab] = useState(
    ["overview", "barangays", "history", "events", "products", "emergency"].includes(initialTab)
      ? initialTab
      : "overview"
  );
  const [brgyQuery, setBrgyQuery] = useState("");

  const filteredBarangays = useMemo(() => {
    const q = brgyQuery.trim().toLowerCase();
    if (!q) return barangays;
    return barangays.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.summary.toLowerCase().includes(q) ||
        b.district.toLowerCase().includes(q)
    );
  }, [barangays, brgyQuery]);

  const TABS = [
    { id: "overview", label: "Municipal Profile", icon: Info },
    { id: "barangays", label: `21 Barangays (${barangays.length})`, icon: MapPin },
    { id: "history", label: "History & Culture", icon: BookOpen },
    { id: "events", label: "Events & Festivals", icon: Calendar },
    { id: "products", label: "Local Products", icon: Trees },
    { id: "emergency", label: "Travel & Emergency", icon: PhoneCall },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold border transition cursor-pointer ${
                tab === t.id
                  ? "bg-[#123F35] text-white border-[#123F35]"
                  : "bg-white text-[#202B28] border-[#E5E0D5] hover:border-[#123F35]/40"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/images/salcedo/seal-of-salcedo.png"
                  alt="Official Municipal Seal of Salcedo, Ilocos Sur"
                  className="w-14 h-14 rounded-full border border-[#E5E0D5] bg-white p-1"
                />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
                    2nd District of Ilocos Sur • Region I
                  </span>
                  <h2 className="font-display text-2xl font-bold text-[#202B28]">
                    Municipality of Salcedo (Formerly Baugen)
                  </h2>
                </div>
              </div>

              <p className="text-sm text-[#5A6B66] leading-relaxed">
                Salcedo is a landlocked 4th-class agricultural and eco-tourism municipality nestled
                along the Buaya River valley and foothills near the Tirad Pass cordillera. Known
                affectionately as the <strong>&ldquo;Rambutan Basket of the North&rdquo;</strong>,
                Salcedo welcomes visitors with cool highland breezes, waterfalls, inland spring
                resorts, and locally crafted cacao tablea.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-3">
                  <p className="text-[11px] text-[#5A6B66]">2020 Census Pop.</p>
                  <p className="font-display text-lg font-bold text-[#123F35] tabular-nums">
                    11,110
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-3">
                  <p className="text-[11px] text-[#5A6B66]">Land Area</p>
                  <p className="font-display text-lg font-bold text-[#123F35] tabular-nums">
                    103.44 km²
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-3">
                  <p className="text-[11px] text-[#5A6B66]">Barangays</p>
                  <p className="font-display text-lg font-bold text-[#123F35] tabular-nums">
                    21
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-3">
                  <p className="text-[11px] text-[#5A6B66]">Postal Code</p>
                  <p className="font-display text-lg font-bold text-[#123F35] tabular-nums">
                    2711
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center">
              <img
                src="/images/salcedo/ilocos-sur-locator-map.jpg"
                alt="Official Locator Map of Salcedo within Ilocos Sur"
                className="w-full max-w-xs rounded-2xl border border-[#E5E0D5] shadow-xs"
              />
              <p className="text-[11px] text-[#5A6B66] mt-2 text-center">
                Locator map of Salcedo in Ilocos Sur (Landlocked, bordered by Candon, Banayoyo,
                Galimuyod, Gregorio del Pilar, Quirino &amp; San Emilio).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {municipalInfo.map((sec) => (
              <article
                key={sec.key}
                className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-2"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#168A8A]">
                  {sec.category.replace("_", " ")}
                </span>
                <h3 className="font-display text-lg font-bold text-[#202B28]">{sec.title}</h3>
                <p className="text-sm text-[#5A6B66] leading-relaxed">{sec.content}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 21 BARANGAYS EXPLORER */}
      {tab === "barangays" && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#E5E0D5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[#202B28]">
                All 21 Official Barangays of Salcedo
              </h2>
              <p className="text-xs text-[#5A6B66]">
                PSA 2020 census figures, PhilAtlas elevations &amp; verified tourism destinations.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#5A6B66] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={brgyQuery}
                onChange={(e) => setBrgyQuery(e.target.value)}
                placeholder="Search barangay..."
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] pl-9 pr-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBarangays.map((b) => (
              <article
                key={b.id}
                className="bg-white rounded-2xl border border-[#E5E0D5] p-5 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-[#202B28]">
                      {b.name}
                    </h3>
                    <span className="rounded-full bg-[#123F35]/10 text-[#123F35] px-2.5 py-0.5 text-[11px] font-bold shrink-0">
                      Salcedo
                    </span>
                  </div>
                  <p className="text-xs text-[#5A6B66] leading-relaxed">{b.summary}</p>
                  {b.historyNotes && (
                    <p className="text-xs text-[#202B28]/85 bg-[#F8F7F2] rounded-xl p-2.5 border border-[#E5E0D5]">
                      {b.historyNotes}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-[#5A6B66] tabular-nums">
                  <span>
                    2020 Pop: <strong>{b.population2020?.toLocaleString() ?? "—"}</strong>
                    {b.elevationMeters ? ` • ${Math.round(b.elevationMeters)}m` : ""}
                  </span>
                  <Link
                    href={`/app/discover?barangay=${encodeURIComponent(b.slug)}`}
                    className="font-bold text-[#168A8A] hover:underline"
                  >
                    {b.publishedPlacesCount} spots →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY & CULTURE */}
      {tab === "history" && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-[#202B28]">
              History of Salcedo (Baugen &amp; Republic Act No. 1627)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {historicalArticles.map((art) => (
                <article
                  key={art.id}
                  className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-2.5"
                >
                  {art.eraOrYear && (
                    <span className="inline-block rounded-full bg-[#D6A85B]/20 text-[#8C611B] px-3 py-0.5 text-[11px] font-bold">
                      {art.eraOrYear}
                    </span>
                  )}
                  <h3 className="font-display text-lg font-bold text-[#202B28]">{art.title}</h3>
                  <p className="text-xs font-semibold text-[#168A8A]">{art.summary}</p>
                  <p className="text-sm text-[#5A6B66] leading-relaxed">{art.content}</p>
                  <p className="text-[11px] text-[#5A6B66]/80 pt-1">
                    Source: {art.sourceReference}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-[#202B28]">
              Culture, People &amp; Living Heritage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {culturalArticles.map((art) => (
                <article
                  key={art.id}
                  className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-2.5"
                >
                  {art.category && (
                    <span className="inline-block rounded-full bg-[#123F35]/10 text-[#123F35] px-3 py-0.5 text-[11px] font-bold capitalize">
                      {art.category}
                    </span>
                  )}
                  <h3 className="font-display text-lg font-bold text-[#202B28]">{art.title}</h3>
                  <p className="text-sm text-[#5A6B66] leading-relaxed">{art.content}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EVENTS */}
      {tab === "events" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map((ev) => (
            <article
              key={ev.id}
              className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#168A8A]">
                <span className="capitalize">{ev.category.replace("_", " ")}</span>
                <span className="tabular-nums">
                  {ev.startDate}
                  {ev.endDate ? ` to ${ev.endDate}` : ""}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-[#202B28]">{ev.title}</h3>
              <p className="text-xs font-semibold text-[#123F35]">
                Venue: {ev.venueName}
                {ev.barangay ? ` (Brgy. ${ev.barangay.name})` : ""}
              </p>
              <p className="text-sm text-[#5A6B66] leading-relaxed">{ev.description}</p>
            </article>
          ))}
        </div>
      )}

      {/* LOCAL PRODUCTS */}
      {tab === "products" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {products.map((pr) => (
            <article
              key={pr.id}
              className="bg-white rounded-3xl border border-[#E5E0D5] overflow-hidden flex flex-col"
            >
              <img
                src={pr.imageUrl || "/images/salcedo/rambutan-cacao-harvest.png"}
                alt={pr.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 space-y-3 flex-1">
                <span className="inline-block rounded-full bg-[#123F35]/10 text-[#123F35] px-3 py-0.5 text-[11px] font-bold capitalize">
                  {pr.category}
                </span>
                <h3 className="font-display text-xl font-bold text-[#202B28]">{pr.name}</h3>
                <p className="text-sm text-[#5A6B66] leading-relaxed">{pr.description}</p>
                {pr.producers.length > 0 && (
                  <div className="pt-2 border-t border-[#E5E0D5] space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#168A8A]">
                      Verified Local Producers
                    </p>
                    {pr.producers.map((prod) => (
                      <div key={prod.id} className="text-xs text-[#202B28]">
                        <strong>{prod.producerName}</strong>
                        {prod.address ? ` — ${prod.address}` : ""}
                        {prod.contactInfo ? ` (${prod.contactInfo})` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* TRAVEL & EMERGENCY */}
      {tab === "emergency" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#202B28]">
              Verified Municipal Emergency &amp; Visitor Assistance Hotlines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-4 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                      {c.category}
                    </span>
                    <h3 className="font-display font-bold text-base text-[#202B28]">
                      {c.agencyName}
                    </h3>
                    <p className="text-xs text-[#5A6B66]">
                      {c.address} {c.operatingHours ? `• ${c.operatingHours}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {c.phoneNumbers.map((num) => (
                      <a
                        key={num}
                        href={`tel:${num.replace(/[^+\d]/g, "")}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#123F35] text-white px-3 py-1.5 text-xs font-bold tabular-nums"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        {num}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {guides.map((g) => (
              <article
                key={g.id}
                className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-2"
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-[#168A8A]/12 text-[#168A8A] px-3 py-0.5 text-[11px] font-bold capitalize">
                  <Compass className="w-3 h-3" /> {g.category.replace("_", " ")}
                </span>
                <h3 className="font-display text-lg font-bold text-[#202B28]">{g.title}</h3>
                <p className="text-sm text-[#5A6B66] leading-relaxed">{g.content}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
