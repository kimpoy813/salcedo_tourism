"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PlaceThumbnail } from "./GuideImage";
import { snapshotMedia } from "@/lib/visitor-media";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader, Skeleton, StepHeader } from "@/components/ui/design";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Bookmark,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  KeyRound,
  MessageSquarePlus,
  Plus,
  Printer,
  Minus,
  RefreshCw,
  Route as RouteIcon,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  TriangleAlert,
  Wand2,
  X,
} from "lucide-react";
import {
  analyzeSchedule,
  buildSuggestedSchedule,
  endTimeFor,
  formatTime12h,
  suggestedNextTime,
} from "@/lib/trip-time";
import {
  deleteLocalDraft,
  listLocalDrafts,
  listLocalReceipts,
  listSavedPlaceIds,
  listSavedPlaceSnapshots,
  type SavedPlaceSnapshot,
  removeLocalReceipt,
  saveLocalDraft,
  saveLocalReceipt,
  type LocalItineraryDraft,
  type LocalItineraryStop,
  type LocalTripReceipt,
} from "@/lib/client/indexeddb";
import { trackItineraryEvent } from "@/lib/client/analytics-tracker";
import type { PlaceCardData } from "./PlaceCard";
import { useMobileApp } from "./MobileAppContext";

interface PrivacyNoticeData {
  version: string;
  title: string;
  bodyMarkdown: string;
}

function getReviewerToken(): string {
  if (typeof window === "undefined") return "browser-guest";
  const key = "cedo_reviewer_token";
  let token = window.localStorage.getItem(key);
  if (!token) {
    token = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, token);
  }
  return token;
}


interface RetrievedItinerary {
  id: string;
  referenceNumber: string;
  title: string;
  plannedVisitDate: string;
  description: string | null;
  totalStops: number;
  numberOfDays?: number;
  estimatedTotalMinutes: number;
  status?: string;
  completedAt?: string | null;
  expiresAt: string | null;
  stops: Array<{
    id: string;
    stopOrder: number;
    dayNumber?: number;
    visitTime: string | null;
    durationMinutes: number;
    personalNotes: string | null;
    visitedAt?: string | null;
    placeId: string;
    placeName: string;
    placeSlug: string;
    placeType: string;
    placeAddress: string;
  }>;
  tripSummary: {
    originMunicipality: string;
    originProvince: string;
    originCountry: string;
    plannedVisitDate: string;
    travelerCount: number;
    purposeOfVisit: string | null;
    transportationType: string | null;
    lengthOfStay: string | null;
    privacyNoticeVersion: string;
  } | null;
}

const ORIGIN_QUICK_CITIES = [
  { city: "Candon City", province: "Ilocos Sur" },
  { city: "Vigan City", province: "Ilocos Sur" },
  { city: "San Fernando", province: "La Union" },
  { city: "Metro Manila", province: "NCR" },
];

const DURATION_PRESETS = [30, 60, 90, 120, 180, 240];
const MAX_STAY_MINUTES = 720; // up to 12 hours at one destination

/** 30 -> "30m", 60 -> "1h", 150 -> "2h 30m" */
function formatDuration(mins: number): string {
  const m = Math.max(0, Math.round(mins || 0));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}

function createEmptyDraft(): LocalItineraryDraft {
  return {
    id: `draft-${Date.now()}`,
    title: "My Salcedo Day Trip",
    plannedVisitDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    description: "",
    stops: [],
    updatedAt: new Date().toISOString(),
  };
}

function computeSegmentDistanceKm(
  a?: { latitude?: number | null; longitude?: number | null },
  b?: { latitude?: number | null; longitude?: number | null }
): number | null {
  if (!a?.latitude || !a?.longitude || !b?.latitude || !b?.longitude) return null;
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Number((2 * R * Math.asin(Math.sqrt(h))).toFixed(1));
}

function useStopReviews() {
  const [stopRatings, setStopRatings] = useState<Record<string, number>>({});
  const [stopComments, setStopComments] = useState<Record<string, string>>({});
  const [visitedStops, setVisitedStops] = useState<Record<string, boolean>>({});
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);
  function clear() {
    setStopRatings({});
    setStopComments({});
    setVisitedStops({});
    setCompletionNotice(null);
  }
  return {
    stopRatings,
    setStopRatings,
    stopComments,
    setStopComments,
    visitedStops,
    setVisitedStops,
    completionNotice,
    setCompletionNotice,
    clear,
  };
}

export function TripsPlannerClient({
  availablePlaces,
  privacyNotice,
}: {
  availablePlaces: PlaceCardData[];
  privacyNotice: PrivacyNoticeData;
}) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const activeTab = tab === "retrieve" || tab === "saved" ? tab : "builder";
  const setActiveTab = (next: "builder" | "retrieve" | "saved") => {
    if (next === activeTab) return;
    window.history.pushState(null, "", next === "builder" ? "/app/trips" : `/app/trips?tab=${next}`);
  };
  const { refreshCounts, showToast, toggleBookmark } = useMobileApp();

  // Native bottom sheets instead of multi-step web forms
  const [stopPickerOpen, setStopPickerOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [showAllDays, setShowAllDays] = useState(true);
  const [registerSheetOpen, setRegisterSheetOpen] = useState(false);
  const [visitorSubmittedRef, setVisitorSubmittedRef] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [view, setView] = useState<"plan" | "review">("plan");
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({});
  const [expandedStopId, setExpandedStopId] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<LocalItineraryDraft[]>([]);
  const [draft, setDraft] = useState<LocalItineraryDraft>(createEmptyDraft);
  const [placeSearch, setPlaceSearch] = useState("");

  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [savedSnapshots, setSavedSnapshots] = useState<SavedPlaceSnapshot[]>([]);
  const [localReceipts, setLocalReceipts] = useState<LocalTripReceipt[]>([]);

  // Optional RA 10173 Submission Form state (in Register bottom sheet)
  const [visitorName, setVisitorName] = useState("");
  const [originMunicipality, setOriginMunicipality] = useState("");
  const [originProvince, setOriginProvince] = useState("");
  const [originCountry, setOriginCountry] = useState("Philippines");
  const [contactNumber, setContactNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [travelerCount, setTravelerCount] = useState<number>(1);
  const [purposeOfVisit, setPurposeOfVisit] = useState("");
  const [firstTimeVisitor, setFirstTimeVisitor] = useState<"yes" | "no" | "prefer_not_to_say">("prefer_not_to_say");
  const [transportationType, setTransportationType] = useState("");
  const [lengthOfStay, setLengthOfStay] = useState("");
  const [discoverySource, setDiscoverySource] = useState("");
  const [preferredExperience, setPreferredExperience] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const draftReviews = useStopReviews();
  const passReviews = useStopReviews();
  const { stopRatings, setStopRatings, stopComments, setStopComments, visitedStops, setVisitedStops, completionNotice, setCompletionNotice } = activeTab === "retrieve" ? passReviews : draftReviews;
  const [completing, setCompleting] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [followUpConsentGiven, setFollowUpConsentGiven] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    referenceNumber: string;
    privateCode: string;
    warning: string;
    title: string;
    plannedVisitDate: string;
    totalStops: number;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [retRef, setRetRef] = useState("");
  const [retCode, setRetCode] = useState("");
  const [retLoading, setRetLoading] = useState(false);
  const [retError, setRetError] = useState<string | null>(null);
  const [retrieved, setRetrieved] = useState<RetrievedItinerary | null>(null);
  const [rotatedCode, setRotatedCode] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [passBusy, setPassBusy] = useState<"rotate" | "delete" | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const [notebookState, setNotebookState] = useState<"opening" | "ready" | "error">("opening");
  useEffect(() => {
    let active = true;
    void (async () => {
      const [loadedDrafts, savedIds, receipts, snapshots] = await Promise.all([
        listLocalDrafts(),
        listSavedPlaceIds(),
        listLocalReceipts(),
        listSavedPlaceSnapshots(),
      ]);
      if (!active) return;
      setSavedSnapshots(snapshots);
      const activeDraft = loadedDrafts.find((d) => d.status !== "completed");
      if (activeDraft) {
        setDrafts(loadedDrafts);
        setDraft(activeDraft);
      } else if (loadedDrafts.length > 0) {
        // Every saved trip is finished — archive stays, but the planner
        // must open empty for the next trip, never holding old destinations.
        const fresh = createEmptyDraft();
        await saveLocalDraft(fresh);
        setDraft(fresh);
        setDrafts(await listLocalDrafts());
      } else {
        setDrafts(loadedDrafts);
      }
      setSavedPlaceIds(savedIds);
      setLocalReceipts(receipts);
      setNotebookState("ready");
    })().catch(() => { if (active) setNotebookState("error"); });
    return () => { active = false; };
  }, []);

  const filteredPlaces = useMemo(() => {
    const q = placeSearch.trim().toLowerCase();
    if (!q) return availablePlaces;
    return availablePlaces.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.placeType.toLowerCase().includes(q) ||
        (p.barangay?.name ?? "").toLowerCase().includes(q)
    );
  }, [availablePlaces, placeSearch]);

  const savedPlaces = useMemo(() => {
    const fromServer = availablePlaces.filter((p) => savedPlaceIds.includes(p.id));
    // Offline fallback: places saved on-device that the server list doesn't
    // include (e.g. no signal) still appear from their IndexedDB snapshots.
    const known = new Set(fromServer.map((p) => p.id));
    const fromSnapshots = savedSnapshots
      .filter((s) => savedPlaceIds.includes(s.id) && !known.has(s.id))
      .map(
        (s) =>
          ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            shortDescription: "",
            placeType: s.placeType,
            address: "",
            latitude: s.latitude ?? null,
            longitude: s.longitude ?? null,
            ...snapshotMedia(s),
            barangay: s.barangayName ? { name: s.barangayName, slug: "" } : null,
          }) as (typeof availablePlaces)[number]
      );
    return [...fromServer, ...fromSnapshots];
  }, [availablePlaces, savedPlaceIds, savedSnapshots]);

  const totalMinutes = useMemo(
    () => draft.stops.reduce((acc, s) => acc + (s.durationMinutes || 60), 0),
    [draft.stops]
  );

  const totalDistanceKm = useMemo(() => {
    let total = 0;
    for (let i = 1; i < draft.stops.length; i++) {
      const d = computeSegmentDistanceKm(draft.stops[i - 1], draft.stops[i]);
      if (d != null) total += d;
    }
    return Number(total.toFixed(1));
  }, [draft.stops]);

  const tripDaysCount = Math.max(1, draft.numberOfDays ?? 1, ...draft.stops.map((s) => s.day ?? 1));
  const focusedDay = Math.min(activeDay, tripDaysCount);
  const dateForDay = (day: number) => {
    const d = new Date(`${draft.plannedVisitDate}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + (day - 1));
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };
  const displayStops = useMemo(() => {
    const perDayCount = new Map<number, number>();
    return draft.stops
      .map((s, origIdx) => ({ s, origIdx, day: Math.min(Math.max(1, s.day ?? 1), Math.max(1, draft.numberOfDays ?? 1, s.day ?? 1)) }))
      .sort((a, b) => a.day - b.day || a.origIdx - b.origIdx)
      .map((item) => {
        const n = (perDayCount.get(item.day) ?? 0) + 1;
        perDayCount.set(item.day, n);
        return { ...item, dayIndex: n };
      });
  }, [draft.stops, draft.numberOfDays]);
  const visibleStops =
    showAllDays || tripDaysCount <= 1
      ? displayStops
      : displayStops.filter((x) => x.day === focusedDay);
  const daySummary = (day: number) => {
    const stops = displayStops.filter((x) => x.day === day).map((x) => x.s);
    if (stops.length === 0) return null;
    const first = stops.find((s) => s.visitTime)?.visitTime;
    const last = stops[stops.length - 1];
    return {
      count: stops.length,
      range: first
        ? `${formatTime12h(first)} – ${formatTime12h(endTimeFor(last.visitTime, last.durationMinutes))}`
        : "",
    };
  };

  const scheduleIssues = useMemo(() => {
    const byPlace = new Map<string, ReturnType<typeof analyzeSchedule>[number]>();
    let total = 0;
    const days = Math.max(1, draft.numberOfDays ?? 1, ...draft.stops.map((s) => s.day ?? 1));
    for (let d = 1; d <= days; d++) {
      const dayStops = draft.stops.filter((s) => (s.day ?? 1) === d);
      for (const issue of analyzeSchedule(dayStops)) {
        total += 1;
        const stop = dayStops[issue.index];
        if (stop) byPlace.set(stop.placeId, issue);
      }
    }
    return { byPlace, total };
  }, [draft.stops, draft.numberOfDays]);
  const issuesByIndex = useMemo(() => {
    const m = new Map<number, ReturnType<typeof analyzeSchedule>[number]>();
    for (const { s, origIdx } of displayStops) {
      const issue = scheduleIssues.byPlace.get(s.placeId);
      if (issue) m.set(origIdx, issue);
    }
    return m;
  }, [displayStops, scheduleIssues]);
  const todayStr = new Date().toISOString().slice(0, 10);
  const tripIsDue = draft.plannedVisitDate <= todayStr;
  const completedStopsCount = draft.stops.filter((s) => visitedStops[s.placeId] ?? true).length;

  const applySuggestedSchedule = async () => {
    const times = new Map<string, string>();
    for (let d = 1; d <= tripDaysCount; d++) {
      const dayStops = draft.stops.filter((s) => (s.day ?? 1) === d);
      if (dayStops.length === 0) continue;
      const first = dayStops.find((s) => s.visitTime)?.visitTime || "08:30";
      buildSuggestedSchedule(dayStops, first).forEach((s) => times.set(s.placeId, s.visitTime));
    }
    const stops = draft.stops.map((s) => ({ ...s, visitTime: times.get(s.placeId) ?? s.visitTime }));
    await persistDraft({ ...draft, stops });
    showToast("Times auto-arranged per day", { tone: "success" });
  };

  const setStopDay = async (origIdx: number, day: number) => {
    const moving = draft.stops[origIdx];
    if (!moving) return;
    const rest = draft.stops.filter((_, i) => i !== origIdx);
    const lastOfDay = rest.map((s, i) => ((s.day ?? 1) === day ? i : -1)).filter((i) => i >= 0).pop();
    const insertAt = lastOfDay == null ? rest.length : lastOfDay + 1;
    const stops = [...rest.slice(0, insertAt), { ...moving, day }, ...rest.slice(insertAt)];
    await persistDraft({ ...draft, stops, numberOfDays: Math.max(tripDaysCount, day) });
  };

  /** Local (unregistered) trip completion: rate each stop into the public ratings system. */
  const handleCompleteLocalTrip = async () => {
    setCompleting(true);
    setCompletionNotice(null);
    try {
      let rated = 0;
      for (const s of draft.stops) {
        if (
          (visitedStops[s.placeId] ?? true) &&
          (stopRatings[s.placeId] || stopComments[s.placeId]?.trim())
        ) {
          const res = await fetch(`/api/places/${s.placeId}/ratings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rating: stopRatings[s.placeId] ?? null,
              comment: stopComments[s.placeId]?.trim() || null,
              travelerType: "Leisure",
              reviewerToken: getReviewerToken(),
            }),
          });
          if (!res.ok) throw new Error("Review not saved");
          rated += 1;
        }
      }
      const completed: LocalItineraryDraft = {
        ...draft,
        status: "completed",
        completedAt: new Date().toISOString(),
        ratings: { ...(draft.ratings ?? {}), ...stopRatings },
      };
      await persistDraft(completed);
      void trackItineraryEvent({ eventType: "trip_completed", stopCount: completedStopsCount, placeIds: draft.stops.map((s) => s.placeId) });
      // Done means done: archive the finished trip under Saved and clear the
      // planner right away so no destinations linger for the next trip.
      const message = `Trip finished: ${completedStopsCount} destination(s) visited, ${rated} review(s) saved.${visitorSubmittedRef ? ` Visitor form recorded (Ref ${visitorSubmittedRef}).` : ""} Your planner is clear for the next trip — Agyaman kami!`;
      const fresh = createEmptyDraft();
      setStopRatings({});
      setStopComments({});
      setVisitedStops({});
      setCommentOpen({});
      setExpandedStopId(null);
      setReviewOpen(false);
      setView("plan");
      setVisitorSubmittedRef(null);
      await persistDraft(fresh);
      setCompletionNotice(message);
      showToast("Trip completed — planner cleared for your next trip!", { tone: "success" });
    } catch {
      setCompletionNotice("Your trip is still open. A review could not be saved; check your connection and try again.");
    } finally {
      setCompleting(false);
    }
  };

  /** Registered trip completion (counts in Tourism Office statistics). */
  const handleCompleteRegisteredTrip = async () => {
    if (!retrieved) return;
    setCompleting(true);
    setRetError(null);
    try {
      const res = await fetch("/api/itineraries/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceNumber: retrieved.referenceNumber,
          privateCode: retCode.trim(),
          reviewerToken: getReviewerToken(),
          stops: retrieved.stops.map((s) => ({
            placeId: s.placeId,
            visited: visitedStops[s.placeId] ?? Boolean(s.visitedAt),
            rating: stopRatings[s.placeId] ?? null,
            comment: stopComments[s.placeId]?.trim() || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRetError(data.error || "Could not complete this trip.");
        return;
      }
      setRetrieved({ ...retrieved, status: "completed", completedAt: data.completedAt,
        stops: retrieved.stops.map(s => ({ ...s, visitedAt: s.visitedAt || (visitedStops[s.placeId] ? data.completedAt : null) })),
      });
      const receipt = localReceipts.find((r) => r.referenceNumber === retrieved.referenceNumber);
      if (receipt) {
        await saveLocalReceipt({ ...receipt, status: "completed", completedAt: data.completedAt, ratings: stopRatings });
        setLocalReceipts(await listLocalReceipts());
      }
      setCompletionNotice(data.message);
      showToast("Trip completed & counted — thank you!", { tone: "success" });
    } catch {
      setRetError("Network error while completing trip.");
    } finally {
      setCompleting(false);
    }
  };

  const persistDraft = async (nextDraft: LocalItineraryDraft, showNotice = false) => {
    const updated = { ...nextDraft, updatedAt: new Date().toISOString() };
    setDraft(updated);
    await saveLocalDraft(updated);
    setDrafts(await listLocalDrafts());
    await refreshCounts();
    if (showNotice) {
      showToast("Draft saved offline", { tone: "success" });
    }
  };

  /** Day tabs (in Step 2, below) jump back up to the Step 1 destinations they control. */
  const jumpToDestinations = () => {
    requestAnimationFrame(() => {
      document.getElementById("trip-destinations")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  /** Clear the finished/current trip and begin a fresh one. */
  const handleStartNewTrip = async () => {
    const fresh = createEmptyDraft();
    setStopRatings({});
    setStopComments({});
    setVisitedStops({});
    setCommentOpen({});
    setExpandedStopId(null);
    setReviewOpen(false);
    setView("plan");
    setSubmissionResult(null);
    setVisitorSubmittedRef(null);
    setCompletionNotice(null);
    await persistDraft(fresh);
    setActiveTab("builder");
    showToast("New trip started", { tone: "success" });
  };

  const placesBySlug = new Map(availablePlaces.map(p=>[p.slug,p]));
  const fromDirectory = (slugs:string[]) => slugs.flatMap(slug=>placesBySlug.get(slug) ?? []);
  const routeOptions = {
    nature: fromDirectory(["baluarte-falls-agila-falls","kinbandiw-falls","bago-resort-spring-water"]),
    heritage: fromDirectory(["salcedo-town-plaza-del-pilar-shrine","tsokolate-de-ylocos-wynns-food-products","palays-bbq-poblacion-norte"]),
  };
  const applyQuickPreset = async (preset: "nature" | "heritage") => {
    const selected = routeOptions[preset];
    if (selected.length === 0) return;

    const times = ["09:00", "11:30", "14:00"];
    const stops: LocalItineraryStop[] = selected.map((p, idx) => ({
      placeId: p.id,
      placeName: p.name,
      placeSlug: p.slug,
      placeType: p.placeType,
      barangayName: p.barangay?.name ?? null,
      ...snapshotMedia(p),
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      visitTime: times[idx] || "",
      durationMinutes: 90,
      personalNotes: "",
    }));

    void trackItineraryEvent({ eventType: "builder_started", stopCount: stops.length });
    await persistDraft({
      ...draft,
      title:
        preset === "nature"
          ? "Salcedo Falls & Springs Day"
          : "Salcedo Heritage & Dining Trail",
      stops,
    });
    showToast(`Added ${stops.length} stops`, { tone: "success" });
  };

  const toggleStop = async (place: PlaceCardData) => {
    const exists = draft.stops.some((s) => s.placeId === place.id);
    const stops: LocalItineraryStop[] = exists
      ? draft.stops.filter((s) => s.placeId !== place.id)
      : [
          ...draft.stops,
          {
            placeId: place.id,
            placeName: place.name,
            placeSlug: place.slug,
            placeType: place.placeType,
            barangayName: place.barangay?.name ?? null,
            ...snapshotMedia(place),
            latitude: place.latitude ?? null,
            longitude: place.longitude ?? null,
            day: activeDay,
            visitTime: (() => {
              const dayStops = draft.stops.filter((x) => (x.day ?? 1) === activeDay);
              return dayStops.length === 0 ? "08:30" : suggestedNextTime(dayStops, dayStops.length) || "08:30";
            })(),
            durationMinutes: 90,
            personalNotes: "",
          },
        ];
    if (!exists && draft.stops.length === 0) {
      void trackItineraryEvent({ eventType: "builder_started", stopCount: 1 });
    }
    await persistDraft({ ...draft, stops });
  };

  const moveStop = async (fromIdx: number, toIdx: number) => {
    const ordered = displayStops.map(({ s }) => s);
    const from = ordered.findIndex((s) => s.placeId === draft.stops[fromIdx]?.placeId);
    if (from < 0 || toIdx < 0 || toIdx >= ordered.length) return;
    // Only reorder within the same day
    if ((ordered[from].day ?? 1) !== (ordered[toIdx].day ?? 1)) return;
    const copy = [...ordered];
    const [item] = copy.splice(from, 1);
    copy.splice(toIdx, 0, item);
    await persistDraft({ ...draft, stops: copy });
  };

  const updateStopField = async (
    idx: number,
    field: "visitTime" | "durationMinutes" | "personalNotes",
    value: string | number
  ) => {
    const copy = draft.stops.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    await persistDraft({ ...draft, stops: copy });
  };

  const downloadItineraryText = (
    docTitle: string,
    date: string,
    stops: Array<{
      placeName: string;
      visitTime?: string | null;
      durationMinutes: number;
      personalNotes?: string | null;
      day?: number;
    }>,
    refNum?: string
  ) => {
    const lines = [
      "PROJECT CEDO: TURI — MUNICIPALITY OF SALCEDO, ILOCOS SUR",
      "==============================================================",
      `Itinerary: ${docTitle}`,
      `Planned Travel Date: ${date}`,
      refNum ? `Official Reference Number: ${refNum}` : "Local Standalone Draft",
      "",
      "STOPS:",
      ...stops.map(
        (s, idx) =>
          `${(s.day ?? 1) > 1 || stops.some((x) => (x.day ?? 1) > 1) ? `Day ${s.day ?? 1} — ` : ""}${idx + 1}. ${s.placeName}${s.visitTime ? ` @ ${formatTime12h(s.visitTime)}` : ""} (${
            s.durationMinutes
          } mins)${s.personalNotes ? `\n   Notes: ${s.personalNotes}` : ""}`
      ),
      "",
      "Generated via Project CEDO: Turi (No account required)",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-salcedo-itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    void trackItineraryEvent({ eventType: "downloaded", stopCount: stops.length });
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (draft.stops.length === 0) {
      setSubmitError("Add at least one destination first.");
      return;
    }
    const errors: Record<string, string> = {};
    if (originMunicipality.trim().length < 2) errors.originMunicipality = "Enter your city or municipality.";
    if (originProvince.trim().length < 2) errors.originProvince = "Enter your province.";
    if (emailAddress.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress.trim())) errors.emailAddress = "Enter a valid email, or leave it blank.";
    if (!privacyAcknowledged) errors.privacy = "Please tick the Privacy Notice acknowledgement below.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmitError("Please fix the highlighted fields above.");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/itineraries/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itinerary: {
            title: draft.title.trim() || "My Salcedo Trip",
            plannedVisitDate: draft.plannedVisitDate,
            description: draft.description || null,
            stops: draft.stops.map((s, idx) => ({
              placeId: s.placeId,
              stopOrder: idx + 1,
              dayNumber: s.day ?? 1,
              visitTime: s.visitTime || null,
              durationMinutes: Number(s.durationMinutes) || 60,
              personalNotes: s.personalNotes || null,
            })),
          },
          visitor: {
            visitorName: visitorName.trim() || null,
            originMunicipality: originMunicipality.trim(),
            originProvince: originProvince.trim(),
            originCountry: originCountry.trim() || "Philippines",
            contactNumber: contactNumber.trim() || null,
            emailAddress: emailAddress.trim() || null,
            plannedVisitDate: draft.plannedVisitDate,
            travelerCount: Number(travelerCount) || 1,
            purposeOfVisit: purposeOfVisit || null,
            firstTimeVisitor,
            transportationType: transportationType || null,
            lengthOfStay: lengthOfStay || null,
            discoverySource: discoverySource || null,
            preferredExperience: preferredExperience || null,
            privacyAcknowledged: true,
            privacyNoticeVersion: privacyNotice.version,
            followUpConsentGiven,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Could not submit travel plan.");
        return;
      }

      setVisitorSubmittedRef(data.referenceNumber);
      // Always present the one-time code, including registrations made during review.
      setSubmissionResult({
          referenceNumber: data.referenceNumber,
          privateCode: data.privateCode,
          warning: data.warning,
          title: draft.title,
          plannedVisitDate: draft.plannedVisitDate,
          totalStops: draft.stops.length,
      });
      setRegisterSheetOpen(false);
      // Do not carry a previous visitor’s details or consent to the next submission.
      setVisitorName(""); setContactNumber(""); setEmailAddress("");
      setOriginMunicipality(""); setOriginProvince(""); setOriginCountry("Philippines"); setTravelerCount(1);
      setPurposeOfVisit(""); setTransportationType(""); setLengthOfStay(""); setDiscoverySource(""); setPreferredExperience("");
      setFirstTimeVisitor("prefer_not_to_say"); setPrivacyAcknowledged(false); setFollowUpConsentGiven(false);

      await saveLocalReceipt({
        referenceNumber: data.referenceNumber,
        title: draft.title,
        plannedVisitDate: draft.plannedVisitDate,
        totalStops: draft.stops.length,
        savedAt: new Date().toISOString(),
      });
      setLocalReceipts(await listLocalReceipts());
    } catch {
      setSubmitError("Network error while submitting plan.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRetrieveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setRetError(null);
    setDeleteSuccess(null);
    setRotatedCode(null);
    setConfirmingDelete(false);
    setRetLoading(true);
    setRetrieved(null);
    try {
      const res = await fetch("/api/itineraries/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceNumber: retRef.trim().toUpperCase(),
          privateCode: retCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRetrieved(null);
        setRetError(data.error || "Invalid reference number or private code.");
        return;
      }
      passReviews.clear();
      setRetrieved(data.itinerary);
      void trackItineraryEvent({
        eventType: "retrieved",
        stopCount: data.itinerary.totalStops,
      });
    } catch {
      setRetError("Network error while retrieving itinerary.");
    } finally {
      setRetLoading(false);
    }
  };

  const changePass = async (action: "rotate" | "delete") => {
    if (!retrieved || passBusy) return;
    if (
      action === "rotate" &&
      !window.confirm("Replace your private code? The old code will stop working immediately.")
    )
      return;
    setPassBusy(action);
    setRetError(null);
    try {
      const endpoint = action === "rotate" ? "access/rotate" : "delete";
      const res = await fetch(`/api/itineraries/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceNumber: retrieved.referenceNumber,
          privateCode: retCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRetError(data.error || "Your pass could not be updated.");
        return;
      }
      if (action === "rotate") {
        setRotatedCode(data.newPrivateCode);
        setRetCode(data.newPrivateCode);
        setSubmissionResult((prev) =>
          prev?.referenceNumber === retrieved.referenceNumber
            ? { ...prev, privateCode: data.newPrivateCode }
            : prev,
        );
        showToast("Save your new code. The previous one no longer works.", { tone: "success" });
      } else {
        await removeLocalReceipt(retrieved.referenceNumber);
        setLocalReceipts(await listLocalReceipts());
        if (visitorSubmittedRef === retrieved.referenceNumber) {
          setVisitorSubmittedRef(null);
          setSubmissionResult(null);
        }
        setRetrieved(null);
        setConfirmingDelete(false);
        setRetCode("");
        setRetRef("");
        setRotatedCode(null);
        passReviews.clear();
        setDeleteSuccess(data.message);
      }
    } catch {
      setRetError(
        "Could not confirm the change. Check your connection and retrieve the trip again.",
      );
    } finally {
      setPassBusy(null);
    }
  };

  function editCredentials(ref: string, code: string) {
    setRetRef(ref);
    setRetCode(code);
    setRetrieved(null);
    setRotatedCode(null);
    setRetError(null);
    setDeleteSuccess(null);
    setConfirmingDelete(false);
  }

  // Never offer an empty itinerary for editing while its persisted stops are still opening.
  if (notebookState === "opening") return (
    <div role="status" className="surface-card p-5 space-y-3">
      <p className="text-sm">Opening the trip notebook on this device…</p>
      <Skeleton className="h-4 w-1/3" /><Skeleton className="h-14 w-full" />
    </div>
  );
  if (notebookState === "error") return (
    <div role="alert" className="surface-card p-5 space-y-3">
      <p>Your trip notebook couldn’t be opened. Allow browser storage, then try again.</p>
      <button type="button" className="secondary-button" onClick={() => window.location.reload()}>Try again</button>
    </div>
  );

  const inReview = view === "review" && draft.status !== "completed";

  return (
    <div className="space-y-5">
      <nav className="planner-tabs no-print" aria-label="Trip notebook sections">
        {([{ id: "builder", label: "Itinerary", icon: RouteIcon, count: draft.stops.length }, { id: "saved", label: "Saved", icon: Bookmark, count: savedPlaces.length }, { id: "retrieve", label: "Find my trip", icon: KeyRound, count: 0 }] as const).map(({ id, label, icon: Icon, count }) => (
          <button key={id} type="button" aria-pressed={activeTab === id} onClick={() => setActiveTab(id)}><Icon size={16}/>{label}{count > 0 && <span>{count}</span>}</button>
        ))}
      </nav>

      {/* TAB 1: NATIVE TIMELINE TRIP BUILDER */}
      {activeTab === "builder" && (
        <div className="space-y-4">
          {completionNotice && draft.stops.length === 0 && !submissionResult && (
            <div className="surface-card p-5 space-y-3 border-[#164237]/25 bg-[#164237]/[0.04]">
              <p className="text-xs leading-relaxed text-[#164237] inline-flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-px" />
                <span>{completionNotice}</span>
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setActiveTab("saved")} className="rounded-full bg-white border border-[#164237]/25 px-4 min-h-[40px] text-xs font-semibold text-[#164237] cursor-pointer">
                  View finished trips
                </button>
                <button type="button" onClick={() => setCompletionNotice(null)} className="rounded-full px-4 min-h-[40px] text-xs font-semibold text-[#616E69] cursor-pointer">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {submissionResult ? (
            <div className="surface-card p-5 space-y-4">
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#164237]">
                  Official CEDO Trip Pass
                </p>
                <h2 className="font-display text-lg font-bold text-[#1A2421]">
                  {submissionResult.title}
                </h2>
                <p className="text-xs text-[#616E69] tabular-nums">
                  {submissionResult.plannedVisitDate} • {submissionResult.totalStops} stops
                </p>
              </div>

              <div className="inset-panel divide-y divide-[#EAE7E0]">
                <div className="p-3.5">
                  <p className="text-[10px] uppercase tracking-wider text-[#616E69]">
                    Reference Number
                  </p>
                  <p className="font-mono text-base font-bold text-[#164237] select-all">
                    {submissionResult.referenceNumber}
                  </p>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-[#616E69]">
                      One-Time Private Retrieval Code
                    </p>
                    <p className="font-mono text-sm font-bold text-[#1A2421] select-all break-all">
                      {submissionResult.privateCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Copy reference number and private code"
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(
                        `Reference: ${submissionResult.referenceNumber}\nPrivate Code: ${submissionResult.privateCode}`
                      );
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                      } catch { showToast("Copy isn’t available here. Download the receipt to keep both codes.", { tone: "info" }); }
                    }}
                    className="rounded-full bg-white border border-[#EAE7E0] p-2 text-[#1A2421] shrink-0 active:scale-90 transition cursor-pointer"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-[#164237]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <p className="rounded-xl bg-[#F3F2EE] p-3 text-xs text-[#1A2421]">
                {submissionResult.warning}
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const txt = `PROJECT CEDO: TURI APP — TRIP RECEIPT\nTitle: ${submissionResult.title}\nDate: ${submissionResult.plannedVisitDate}\nReference Number: ${submissionResult.referenceNumber}\nPrivate Code: ${submissionResult.privateCode}`;
                    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${submissionResult.referenceNumber}-receipt.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full btn-primary-pro py-3 text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Receipt (.txt)
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      editCredentials(submissionResult.referenceNumber, submissionResult.privateCode);
                      setActiveTab("retrieve");
                    }}
                    className="rounded-full border border-[#EAE7E0] bg-white py-2.5 text-xs font-semibold text-[#1A2421] cursor-pointer"
                  >
                    Manage Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionResult(null);
                    }}
                    className="rounded-full border border-[#EAE7E0] bg-white py-2.5 text-xs font-medium text-[#616E69] cursor-pointer"
                  >
                    Continue my trip
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Native Trip Header Card */}
              <div className={`surface-card p-5 space-y-3 ${inReview ? "hidden" : ""}`}>
                <div className="space-y-2">
                  <label className="draft-name-label" htmlFor="draft-title">Itinerary name</label>
                  <input
                    id="draft-title"
                    type="text"
                    value={draft.title}
                    onChange={(e) => void persistDraft({ ...draft, title: e.target.value })}
                    className="w-full font-display text-3xl font-medium text-[#1A2421] bg-transparent focus:outline-none border-b border-transparent focus:border-[#EAE7E0] pb-0.5"
                  />

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#616E69]">
                    <span className="draft-summary">
                      <Clock className="w-3 h-3" />
                      {draft.stops.length} {draft.stops.length === 1 ? "stop" : "stops"}{draft.stops.length>0 ? ` · ${formatDuration(totalMinutes)}` : ""}
                      {totalDistanceKm > 0 ? ` • ${totalDistanceKm} km` : ""}
                    </span>
                  </div>
                </div>


              </div>


              {/* Native Vertical Route Timeline — STEP 1 comes first, physically */}
              {draft.stops.length > 0 && !inReview && (
                <section id="trip-destinations" className="surface-card p-5 space-y-3 scroll-mt-3">
                  <StepHeader
                    step={1}
                    eyebrow="Destinations"
                    title={
                      showAllDays || tripDaysCount <= 1
                        ? `Your destinations (${draft.stops.length})`
                        : `Day ${focusedDay} of ${tripDaysCount} (${visibleStops.length} ${visibleStops.length === 1 ? "stop" : "stops"})`
                    }
                    description={
                      showAllDays || tripDaysCount <= 1
                        ? "Added from Discover. Assign each one to a day."
                        : `${dateForDay(focusedDay)}${daySummary(focusedDay) ? ` · ${daySummary(focusedDay)!.range}` : ""} — reorder, set times, or move stops between days.`
                    }
                    action={
                      !showAllDays && tripDaysCount > 1 ? (
                        <div className="flex items-center gap-1">
                          <button type="button" disabled={focusedDay <= 1} onClick={() => setActiveDay(focusedDay - 1)} aria-label="Previous day" className="w-10 h-10 rounded-full bg-white border border-[#EAE7E0] flex items-center justify-center disabled:opacity-30 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                          <button type="button" disabled={focusedDay >= tripDaysCount} onClick={() => setActiveDay(focusedDay + 1)} aria-label="Next day" className="w-10 h-10 rounded-full bg-white border border-[#EAE7E0] flex items-center justify-center disabled:opacity-30 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                      ) : undefined
                    }
                  />
                  {visibleStops.map(({ s, origIdx: idx, day, dayIndex }) => (
                    <React.Fragment key={s.placeId}>
                    {dayIndex === 1 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="rounded-full bg-[#164237] text-white px-3 py-1 text-[11px] font-bold">Day {day}{dateForDay(day) ? ` • ${dateForDay(day)}` : ""}</span>
                        <span className="text-[11px] text-[#616E69] tabular-nums">{displayStops.filter((x) => x.day === day).length} stops{daySummary(day) ? ` · ${daySummary(day)!.range}` : ""}</span>
                        <span className="flex-1 h-px bg-[#EAE7E0]" />
                      </div>
                    )}
                    <div className="relative flex gap-2.5">
                      {/* Vertical Route Track */}
                      <div className="flex flex-col items-center pt-3">
                        <span className="w-6 h-6 rounded-full bg-[#164237] text-white text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums z-10">
                          {dayIndex}
                        </span>
                        {displayStops.findIndex((x) => x.s.placeId === s.placeId) < displayStops.length - 1 && displayStops[displayStops.findIndex((x) => x.s.placeId === s.placeId) + 1]?.day === day && (
                          <div className="w-px flex-1 border-l-2 border-dashed border-[#D8D3C8] my-1" />
                        )}
                      </div>

                      {/* Stop Card — collapsed by default: photo, name, time. Tap Edit for the rest. */}
                      <div className="flex-1 min-w-0 inset-panel px-4 py-3.5">
                        {(() => {
                          const dispIdx = displayStops.findIndex((x) => x.s.placeId === s.placeId);
                          const canUp = dispIdx > 0 && displayStops[dispIdx - 1].day === day;
                          const canDown = dispIdx >= 0 && dispIdx < displayStops.length - 1 && displayStops[dispIdx + 1].day === day;
                          const expanded = expandedStopId === s.placeId;
                          return (
                            <>
                              <div className="flex items-center gap-3">
                                <PlaceThumbnail place={s} width={44} height={44} className="stop-thumb" />
                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={`/app/places/${s.placeSlug}`}
                                    className="font-display font-bold text-[13px] text-[#1A2421] line-clamp-1 hover:text-[#164237]"
                                  >
                                    {s.placeName}
                                  </Link>
                                  <p className="text-[11px] text-[#616E69] truncate">
                                    {s.barangayName ? `Brgy. ${s.barangayName}` : s.placeType}
                                  </p>
                                  <p className="text-[11px] font-semibold text-[#164237] tabular-nums mt-0.5 inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime12h(s.visitTime)} – {formatTime12h(endTimeFor(s.visitTime, s.durationMinutes))}
                                    <span className="font-normal text-[#616E69]">· {formatDuration(s.durationMinutes || 60)}</span>
                                    {tripDaysCount > 1 && <span className="font-normal text-[#616E69]">· Day {day}</span>}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setExpandedStopId(expanded ? null : s.placeId)}
                                  aria-expanded={expanded}
                                  aria-label={expanded ? `Close details for ${s.placeName}` : `Edit ${s.placeName}`}
                                  className="no-print shrink-0 inline-flex items-center gap-1 rounded-full bg-[#FAF9F6] border border-[#EAE7E0] pl-3 pr-2.5 min-h-[36px] text-[11px] font-semibold text-[#164237] active:scale-95 transition cursor-pointer"
                                >
                                  {expanded ? "Done" : "Edit"}
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                                </button>
                              </div>

                              {expanded && (
                                <div className="mt-3 space-y-3 rounded-2xl bg-white border border-[#EAE7E0] p-3">
                                  {tripDaysCount > 1 && (
                                    <div>
                                      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[#616E69] mb-1.5">Assigned to</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {Array.from({ length: tripDaysCount }, (_, i) => i + 1).map((d) => (
                                          <button
                                            key={d}
                                            type="button"
                                            onClick={() => { void setStopDay(idx, d); setActiveDay(d); }}
                                            aria-pressed={day === d}
                                            className={`rounded-full px-3 min-h-[36px] text-[11px] font-bold border cursor-pointer ${day === d ? "bg-[#164237] text-white border-[#164237]" : "bg-white text-[#1A2421] border-[#EAE7E0]"}`}
                                          >
                                            Day {d}{dateForDay(d) ? ` · ${dateForDay(d)}` : ""}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex items-end gap-2">
                                    <label className="flex-1 min-w-0">
                                      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[#616E69] mb-1">Arrive at</span>
                                      <input
                                        type="time"
                                        value={s.visitTime}
                                        onChange={(e) => void updateStopField(idx, "visitTime", e.target.value)}
                                        aria-label={`Arrival time at ${s.placeName}`}
                                        className="w-full rounded-lg border border-[#EAE7E0] bg-white px-2.5 py-2 text-xs font-semibold tabular-nums focus:outline-none focus:border-[#164237] focus:ring-[3px] focus:ring-[#164237]/10 min-h-[40px]"
                                      />
                                    </label>
                                    <div className="text-center shrink-0 pb-1">
                                      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[#616E69] mb-1">Leave</span>
                                      <span className="text-xs font-bold text-[#164237] tabular-nums">{formatTime12h(endTimeFor(s.visitTime, s.durationMinutes))}</span>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[#616E69] mb-1.5">Stay for</span>
                                    <div className="grid grid-cols-3 gap-1.5">
                                      {DURATION_PRESETS.map((mins) => (
                                        <button key={mins} type="button" onClick={() => void updateStopField(idx, "durationMinutes", mins)}
                                          aria-pressed={s.durationMinutes === mins}
                                          className={`rounded-lg py-2 min-h-[40px] text-[11px] font-semibold border cursor-pointer ${s.durationMinutes === mins ? "bg-[#164237] text-white border-[#164237]" : "bg-white text-[#616E69] border-[#EAE7E0]"}`}>
                                          {formatDuration(mins)}
                                        </button>
                                      ))}
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-white border border-[#EAE7E0] px-1.5 py-1.5">
                                      <button type="button" aria-label="Shorter stay" disabled={(s.durationMinutes || 60) <= 15} onClick={() => void updateStopField(idx, "durationMinutes", Math.max(15, (s.durationMinutes || 60) - 15))}
                                        className="w-9 h-9 rounded-full bg-[#FAF9F6] border border-[#EAE7E0] flex items-center justify-center disabled:opacity-30 cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                                      <span className="flex-1 text-center text-xs font-bold text-[#1A2421] tabular-nums">{formatDuration(s.durationMinutes || 60)} <span className="font-medium text-[#616E69]">stay</span></span>
                                      <button type="button" aria-label="Longer stay" disabled={(s.durationMinutes || 60) >= MAX_STAY_MINUTES} onClick={() => void updateStopField(idx, "durationMinutes", Math.min(MAX_STAY_MINUTES, (s.durationMinutes || 60) + 15))}
                                        className="w-9 h-9 rounded-full bg-[#164237] text-white flex items-center justify-center disabled:opacity-30 cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                                    </div>
                                    <p className="mt-1 text-[10px] text-[#616E69]">Need longer? Keep tapping + — up to 12 hours at one destination.</p>
                                  </div>

                                  {issuesByIndex.get(idx) && (
                                    <p className={`rounded-lg px-2.5 py-2 text-[11px] ${issuesByIndex.get(idx)!.kind === "overlap" ? "bg-rose-50 text-rose-800 border border-rose-200" : "bg-amber-50 text-amber-900 border border-amber-200"}`}>
                                      <span className="inline-flex items-start gap-1"><TriangleAlert className="w-3 h-3 mt-px shrink-0" />{issuesByIndex.get(idx)!.message}</span>
                                      {issuesByIndex.get(idx)!.suggestedTime && (
                                        <button type="button" onClick={() => void updateStopField(idx, "visitTime", issuesByIndex.get(idx)!.suggestedTime!)}
                                          className="ml-1 font-bold underline cursor-pointer">Use {formatTime12h(issuesByIndex.get(idx)!.suggestedTime)}</button>
                                      )}
                                    </p>
                                  )}

                                  <input
                                    type="text"
                                    value={s.personalNotes}
                                    onChange={(e) => void updateStopField(idx, "personalNotes", e.target.value)}
                                    placeholder="Note for this stop (e.g. bring swimwear)…"
                                    aria-label={`Notes for ${s.placeName}`}
                                    className="w-full rounded-lg border border-[#EAE7E0] bg-white px-2.5 py-2 text-[11px] focus:outline-none focus:border-[#164237] focus:ring-[3px] focus:ring-[#164237]/10 min-h-[40px]"
                                  />

                                  <div className="no-print flex items-center gap-1.5 pt-0.5">
                                    <button type="button" onClick={() => void moveStop(idx, dispIdx - 1)} disabled={!canUp}
                                      className="inline-flex items-center gap-1 rounded-full bg-white border border-[#EAE7E0] px-3 min-h-[36px] text-[11px] font-semibold text-[#1A2421] disabled:opacity-30 cursor-pointer">
                                      <ArrowUp className="w-3.5 h-3.5" /> Earlier
                                    </button>
                                    <button type="button" onClick={() => void moveStop(idx, dispIdx + 1)} disabled={!canDown}
                                      className="inline-flex items-center gap-1 rounded-full bg-white border border-[#EAE7E0] px-3 min-h-[36px] text-[11px] font-semibold text-[#1A2421] disabled:opacity-30 cursor-pointer">
                                      <ArrowDown className="w-3.5 h-3.5" /> Later
                                    </button>
                                    <span className="flex-1" />
                                    <button type="button"
                                      onClick={() => void persistDraft({ ...draft, stops: draft.stops.filter((_, i) => i !== idx) })}
                                      className="inline-flex items-center gap-1 rounded-full bg-white border border-rose-200 px-3 min-h-[36px] text-[11px] font-semibold text-rose-700 cursor-pointer">
                                      <Trash2 className="w-3.5 h-3.5" /> Remove
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    </React.Fragment>
                  ))}

                  {/* Focused day with nothing assigned yet */}
                  {!showAllDays && tripDaysCount > 1 && visibleStops.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-[#D8D3C8] bg-white/70 p-5 text-center space-y-2">
                      <p className="font-display text-sm font-bold text-[#1A2421]">Day {focusedDay} is still empty</p>
                      <p className="text-[11px] text-[#616E69]">Add destinations to {dateForDay(focusedDay) || `Day ${focusedDay}`}, or move a stop here from another day.</p>
                      <button type="button" onClick={() => setStopPickerOpen(true)} className="inline-flex items-center gap-1.5 rounded-full btn-primary-pro px-4 py-2.5 text-xs font-semibold active:scale-95 transition cursor-pointer min-h-[40px]">
                        <Plus className="w-3.5 h-3.5" /> Add to Day {focusedDay}
                      </button>
                    </div>
                  )}

                  {/* Empty days stay visible in the overview so nothing gets forgotten */}
                  {showAllDays && tripDaysCount > 1 &&
                    Array.from({ length: tripDaysCount }, (_, i) => i + 1)
                      .filter((d) => !daySummary(d))
                      .map((d) => (
                        <button key={d} type="button" onClick={() => { setActiveDay(d); setShowAllDays(false); }} className="w-full flex items-center gap-2 rounded-xl border border-dashed border-[#D8D3C8] bg-white/60 px-3 py-2.5 text-left cursor-pointer min-h-[44px]">
                          <span className="rounded-full bg-[#EFECE5] text-[#616E69] px-2.5 py-0.5 text-[11px] font-bold">Day {d}</span>
                          <span className="text-[11px] text-[#616E69] tabular-nums">{dateForDay(d)}</span>
                          <span className="flex-1 text-[11px] text-[#616E69]">No stops yet</span>
                          <span className="text-[11px] font-semibold text-[#164237]">Plan →</span>
                        </button>
                      ))}
                </section>
              )}

              {/* STEP 2: Plan your days — start date, how many days, what falls on each day */}
              {draft.stops.length > 0 && (
              <section className={`no-print surface-card p-5 space-y-3 ${inReview ? "hidden" : ""}`}>
                <StepHeader
                  step={2}
                  eyebrow="Plan"
                  title="Plan your days"
                  description="Pick a start date and trip length. Tap a day to jump up to its destinations and arrange them."
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F6] border border-[#EAE7E0] px-3 py-1.5 cursor-pointer min-h-[40px]">
                    <Calendar className="w-3.5 h-3.5 text-[#164237]" />
                    <span className="text-[11px] font-semibold text-[#616E69]">Starts</span>
                    <input
                      type="date"
                      value={draft.plannedVisitDate}
                      onChange={(e) => void persistDraft({ ...draft, plannedVisitDate: e.target.value })}
                      aria-label="Trip start date"
                      className="bg-transparent text-xs font-semibold text-[#1A2421] focus:outline-none tabular-nums"
                    />
                  </label>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F6] border border-[#EAE7E0] pl-3 pr-1 py-1 min-h-[40px]">
                    <span className="text-[11px] font-semibold text-[#1A2421]">{tripDaysCount} {tripDaysCount === 1 ? "day" : "days"}</span>
                    <button type="button" aria-label="One day less" onClick={() => { const n = Math.max(1, tripDaysCount - 1); void persistDraft({ ...draft, numberOfDays: n, stops: draft.stops.map((s) => ({ ...s, day: Math.min(s.day ?? 1, n) })) }); }} className="w-7 h-7 rounded-full bg-white border border-[#EAE7E0] flex items-center justify-center cursor-pointer"><Minus className="w-3 h-3" /></button>
                    <button type="button" aria-label="Add a day" onClick={() => void persistDraft({ ...draft, numberOfDays: Math.min(14, tripDaysCount + 1) })} className="w-7 h-7 rounded-full bg-[#164237] text-white flex items-center justify-center cursor-pointer"><Plus className="w-3 h-3" /></button>
                  </span>
                  {tripDaysCount > 1 && dateForDay(tripDaysCount) && (
                    <span className="text-[11px] text-[#616E69] tabular-nums">Ends {dateForDay(tripDaysCount)}</span>
                  )}
                </div>
                {tripDaysCount > 1 && (
                  <>
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist" aria-label="Plan by day">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={showAllDays}
                        onClick={() => { setShowAllDays(true); jumpToDestinations(); }}
                        className={`shrink-0 rounded-xl border px-3 py-2 text-left cursor-pointer min-w-[92px] min-h-[48px] ${showAllDays ? "border-[#164237] bg-[#164237] text-white" : "border-[#EAE7E0] bg-[#FAF9F6]"}`}
                      >
                        <span className="block text-[11px] font-bold">All days</span>
                        <span className={`block text-[10px] tabular-nums ${showAllDays ? "text-white/75" : "text-[#616E69]"}`}>{tripDaysCount} days · {draft.stops.length} stops</span>
                      </button>
                      {Array.from({ length: tripDaysCount }, (_, i) => i + 1).map((d) => {
                        const summary = daySummary(d);
                        const isActive = !showAllDays && focusedDay === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => { setActiveDay(d); setShowAllDays(false); jumpToDestinations(); }}
                            className={`shrink-0 rounded-xl border px-3 py-2 text-left cursor-pointer min-w-[92px] min-h-[48px] ${isActive ? "border-[#164237] bg-[#164237] text-white" : "border-[#EAE7E0] bg-[#FAF9F6]"}`}
                          >
                            <span className="block text-[11px] font-bold">Day {d}</span>
                            <span className={`block text-[10px] tabular-nums ${isActive ? "text-white/75" : "text-[#616E69]"}`}>
                              {dateForDay(d) ?? ""} · {summary ? `${summary.count} ${summary.count === 1 ? "stop" : "stops"}` : "No stops"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[#616E69]">
                      {showAllDays
                        ? "Overview of every day. Tap a day to jump to its destinations above."
                        : `Planning Day ${focusedDay}${dateForDay(focusedDay) ? ` (${dateForDay(focusedDay)})` : ""} — its destinations are shown above; new ones are added to this day.`}
                    </p>
                  </>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#EAE7E0]">
                  {scheduleIssues.total > 0 ? (
                    <p className="flex-1 min-w-[180px] text-[11px] text-amber-900 inline-flex items-start gap-1"><TriangleAlert className="w-3.5 h-3.5 mt-px shrink-0" />{scheduleIssues.total} timing {scheduleIssues.total === 1 ? "issue" : "issues"} — fix on the stop, or auto-arrange.</p>
                  ) : (
                    <p className="flex-1 min-w-[180px] text-[11px] text-[#616E69]">Times look good. You can also let us arrange them for you.</p>
                  )}
                  <button type="button" onClick={() => void applySuggestedSchedule()}
                    className="inline-flex items-center gap-1 rounded-full bg-[#164237]/5 border border-[#164237]/20 px-3 min-h-[36px] text-[11px] font-semibold text-[#164237] cursor-pointer active:scale-95 transition">
                    <Wand2 className="w-3.5 h-3.5" /> Auto-arrange times
                  </button>
                </div>
              </section>
              )}

              {draft.stops.length > 0 && !inReview && (
                <div className="no-print flex items-center justify-center gap-2">
                  <button type="button" onClick={() => downloadItineraryText(draft.title, draft.plannedVisitDate, draft.stops)} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#EAE7E0] px-4 min-h-[40px] text-xs font-semibold text-[#1A2421] active:scale-95 transition cursor-pointer">
                    <Download className="w-3.5 h-3.5" /> Save trip file
                  </button>
                  <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#EAE7E0] px-4 min-h-[40px] text-xs font-semibold text-[#1A2421] active:scale-95 transition cursor-pointer">
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>
              )}

              {/* STEP 3: Finish & review — its own focused mode after going */}
              {draft.stops.length > 0 && (inReview || draft.status === "completed") && (
                <section className="no-print surface-card p-5 space-y-3">
                  {inReview && draft.status !== "completed" && (
                    <button type="button" onClick={() => setView("plan")} className="inline-flex items-center gap-1 text-xs font-semibold text-[#164237] cursor-pointer min-h-[36px]">
                      <ChevronLeft className="w-4 h-4" /> Back to plan
                    </button>
                  )}
                  <StepHeader
                    step={3}
                    eyebrow="Final step"
                    title={draft.status === "completed" ? "Trip finished" : "Finish your trip"}
                    description={
                      draft.status === "completed"
                        ? "Thank you — your reviews help the next tourists and Salcedo's rankings."
                        : "Mark the stops you visited. Ratings, comments, and registration are optional."
                    }
                  />

                  {draft.status === "completed" ? (
                    <div className="space-y-2.5">
                      <p className="rounded-xl bg-[#164237]/5 border border-[#164237]/15 p-3 text-xs text-[#164237] inline-flex items-start gap-2 w-full">
                        <Check className="w-4 h-4 shrink-0 mt-px" />
                        <span>{completionNotice ?? "This trip is finished and counted. Agyaman kami!"}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleStartNewTrip()}
                        className="w-full rounded-full btn-primary-pro py-3.5 text-xs font-semibold active:scale-[0.98] transition cursor-pointer min-h-[44px]"
                      >
                        Start a New Trip
                      </button>
                      <p className="text-[11px] text-[#616E69] text-center">This finished trip stays saved under Saved → Local Drafts.</p>
                    </div>
                  ) : !(reviewOpen || tripIsDue) ? (
                    <>
                      <p className="text-xs text-[#616E69] leading-relaxed">
                        Still planning? No rush — this step unlocks when your trip date arrives. If you finish early, you can review right away.
                      </p>
                      <button
                        type="button"
                        onClick={() => setReviewOpen(true)}
                        className="w-full rounded-full border border-[#164237]/30 bg-white py-3 text-xs font-semibold text-[#164237] active:scale-[0.98] transition cursor-pointer"
                      >
                        Finish trip &amp; review places
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2.5">
                        {draft.stops.map((s) => {
                          const visited = visitedStops[s.placeId] ?? true;
                          const rating = stopRatings[s.placeId] ?? draft.ratings?.[s.placeId] ?? 0;
                          const comment = stopComments[s.placeId] ?? "";
                          const showComment = commentOpen[s.placeId] ?? comment.length > 0;
                          return (
                            <div key={s.placeId} className="inset-panel p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-display text-[13px] font-bold text-[#1A2421] truncate">{s.placeName}</p>
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#164237] cursor-pointer shrink-0 min-h-[32px]">
                                  <input type="checkbox" checked={visited} onChange={(e) => setVisitedStops((v) => ({ ...v, [s.placeId]: e.target.checked }))} className="w-4 h-4 accent-[#164237]" />
                                  Visited
                                </label>
                              </div>

                              {visited && (
                                <>
                                  <div className="flex items-center gap-1" role="group" aria-label={`Rate ${s.placeName}`}>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <button key={n} type="button" onClick={() => setStopRatings((r) => ({ ...r, [s.placeId]: n }))} aria-label={`${n} stars`} aria-pressed={rating === n} className="p-1 active:scale-90 transition cursor-pointer">
                                        <Star className={`w-7 h-7 ${n <= rating ? "text-[#B88A44]" : "text-[#D8D3C8]"}`} fill={n <= rating ? "currentColor" : "none"} />
                                      </button>
                                    ))}
                                    <span className="text-[11px] font-semibold text-[#616E69] ml-1">{rating ? `${rating} of 5` : "Tap to rate"}</span>
                                  </div>

                                  {showComment ? (
                                    <div className="space-y-1">
                                      <textarea
                                        value={comment}
                                        onChange={(e) => setStopComments((c) => ({ ...c, [s.placeId]: e.target.value }))}
                                        rows={3}
                                        maxLength={500}
                                        autoFocus={commentOpen[s.placeId] && comment.length === 0}
                                        placeholder="Leave a comment — tips, best time to visit, what to bring…"
                                        aria-label={`Comment for ${s.placeName}`}
                                        className="w-full rounded-xl border border-[#EAE7E0] bg-white px-3 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:border-[#164237] focus:ring-[3px] focus:ring-[#164237]/10"
                                      />
                                      <p className="text-right text-[10px] text-[#616E69] tabular-nums">{comment.length}/500</p>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setCommentOpen((o) => ({ ...o, [s.placeId]: true }))}
                                      className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#EAE7E0] px-3 py-2 text-[11px] font-semibold text-[#164237] active:scale-95 transition cursor-pointer min-h-[36px]"
                                    >
                                      <MessageSquarePlus className="w-3.5 h-3.5" />
                                      Leave a comment instead
                                    </button>
                                  )}
                                  <p className="text-[10px] text-[#616E69]">Stars, a comment, or both — either one counts as your review.</p>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {completionNotice && (
                        <p role="status" className="rounded-xl bg-[#F3F2EE] p-3 text-xs text-[#164237]">{completionNotice}</p>
                      )}
                      <div className="inset-panel p-3.5 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#616E69]">Your details · Visitor form (optional)</p>
                        {visitorSubmittedRef ? (
                          <p className="text-xs text-[#164237] inline-flex items-start gap-1.5">
                            <Check className="w-4 h-4 shrink-0 mt-px" />
                            <span>Visitor form submitted — Reference <strong className="font-mono">{visitorSubmittedRef}</strong>. Your travel plan has been recorded.</span>
                          </p>
                        ) : (
                          <>
                            <p className="text-xs leading-relaxed text-[#616E69]">Share your travel plan with the tourism office and get a private retrieval code. You can finish your trip without registering.</p>
                            <button type="button" onClick={() => setRegisterSheetOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#164237]/30 px-4 min-h-[40px] text-xs font-semibold text-[#164237] active:scale-95 transition cursor-pointer">
                              <Send className="w-3.5 h-3.5" /> Fill the visitor form
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={completing}
                        onClick={() => void handleCompleteLocalTrip()}
                        className="w-full rounded-full btn-primary-pro py-3.5 text-xs font-semibold disabled:opacity-50 active:scale-[0.98] transition cursor-pointer min-h-[44px]"
                      >
                        {completing ? "Saving…" : "Finish Trip — Save Reviews & Done"}
                      </button>
                      <p className="text-[10px] text-[#616E69] text-center">Finishing clears this trip from your planner, ready for the next one.</p>
                    </>
                  )}
                </section>
              )}

              {draft.stops.length === 0 && (
                <div className="trip-start surface-card">
                  <div className="trip-start-head"><div><h2>Choose your first stop</h2><p>{routeOptions.nature.length||routeOptions.heritage.length ? "Add destinations yourself or start with a suggested route." : "Choose destinations from the place directory."}</p></div><button type="button" className="primary-button" onClick={()=>setStopPickerOpen(true)}><Plus size={16}/>Choose stops</button></div>
                  {(Object.keys(routeOptions) as Array<keyof typeof routeOptions>).filter(key=>routeOptions[key].length>0).map(key=><button className="route-option" key={key} onClick={()=>void applyQuickPreset(key)}>
                    <PlaceThumbnail place={routeOptions[key][0]} width={64} height={50}/>
                    <span><strong>{key==='nature'?'Falls & springs':'Heritage & dining'}</strong><small>{routeOptions[key].map(p=>p.name.split(' (')[0]).join(' · ')}</small></span><span className="route-count">{routeOptions[key].length} {routeOptions[key].length===1?'stop':'stops'}</span><ChevronRight size={16}/>
                  </button>)}
                  <Link className="text-link" href="/app/discover">Browse place directory <ArrowRight size={14}/></Link>
                </div>
              )}

              {/* One sticky action dock for plan mode: Add + the single next step */}
              {draft.stops.length > 0 && !inReview && draft.status !== "completed" && (
                <div className="trip-action-dock no-print sticky bottom-3 z-30 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md border border-[#EAE7E0] shadow-[0_16px_40px_-16px_rgba(22,66,55,0.35)] p-1.5">
                  <button
                    type="button"
                    onClick={() => setStopPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F6] border border-[#EAE7E0] px-4 min-h-[44px] text-xs font-semibold text-[#164237] active:scale-95 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    {tripDaysCount > 1 ? `Day ${focusedDay}` : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setReviewOpen(true); setView("review"); }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full btn-primary-pro px-4 min-h-[44px] text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    Finish &amp; Review Trip
                  </button>
                </div>
              )}

            </>
          )}
        </div>
      )}

      {/* TAB 2: SAVED PLACES & DRAFTS */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          <div className="surface-card p-5 space-y-3">
            <SectionHeader eyebrow="Offline" title={`Bookmarked places (${savedPlaces.length})`} />
            {savedPlaces.length === 0 ? (
              <p className="text-xs text-[#616E69]">
                Bookmark a destination to keep it here for later. <Link className="text-link" href="/app/discover">Find places <ArrowRight size={13}/></Link>
              </p>
            ) : (
              <div className="divide-y divide-[#EAE7E0]">
                {savedPlaces.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 py-2.5">
                    <Link
                      href={`/app/places/${p.slug}`}
                      className="saved-place-row"
                    >
                      <PlaceThumbnail place={p} width={70} height={50} />
                      <span>{p.name}<small>{p.barangay?.name || "Salcedo"}</small></span>
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleBookmark(p.id, p.name);
                        setSavedPlaceIds(await listSavedPlaceIds());
                        await refreshCounts();
                      }}
                      className="text-[11px] font-medium text-[#616E69] hover:text-rose-700 cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="surface-card p-5 space-y-3">
            <SectionHeader eyebrow="On this device" title={`Local drafts (${drafts.length})`} />
            {drafts.length === 0 ? (
              <p className="text-xs text-[#616E69]">No drafts saved yet.</p>
            ) : (
              <div className="divide-y divide-[#EAE7E0]">
                {drafts.map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-xs text-[#1A2421] truncate">
                        {d.title}
                      </p>
                      <p className="text-[11px] text-[#616E69] tabular-nums">
                        {d.stops.length} stops • {d.plannedVisitDate}
                        {d.status === "completed" && (
                          <span className="ml-1.5 rounded-full bg-[#164237]/10 text-[#164237] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide">Finished</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {d.status !== "completed" && (
                        <button
                          type="button"
                          onClick={async () => {
                            await persistDraft(d);
                            setActiveDay(1); setView("plan"); setReviewOpen(false); setSubmissionResult(null); setVisitorSubmittedRef(null); draftReviews.clear();
                            setActiveTab("builder");
                          }}
                          className="rounded-full bg-[#164237] text-white px-3 py-1 text-[11px] font-semibold cursor-pointer"
                        >
                          Resume
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`Delete “${d.title}” from this device? This cannot be undone.`)) return;
                          await deleteLocalDraft(d.id);
                          const remaining = await listLocalDrafts();
                          setDrafts(remaining);
                          if (d.id === draft.id) setDraft(remaining.find(item => item.status !== "completed") ?? createEmptyDraft());
                          await refreshCounts();
                        }}
                        aria-label="Delete draft"
                        className="p-1.5 text-[#616E69] hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RETRIEVE & MANAGE PASS */}
      {activeTab === "retrieve" && (
        <div className="space-y-4">
          {localReceipts.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#EAE7E0] divide-y divide-[#EAE7E0] overflow-hidden">
              <p className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#616E69] bg-[#FAF9F6]">
                Recent Reference Numbers
              </p>
              {localReceipts.map((r) => (
                <button
                  key={r.referenceNumber}
                  type="button"
                  onClick={() => editCredentials(r.referenceNumber, retRef === r.referenceNumber ? retCode : "")}
                  className="w-full px-4 py-3 text-left active:bg-[#F3F2EE] flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-[#164237]">
                      {r.referenceNumber}
                    </p>
                    <p className="text-xs text-[#1A2421] truncate">{r.title}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#164237]">Fill →</span>
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleRetrieveTrip}
            className="no-print surface-card p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#164237]" />
              <h2 className="font-display text-sm font-bold text-[#1A2421]">
                Retrieve Submitted Trip
              </h2>
            </div>

            <label htmlFor="trip-reference" className="block text-sm font-semibold">Reference number</label>
            <input
              id="trip-reference"
              type="text"
              required
              value={retRef}
              onChange={(e) => editCredentials(e.target.value.toUpperCase(), retCode)}
              placeholder="CEDO-TRIP-YYYY-XXXXXX"
              className="field-pro font-mono uppercase"
            />
            <label htmlFor="retrieval-code" className="block text-sm font-semibold">Private retrieval code</label>
            <input
              id="retrieval-code"
              autoComplete="off"
              type="password"
              required
              value={retCode}
              onChange={(e) => editCredentials(retRef, e.target.value)}
              placeholder="SALCEDO-XXXX-XXXX-XXXX"
              className="field-pro font-mono"
            />

            {retError && (
              <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                {retError}
              </p>
            )}
            {deleteSuccess && (
              <p role="status" className="rounded-xl bg-[#F3F2EE] p-3 text-xs text-[#164237]">
                {deleteSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={retLoading || completing || Boolean(passBusy)}
              className="w-full rounded-full btn-primary-pro py-3 text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
            >
              {retLoading ? "Verifying..." : "Retrieve Itinerary"}
            </button>
          </form>

          {retrieved && (
            <div className="surface-card p-5 space-y-4">
              <div>
                <p className="font-mono text-[11px] font-bold text-[#164237]">
                  {retrieved.referenceNumber}
                </p>
                <h3 className="font-display text-base font-bold text-[#1A2421]">
                  {retrieved.title}
                </h3>
                <p className="text-xs text-[#616E69] tabular-nums">
                  {retrieved.plannedVisitDate} • {retrieved.totalStops} stops
                </p>
              </div>

              {rotatedCode && (
                <div className="rounded-xl bg-[#F3F2EE] p-3 text-xs">
                  New Private Code: <strong className="font-mono">{rotatedCode}</strong>
                </div>
              )}

              <div className="space-y-2 border-t border-[#EAE7E0] pt-3">
                {retrieved.stops.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-medium text-[#1A2421]">
                      {(retrieved.numberOfDays ?? 1) > 1 ? `Day ${s.dayNumber ?? 1} • ` : ""}{s.placeName}
                      {s.visitedAt && <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#164237]"><Check className="w-3 h-3" />Visited</span>}
                    </span>
                    <span className="text-[#616E69] tabular-nums">
                      {s.visitTime ? formatTime12h(s.visitTime) : "Flexible"} ({formatDuration(s.durationMinutes || 60)})
                    </span>
                  </div>
                ))}
              </div>

              {/* After-trip completion + per-destination ratings (counts in Tourism Office stats) */}
              <div className="inset-panel p-3 space-y-3">
                {retrieved.status === "completed" ? (
                  <p className="text-xs font-semibold text-[#164237] inline-flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4 shrink-0" /> Trip completed{retrieved.completedAt ? ` on ${String(retrieved.completedAt).slice(0, 10)}` : ""} — counted by the Tourism Office. You can still update your ratings below.
                  </p>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-[#1A2421]">Finished this trip?</p>
                    <p className="text-[11px] text-[#616E69]">Mark the stops you visited and rate each destination. Completed trips and ratings count in Salcedo&apos;s official tourism statistics and destination rankings.</p>
                  </div>
                )}
                {retrieved.stops.map((s) => (
                  <div key={s.id} className="rounded-lg bg-white border border-[#EAE7E0] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#1A2421] truncate">{s.placeName}</p>
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#164237] cursor-pointer shrink-0">
                        <input type="checkbox" checked={visitedStops[s.placeId] ?? Boolean(s.visitedAt)} onChange={(e) => setVisitedStops((v) => ({ ...v, [s.placeId]: e.target.checked }))} className="accent-[#164237]" />
                        Visited
                      </label>
                    </div>
                    {(visitedStops[s.placeId] ?? Boolean(s.visitedAt)) && (
                      <>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} type="button" onClick={() => setStopRatings((r) => ({ ...r, [s.placeId]: n }))} aria-label={`Rate ${s.placeName} ${n} stars`} aria-pressed={n === stopRatings[s.placeId]} className="p-0.5 active:scale-90 transition cursor-pointer">
                              <Star className={`w-6 h-6 ${n <= (stopRatings[s.placeId] ?? 0) ? "text-[#B88A44]" : "text-[#D8D3C8]"}`} fill={n <= (stopRatings[s.placeId] ?? 0) ? "currentColor" : "none"} />
                            </button>
                          ))}
                          <span className="text-[11px] font-semibold text-[#616E69]">{stopRatings[s.placeId] ? `${stopRatings[s.placeId]}/5` : "Tap to rate"}</span>
                        </div>
                        <input type="text" value={stopComments[s.placeId] ?? ""} onChange={(e) => setStopComments((c) => ({ ...c, [s.placeId]: e.target.value }))} placeholder="Tip for other tourists (optional)…" maxLength={500} className="w-full rounded-lg border border-[#EAE7E0] bg-[#FAF9F6] px-2 py-1.5 text-[11px]" />
                      </>
                    )}
                  </div>
                ))}
                {completionNotice && <p className="rounded-lg bg-[#F3F2EE] p-2.5 text-[11px] text-[#164237]">{completionNotice}</p>}
                <button type="button" disabled={completing || Boolean(passBusy)} onClick={() => void handleCompleteRegisteredTrip()}
                  className="w-full rounded-full bg-[#8A6527] text-white py-2.5 text-xs font-semibold disabled:opacity-50 active:scale-[0.98] transition cursor-pointer">
                  {completing ? "Saving…" : retrieved.status === "completed" ? "Update My Ratings" : "Complete Trip & Submit Ratings"}
                </button>
              </div>

              <div className="no-print pt-3 border-t border-[#EAE7E0] space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void changePass("rotate")}
                    disabled={Boolean(passBusy) || completing}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-[#EAE7E0] py-2 text-xs font-semibold text-[#1A2421] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {passBusy === "rotate" ? "Replacing…" : "Replace private code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-[#EAE7E0] py-2 text-xs font-semibold text-[#1A2421] cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print
                  </button>
                </div>

                {!confirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="w-full inline-flex items-center justify-center gap-1 rounded-full border border-rose-200 py-2 text-xs font-semibold text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Erase Submission (RA 10173)
                  </button>
                ) : (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 space-y-2">
                    <p className="text-xs font-semibold text-rose-900">
                      Permanently erase this record?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        className="flex-1 rounded-full bg-white border border-rose-200 py-1.5 text-xs font-semibold text-[#1A2421] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void changePass("delete")}
                        disabled={Boolean(passBusy) || completing}
                        className="flex-1 rounded-full bg-rose-700 text-white py-1.5 text-xs font-semibold cursor-pointer"
                      >
                        {passBusy === "delete" ? "Erasing…" : "Confirm Erase"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NATIVE BOTTOM SHEET: ADD DESTINATION STOP */}
      {stopPickerOpen && (
        <Modal label="Add a destination" onClose={() => setStopPickerOpen(false)}>
          <div className="w-full max-h-[82dvh] bg-white rounded-xl border-t border-[#EAE7E0] p-4 pb-6 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1 rounded-full bg-[#D8D3C8] mx-auto" />

            {tripDaysCount > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-semibold text-[#616E69] shrink-0">Adding to:</span>
                {Array.from({ length: tripDaysCount }, (_, i) => i + 1).map((d) => (
                  <button key={d} type="button" onClick={() => setActiveDay(d)} className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold border cursor-pointer ${activeDay === d ? "bg-[#164237] text-white border-[#164237]" : "bg-[#FAF9F6] border-[#EAE7E0] text-[#1A2421]"}`}>
                    Day {d}{dateForDay(d) ? ` • ${dateForDay(d)}` : ""}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <SectionHeader eyebrow="Step 1 · Explore" title={`Choose stops (${draft.stops.length})`} />
              <button
                type="button"
                onClick={() => setStopPickerOpen(false)}
                className="rounded-full bg-[#164237] text-white px-4 py-1.5 text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#616E69] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={placeSearch}
                onChange={(e) => setPlaceSearch(e.target.value)}
                aria-label="Search stops to add"
                placeholder="Search waterfalls, cafés, resorts…"
                className="w-full rounded-full border border-[#EAE7E0] bg-white pl-9 pr-4 min-h-[40px] text-xs focus:outline-none focus:border-[#164237] focus:ring-[3px] focus:ring-[#164237]/10 shadow-[inset_0_1px_2px_rgba(26,36,33,0.04)]"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#EAE7E0]">
              {filteredPlaces.length === 0 && <p role="status" className="empty-note">No matching stops. Try a different place or barangay.</p>}
              {filteredPlaces.map((p) => {
                const selected = draft.stops.some((s) => s.placeId === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => void toggleStop(p)}
                    className="w-full flex items-center gap-3 py-3 text-left active:bg-[#FAF9F6] cursor-pointer"
                  >
                    <PlaceThumbnail place={p} width={44} height={44} className="stop-thumb" />
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-xs text-[#1A2421] truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-[#616E69] truncate">
                        {p.barangay ? `Brgy. ${p.barangay.name}` : p.placeType}
                      </p>
                    </div>
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition ${
                        selected
                          ? "bg-[#164237] text-white"
                          : "bg-[#F3F2EE] text-[#1A2421]"
                      }`}
                    >
                      {selected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* NATIVE BOTTOM SHEET: OPTIONAL TOURISM OFFICE REGISTRATION (RA 10173) */}
      {registerSheetOpen && (
        <Modal label="Register trip with Salcedo CEDO" onClose={() => { if (!submitLoading) setRegisterSheetOpen(false); }}>
          <form
            onSubmit={handleSubmitPlan}
            className="w-full max-h-[88dvh] bg-white rounded-xl border-t border-[#EAE7E0] p-5 pb-6 flex flex-col gap-3.5 shadow-2xl overflow-y-auto animate-in slide-in-from-bottom-6 duration-200"
          >
            <div className="w-10 h-1 rounded-full bg-[#D8D3C8] mx-auto shrink-0" />

            <div className="flex items-center justify-between gap-2">
              <SectionHeader eyebrow="Optional" title="Register trip with Salcedo CEDO" />
              <button
                type="button"
                onClick={() => setRegisterSheetOpen(false)}
                aria-label="Close registration sheet"
                disabled={submitLoading}
                className="w-8 h-8 rounded-full bg-[#F3F2EE] flex items-center justify-center text-[#616E69] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-[#F3F2EE] p-3 flex items-start gap-2 text-[11px] text-[#1A2421]">
              <ShieldCheck className="w-4 h-4 text-[#164237] shrink-0 mt-0.5" />
              <span>
                <strong>{privacyNotice.title}</strong> ({privacyNotice.version})
              </span>
            </div>

            <p className="text-xs text-[#616E69] leading-relaxed">Registering sends your itinerary to the tourism office. Enter your origin and group size, then read the privacy notice below. No name or contact details are required.</p>

            <div>
              <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">Where are you visiting from? *</span>
              <div className="flex flex-wrap gap-1.5">
              {ORIGIN_QUICK_CITIES.map((c) => (
                <button
                  key={c.city}
                  type="button"
                  onClick={() => {
                    setOriginMunicipality(c.city);
                    setOriginProvince(c.province);
                    setOriginCountry("Philippines");
                  }}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium border cursor-pointer ${
                    originMunicipality === c.city
                      ? "bg-[#164237] text-white border-[#164237]"
                      : "bg-[#FAF9F6] text-[#1A2421] border-[#EAE7E0]"
                  }`}
                >
                  {c.city}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">City / Municipality <span className="text-rose-700">*</span></span>
                <input type="text" required value={originMunicipality} onChange={(e) => setOriginMunicipality(e.target.value)} placeholder="e.g. Candon City" autoComplete="address-level2"
                  className={`w-full rounded-xl border bg-[#FAF9F6] px-3.5 py-2.5 text-sm ${formErrors.originMunicipality ? "border-rose-400" : "border-[#EAE7E0]"}`} />
                {formErrors.originMunicipality && <span className="block text-[11px] text-rose-700 mt-1">{formErrors.originMunicipality}</span>}
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">Province / region <span className="text-rose-700">*</span></span>
                <input type="text" required value={originProvince} onChange={(e) => setOriginProvince(e.target.value)} placeholder="e.g. Ilocos Sur" autoComplete="address-level1"
                  className={`w-full rounded-xl border bg-[#FAF9F6] px-3.5 py-2.5 text-sm ${formErrors.originProvince ? "border-rose-400" : "border-[#EAE7E0]"}`} />
                {formErrors.originProvince && <span className="block text-[11px] text-rose-700 mt-1">{formErrors.originProvince}</span>}
              </label>
            </div>
            </div>

            <label className="block"><span className="block text-[11px] font-semibold mb-1">Country</span>
              <input type="text" required autoComplete="country-name" maxLength={120} value={originCountry} onChange={e => setOriginCountry(e.target.value)} className="field-pro" />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">How many travelers? *</span>
                <div className="flex items-center gap-2 rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-2 py-1.5">
                  <button type="button" aria-label="Fewer travelers" onClick={() => setTravelerCount((c) => Math.max(1, c - 1))} className="w-8 h-8 rounded-full bg-white border border-[#EAE7E0] flex items-center justify-center cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="flex-1 text-center text-sm font-bold tabular-nums">{travelerCount}</span>
                  <button type="button" aria-label="More travelers" onClick={() => setTravelerCount((c) => Math.min(200, c + 1))} className="w-8 h-8 rounded-full bg-white border border-[#EAE7E0] flex items-center justify-center cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">Purpose of visit</span>
                <select value={purposeOfVisit} onChange={(e) => setPurposeOfVisit(e.target.value)} className="field-pro">
                  <option value="">Not specified</option>
                  <option>Leisure &amp; Nature Sightseeing</option>
                  <option>Family Resort Outing</option>
                  <option>Agri-Tourism / Farm Visit</option>
                  <option>Cultural / Fiesta Participation</option>
                  <option>Research / Educational Fieldwork</option>
                  <option>Business / Official Travel</option>
                </select>
              </label>
            </div>

            <details className="rounded-xl border border-dashed border-[#EAE7E0] p-3 space-y-3">
              <summary className="text-[11px] font-semibold text-[#164237] cursor-pointer">
                Optional details: contact information and travel preferences
              </summary>
            <label className="block">
              <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">Your full name <span className="font-normal text-[#616E69]">(optional)</span></span>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="e.g. Maria Clara"
                autoComplete="name"
                className="field-pro"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">Mobile number <span className="font-normal text-[#616E69]">(optional)</span></span>
                <input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="09XX XXX XXXX" autoComplete="tel"
                  className="field-pro" />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">Email <span className="font-normal text-[#616E69]">(optional)</span></span>
                <input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="you@email.com" autoComplete="email"
                  className={`w-full rounded-xl border bg-[#FAF9F6] px-3.5 py-2.5 text-sm ${formErrors.emailAddress ? "border-rose-400" : "border-[#EAE7E0]"}`} />
                {formErrors.emailAddress && <span className="block text-[11px] text-rose-700 mt-1">{formErrors.emailAddress}</span>}
              </label>
            </div>


            <div>
              <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">First time visiting Salcedo?</span>
              <div className="flex gap-1.5">
                {([["yes", "Yes, first time"], ["no", "Returning visitor"], ["prefer_not_to_say", "Prefer not to say"]] as const).map(([v, label]) => (
                  <button key={v} type="button" aria-pressed={firstTimeVisitor === v} onClick={() => setFirstTimeVisitor(v)} className={`flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold border cursor-pointer ${firstTimeVisitor === v ? "bg-[#164237] text-white border-[#164237]" : "bg-[#FAF9F6] border-[#EAE7E0] text-[#1A2421]"}`}>{label}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">Transportation</span>
                <select value={transportationType} onChange={(e) => setTransportationType(e.target.value)} className="field-pro">
                  <option value="">Not specified</option>
                  <option>Private Vehicle</option><option>Public Bus / Van</option><option>Tricycle / Local Transport</option><option>Motorcycle</option><option>Organized Tour Van</option><option>Walking / Cycling</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">Length of stay</span>
                <select value={lengthOfStay} onChange={(e) => setLengthOfStay(e.target.value)} className="field-pro">
                  <option value="">Not specified</option>
                  <option>Day Trip</option><option>Overnight (1 night)</option><option>2–3 Days</option><option>4+ Days</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">How did you discover Salcedo?</span>
                <select value={discoverySource} onChange={(e) => setDiscoverySource(e.target.value)} className="field-pro">
                  <option value="">Not specified</option>
                  <option>Social Media / Online Search</option><option>Friend / Family Recommendation</option><option>Tourism Office / LGU</option><option>School / Work</option><option>Passed By / Nearby Resident</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-[#1A2421] mb-1">Preferred experience</span>
                <select value={preferredExperience} onChange={(e) => setPreferredExperience(e.target.value)} className="field-pro">
                  <option value="">Not specified</option>
                  <option>Waterfalls &amp; Resorts</option><option>Heritage &amp; Culture</option><option>Food &amp; Local Products</option><option>Farms &amp; Nature</option><option>Adventure / Hiking</option>
                </select>
              </label>
            </div>
            </details>

            <details className="inset-panel p-3">
              <summary className="text-[11px] font-semibold text-[#164237] cursor-pointer">Read the full Privacy Notice</summary>
              <p className="text-[11px] text-[#616E69] leading-relaxed mt-2 whitespace-pre-line max-h-32 overflow-y-auto">{privacyNotice.bodyMarkdown}</p>
            </details>
            {formErrors.privacy && <p className="text-[11px] text-rose-700">{formErrors.privacy}</p>}

            <label className="flex items-start gap-2.5 rounded-xl border border-[#EAE7E0] p-3 text-xs text-[#1A2421] cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAcknowledged}
                onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
                className="mt-0.5 accent-[#164237]"
              />
              <span>
                I acknowledge the Salcedo Tourism Data Privacy Notice (RA 10173). *
              </span>
            </label>

            <label className="flex items-start gap-2.5 rounded-xl border border-[#EAE7E0] p-3 text-xs text-[#616E69] cursor-pointer">
              <input
                type="checkbox"
                checked={followUpConsentGiven}
                onChange={(e) => setFollowUpConsentGiven(e.target.checked)}
                className="mt-0.5 accent-[#164237]"
              />
              <span>
                Optional: Allow Salcedo Tourism Office to contact me regarding this trip.
              </span>
            </label>

            {submitError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full rounded-full btn-primary-pro py-3 text-xs font-semibold disabled:opacity-50 active:scale-[0.98] transition cursor-pointer"
            >
              {submitLoading ? "Submitting..." : "Get Official CEDO Reference"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
