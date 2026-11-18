"use client";

import React, { useMemo, useState } from "react";
import { GuideImage } from "./GuideImage";
import { FactList } from "@/components/ui/FactList";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const tab = initialTab;
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
      <nav className="profile-nav" aria-label="Visitor information topics">
        {tabs.map(t => <Link href={`/app/salcedo?tab=${t.id}`} scroll={false} key={t.id} aria-current={tab === t.id ? "page" : undefined}>{t.label}</Link>)}
      </nav>
      <label className="profile-topic">Guide section<select className="guide-field" value={tab} onChange={e=>router.push(`/app/salcedo?tab=${e.target.value}`,{scroll:false})}>{tabs.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
      <div className="profile-content">
      {tab === "overview" && (
        <div className="profile-overview">
          <div className="bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/images/salcedo/municipal-seal.webp"
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
              className="locator-map"
            />
          </div>

          <section className="municipal-facts"><h2>Municipal figures</h2><FactList rows={[["Population (2020)","11,110"],["Barangays",barangays.length],["Land area","103.44 km²"],["ZIP code","2711"]]} numeric/></section>

          {municipalInfo.filter(sec => sec.key !== "profile_overview").map((sec) => (
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
          <div className="community-search"><input
            type="search"
            value={barangayQuery}
            onChange={(e) => setBarangayQuery(e.target.value)}
            aria-label="Search the barangay directory"
            placeholder="Search the 21 barangays…"
            className="guide-field"
          /><small role="status">{filteredBarangays.length} of {barangays.length}</small></div>

          {!filteredBarangays.length ? <p className="empty-note" role="status">No barangays match “{barangayQuery}”. Try a different name.</p> : <table className="community-register"><caption className="sr-only">Barangay directory</caption><thead><tr><th scope="col">Barangay</th><th scope="col">Population (2020)</th><th scope="col">Elevation</th><th scope="col">Places</th></tr></thead><tbody>
            {filteredBarangays.map(b=><tr key={b.id}><th scope="row"><Link href={`/app/discover?barangay=${encodeURIComponent(b.slug)}`}>{b.name}</Link><small>{b.summary}</small></th><td><span className="compact-prefix">Population: </span>{b.population2020?.toLocaleString('en-PH')??'—'}</td><td><span className="compact-prefix">Elevation: </span>{b.elevationMeters==null?'—':`${Math.round(b.elevationMeters)} m`}</td><td>{b.publishedPlacesCount}<span className="compact-prefix"> {b.publishedPlacesCount===1?"place":"places"}</span></td></tr>)}
          </tbody></table>}
        </div>
      )}

      {tab === "history" && (
        <div className="profile-grid">
          {historicalArticles.map((art) => (
            <article
              key={art.id}
              className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-1.5"
            >
              {art.eraOrYear && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A6527]">
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
        <div className="profile-grid">
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
        <div className="harvest-layout">
          <div className="product-list">{products.length===0 && <p className="empty-note">No local products are listed yet.</p>}{products.map(pr=><article key={pr.id} className="product-entry">
            {pr.imageUrl && <GuideImage src={pr.imageUrl} size="thumb" width={100} height={80} alt="" className="product-thumb"/>}
            <header><small>{pr.category}{pr.barangay && ` · Brgy. ${pr.barangay.name}`}</small><h2>{pr.name}</h2></header>
            <p>{pr.description}</p>
            {pr.producers.length>0 && <p className="product-source"><strong>{pr.producers.length===1?'Producer':'Producers'}:</strong> {pr.producers.map(p=>p.producerName).join(', ')}</p>}
          </article>)}</div>
          <figure className="harvest-plate"><img src="/images/salcedo/cacao-plate.webp" alt="Botanical plate of a cacao branch, pod and flower" width="500" height="731" loading="lazy"/><figcaption><strong>Cacao &amp; tablea</strong><p>Cacao grows in Sorioan. In Poblacion, local makers roast and grind the beans into tablea for hot chocolate.</p></figcaption><small className="plate-credit"><i>Theobroma cacao</i> · <Link href="/app/more#sources">Flora de Filipinas, pl.&nbsp;275</Link></small></figure>
        </div>
      )}

      {tab === "guides" && (
        <div className="profile-grid">
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
