"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Check,
  Compass,
  Home,
  Info,
  Map,
  Route,
  WifiOff,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/ui/FieldGuide";
import { keepPlaceOffline } from "@/lib/client/offline-place";
import { trackPageView } from "@/lib/client/analytics-tracker";
import { MobileAppProvider, useMobileApp } from "./MobileAppContext";

const NAV = [
  { href: "/app", label: "Home", short: "Home", icon: Home },
  { href: "/app/discover", label: "Discover", short: "Discover", icon: Compass },
  { href: "/app/map", label: "Map explorer", short: "Map", icon: Map },
  { href: "/app/more", label: "Local guide", short: "Guide", icon: BookOpen },
];
const TRIP = { href: "/app/trips", label: "My trip", short: "My trip", icon: Route };

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <MobileAppProvider>
      <GuideShell>{children}</GuideShell>
    </MobileAppProvider>
  );
}

function GuideShell({ children }: { children: ReactNode }) {
  const pathname = (usePathname() || "/app").replace(/\/$/, "");
  const { draftStopCount, savedCount, toast, dismissToast } = useMobileApp();
  const [offline, setOffline] = useState(false);
  const isMap = pathname === "/app/map";
  function active(href: string) {
    return (
      href === pathname ||
      (href === "/app/more" && pathname.startsWith("/app/salcedo")) ||
      (href === "/app/discover" && pathname.startsWith("/app/places/"))
    );
  }

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/app/sw.js", { scope: "/app/" }).catch(() => undefined);
    }
    const update = () => setOffline(!navigator.onLine);
    void Promise.resolve().then(update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    const pageType =
      pathname === "/app"
        ? "home"
        : pathname.startsWith("/app/places/")
          ? "place_detail"
          : ["/app/salcedo", "/app/more"].includes(pathname)
            ? "salcedo_info"
            : pathname.split("/")[2] || "app_page";
    if (pageType === "place_detail") keepPlaceOffline(pathname);
    void trackPageView({ path: pathname, pageType });
  }, [pathname]);

  return (
    <div className={`guide-shell ${isMap ? "map-shell" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header no-print">
        <div className="guide-wrap header-layout">
          <Link href="/app/">
            <Wordmark />
            <span className="sr-only"> home</span>
          </Link>
          <nav aria-label="Main navigation" className="desktop-nav">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href === "/app" ? "/app/" : item.href}
                aria-current={active(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link
              className="saved-link"
              href="/app/trips?tab=saved"
              aria-label={`Saved${savedCount ? ` (${savedCount})` : ""} places`}
            >
              <Bookmark size={16} />
              <span>Saved{savedCount > 0 ? ` (${savedCount})` : ""}</span>
            </Link>
            <Link
              className="trip-link"
              href="/app/trips"
              aria-current={active(TRIP.href) ? "page" : undefined}
            >
              <Route size={16} />
              <span>My trip</span>
              {draftStopCount > 0 && <b>{draftStopCount}</b>}
            </Link>
          </div>
        </div>
      </header>
      {offline && (
        <div role="status" className="offline-note no-print">
          <WifiOff size={15} /> You’re offline.{" "}
          <Link href="/app/trips?tab=saved">Open saved places and trips</Link>
        </div>
      )}
      <main id="main-content" tabIndex={-1} className={isMap ? "map-canvas" : "guide-main"}>
        {children}
      </main>
      {!isMap && (
        <footer className="site-footer no-print">
          <div className="guide-wrap footer-layout">
            <Link href="/app/">
              <Wordmark />
              <span className="sr-only"> home</span>
            </Link>
            <p>
              Project CEDO: Turi <span>·</span> Municipality of Salcedo, Ilocos Sur
            </p>
            <Link href="/admin/login">
              Staff access <ArrowUpRight size={14} />
            </Link>
          </div>
        </footer>
      )}
      <nav className="mobile-nav no-print" aria-label="Tourist navigation">
        {[...NAV.slice(0, 3), TRIP, NAV[3]].map(({ href, short, icon: Icon }) => (
          <Link
            key={href}
            href={href === "/app" ? "/app/" : href}
            aria-current={active(href) ? "page" : undefined}
          >
            <span>
              <Icon size={20} strokeWidth={active(href) ? 2 : 1.6} />
              {href === TRIP.href && draftStopCount > 0 && <b>{draftStopCount}</b>}
            </span>
            {short}
          </Link>
        ))}
      </nav>
      <div className="toast-region no-print" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="guide-toast" key={toast.id}>
            {toast.tone === "success" ? <Check size={17} /> : <Info size={17} />}
            <span>{toast.message}</span>
            {toast.actionHref && (
              <Link onClick={dismissToast} href={toast.actionHref}>
                {toast.actionLabel}
              </Link>
            )}
            <button onClick={dismissToast} aria-label="Dismiss notification">
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
