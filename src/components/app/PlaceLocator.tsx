import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { isInsideSalcedo } from "@/lib/geo/salcedo-boundary";
import { RELIEF, locatorPoint } from "@/lib/geo/relief";

/** A north-up orientation figure, not a substitute photograph or a route. */
export function PlaceLocator({
  name,
  slug,
  latitude,
  longitude,
  area,
}: {
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  area?: string;
}) {
  const point =
    latitude != null && longitude != null && isInsideSalcedo(latitude, longitude)
      ? locatorPoint(latitude, longitude)
      : null;
  const { x, y } = point ?? { x: RELIEF.width / 2, y: RELIEF.height / 2 };
  return (
    <div className="place-locator">
      <svg
        viewBox={`${x - 260} ${y - 160} 520 320`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={
          point
            ? `Location of ${name} in Salcedo`
            : "Municipal overview; this place has no mapped location"
        }
      >
        <image href="/app/maps/salcedo-locator.webp" width={RELIEF.width} height={RELIEF.height} />
        {point && (
          <g transform={`translate(${x} ${y})`}>
            <circle r="10" fill="#263e35" stroke="#fffdf4" strokeWidth="2.5" />
            <circle r="3" fill="#fffdf4" />
          </g>
        )}
      </svg>
      <div className="locator-foot">
        <span>
          <strong>{point && area ? `Barangay ${area}` : "Salcedo, Ilocos Sur"}</strong>
          <small>
            {point
              ? `${latitude!.toFixed(4)}° N · ${longitude!.toFixed(4)}° E`
              : "Municipal overview"}
          </small>
        </span>
        <Link href={point ? `/app/map?place=${encodeURIComponent(slug)}` : "/app/map"}>
          Open map <ArrowUpRight size={15} />
        </Link>
      </div>
      <p className="locator-credits">
        <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> ·{" "}
        <a href="/app/more#sources">GEBCO</a>
      </p>
    </div>
  );
}
