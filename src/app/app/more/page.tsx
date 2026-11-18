import Link from "next/link";
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
import { PageIntro } from "@/components/ui/FieldGuide";

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
  {tab:"history",icon:BookOpen,title:"History & culture",text:"Baugen, Tirad Pass and the town’s heritage."},
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
      <div className="guide-wrap inner-mast">
        <PageIntro
          title="Local guide"
          description="Barangay information, public services, and the municipal calendar."
        />
      </div>
      <div className="guide-wrap local-guide-layout">
        <section>
          <div className="section-heading">
            <div>
              <h2>Visitor essentials</h2>
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
          <figure className="guide-map-note"><img src="/app/maps/valley-plate.webp" alt="Relief model of the Buaya River valley" width="640" height="394"/>
            <figcaption><h2>The Buaya River valley</h2><p>Locate places, roads and waterways on the municipal map.</p><Link className="text-link" href="/app/map">Open map <ArrowRight size={15}/></Link><small>Relief: <a href="#sources">GEBCO</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></small></figcaption>
          </figure>
          <Link className="guide-overview" href="/app/salcedo">
            Municipality profile <ArrowUpRight size={16} />
          </Link>
        </aside>
      </div>
      <section className="guide-wrap source-note" id="sources">
        <h2>Sources &amp; credits</h2>
        <p>
          <strong>Maps.</strong> Relief is drawn from the{" "}
          <a href="https://doi.org/10.5285/a29c5465-b138-234d-e053-6c86abc040b9">
            GEBCO Compilation Group (2020) grid
          </a>
          . Heights are exaggerated in the relief model. Roads and waterways:{" "}
          <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>.
          Boundaries: PSA / NAMRIA. Maps are for orientation, not trail navigation.
        </p>
        <p>
          <strong>Guide imagery.</strong> The landscape cover and images marked “Illustration” are representative artwork, not photographs of the listed sites. Where a place has its own photos, these are shown first.
        </p>
        <p>
          <strong>Botanical plate.</strong> <i>Theobroma cacao</i>, plate 275 of Francisco Manuel
          Blanco’s <i>Flora de Filipinas</i>, Atlas II.{" "}
          <a href="https://commons.wikimedia.org/wiki/File:Theobroma_cacao_Blanco2.275.jpg">
            Public-domain illustration, via Wikimedia Commons.
          </a>
        </p>
      </section>
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
