import Link from "next/link";
import { WifiOff, MapPin, Compass } from "lucide-react";

export default function AppOfflinePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12 text-center bg-[#F8F7F2]">
      <div className="w-16 h-16 rounded-2xl bg-[#123F35]/10 flex items-center justify-center mb-5 text-[#123F35]">
        <WifiOff className="w-8 h-8" />
      </div>
      <h1 className="font-display text-2xl font-bold text-[#202B28] mb-2">
        You&apos;re Currently Offline
      </h1>
      <p className="text-sm text-[#5A6B66] max-w-md mb-6 leading-relaxed">
        Project CEDO: Turi App could not reach the network right now. Your saved trip drafts
        stored locally in your browser remain safe on this device.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-xl bg-[#123F35] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#0D3029] transition"
        >
          <Compass className="w-4 h-4" />
          Return to Turi Home
        </Link>
        <Link
          href="/app/trips"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D5] bg-white text-[#202B28] px-5 py-2.5 text-sm font-semibold hover:bg-[#F8F7F2] transition"
        >
          <MapPin className="w-4 h-4" />
          View Local Trip Drafts
        </Link>
      </div>
    </div>
  );
}
