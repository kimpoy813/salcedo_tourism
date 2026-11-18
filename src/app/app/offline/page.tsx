import Link from "next/link";
import { ArrowRight, Bookmark, WifiOff } from "lucide-react";
import { Kicker } from "@/components/ui/FieldGuide";

export const metadata = { title: "Offline" };
export default function AppOfflinePage() {
  return (
    <div className="guide-wrap offline-page">
      <div className="offline-card">
        <WifiOff size={35} strokeWidth={1.4} />
        <Kicker>On the road</Kicker>
        <h1>You’re offline.</h1>
        <p>
          You can still open the bookmarks and trip drafts you’ve saved on this device. Reconnect to
          browse new places.
        </p>
        <div>
          <Link className="primary-button" href="/app/trips?tab=saved">
            <Bookmark size={16} />
            Open saved places
          </Link>
          <Link className="text-link" href="/app/">
            Try home <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
