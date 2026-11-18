import Link from "next/link";
import { Compass } from "lucide-react";
import { Kicker } from "@/components/ui/FieldGuide";

export default function PlaceNotFound() {
  return (
    <div className="guide-wrap offline-page">
      <div className="offline-card">
        <Compass size={32} />
        <Kicker>Place directory</Kicker>
        <h1>Place not found.</h1>
        <p>
          This destination may have moved or may no longer be published. The directory has the
          latest places to explore.
        </p>
        <div>
          <Link className="primary-button" href="/app/discover">
            Open the directory
          </Link>
        </div>
      </div>
    </div>
  );
}
