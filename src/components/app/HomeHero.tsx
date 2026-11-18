import Form from "next/form";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search } from "lucide-react";

/** A local relief plate, not a photograph. Projection and annotation anchors
 * are reproduced by scripts/build-visitor-relief.py. */
export function HomeHero() {
  return (
    <section className="visitor-cover" aria-labelledby="cover-title">
      <div className="guide-wrap cover-spread">
        <div className="cover-intro">
          <p className="cover-location">
            Philippines <span>/</span> Ilocos Sur
          </p>
          <h1 id="cover-title">Salcedo</h1>
          <p className="cover-deck">
            A visitor’s guide to the Buaya River valley, from the town plaza to the springs of Ubbog
            and the falls of Baluarte.
          </p>
          <Form className="cover-search" action="/app/discover" role="search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              name="q"
              aria-label="Search the place directory"
              placeholder="Place or barangay"
            />
            <button type="submit" aria-label="Search destinations">
              Search
            </button>
          </Form>
          <Link className="cover-browse" href="/app/discover">
            Browse the directory <ArrowRight size={15} />
          </Link>
        </div>
        <figure className="valley-figure">
          <div className="valley-plate">
            <svg
              viewBox="0 0 640 394"
              role="img"
              aria-label="Relief of Salcedo from the southwest: the town plaza in the valley, Baluarte Falls to the south, and Madarang in the eastern foothills"
            >
              <image href="/app/maps/valley-plate.webp" width="640" height="394" />
              <g className="plate-annotation">
                <path d="M250 200 215 153H140" />
                <circle cx="250" cy="200" r="3.5" />
                <text x="139" y="146">
                  Town plaza
                </text>
                <path d="M432 83 461 34H539" />
                <circle cx="432" cy="83" r="3.5" />
                <text x="465" y="27">
                  Madarang
                </text>
                <path d="M285 288 316 344H385" />
                <circle cx="285" cy="288" r="3.5" />
                <text x="322" y="365">
                  Baluarte
                </text>
              </g>
            </svg>
          </div>
          <figcaption>
            <div>
              <strong>Buaya River valley</strong>
              <small>
                Relief: <Link href="/app/more#sources">GEBCO</Link> ·{" "}
                <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>
              </small>
            </div>
            <Link href="/app/map">
              Open map <ArrowUpRight size={16} />
            </Link>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
