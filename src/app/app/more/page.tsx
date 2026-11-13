import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Compass,
  Info,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Trees,
} from "lucide-react";

const MORE_LINKS = [
  {
    href: "/app/salcedo?tab=overview",
    title: "Municipal Profile & Geography",
    desc: "Landlocked Ilocos Sur facts, 103.44 km² profile, 2711 postal code & official seal.",
    icon: Info,
  },
  {
    href: "/app/salcedo?tab=barangays",
    title: "All 21 Official Barangays",
    desc: "Explore population stats, elevations & destinations from Atabay to Ubbog.",
    icon: MapPin,
  },
  {
    href: "/app/salcedo?tab=history",
    title: "History & Culture (Baugen → Salcedo)",
    desc: "Republic Act No. 1627 heritage, Bago & Ilocano traditions, Gregorio del Pilar shrine.",
    icon: BookOpen,
  },
  {
    href: "/app/salcedo?tab=events",
    title: "Festivals & Municipal Calendar",
    desc: "Banat Kadiwa cum Rambutan Harvest Fair, Town Fiesta & Salcedo Motocross.",
    icon: Calendar,
  },
  {
    href: "/app/salcedo?tab=products",
    title: "Local Products & Cacao Tablea",
    desc: "Salcedo Rambutan, Tsokolate de Ylocos / Wynn's Food Products & Sorioan cacao.",
    icon: Trees,
  },
  {
    href: "/app/salcedo?tab=emergency",
    title: "Travel Tips & Emergency Hotlines",
    desc: "Direct numbers for Salcedo MDRRMO, PNP, BFP, RHU & District Hospital.",
    icon: PhoneCall,
  },
];

export default function MoreHubPage() {
  return (
    <div className="px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#168A8A]">
          Visitor Information Hub
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202B28]">
          More About Salcedo &amp; Turi
        </h1>
        <p className="text-sm text-[#5A6B66] max-w-2xl">
          Quick access to municipal background, all 21 barangays, emergency contacts, and privacy
          information.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MORE_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white rounded-3xl border border-[#E5E0D5] p-5 hover:border-[#123F35] hover:shadow-md transition space-y-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#123F35]/10 text-[#123F35] flex items-center justify-center group-hover:bg-[#123F35] group-hover:text-white transition">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#202B28]">
                {item.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#5A6B66] leading-relaxed">{item.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Data Privacy & PWA Info */}
      <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-3">
        <div className="flex items-center gap-2 text-[#123F35]">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="font-display text-lg font-bold">
            Visitor Privacy &amp; RA 10173 Commitment
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#5A6B66] leading-relaxed">
          Project CEDO: Turi App operates without tourist accounts, passwords, or social tracking.
          Anonymous session insights exclude your personal identity, and itineraries drafted locally
          never leave your device unless you voluntarily submit your travel plan to receive a
          reference code.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/app/trips"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#123F35] text-white px-4 py-2 text-xs font-bold"
          >
            <Compass className="w-3.5 h-3.5" />
            Manage or Erase Submitted Trip
          </Link>
        </div>
      </div>
    </div>
  );
}
