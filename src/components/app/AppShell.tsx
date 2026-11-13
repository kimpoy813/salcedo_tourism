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
  { href: "/app/trips", label: "Trips", icon: Route, matchExact: false },
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
    ? "Destination"
    : pathname.startsWith("/app/salcedo")
    ? "About Salcedo"
    : pathname.startsWith("/app/offline")
    ? "Offline"
    : "Turi";

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/app");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F2F0EA] flex justify-center">
      {/* Minimalist Mobile Viewport Shell */}
      <div className="w-full max-w-[430px] min-h-[100dvh] bg-[#FAF9F6] text-[#1A2421] flex flex-col relative sm:border-x sm:border-[#E5E1D8]">
        {/* Light Translucent Mobile Header */}
        <header className="no-print sticky top-0 z-40 h-14 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#EAE7E0] px-4 flex items-center justify-between gap-2">
          {isSubPage ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="w-8 h-8 rounded-full bg-white border border-[#EAE7E0] flex items-center justify-center text-[#1A2421] hover:bg-[#F3F2EE] transition cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="font-display text-sm font-bold text-[#1A2421] truncate">
                {subPageTitle}
              </span>
            </div>
          ) : (
            <Link href="/app" className="flex items-center gap-2.5 min-w-0">
              <img
                src="/images/salcedo/seal-of-salcedo.png"
                alt="Salcedo Seal"
                className="w-7 h-7 rounded-full object-contain shrink-0"
              />
              <div className="min-w-0 flex items-baseline gap-1.5">
                <span className="font-display text-base font-bold tracking-tight text-[#164237]">
                  Turi
                </span>
                <span className="text-[11px] text-[#616E69] truncate">
                  Salcedo
                </span>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {isOffline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F2EE] border border-[#EAE7E0] px-2 py-0.5 text-[10px] font-medium text-[#616E69]">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}
            {installPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex items-center gap-1 rounded-full bg-[#164237] text-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#10322A] transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Install
              </button>
            )}
            {!pathname.startsWith("/app/discover") && (
              <Link
                href="/app/discover"
                aria-label="Search destinations"
                className="w-8 h-8 rounded-full bg-white border border-[#EAE7E0] flex items-center justify-center text-[#1A2421] hover:bg-[#F3F2EE] transition"
              >
                <Search className="w-4 h-4" />
              </Link>
            )}
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 w-full pb-[76px]">{children}</main>

        {/* Minimalist Bottom 5-Tab Navigation Bar */}
        <nav
          aria-label="Primary Tourist Navigation"
          className="no-print fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE7E0] px-2 pb-[env(safe-area-inset-bottom)]"
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
                  className={`relative flex flex-col items-center justify-center gap-1 py-1 transition active:scale-95 ${
                    isActive ? "text-[#164237]" : "text-[#616E69] hover:text-[#1A2421]"
                  }`}
                >
                  <span className="relative flex items-center justify-center w-8 h-6">
                    <Icon
                      className="w-[19px] h-[19px]"
                      strokeWidth={isActive ? 2.1 : 1.6}
                    />
                    {showTripBadge && (
                      <span className="absolute -top-0.5 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#164237] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                        {draftStopCount}
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[10px] tracking-tight ${
                      isActive ? "font-bold text-[#164237]" : "font-medium"
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
