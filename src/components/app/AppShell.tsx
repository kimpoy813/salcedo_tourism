"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Download,
  Home,
  Info,
  Map as MapIcon,
  Route,
  WifiOff,
} from "lucide-react";
import { trackPageView } from "@/lib/client/analytics-tracker";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: Home, matchExact: true },
  { href: "/app/discover", label: "Discover", icon: Compass, matchExact: false },
  { href: "/app/map", label: "Map", icon: MapIcon, matchExact: false },
  { href: "/app/trips", label: "My Trips", icon: Route, matchExact: false },
  { href: "/app/more", label: "More", icon: Info, matchExact: false },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/app";
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
    updateOnline();

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

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#202B28] flex flex-col pb-20 md:pb-0">
      {/* Top Municipal App Bar */}
      <header className="no-print sticky top-0 z-40 border-b border-[#E5E0D5] bg-[#123F35] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/app" className="flex items-center gap-3 min-w-0">
            <img
              src="/images/salcedo/seal-of-salcedo.png"
              alt="Official Seal of the Municipality of Salcedo"
              className="w-10 h-10 rounded-full bg-white p-0.5 object-contain shrink-0 ring-1 ring-[#D6A85B]/60"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-base sm:text-lg font-bold tracking-tight truncate">
                  Turi
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-[#D6A85B]/20 border border-[#D6A85B]/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F8F7F2]">
                  Project CEDO
                </span>
              </div>
              <p className="text-[11px] text-[#E5E0D5]/85 truncate">
                Salcedo, Ilocos Sur • Official Guide
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.matchExact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-[#0D3029] text-[#D6A85B] shadow-inner"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {isOffline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-300/40 px-2.5 py-1 text-[11px] font-medium text-amber-100">
                <WifiOff className="w-3.5 h-3.5" />
                Offline
              </span>
            )}
            {installPrompt && (
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#D6A85B] text-[#0D3029] px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-[#e1b76f] transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Turi</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto">{children}</main>

      {/* Editorial Footer (Desktop) */}
      <footer className="no-print hidden md:block border-t border-[#E5E0D5] bg-white/70 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#5A6B66]">
          <div className="space-y-1">
            <p className="font-semibold text-[#202B28]">
              Project CEDO: Turi App — Municipality of Salcedo, Ilocos Sur (2711)
            </p>
            <p>
              Official Municipal Tourism Discovery &amp; Visitor Information System. No tourist
              account required. Privacy compliant with RA 10173.
            </p>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/app/salcedo" className="hover:text-[#123F35]">
              All About Salcedo
            </Link>
            <Link href="/app/salcedo?tab=emergency" className="hover:text-[#123F35]">
              Emergency Contacts
            </Link>
            <Link href="/app/trips" className="hover:text-[#123F35]">
              Retrieve Saved Trip
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom 5-Tab Navigation Bar */}
      <nav
        aria-label="Primary Tourist Navigation"
        className="no-print md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E5E0D5] px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(18,63,53,0.08)]"
      >
        <div className="grid grid-cols-5 h-16 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchExact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition ${
                  isActive ? "text-[#123F35]" : "text-[#5A6B66] hover:text-[#202B28]"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-9 h-7 rounded-full transition ${
                    isActive ? "bg-[#123F35]/12 text-[#123F35]" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} />
                </span>
                <span className={`text-[10px] tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
