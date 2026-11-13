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
    { id: "overview", label: "Profile", icon: Info },
    { id: "barangays", label: `Barangays (${barangays.length})`, icon: MapPin },
    { id: "history", label: "History", icon: BookOpen },
    { id: "events", label: "Events", icon: Calendar },
    { id: "products", label: "Products", icon: Trees },
    { id: "emergency", label: "Emergency", icon: PhoneCall },
  ];

  return (
    <div className="space-y-4">
      {/* Sticky Horizontal Mobile Sub-navigation Pills */}
      <div className="sticky top-14 z-30 -mx-4 px-4 py-2 bg-[#F8F7F2]/95 backdrop-blur-md border-b border-[#E5E0D5]/80 flex gap-1.5 overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition cursor-pointer ${
                tab === t.id
                  ? "bg-[#123F35] text-white border-[#123F35]"
                  : "bg-white text-[#202B28] border-[#E5E0D5]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/salcedo/seal-of-salcedo.png"
                alt="Official Municipal Seal of Salcedo, Ilocos Sur"
                className="w-12 h-12 rounded-full border border-[#E5E0D5] bg-white p-0.5 shrink-0"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                  2nd District of Ilocos Sur
                </span>
                <h2 className="font-display text-lg font-bold text-[#202B28] leading-snug">
                  Municipality of Salcedo
                </h2>
                <p className="text-[11px] text-[#5A6B66]">Formerly Baugen • Region I</p>
              </div>
            </div>

            <p className="text-xs text-[#5A6B66] leading-relaxed">
              Salcedo is a landlocked 4th-class agricultural and eco-tourism municipality nestled
              along the Buaya River valley near Tirad Pass. Known as the{" "}
              <strong>&ldquo;Rambutan Basket of the North&rdquo;</strong>, it welcomes visitors with
              waterfalls, inland spring resorts, and locally crafted cacao tablea.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3">
                <p className="text-[10px] text-[#5A6B66]">2020 Census Pop.</p>
                <p className="font-display text-base font-bold text-[#123F35] tabular-nums">
                  11,110
                </p>
              </div>
              <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3">
                <p className="text-[10px] text-[#5A6B66]">Land Area</p>
                <p className="font-display text-base font-bold text-[#123F35] tabular-nums">
                  103.44 km²
                </p>
              </div>
              <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3">
                <p className="text-[10px] text-[#5A6B66]">Official Barangays</p>
                <p className="font-display text-base font-bold text-[#123F35] tabular-nums">21</p>
              </div>
              <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3">
                <p className="text-[10px] text-[#5A6B66]">Postal Code</p>
                <p className="font-display text-base font-bold text-[#123F35] tabular-nums">
                  2711
                </p>
              </div>
            </div>

            <div className="pt-1 space-y-1.5">
              <img
                src="/images/salcedo/ilocos-sur-locator-map.jpg"
                alt="Official Locator Map of Salcedo within Ilocos Sur"
                className="w-full rounded-xl border border-[#E5E0D5]"
              />
              <p className="text-[10px] text-[#5A6B66] text-center">
                Landlocked municipality bordered by Candon, Banayoyo, Galimuyod, Gregorio del
                Pilar, Quirino &amp; San Emilio.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {municipalInfo.map((sec) => (
              <article
                key={sec.key}
                className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-1.5"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                  {sec.category.replace("_", " ")}
                </span>
                <h3 className="font-display text-base font-bold text-[#202B28]">{sec.title}</h3>
                <p className="text-xs text-[#5A6B66] leading-relaxed">{sec.content}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 21 BARANGAYS EXPLORER */}
      {tab === "barangays" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5A6B66] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={brgyQuery}
              onChange={(e) => setBrgyQuery(e.target.value)}
              placeholder="Search any of the 21 barangays..."
              className="w-full rounded-xl border border-[#E5E0D5] bg-white pl-9 pr-3 py-2.5 text-sm"
            />
          </div>

          <div className="space-y-3">
            {filteredBarangays.map((b) => (
              <article
                key={b.id}
                className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[#202B28]">
                    Brgy. {b.name}
                  </h3>
                  <Link
                    href={`/app/discover?barangay=${encodeURIComponent(b.slug)}`}
                    className="rounded-full bg-[#123F35]/10 text-[#123F35] px-2.5 py-0.5 text-[11px] font-bold shrink-0"
                  >
                    {b.publishedPlacesCount} spots →
                  </Link>
                </div>
                <p className="text-xs text-[#5A6B66] leading-relaxed">{b.summary}</p>
                <div className="flex items-center justify-between text-[11px] text-[#5A6B66] tabular-nums pt-1 border-t border-[#E5E0D5]/70">
                  <span>2020 Pop: {b.population2020?.toLocaleString() ?? "—"}</span>
                  {b.elevationMeters ? (
                    <span>Elev: {Math.round(b.elevationMeters)}m ASL</span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY & CULTURE */}
      {tab === "history" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="font-display text-base font-bold text-[#202B28]">
              History of Salcedo (Baugen → RA 1627)
            </h2>
            {historicalArticles.map((art) => (
              <article
                key={art.id}
                className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-2"
              >
                {art.eraOrYear && (
                  <span className="inline-block rounded-full bg-[#D6A85B]/20 text-[#8C611B] px-2.5 py-0.5 text-[10px] font-bold">
                    {art.eraOrYear}
                  </span>
                )}
                <h3 className="font-display text-base font-bold text-[#202B28]">{art.title}</h3>
                <p className="text-xs font-semibold text-[#168A8A]">{art.summary}</p>
                <p className="text-xs text-[#5A6B66] leading-relaxed">{art.content}</p>
              </article>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-base font-bold text-[#202B28]">
              Culture &amp; Living Heritage
            </h2>
            {culturalArticles.map((art) => (
              <article
                key={art.id}
                className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-2"
              >
                {art.category && (
                  <span className="inline-block rounded-full bg-[#123F35]/10 text-[#123F35] px-2.5 py-0.5 text-[10px] font-bold capitalize">
                    {art.category}
                  </span>
                )}
                <h3 className="font-display text-base font-bold text-[#202B28]">{art.title}</h3>
                <p className="text-xs text-[#5A6B66] leading-relaxed">{art.content}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* EVENTS */}
      {tab === "events" && (
        <div className="space-y-3">
          {events.map((ev) => (
            <article
              key={ev.id}
              className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#168A8A]">
                <span className="capitalize">{ev.category.replace("_", " ")}</span>
                <span className="tabular-nums">
                  {ev.startDate}
                  {ev.endDate ? ` – ${ev.endDate}` : ""}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-[#202B28]">{ev.title}</h3>
              <p className="text-xs font-semibold text-[#123F35]">
                Venue: {ev.venueName}
                {ev.barangay ? ` (Brgy. ${ev.barangay.name})` : ""}
              </p>
              <p className="text-xs text-[#5A6B66] leading-relaxed">{ev.description}</p>
            </article>
          ))}
        </div>
      )}

      {/* LOCAL PRODUCTS */}
      {tab === "products" && (
        <div className="space-y-3">
          {products.map((pr) => (
            <article
              key={pr.id}
              className="bg-white rounded-2xl border border-[#E5E0D5] overflow-hidden"
            >
              <img
                src={pr.imageUrl || "/images/salcedo/rambutan-cacao-harvest.png"}
                alt={pr.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-4 space-y-2">
                <span className="inline-block rounded-full bg-[#123F35]/10 text-[#123F35] px-2.5 py-0.5 text-[10px] font-bold capitalize">
                  {pr.category}
                </span>
                <h3 className="font-display text-base font-bold text-[#202B28]">{pr.name}</h3>
                <p className="text-xs text-[#5A6B66] leading-relaxed">{pr.description}</p>
                {pr.producers.length > 0 && (
                  <div className="pt-2 border-t border-[#E5E0D5] space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                      Verified Local Producers
                    </p>
                    {pr.producers.map((prod) => (
                      <p key={prod.id} className="text-xs text-[#202B28]">
                        <strong>{prod.producerName}</strong>
                        {prod.address ? ` — ${prod.address}` : ""}
                        {prod.contactInfo ? ` (${prod.contactInfo})` : ""}
                      </p>
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
        <div className="space-y-4">
          <div className="space-y-2.5">
            <h2 className="font-display text-base font-bold text-[#202B28]">
              Tap-to-Call Salcedo Emergency Hotlines
            </h2>
            {contacts.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-[#E5E0D5] p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                    {c.category}
                  </span>
                  <h3 className="font-display font-bold text-sm text-[#202B28]">
                    {c.agencyName}
                  </h3>
                  <p className="text-[11px] text-[#5A6B66]">
                    {c.address} {c.operatingHours ? `• ${c.operatingHours}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {c.phoneNumbers.map((num) => (
                    <a
                      key={num}
                      href={`tel:${num.replace(/[^+\d]/g, "")}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#123F35] text-white px-3 py-2 text-xs font-bold tabular-nums"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      {num}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <h2 className="font-display text-base font-bold text-[#202B28]">Travel Tips</h2>
            {guides.map((g) => (
              <article
                key={g.id}
                className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-1.5"
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-[#168A8A]/12 text-[#168A8A] px-2.5 py-0.5 text-[10px] font-bold capitalize">
                  <Compass className="w-3 h-3" /> {g.category.replace("_", " ")}
                </span>
                <h3 className="font-display text-sm font-bold text-[#202B28]">{g.title}</h3>
                <p className="text-xs text-[#5A6B66] leading-relaxed">{g.content}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
