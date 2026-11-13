import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Compass,
  Info,
  MapPin,
  PhoneCall,
  Route,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

const EXPLORE_ROWS = [
  {
    href: "/app/salcedo?tab=barangays",
    icon: MapPin,
    tint: "bg-[#164237]/10 text-[#164237]",
    title: "21 Barangays Directory",
    subtitle: "Profiles, coordinates & local highlights",
  },
  {
    href: "/app/salcedo?tab=events",
    icon: CalendarDays,
    tint: "bg-[#B88A44]/15 text-[#9A6F2B]",
    title: "Festivals & Calendar",
    subtitle: "Salcedo Town Fiesta & Rambutan Fair",
  },
  {
    href: "/app/salcedo?tab=products",
    icon: ShoppingBag,
    tint: "bg-[#9E6340]/12 text-[#8E5332]",
    title: "Local Harvest & Crafts",
    subtitle: "Rambutan, cacao tablea & produce",
  },
  {
    href: "/app/salcedo?tab=guides",
    icon: BookOpen,
    tint: "bg-[#1D7874]/12 text-[#1D7874]",
    title: "Visitor Guides & Articles",
    subtitle: "Travel tips & cultural etiquette",
  },
  {
    href: "/app/salcedo?tab=history",
    icon: Info,
    tint: "bg-[#164237]/10 text-[#164237]",
    title: "About Salcedo (2711)",
    subtitle: "Geography, Baugen roots & profile",
  },
];

const SUPPORT_ROWS = [
  {
    href: "/app/salcedo?tab=emergency",
    icon: PhoneCall,
    tint: "bg-rose-100 text-rose-700",
    title: "Emergency Hotlines",
    subtitle: "MDRRMO, PNP Salcedo & RHU",
  },
  {
    href: "/app/trips?tab=saved",
    icon: Route,
    tint: "bg-[#164237]/10 text-[#164237]",
    title: "Saved Places & Drafts",
    subtitle: "Offline bookmarks stored on device",
  },
  {
    href: "/app/discover",
    icon: Compass,
    tint: "bg-[#1D7874]/12 text-[#1D7874]",
    title: "Full Place Directory",
    subtitle: "All verified stops across Salcedo",
  },
];

export default function MoreHubPage() {
  return (
    <div className="px-4 pt-[max(18px,env(safe-area-inset-top))] pb-6 space-y-6">
      <div className="flex items-center gap-3">
        <img
          src="/images/salcedo/turi-logo.png"
          alt="Project CEDO: Turi Logo"
          className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-xs"
        />
        <div className="space-y-0.5 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#616E69]">
            Project CEDO: Turi
          </p>
          <h1 className="font-display text-xl font-bold text-[#1A2421] truncate">
            More About Salcedo
          </h1>
        </div>
      </div>

      {/* Grouped Native Inset Rows */}
      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#616E69] px-1">
          Municipality
        </h2>
        <div className="bg-white rounded-2xl border border-[#EAE7E0] divide-y divide-[#EAE7E0] overflow-hidden">
          {EXPLORE_ROWS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3.5 active:bg-[#F3F2EE] transition"
              >
                <span
                  className={`w-9 h-9 rounded-xl ${item.tint} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.9} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-[#1A2421] leading-snug">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#616E69] truncate">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#616E69]/70 shrink-0" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#616E69] px-1">
          Traveler Support
        </h2>
        <div className="bg-white rounded-2xl border border-[#EAE7E0] divide-y divide-[#EAE7E0] overflow-hidden">
          {SUPPORT_ROWS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3.5 active:bg-[#F3F2EE] transition"
              >
                <span
                  className={`w-9 h-9 rounded-xl ${item.tint} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.9} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-[#1A2421] leading-snug">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#616E69] truncate">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#616E69]/70 shrink-0" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quiet Privacy & Staff Cell */}
      <section className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#164237]" />
          <p className="font-display text-xs font-bold text-[#1A2421]">
            Privacy-First Design (RA 10173)
          </p>
        </div>
        <p className="text-xs text-[#616E69] leading-relaxed">
          Tourists browse freely without creating an account. Itinerary details are stored
          securely only when you choose to submit a trip plan.
        </p>
        <div className="pt-2 border-t border-[#EAE7E0] flex items-center justify-between text-[11px] text-[#616E69]">
          <span>LGU Salcedo • Tourism Office</span>
          <Link href="/admin/login" className="font-semibold text-[#164237]">
            Admin Console →
          </Link>
        </div>
      </section>
    </div>
  );
}
