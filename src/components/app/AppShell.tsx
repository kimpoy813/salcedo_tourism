"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Compass,
  Download,
  Home,
  LayoutGrid,
  Map as MapIcon,
  Route,
  Search,
  WifiOff,
} from "lucide-react";
import { trackPageView } from "@/lib/client/analytics-tracker";
import { MobileAppProvider, useMobileApp } from "./MobileAppContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: Home, matchExact: true },
  { href: "/app/discover", label: "Discover", icon: Compass, matchExact: false },
  { href: "/app/map", label: "Map", icon: MapIcon, matchExact: false },
  { href: "/app/trips", label: "My Trips", icon: Route, matchExact: false },
  { href: "/app/more", label: "More", icon: LayoutGrid, matchExact: false },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MobileAppProvider>
      <MobileAppShellInner>{children}</MobileAppShellInner>
    </MobileAppProvider>
  );
}

function MobileAppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/app";
  const router = useRouter();
  const { draftStopCount } = useMobileApp();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Register Service Worker scoped strictly to /app/
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/app/sw.js", { scope: "/app/" })
        .catch(() => undefined);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const updateOnline = () => setIsOffline(!navigator.onLine);

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    Promise.resolve().then(() => updateOnline());

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  // Track anonymous page view once per route change (never blocks navigation)
  useEffect(() => {
    if (!pathname.startsWith("/app")) return;
    const pageType =
      pathname === "/app"
        ? "home"
        : pathname.startsWith("/app/places/")
        ? "place_detail"
        : pathname.startsWith("/app/discover")
        ? "discover"
        : pathname.startsWith("/app/map")
        ? "map"
        : pathname.startsWith("/app/trips")
        ? "trips"
        : pathname.startsWith("/app/salcedo") || pathname.startsWith("/app/more")
        ? "salcedo_info"
        : "app_page";
    void trackPageView({ path: pathname, pageType });
  }, [pathname]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const res = await installPrompt.userChoice;
    if (res.outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  const isSubPage =
    pathname.startsWith("/app/places/") ||
    pathname.startsWith("/app/salcedo") ||
    pathname.startsWith("/app/offline");

  const subPageTitle = pathname.startsWith("/app/places/")
    ? "Destination Guide"
    : pathname.startsWith("/app/salcedo")
    ? "All About Salcedo"
    : pathname.startsWith("/app/offline")
    ? "Offline Mode"
    : "Turi";

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/app");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#E8E3D8] flex justify-center">
      {/* Mobile-First App Frame (Full width on mobile, centered mobile app frame on wide screens) */}
      <div className="w-full max-w-[440px] min-h-[100dvh] bg-[#F8F7F2] text-[#202B28] flex flex-col relative sm:shadow-[0_24px_80px_rgba(13,48,41,0.16)] sm:border-x sm:border-[#D9D2C3]">
        {/* Mobile App Top Header */}
        <header className="no-print sticky top-0 z-40 h-14 bg-[#123F35] text-white px-3.5 flex items-center justify-between gap-2 shadow-sm">
          {isSubPage ? (
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold truncate">{subPageTitle}</p>
                <p className="text-[10px] text-[#E5E0D5]/80 truncate">
                  Salcedo, Ilocos Sur
                </p>
              </div>
            </div>
          ) : (
            <Link href="/app" className="flex items-center gap-2.5 min-w-0">
              <img
                src="/images/salcedo/seal-of-salcedo.png"
                alt="Official Seal of Salcedo"
                className="w-9 h-9 rounded-full bg-white p-0.5 object-contain shrink-0 ring-1 ring-[#D6A85B]/70"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-base font-bold tracking-tight truncate">
                    Turi
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[#D6A85B]/20 border border-[#D6A85B]/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F8F7F2]">
                    CEDO
                  </span>
                </div>
                <p className="text-[10px] text-[#E5E0D5]/85 truncate">
                  Salcedo, Ilocos Sur • Official Guide
                </p>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {isOffline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-300/40 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}
            {installPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex items-center gap-1 rounded-full bg-[#D6A85B] text-[#0D3029] px-2.5 py-1 text-[11px] font-bold shadow-xs hover:bg-[#e1b76f] transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Install
              </button>
            )}
            {!pathname.startsWith("/app/discover") && (
              <Link
                href="/app/discover"
                aria-label="Search destinations"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <Search className="w-4 h-4" />
              </Link>
            )}
          </div>
        </header>

        {/* Scrollable Mobile Content Canvas */}
        <main className="flex-1 w-full pb-[78px]">{children}</main>

        {/* Persistent Mobile Bottom 5-Tab Navigation Bar */}
        <nav
          aria-label="Primary Tourist Navigation"
          className="no-print fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E0D5] px-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(18,63,53,0.08)]"
        >
          <div className="grid grid-cols-5 h-16 items-center">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.matchExact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const showTripBadge = item.href === "/app/trips" && draftStopCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition active:scale-95 ${
                    isActive ? "text-[#123F35]" : "text-[#5A6B66] hover:text-[#202B28]"
                  }`}
                >
                  <span
                    className={`relative flex items-center justify-center w-10 h-7 rounded-full transition ${
                      isActive ? "bg-[#123F35]/12 text-[#123F35]" : ""
                    }`}
                  >
                    <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.4 : 1.8} />
                    {showTripBadge && (
                      <span className="absolute -top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#D6A85B] text-[#0D3029] text-[9px] font-extrabold flex items-center justify-center tabular-nums shadow-xs">
                        {draftStopCount}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[10px] tracking-tight ${
                      isActive ? "font-bold" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
