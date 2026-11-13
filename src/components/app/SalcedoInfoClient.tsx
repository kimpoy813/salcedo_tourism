"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Phone, ShieldAlert } from "lucide-react";

type TabId = "overview" | "barangays" | "history" | "events" | "products" | "guides" | "emergency";

interface BarangayItem {
  id: string;
  name: string;
  slug: string;
  district: string;
  population2020: number | null;
  elevationMeters: number | null;
  summary: string;
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

interface SalcedoDataProps {
  barangays: BarangayItem[];
  historicalArticles: ArticleItem[];
  culturalArticles: ArticleItem[];
  events: EventItem[];
  products: ProductItem[];
  guides: GuideItem[];
  contacts: ContactItem[];
  municipalInfo: Array<{ key: string; title: string; category: string; content: string }>;
}

const VALID_TABS: TabId[] = [
  "overview",
  "barangays",
  "history",
  "events",
  "products",
  "guides",
  "emergency",
];

export function SalcedoInfoClient(data: SalcedoDataProps) {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const normalized = rawTab === "history" ? "history" : (rawTab as TabId | null);
  const initialTab: TabId =
    normalized && VALID_TABS.includes(normalized) ? normalized : "overview";

  return <SalcedoInfoInner key={initialTab} initialTab={initialTab} {...data} />;
}

function SalcedoInfoInner({
  initialTab,
  barangays,
  historicalArticles,
  culturalArticles,
  events,
  products,
  guides,
  contacts,
  municipalInfo,
}: SalcedoDataProps & { initialTab: TabId }) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [barangayQuery, setBarangayQuery] = useState("");

  const filteredBarangays = useMemo(() => {
    const q = barangayQuery.trim().toLowerCase();
    if (!q) return barangays;
    return barangays.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.summary.toLowerCase().includes(q) ||
        b.district.toLowerCase().includes(q)
    );
  }, [barangays, barangayQuery]);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "barangays", label: "Barangays" },
    { id: "history", label: "History" },
    { id: "events", label: "Events" },
    { id: "products", label: "Products" },
    { id: "guides", label: "Guides" },
    { id: "emergency", label: "Hotlines" },
  ];

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Minimal Sticky Pills */}
      <div className="sticky top-0 z-30 w-full py-2 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#EAE7E0]">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 after:content-[''] after:w-1 after:shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                tab === t.id
                  ? "bg-[#164237] text-white"
                  : "bg-white text-[#1A2421] border border-[#EAE7E0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/images/salcedo/seal-of-salcedo.png"
                alt="Official Seal of Salcedo"
                className="w-11 h-11 rounded-full border border-[#EAE7E0] shrink-0"
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                  2nd District of Ilocos Sur
                </p>
                <h2 className="font-display text-lg font-bold text-[#1A2421]">
                  Municipality of Salcedo
                </h2>
              </div>
            </div>
            <p className="text-sm text-[#1A2421]/85 leading-relaxed">
              {municipalInfo.find((m) => m.key === "profile_overview")?.content ||
                "Known historically as Baugen, Salcedo is a serene valley municipality along the Buaya River near Tirad Pass. Celebrated as the \"Rambutan Basket of the North\", it welcomes travelers with cool inland springs, waterfalls, and heritage cacao tablea."}
            </p>
            <img
              src="/images/salcedo/ilocos-sur-locator-map.jpg"
              alt="Locator Map of Salcedo, Ilocos Sur"
              className="w-full rounded-xl border border-[#EAE7E0]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl border border-[#EAE7E0] p-3.5">
              <p className="text-[10px] uppercase tracking-wider text-[#616E69]">
                2020 Population
              </p>
              <p className="font-display font-bold text-sm text-[#1A2421] mt-0.5 tabular-nums">
                11,110
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-[#EAE7E0] p-3.5">
              <p className="text-[10px] uppercase tracking-wider text-[#616E69]">ZIP Code</p>
              <p className="font-display font-bold text-sm text-[#1A2421] mt-0.5 tabular-nums">
                2711
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-[#EAE7E0] p-3.5">
              <p className="text-[10px] uppercase tracking-wider text-[#616E69]">Barangays</p>
              <p className="font-display font-bold text-sm text-[#1A2421] mt-0.5 tabular-nums">
                {barangays.length} Official
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-[#EAE7E0] p-3.5">
              <p className="text-[10px] uppercase tracking-wider text-[#616E69]">
                Land Area
              </p>
              <p className="font-display font-bold text-sm text-[#1A2421] mt-0.5 tabular-nums">
                103.44 km²
              </p>
            </div>
          </div>

          {municipalInfo.map((sec) => (
            <article
              key={sec.key}
              className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-1.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                {sec.category.replace("_", " ")}
              </p>
              <h3 className="font-display text-sm font-bold text-[#1A2421]">{sec.title}</h3>
              <p className="text-xs text-[#616E69] leading-relaxed">{sec.content}</p>
            </article>
          ))}
        </div>
      )}

      {tab === "barangays" && (
        <div className="space-y-3">
          <input
            type="search"
            value={barangayQuery}
            onChange={(e) => setBarangayQuery(e.target.value)}
            placeholder="Filter the 21 barangays..."
            className="w-full rounded-full border border-[#EAE7E0] bg-white px-4 py-2 text-sm focus:outline-none focus:border-[#164237]/40"
          />

          <div className="bg-white rounded-2xl border border-[#EAE7E0] divide-y divide-[#EAE7E0] overflow-hidden">
            {filteredBarangays.map((b) => (
              <Link
                key={b.id}
                href={`/app/discover?barangay=${encodeURIComponent(b.slug)}`}
                className="block p-3.5 hover:bg-[#FAF9F6] transition space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-bold text-sm text-[#1A2421]">
                    Brgy. {b.name}
                  </p>
                  <span className="text-[11px] font-medium text-[#616E69] tabular-nums shrink-0">
                    {b.publishedPlacesCount}{" "}
                    {b.publishedPlacesCount === 1 ? "spot" : "spots"}
                  </span>
                </div>
                <p className="text-xs text-[#616E69] leading-relaxed">{b.summary}</p>
                <p className="text-[11px] text-[#616E69]/80 tabular-nums">
                  Pop: {b.population2020?.toLocaleString() ?? "—"}
                  {b.elevationMeters ? ` • ${Math.round(b.elevationMeters)}m ASL` : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {historicalArticles.map((art) => (
            <article
              key={art.id}
              className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-1.5"
            >
              {art.eraOrYear && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B88A44]">
                  {art.eraOrYear}
                </p>
              )}
              <h3 className="font-display text-base font-bold text-[#1A2421]">{art.title}</h3>
              <p className="text-xs font-medium text-[#164237]">{art.summary}</p>
              <p className="text-xs text-[#616E69] leading-relaxed">{art.content}</p>
            </article>
          ))}
          {culturalArticles.map((art) => (
            <article
              key={art.id}
              className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-1.5"
            >
              {art.category && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                  {art.category}
                </p>
              )}
              <h3 className="font-display text-base font-bold text-[#1A2421]">{art.title}</h3>
              <p className="text-xs text-[#616E69] leading-relaxed">{art.content}</p>
            </article>
          ))}
        </div>
      )}

      {tab === "events" && (
        <div className="space-y-3">
          {events.map((ev) => (
            <article
              key={ev.id}
              className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-1.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69] tabular-nums">
                {ev.startDate}
                {ev.endDate ? ` — ${ev.endDate}` : ""}
              </p>
              <h3 className="font-display text-base font-bold text-[#1A2421]">{ev.title}</h3>
              <p className="text-xs font-medium text-[#164237]">
                {ev.venueName}
                {ev.barangay ? ` • Brgy. ${ev.barangay.name}` : ""}
              </p>
              <p className="text-xs text-[#616E69] leading-relaxed">{ev.description}</p>
            </article>
          ))}
        </div>
      )}

      {tab === "products" && (
        <div className="space-y-3">
          {products.map((pr) => (
            <article
              key={pr.id}
              className="bg-white rounded-2xl border border-[#EAE7E0] overflow-hidden flex gap-3 p-3"
            >
              <img
                src={pr.imageUrl || "/images/salcedo/rambutan-cacao-harvest.png"}
                alt={pr.name}
                className="w-20 h-20 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                  {pr.category}
                </p>
                <h3 className="font-display text-sm font-bold text-[#1A2421] leading-snug">
                  {pr.name}
                </h3>
                <p className="text-xs text-[#616E69] leading-relaxed">{pr.description}</p>
                {pr.producers.length > 0 && (
                  <p className="text-[11px] font-medium text-[#164237]">
                    {pr.producers.map((p) => p.producerName).join(", ")}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "guides" && (
        <div className="space-y-3">
          {guides.map((g) => (
            <article
              key={g.id}
              className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-1.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                {g.category.replace("_", " ")}
              </p>
              <h3 className="font-display text-base font-bold text-[#1A2421]">{g.title}</h3>
              <p className="text-xs font-medium text-[#164237]">{g.summary}</p>
              <p className="text-xs text-[#616E69] leading-relaxed">{g.content}</p>
            </article>
          ))}
        </div>
      )}

      {tab === "emergency" && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[#F3F2EE] p-3.5 text-xs text-[#1A2421] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#B88A44] shrink-0" />
            <span>Tap any number below to dial directly from your phone.</span>
          </div>
          {contacts.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2.5"
            >
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#616E69]">
                  {c.category}
                </p>
                <h3 className="font-display text-sm font-bold text-[#1A2421]">
                  {c.agencyName}
                </h3>
                <p className="text-xs text-[#616E69]">
                  {c.address} {c.operatingHours ? `• ${c.operatingHours}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.phoneNumbers.map((num) => (
                  <a
                    key={num}
                    href={`tel:${num.replace(/[^+\d]/g, "")}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-1.5 text-xs font-semibold tabular-nums"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {num}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
