import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBasket,
} from "lucide-react";
import { GuideBanner } from "@/components/ui/GuideBanner";
import { Kicker } from "@/components/ui/FieldGuide";

export const metadata = { title: "Local guide" };
const essentials = [
  {
    tab: "barangays",
    icon: MapPin,
    title: "Barangay directory",
    text: "Get to know the 21 communities of Salcedo.",
  },
  {
    tab: "events",
    icon: CalendarDays,
    title: "Festivals & events",
    text: "Explore the municipal calendar and harvest fairs.",
  },
  {
    tab: "products",
    icon: ShoppingBasket,
    title: "Harvest & local crafts",
    text: "Find local produce, cacao tablea, and their makers.",
  },
  {
    tab: "guides",
    icon: BookOpen,
    title: "Practical travel guides",
    text: "Getting here, local seasons, and visitor tips.",
  },
  {
    tab: "emergency",
    icon: Phone,
    title: "Emergency contacts",
    text: "Find health, police, and emergency hotlines.",
  },
];
export default function MoreHubPage() {
  return (
    <>
      <GuideBanner
        eyebrow="The local guide"
        title="Get to know Salcedo"
        description="The people, places, and traditions that make this valley home."
        image="/images/salcedo/plaza-heritage.png"
        note="Poblacion Norte · Ilocos Sur"
      />
      <div className="guide-wrap local-guide-layout">
        <section>
          <div className="section-heading">
            <div>
              <Kicker>Visitor essentials</Kicker>
              <h2>Before you go</h2>
            </div>
          </div>
          <div className="guide-index">
            {essentials.map(({ tab, icon: Icon, title, text }) => (
              <Link key={tab} href={`/app/salcedo?tab=${tab}`}>
                <span className="index-icon">
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}
          </div>
        </section>
        <aside className="guide-aside">
          <div className="guide-story">
            <Image
              src="/images/salcedo/gallery-heritage-church.jpg"
              width={600}
              height={310}
              alt="Heritage church and plaza"
            />
            <div>
              <Kicker>Culture & heritage</Kicker>
              <h2>Stories from the valley</h2>
              <p>
                Trace Salcedo’s Baugen roots, its heritage landmarks, and the traditions of upland
                life.
              </p>
              <Link className="text-link" href="/app/salcedo?tab=history">
                Read local history <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <Link className="guide-overview" href="/app/salcedo">
            Municipality profile <ArrowUpRight size={16} />
          </Link>
        </aside>
      </div>
      <div className="guide-wrap privacy-footnote">
        <ShieldCheck size={19} />
        <p>
          <strong>Your guide, no account needed.</strong> Bookmarks and drafts stay on this device.
          Sharing a visitor plan with the tourism office is optional under RA 10173.
        </p>
      </div>
    </>
  );
}
