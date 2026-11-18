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
import { Kicker, PageIntro } from "@/components/ui/FieldGuide";

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
      <div className="guide-wrap inner-mast">
        <PageIntro
          eyebrow="Salcedo, Ilocos Sur"
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
          <div className="guide-story">
            <div className="history-cover">
              <img
                src="/images/salcedo/municipal-seal.webp"
                width="68"
                height="68"
                alt="Municipal seal of Salcedo"
              />
              <Kicker>Municipal history</Kicker>
              <h2>
                Before Salcedo:
                <br />
                Baugen
              </h2>
              <p>
                Baugen was the earlier name of Salcedo. Read about the town’s beginnings and its
                links to Tirad Pass.
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
      <section className="guide-wrap source-note" id="sources">
        <h2>Sources &amp; credits</h2>
        <p>
          <strong>Maps.</strong> Relief is drawn from the{" "}
          <a href="https://doi.org/10.5285/a29c5465-b138-234d-e053-6c86abc040b9">
            GEBCO Compilation Group (2020) grid
          </a>
          . Heights are exaggerated in the valley illustration. Roads and waterways:{" "}
          <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>.
          Boundaries: PSA / NAMRIA. Maps are for orientation, not trail navigation.
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
