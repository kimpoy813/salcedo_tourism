import Link from "next/link";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Info,
  MapPin,
  PhoneCall,
  Route,
  ShieldCheck,
  Trees,
} from "lucide-react";

const MORE_LINKS = [
  {
    href: "/app/salcedo?tab=overview",
    title: "Municipal Profile & Geography",
    desc: "Landlocked 103.44 km² profile, 2711 postal code & official seal",
    icon: Info,
    tone: "bg-[#123F35]/10 text-[#123F35]",
  },
  {
    href: "/app/salcedo?tab=barangays",
    title: "All 21 Official Barangays",
    desc: "Census population, elevations & spots from Atabay to Ubbog",
    icon: MapPin,
    tone: "bg-[#168A8A]/12 text-[#168A8A]",
  },
  {
    href: "/app/salcedo?tab=history",
    title: "History & Culture (Baugen → Salcedo)",
    desc: "Republic Act No. 1627 heritage, Bago & Ilocano traditions",
    icon: BookOpen,
    tone: "bg-amber-900/10 text-amber-900",
  },
  {
    href: "/app/salcedo?tab=events",
    title: "Festivals & Municipal Calendar",
    desc: "Banat Kadiwa cum Rambutan Harvest Fair & Town Fiesta",
    icon: Calendar,
    tone: "bg-[#D6A85B]/20 text-[#8C611B]",
  },
  {
    href: "/app/salcedo?tab=products",
    title: "Local Products & Cacao Tablea",
    desc: "Salcedo Rambutan, Tsokolate de Ylocos & Sorioan cacao",
    icon: Trees,
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    href: "/app/salcedo?tab=emergency",
    title: "Travel Tips & Emergency Hotlines",
    desc: "1-tap call for Salcedo MDRRMO, PNP, BFP, RHU & Hospital",
    icon: PhoneCall,
    tone: "bg-rose-50 text-rose-700",
  },
];

export default function MoreHubPage() {
  return (
    <div className="px-4 py-4 space-y-5">
      {/* Mobile Header Summary */}
      <div className="rounded-2xl bg-[#123F35] text-white p-4 flex items-center gap-3.5 shadow-sm">
        <img
          src="/images/salcedo/seal-of-salcedo.png"
          alt="Official Seal of Salcedo"
          className="w-12 h-12 rounded-full bg-white p-0.5 shrink-0"
        />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#D6A85B]">
            Project CEDO: Turi App
          </p>
          <h1 className="font-display text-lg font-bold leading-snug truncate">
            Municipality of Salcedo
          </h1>
          <p className="text-[11px] text-white/80 truncate">
            Ilocos Sur • Official Municipal Guide
          </p>
        </div>
      </div>

      {/* Grouped Native-Style Settings / Directory List */}
      <div className="bg-white rounded-2xl border border-[#E5E0D5] divide-y divide-[#E5E0D5] overflow-hidden">
        {MORE_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#F8F7F2] active:bg-[#EFECE3] transition"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.tone}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-sm text-[#202B28] truncate">
                  {item.title}
                </h2>
                <p className="text-[11px] text-[#5A6B66] line-clamp-1">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#5A6B66] shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Data Privacy & Account-Free Trips Card */}
      <div className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3">
        <div className="flex items-center gap-2 text-[#123F35]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <h2 className="font-display text-sm font-bold">
            Visitor Privacy &amp; RA 10173 Commitment
          </h2>
        </div>
        <p className="text-xs text-[#5A6B66] leading-relaxed">
          Turi operates with zero tourist accounts, passwords, or ad tracking. Local itinerary
          drafts stay on your device unless you submit them to get a cross-device CEDO trip code.
        </p>
        <Link
          href="/app/trips?tab=retrieve"
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#123F35] text-white px-4 py-2.5 text-xs font-bold"
        >
          <Route className="w-3.5 h-3.5" />
          Retrieve or Erase Submitted Trip
        </Link>
      </div>
    </div>
  );
}
