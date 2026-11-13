"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  listLocalDrafts,
  listSavedPlaceIds,
  saveLocalDraft,
  toggleSavedPlaceId,
  type LocalItineraryDraft,
} from "@/lib/client/indexeddb";

export interface ToastState {
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
  toast: ToastState | null;
  dismissToast: () => void;
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

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

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
      }, 3000);
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
        toast,
        dismissToast,
        refreshCounts,
        addPlaceToActiveDraft,
        toggleBookmark,
        showToast,
      }}
    >
      {children}
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
