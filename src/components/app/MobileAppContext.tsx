"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Check, Info, X } from "lucide-react";
import {
  listLocalDrafts,
  listSavedPlaceIds,
  saveLocalDraft,
  toggleSavedPlaceId,
  type LocalItineraryDraft,
} from "@/lib/client/indexeddb";

interface ToastState {
  id: number;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  tone?: "success" | "info";
}

interface MobileAppContextValue {
  draftStopIds: string[];
  draftStopCount: number;
  savedPlaceIds: string[];
  savedCount: number;
  refreshCounts: () => Promise<void>;
  addPlaceToActiveDraft: (place: {
    id: string;
    name: string;
    slug: string;
    placeType: string;
    barangayName?: string | null;
    featuredImageUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }) => Promise<boolean>;
  toggleBookmark: (placeId: string, placeName?: string) => Promise<boolean>;
  showToast: (
    message: string,
    options?: { actionLabel?: string; actionHref?: string; tone?: "success" | "info" }
  ) => void;
}

const MobileAppContext = createContext<MobileAppContextValue | null>(null);

export function MobileAppProvider({ children }: { children: React.ReactNode }) {
  const [draftStopIds, setDraftStopIds] = useState<string[]>([]);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (
      message: string,
      options?: { actionLabel?: string; actionHref?: string; tone?: "success" | "info" }
    ) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const id = Date.now();
      setToast({
        id,
        message,
        actionLabel: options?.actionLabel,
        actionHref: options?.actionHref,
        tone: options?.tone ?? "success",
      });
      timerRef.current = setTimeout(() => {
        setToast((cur) => (cur?.id === id ? null : cur));
      }, 3200);
    },
    []
  );

  const refreshCounts = useCallback(async () => {
    try {
      const [drafts, savedIds] = await Promise.all([
        listLocalDrafts(),
        listSavedPlaceIds(),
      ]);
      const primaryStops = drafts[0]?.stops ?? [];
      setDraftStopIds(primaryStops.map((s) => s.placeId));
      setSavedPlaceIds(savedIds);
    } catch {
      // Ignore storage failures safely
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => void refreshCounts());
    const onSync = () => void refreshCounts();
    window.addEventListener("turi:sync-state", onSync);
    return () => {
      window.removeEventListener("turi:sync-state", onSync);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refreshCounts]);

  const addPlaceToActiveDraft = useCallback(
    async (place: {
      id: string;
      name: string;
      slug: string;
      placeType: string;
      barangayName?: string | null;
      featuredImageUrl?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    }) => {
      const drafts = await listLocalDrafts();
      const activeDraft: LocalItineraryDraft = drafts[0] ?? {
        id: `draft-${Date.now()}`,
        title: "My Salcedo Day Trip",
        plannedVisitDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
        description: "",
        stops: [],
        updatedAt: new Date().toISOString(),
      };

      const alreadyAdded = activeDraft.stops.some((s) => s.placeId === place.id);
      if (!alreadyAdded) {
        activeDraft.stops.push({
          placeId: place.id,
          placeName: place.name,
          placeSlug: place.slug,
          placeType: place.placeType,
          barangayName: place.barangayName ?? null,
          featuredImageUrl: place.featuredImageUrl ?? null,
          latitude: place.latitude ?? null,
          longitude: place.longitude ?? null,
          visitTime: activeDraft.stops.length === 0 ? "09:00" : "",
          durationMinutes: 90,
          personalNotes: "",
        });
        activeDraft.updatedAt = new Date().toISOString();
        await saveLocalDraft(activeDraft);
        await refreshCounts();
        showToast(`Added ${place.name}`, {
          actionLabel: "Trip",
          actionHref: "/app/trips",
          tone: "success",
        });
        return true;
      }

      showToast(`${place.name} is already in your trip`, {
        actionLabel: "View",
        actionHref: "/app/trips",
        tone: "info",
      });
      return false;
    },
    [refreshCounts, showToast]
  );

  const toggleBookmark = useCallback(
    async (placeId: string, placeName?: string) => {
      const isNowSaved = await toggleSavedPlaceId(placeId);
      await refreshCounts();
      showToast(
        isNowSaved
          ? `Saved ${placeName || "place"}`
          : `Removed ${placeName || "place"}`,
        {
          actionLabel: isNowSaved ? "Saved" : undefined,
          actionHref: isNowSaved ? "/app/trips?tab=saved" : undefined,
          tone: isNowSaved ? "success" : "info",
        }
      );
      return isNowSaved;
    },
    [refreshCounts, showToast]
  );

  return (
    <MobileAppContext.Provider
      value={{
        draftStopIds,
        draftStopCount: draftStopIds.length,
        savedPlaceIds,
        savedCount: savedPlaceIds.length,
        refreshCounts,
        addPlaceToActiveDraft,
        toggleBookmark,
        showToast,
      }}
    >
      {children}

      {/* Minimalist Floating Snackbar */}
      {toast && (
        <div className="no-print fixed bottom-[76px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[398px] pointer-events-none">
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
                  onClick={() => setToast(null)}
                  className="rounded-full bg-white text-[#1A2421] px-2.5 py-1 text-[11px] font-bold hover:bg-[#FAF9F6] transition"
                >
                  {toast.actionLabel}
                </Link>
              )}
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss"
                className="p-1 text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileAppContext.Provider>
  );
}

export function useMobileApp() {
  const ctx = useContext(MobileAppContext);
  if (!ctx) {
    throw new Error("useMobileApp must be used inside MobileAppProvider");
  }
  return ctx;
}
