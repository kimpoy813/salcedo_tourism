import Link from "next/link";
import { Compass, MapPin } from "lucide-react";

export default function AppOfflinePage() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xs mb-5">
        <img
          src="/images/salcedo/turi-logo.png"
          alt="Project CEDO: Turi Logo"
          className="w-full h-full object-cover"
        />
      </div>
      <h1 className="font-display text-xl font-bold text-[#1A2421] mb-2">
        You&apos;re Offline
      </h1>
      <p className="text-xs text-[#616E69] max-w-xs mb-6 leading-relaxed">
        Project CEDO: Turi could not reach the network right now. Local trip drafts and
        bookmarks saved on this device remain available.
      </p>
      <div className="flex flex-col w-full max-w-xs gap-2">
        <Link
          href="/app"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#164237] text-white px-5 py-2.5 text-xs font-semibold hover:bg-[#10322A] transition"
        >
          <Compass className="w-4 h-4" />
          Return Home
        </Link>
        <Link
          href="/app/trips"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#EAE7E0] bg-white text-[#1A2421] px-5 py-2.5 text-xs font-semibold hover:bg-[#F3F2EE] transition"
        >
          <MapPin className="w-4 h-4" />
          Open Local Drafts
        </Link>
      </div>
    </div>
  );
}
