"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  KeyRound,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteLocalDraft,
  listLocalDrafts,
  listLocalReceipts,
  listSavedPlaceIds,
  removeLocalReceipt,
  saveLocalDraft,
  saveLocalReceipt,
  toggleSavedPlaceId,
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

interface RetrievedItinerary {
  id: string;
  referenceNumber: string;
  title: string;
  plannedVisitDate: string;
  description: string | null;
  totalStops: number;
  estimatedTotalMinutes: number;
  expiresAt: string | null;
  stops: Array<{
    id: string;
    stopOrder: number;
    visitTime: string | null;
    durationMinutes: number;
    personalNotes: string | null;
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

const DURATION_PRESETS = [30, 60, 90, 120];

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

export function TripsPlannerClient({
  availablePlaces,
  privacyNotice,
}: {
  availablePlaces: PlaceCardData[];
  privacyNotice: PrivacyNoticeData;
}) {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams.get("tab");
  const initialTab: "builder" | "retrieve" | "saved" =
    initialTabParam === "retrieve" || initialTabParam === "saved"
      ? initialTabParam
      : "builder";

  return (
    <TripsPlannerInner
      key={initialTab}
      initialTab={initialTab}
      availablePlaces={availablePlaces}
      privacyNotice={privacyNotice}
    />
  );
}

function TripsPlannerInner({
  initialTab,
  availablePlaces,
  privacyNotice,
}: {
  initialTab: "builder" | "retrieve" | "saved";
  availablePlaces: PlaceCardData[];
  privacyNotice: PrivacyNoticeData;
}) {
  const { refreshCounts, showToast } = useMobileApp();
  const [activeTab, setActiveTab] = useState<"builder" | "retrieve" | "saved">(initialTab);

  // Native bottom sheets instead of multi-step web forms
  const [stopPickerOpen, setStopPickerOpen] = useState(false);
  const [registerSheetOpen, setRegisterSheetOpen] = useState(false);

  const [drafts, setDrafts] = useState<LocalItineraryDraft[]>([]);
  const [draft, setDraft] = useState<LocalItineraryDraft>(createEmptyDraft);
  const [placeSearch, setPlaceSearch] = useState("");

  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [localReceipts, setLocalReceipts] = useState<LocalTripReceipt[]>([]);

  // Optional RA 10173 Submission Form state (in Register bottom sheet)
  const [visitorName, setVisitorName] = useState("");
  const [originMunicipality, setOriginMunicipality] = useState("");
  const [originProvince, setOriginProvince] = useState("");
  const [originCountry] = useState("Philippines");
  const [contactNumber, setContactNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [travelerCount, setTravelerCount] = useState<number>(2);
  const [purposeOfVisit, setPurposeOfVisit] = useState("Leisure & Nature Sightseeing");
  const [firstTimeVisitor] = useState<"yes" | "no" | "prefer_not_to_say">("yes");
  const [transportationType] = useState("Private Vehicle");
  const [lengthOfStay] = useState("Day Trip");
  const [discoverySource] = useState("Social Media / Online Search");
  const [preferredExperience] = useState("Waterfalls & Resorts");
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
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(async () => {
      const [loadedDrafts, savedIds, receipts] = await Promise.all([
        listLocalDrafts(),
        listSavedPlaceIds(),
        listLocalReceipts(),
      ]);
      setDrafts(loadedDrafts);
      if (loadedDrafts.length > 0) {
        setDraft(loadedDrafts[0]);
      }
      setSavedPlaceIds(savedIds);
      setLocalReceipts(receipts);
    });
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

  const savedPlaces = useMemo(
    () => availablePlaces.filter((p) => savedPlaceIds.includes(p.id)),
    [availablePlaces, savedPlaceIds]
  );

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

  const applyQuickPreset = async (preset: "nature" | "heritage") => {
    const picks =
      preset === "nature"
        ? availablePlaces.filter((p) =>
            ["nature", "resort", "attraction"].includes(p.placeType)
          )
        : availablePlaces.filter((p) =>
            ["heritage", "restaurant", "cafe", "business"].includes(p.placeType)
          );

    const selected = picks.slice(0, 3);
    if (selected.length === 0) return;

    const times = ["09:00", "11:30", "14:00"];
    const stops: LocalItineraryStop[] = selected.map((p, idx) => ({
      placeId: p.id,
      placeName: p.name,
      placeSlug: p.slug,
      placeType: p.placeType,
      barangayName: p.barangay?.name ?? null,
      featuredImageUrl: p.featuredImageUrl ?? null,
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
            featuredImageUrl: place.featuredImageUrl ?? null,
            latitude: place.latitude ?? null,
            longitude: place.longitude ?? null,
            visitTime: draft.stops.length === 0 ? "08:30" : "",
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
    if (toIdx < 0 || toIdx >= draft.stops.length) return;
    const copy = [...draft.stops];
    const [item] = copy.splice(fromIdx, 1);
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
          `${idx + 1}. ${s.placeName}${s.visitTime ? ` @ ${s.visitTime}` : ""} (${
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
    if (!privacyAcknowledged) {
      setSubmitError("Accept the RA 10173 Privacy Notice before submitting.");
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
            purposeOfVisit,
            firstTimeVisitor,
            transportationType,
            lengthOfStay,
            discoverySource,
            preferredExperience,
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

      setSubmissionResult({
        referenceNumber: data.referenceNumber,
        privateCode: data.privateCode,
        warning: data.warning,
        title: draft.title,
        plannedVisitDate: draft.plannedVisitDate,
        totalStops: draft.stops.length,
      });
      setRegisterSheetOpen(false);

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

  const handleRotateCode = async () => {
    if (!retrieved) return;
    setRetError(null);
    const res = await fetch("/api/itineraries/access/rotate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referenceNumber: retrieved.referenceNumber,
        privateCode: retCode.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRetError(data.error || "Could not rotate retrieval code.");
      return;
    }
    setRotatedCode(data.newPrivateCode);
    setRetCode(data.newPrivateCode);
    showToast("New retrieval code issued", { tone: "success" });
  };

  const handleDeleteRetrieved = async () => {
    if (!retrieved) return;
    const res = await fetch("/api/itineraries/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referenceNumber: retrieved.referenceNumber,
        privateCode: retCode.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRetError(data.error || "Could not delete itinerary.");
      return;
    }
    await removeLocalReceipt(retrieved.referenceNumber);
    setLocalReceipts(await listLocalReceipts());
    setRetrieved(null);
    setConfirmingDelete(false);
    setRetCode("");
    setDeleteSuccess(data.message);
  };

  return (
    <div className="space-y-4">
      {/* Native Segmented Control */}
      <div className="no-print grid grid-cols-3 rounded-full bg-[#EFECE5] p-1 border border-[#EAE7E0]">
        <button
          type="button"
          onClick={() => setActiveTab("builder")}
          className={`rounded-full py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === "builder" ? "bg-white text-[#1A2421] shadow-2xs" : "text-[#616E69]"
          }`}
        >
          Itinerary ({draft.stops.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`rounded-full py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === "saved" ? "bg-white text-[#1A2421] shadow-2xs" : "text-[#616E69]"
          }`}
        >
          Saved ({savedPlaces.length + drafts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("retrieve")}
          className={`rounded-full py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === "retrieve" ? "bg-white text-[#1A2421] shadow-2xs" : "text-[#616E69]"
          }`}
        >
          Lookup
        </button>
      </div>

      {/* TAB 1: NATIVE TIMELINE TRIP BUILDER */}
      {activeTab === "builder" && (
        <div className="space-y-4">
          {submissionResult ? (
            <div className="bg-white rounded-3xl border border-[#EAE7E0] p-5 space-y-4 shadow-2xs">
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

              <div className="rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] divide-y divide-[#EAE7E0]">
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
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `Reference: ${submissionResult.referenceNumber}\nPrivate Code: ${submissionResult.privateCode}`
                      );
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
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
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#164237] text-white py-3 text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Receipt (.txt)
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRetRef(submissionResult.referenceNumber);
                      setRetCode(submissionResult.privateCode);
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
                      setDraft(createEmptyDraft());
                    }}
                    className="rounded-full border border-[#EAE7E0] bg-white py-2.5 text-xs font-medium text-[#616E69] cursor-pointer"
                  >
                    New Trip
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Native Trip Header Card */}
              <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => void persistDraft({ ...draft, title: e.target.value })}
                    aria-label="Trip Title"
                    className="w-full font-display text-lg font-bold text-[#1A2421] bg-transparent focus:outline-none border-b border-transparent focus:border-[#EAE7E0] pb-0.5"
                  />

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#616E69]">
                    <label className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F6] border border-[#EAE7E0] px-3 py-1 cursor-pointer">
                      <Calendar className="w-3.5 h-3.5 text-[#164237]" />
                      <input
                        type="date"
                        value={draft.plannedVisitDate}
                        onChange={(e) =>
                          void persistDraft({ ...draft, plannedVisitDate: e.target.value })
                        }
                        className="bg-transparent text-xs font-semibold text-[#1A2421] focus:outline-none tabular-nums"
                      />
                    </label>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F2EE] px-2.5 py-1 text-[11px] font-semibold text-[#164237] tabular-nums">
                      <Clock className="w-3 h-3" />
                      ~{(totalMinutes / 60).toFixed(1)}h
                      {totalDistanceKm > 0 ? ` • ${totalDistanceKm} km` : ""}
                    </span>
                  </div>
                </div>

                {/* Quick Starter Templates when empty */}
                {draft.stops.length === 0 && availablePlaces.length > 0 && (
                  <div className="pt-2 border-t border-[#EAE7E0] space-y-2">
                    <p className="text-[11px] font-semibold text-[#616E69] inline-flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#B88A44]" />
                      Start from a Salcedo route
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => void applyQuickPreset("nature")}
                        className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] p-3 text-left active:scale-[0.98] transition cursor-pointer"
                      >
                        <p className="font-display text-xs font-bold text-[#1A2421]">
                          Falls &amp; Springs
                        </p>
                        <p className="text-[11px] text-[#616E69] mt-0.5">3 top stops</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => void applyQuickPreset("heritage")}
                        className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] p-3 text-left active:scale-[0.98] transition cursor-pointer"
                      >
                        <p className="font-display text-xs font-bold text-[#1A2421]">
                          Heritage &amp; Dining
                        </p>
                        <p className="text-[11px] text-[#616E69] mt-0.5">Cultural route</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Native Vertical Route Timeline */}
              {draft.stops.length > 0 && (
                <div className="space-y-2.5">
                  {draft.stops.map((s, idx) => (
                    <div key={s.placeId} className="relative flex gap-2.5">
                      {/* Vertical Route Track */}
                      <div className="flex flex-col items-center pt-3">
                        <span className="w-6 h-6 rounded-full bg-[#164237] text-white text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums z-10">
                          {idx + 1}
                        </span>
                        {idx < draft.stops.length - 1 && (
                          <div className="w-px flex-1 border-l-2 border-dashed border-[#D8D3C8] my-1" />
                        )}
                      </div>

                      {/* Stop Card */}
                      <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#EAE7E0] p-3 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={
                                s.featuredImageUrl ||
                                "/images/salcedo/hero-salcedo-valley.png"
                              }
                              alt={s.placeName}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/app/places/${s.placeSlug}`}
                                className="font-display font-bold text-xs text-[#1A2421] line-clamp-1 hover:text-[#164237]"
                              >
                                {s.placeName}
                              </Link>
                              <p className="text-[11px] text-[#616E69] truncate">
                                {s.barangayName ? `Brgy. ${s.barangayName}` : s.placeType}
                              </p>
                            </div>
                          </div>

                          <div className="no-print flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => void moveStop(idx, idx - 1)}
                              disabled={idx === 0}
                              aria-label="Move stop up"
                              className="p-1.5 rounded-full bg-[#FAF9F6] border border-[#EAE7E0] disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void moveStop(idx, idx + 1)}
                              disabled={idx === draft.stops.length - 1}
                              aria-label="Move stop down"
                              className="p-1.5 rounded-full bg-[#FAF9F6] border border-[#EAE7E0] disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void persistDraft({
                                  ...draft,
                                  stops: draft.stops.filter((_, i) => i !== idx),
                                })
                              }
                              aria-label="Remove stop"
                              className="p-1.5 rounded-full bg-[#FAF9F6] border border-[#EAE7E0] text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="time"
                            value={s.visitTime}
                            onChange={(e) =>
                              void updateStopField(idx, "visitTime", e.target.value)
                            }
                            aria-label="Visit time"
                            className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-2.5 py-1.5 text-xs tabular-nums"
                          />
                          <div className="flex items-center gap-1">
                            {DURATION_PRESETS.map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() =>
                                  void updateStopField(idx, "durationMinutes", mins)
                                }
                                className={`flex-1 rounded-xl py-1.5 text-[10px] font-semibold border cursor-pointer ${
                                  s.durationMinutes === mins
                                    ? "bg-[#164237] text-white border-[#164237]"
                                    : "bg-[#FAF9F6] text-[#616E69] border-[#EAE7E0]"
                                }`}
                              >
                                {mins === 60
                                  ? "1h"
                                  : mins === 90
                                  ? "1.5h"
                                  : mins === 120
                                  ? "2h"
                                  : "30m"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Destination Native Trigger */}
              <button
                type="button"
                onClick={() => setStopPickerOpen(true)}
                className="no-print w-full rounded-2xl border-2 border-dashed border-[#D8D3C8] bg-white/70 hover:bg-white py-3.5 text-xs font-semibold text-[#164237] inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Destination Stop
              </button>

              {/* Standalone Export + Optional Registration Dock */}
              {draft.stops.length > 0 && (
                <div className="no-print bg-white rounded-2xl border border-[#EAE7E0] p-3.5 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadItineraryText(
                          draft.title,
                          draft.plannedVisitDate,
                          draft.stops
                        )
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#EAE7E0] bg-[#FAF9F6] py-2.5 text-xs font-semibold text-[#1A2421] active:scale-95 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save (.txt)
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#EAE7E0] bg-[#FAF9F6] py-2.5 text-xs font-semibold text-[#1A2421] active:scale-95 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Trip
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRegisterSheetOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#164237] text-white py-3 text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Register with Tourism Office (Optional)
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
          <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
            <h2 className="font-display text-sm font-bold text-[#1A2421]">
              Bookmarked Places ({savedPlaces.length})
            </h2>
            {savedPlaces.length === 0 ? (
              <p className="text-xs text-[#616E69]">
                Tap the bookmark icon on any destination to save it offline here.
              </p>
            ) : (
              <div className="divide-y divide-[#EAE7E0]">
                {savedPlaces.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 py-2.5">
                    <Link
                      href={`/app/places/${p.slug}`}
                      className="text-xs font-semibold text-[#1A2421] hover:text-[#164237] truncate"
                    >
                      {p.name}
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleSavedPlaceId(p.id);
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

          <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
            <h2 className="font-display text-sm font-bold text-[#1A2421]">
              Local Drafts ({drafts.length})
            </h2>
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
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(d);
                          setActiveTab("builder");
                        }}
                        className="rounded-full bg-[#164237] text-white px-3 py-1 text-[11px] font-semibold cursor-pointer"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteLocalDraft(d.id);
                          setDrafts(await listLocalDrafts());
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
                  onClick={() => setRetRef(r.referenceNumber)}
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
            className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#164237]" />
              <h2 className="font-display text-sm font-bold text-[#1A2421]">
                Retrieve Submitted Trip
              </h2>
            </div>

            <input
              type="text"
              required
              value={retRef}
              onChange={(e) => setRetRef(e.target.value.toUpperCase())}
              placeholder="Reference Number (CEDO-TRIP-...)"
              className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-mono uppercase"
            />
            <input
              type="text"
              required
              value={retCode}
              onChange={(e) => setRetCode(e.target.value)}
              placeholder="Private Retrieval Code"
              className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-mono"
            />

            {retError && (
              <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                {retError}
              </p>
            )}
            {deleteSuccess && (
              <p className="rounded-xl bg-[#F3F2EE] p-3 text-xs text-[#164237]">
                {deleteSuccess}
              </p>
            )}

            <button
              type="submit"
              disabled={retLoading}
              className="w-full rounded-full bg-[#164237] text-white py-3 text-xs font-semibold active:scale-[0.98] transition cursor-pointer"
            >
              {retLoading ? "Verifying..." : "Retrieve Itinerary"}
            </button>
          </form>

          {retrieved && (
            <div className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-4">
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
                      {s.stopOrder}. {s.placeName}
                    </span>
                    <span className="text-[#616E69] tabular-nums">
                      {s.visitTime || "Flexible"} ({s.durationMinutes}m)
                    </span>
                  </div>
                ))}
              </div>

              <div className="no-print pt-3 border-t border-[#EAE7E0] space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRotateCode()}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-[#EAE7E0] py-2 text-xs font-semibold text-[#1A2421] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Rotate Code
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
                        onClick={() => void handleDeleteRetrieved()}
                        className="flex-1 rounded-full bg-rose-700 text-white py-1.5 text-xs font-semibold cursor-pointer"
                      >
                        Confirm Erase
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="w-full max-w-[430px] max-h-[82dvh] bg-white rounded-t-[28px] border-t border-[#EAE7E0] p-4 pb-6 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="w-10 h-1 rounded-full bg-[#D8D3C8] mx-auto" />

            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#1A2421]">
                Choose Stops ({draft.stops.length})
              </h2>
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
                placeholder="Search waterfalls, cafés, resorts..."
                className="w-full rounded-full border border-[#EAE7E0] bg-[#FAF9F6] pl-9 pr-4 py-2 text-xs focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#EAE7E0]">
              {filteredPlaces.map((p) => {
                const selected = draft.stops.some((s) => s.placeId === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => void toggleStop(p)}
                    className="w-full flex items-center gap-3 py-3 text-left active:bg-[#FAF9F6] cursor-pointer"
                  >
                    <img
                      src={p.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
                      alt={p.name}
                      className="w-11 h-11 rounded-xl object-cover shrink-0 bg-[#F3F2EE]"
                    />
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
        </div>
      )}

      {/* NATIVE BOTTOM SHEET: OPTIONAL TOURISM OFFICE REGISTRATION (RA 10173) */}
      {registerSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[1px]">
          <form
            onSubmit={handleSubmitPlan}
            className="w-full max-w-[430px] max-h-[88dvh] bg-white rounded-t-[28px] border-t border-[#EAE7E0] p-5 pb-6 flex flex-col gap-3.5 shadow-2xl overflow-y-auto animate-in slide-in-from-bottom-6 duration-200"
          >
            <div className="w-10 h-1 rounded-full bg-[#D8D3C8] mx-auto shrink-0" />

            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-[#1A2421]">
                Register Trip with Salcedo CEDO
              </h2>
              <button
                type="button"
                onClick={() => setRegisterSheetOpen(false)}
                aria-label="Close registration sheet"
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

            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Full Name (Optional)"
              className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
            />

            <div className="flex flex-wrap gap-1.5">
              {ORIGIN_QUICK_CITIES.map((c) => (
                <button
                  key={c.city}
                  type="button"
                  onClick={() => {
                    setOriginMunicipality(c.city);
                    setOriginProvince(c.province);
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
              <input
                type="text"
                required
                value={originMunicipality}
                onChange={(e) => setOriginMunicipality(e.target.value)}
                placeholder="City / Municipality *"
                className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
              <input
                type="text"
                required
                value={originProvince}
                onChange={(e) => setOriginProvince(e.target.value)}
                placeholder="Province *"
                className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Phone (Optional)"
                className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Email (Optional)"
                className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min={1}
                max={200}
                value={travelerCount}
                onChange={(e) => setTravelerCount(Number(e.target.value))}
                aria-label="Travelers"
                className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm tabular-nums"
              />
              <select
                value={purposeOfVisit}
                onChange={(e) => setPurposeOfVisit(e.target.value)}
                className="col-span-2 rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2.5 text-xs"
              >
                <option>Leisure &amp; Nature Sightseeing</option>
                <option>Family Resort Outing</option>
                <option>Agri-Tourism / Farm Visit</option>
                <option>Cultural / Fiesta Participation</option>
                <option>Research / Educational Fieldwork</option>
              </select>
            </div>

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
              className="w-full rounded-full bg-[#164237] text-white py-3 text-xs font-semibold disabled:opacity-50 active:scale-[0.98] transition cursor-pointer"
            >
              {submitLoading ? "Submitting..." : "Get Official CEDO Reference"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
