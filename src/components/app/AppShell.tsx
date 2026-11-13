"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Compass,
  Download,
  Home,
  Info,
  LayoutGrid,
  Map as MapIcon,
  Route,
  WifiOff,
  X,
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
  const scrollRef = useRef<HTMLElement | null>(null);
  const { draftStopCount, toast, dismissToast } = useMobileApp();
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

  // Scroll back to top on route change like a native view stack
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

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

  // Native route layouts:
  // - /app/map: 100% full-screen interactive map (no top header, no scroll wrapper)
  // - /app/places/[slug]: full-bleed hero image with floating back/share/bookmark buttons inside screen
  // - /app/salcedo & /app/offline: native push-stack navigation bar with back button
  // - root tabs (/app, /app/discover, /app/trips, /app/more): native screen large title, zero website navbar
  const isFullScreenMap = pathname.startsWith("/app/map");
  const isPushBarPage =
    pathname.startsWith("/app/salcedo") || pathname.startsWith("/app/offline");

  const pushPageTitle = pathname.startsWith("/app/salcedo")
    ? "Salcedo Guide"
    : pathname.startsWith("/app/offline")
    ? "Offline"
    : "Turi";

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/app/more");
    }
  };

  return (
    <div className="app-shell-backdrop min-h-[100dvh] bg-[#EAE7DF] flex items-center justify-center sm:p-3">
      {/* Native Mobile Viewport Container */}
      <div className="app-shell-frame relative w-full max-w-[430px] h-[100dvh] sm:h-[min(896px,calc(100dvh-24px))] bg-[#FAF9F6] text-[#1A2421] flex flex-col overflow-hidden sm:rounded-[36px] sm:border sm:border-[#D9D4C8] sm:shadow-[0_24px_70px_-16px_rgba(22,66,55,0.24)]">
        {/* Compact Push Navigation Bar (Only on nested info/offline pages) */}
        {isPushBarPage && (
          <header className="no-print shrink-0 h-12 pt-[env(safe-area-inset-top)] bg-[#FAF9F6]/92 backdrop-blur-md border-b border-[#EAE7E0] px-3 flex items-center justify-between gap-2 z-30 select-none">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1 rounded-full py-1 pr-2.5 pl-1 text-xs font-semibold text-[#164237] active:scale-95 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="font-display text-sm font-bold text-[#1A2421] truncate">
              {pushPageTitle}
            </span>
            <div className="w-14 flex justify-end">
              {isOffline && <WifiOff className="w-3.5 h-3.5 text-[#616E69]" />}
            </div>
          </header>
        )}

        {/* Floating Offline / Install Pill (Only visible when offline or installable) */}
        {!isPushBarPage && (isOffline || installPrompt) && (
          <div className="no-print absolute top-[max(10px,env(safe-area-inset-top))] right-3 z-40 flex items-center gap-1.5">
            {isOffline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md border border-[#EAE7E0] px-2.5 py-1 text-[10px] font-semibold text-[#616E69] shadow-xs">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}
            {installPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex items-center gap-1 rounded-full bg-[#164237] text-white px-3 py-1 text-[11px] font-semibold shadow-sm active:scale-95 transition cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Install App
              </button>
            )}
          </div>
        )}

        {/* Native Scrollable Content Canvas (or Fullscreen Map Canvas) */}
        <main
          ref={scrollRef}
          className={`app-shell-scroll w-full max-w-full min-w-0 flex-1 min-h-0 relative ${
            isFullScreenMap
              ? "overflow-hidden"
              : "overflow-y-auto overflow-x-hidden overscroll-contain"
          }`}
        >
          {children}
        </main>

        {/* Native In-Frame Floating Snackbar */}
        {toast && (
          <div className="no-print absolute bottom-[72px] left-3 right-3 z-50 pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-between gap-2.5 rounded-full bg-[#1A2421] text-white pl-3.5 pr-2 py-2 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2 min-w-0">
                {toast.tone === "success" ? (
                  <span className="w-5 h-5 rounded-full bg-[#164237] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                ) : (
                  <Info className="w-4 h-4 text-white/75 shrink-0" />
                )}
                <p className="text-xs font-medium truncate">{toast.message}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {toast.actionLabel && toast.actionHref && (
                  <Link
                    href={toast.actionHref}
                    onClick={dismissToast}
                    className="rounded-full bg-white text-[#1A2421] px-2.5 py-1 text-[11px] font-bold active:scale-95 transition"
                  >
                    {toast.actionLabel}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={dismissToast}
                  aria-label="Dismiss"
                  className="p-1 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Native Bottom 5-Tab Navigation Bar */}
        <nav
          aria-label="Primary Tourist Navigation"
          className="no-print shrink-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE7E0] px-2 pb-[env(safe-area-inset-bottom)] select-none"
        >
          <div className="grid grid-cols-5 h-[62px] items-center">
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
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-1 transition-transform duration-100 active:scale-90 ${
                    isActive ? "text-[#164237]" : "text-[#616E69] hover:text-[#1A2421]"
                  }`}
                >
                  <span
                    className={`relative flex items-center justify-center w-12 h-7 rounded-full transition-colors ${
                      isActive ? "bg-[#164237]/12" : ""
                    }`}
                  >
                    <Icon
                      className="w-[19px] h-[19px]"
                      strokeWidth={isActive ? 2.2 : 1.7}
                    />
                    {showTripBadge && (
                      <span className="absolute -top-0.5 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#164237] text-white text-[9px] font-bold flex items-center justify-center tabular-nums ring-2 ring-white">
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
