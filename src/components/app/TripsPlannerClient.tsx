"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Check,
  CheckCircle2,
  Copy,
  Download,
  GripVertical,
  KeyRound,
  Printer,
  RefreshCw,
  Route,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  deleteLocalDraft,
  listLocalDrafts,
  listLocalReceipts,
  listSavedPlaceIds,
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
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [drafts, setDrafts] = useState<LocalItineraryDraft[]>([]);
  const [draft, setDraft] = useState<LocalItineraryDraft>(createEmptyDraft);
  const [placeSearch, setPlaceSearch] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Saved places & local receipts
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [localReceipts, setLocalReceipts] = useState<LocalTripReceipt[]>([]);

  // Step 5: Post-Itinerary Visitor Information Form (collected ONLY at final step)
  const [visitorName, setVisitorName] = useState("");
  const [originMunicipality, setOriginMunicipality] = useState("");
  const [originProvince, setOriginProvince] = useState("");
  const [originCountry, setOriginCountry] = useState("Philippines");
  const [contactNumber, setContactNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [travelerCount, setTravelerCount] = useState<number>(2);
  const [purposeOfVisit, setPurposeOfVisit] = useState("Leisure & Nature Sightseeing");
  const [firstTimeVisitor, setFirstTimeVisitor] = useState<
    "yes" | "no" | "prefer_not_to_say"
  >("yes");
  const [transportationType, setTransportationType] = useState("Private Vehicle");
  const [lengthOfStay, setLengthOfStay] = useState("Day Trip");
  const [discoverySource, setDiscoverySource] = useState("Social Media / Online Search");
  const [preferredExperience, setPreferredExperience] = useState("Waterfalls & Resorts");
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  // MUST default to false (unprechecked per RA 10173!)
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

  // Retrieve tab state
  const [retRef, setRetRef] = useState("");
  const [retCode, setRetCode] = useState("");
  const [retLoading, setRetLoading] = useState(false);
  const [retError, setRetError] = useState<string | null>(null);
  const [retrieved, setRetrieved] = useState<RetrievedItinerary | null>(null);
  const [rotatedCode, setRotatedCode] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
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
    })();
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

  const persistDraft = async (nextDraft: LocalItineraryDraft, showNotice = false) => {
    const updated = { ...nextDraft, updatedAt: new Date().toISOString() };
    setDraft(updated);
    await saveLocalDraft(updated);
    setDrafts(await listLocalDrafts());
    await refreshCounts();
    if (showNotice) {
      showToast("Draft saved offline on this device", { tone: "success" });
    }
  };

  const applyQuickPreset = async (preset: "nature" | "heritage") => {
    const picks =
      preset === "nature"
        ? availablePlaces.filter((p) =>
            ["nature", "resort", "attraction"].includes(p.placeType)
          )
        : availablePlaces.filter((p) =>
            ["heritage", "restaurant", "business", "attraction"].includes(p.placeType)
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
          ? "Salcedo Waterfalls & Spring Getaway"
          : "Salcedo Heritage & Cacao Trail",
      stops,
    });
    showToast(`Added ${stops.length} verified Salcedo stops`, { tone: "success" });
    setStep(3);
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
    title: string,
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
      "PROJECT CEDO: TURI APP — MUNICIPALITY OF SALCEDO, ILOCOS SUR",
      "==============================================================",
      `Itinerary: ${title}`,
      `Planned Travel Date: ${date}`,
      refNum ? `Official Reference Number: ${refNum}` : "Local Standalone Draft (Not Submitted)",
      "",
      "STOPS:",
      ...stops.map(
        (s, idx) =>
          `${idx + 1}. ${s.placeName}${s.visitTime ? ` @ ${s.visitTime}` : ""} (${
            s.durationMinutes
          } mins)${s.personalNotes ? `\n   Notes: ${s.personalNotes}` : ""}`
      ),
      "",
      "Generated via Project CEDO: Turi App (No account required)",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-salcedo-itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    void trackItineraryEvent({
      eventType: "downloaded",
      stopCount: stops.length,
    });
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (draft.stops.length === 0) {
      setSubmitError("Add at least one destination before submitting your travel plan.");
      return;
    }
    if (!privacyAcknowledged) {
      setSubmitError("Please acknowledge the RA 10173 Data Privacy Notice first.");
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
        setSubmitError(data.error || "Could not submit travel plan. Please check required fields.");
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

      await saveLocalReceipt({
        referenceNumber: data.referenceNumber,
        title: draft.title,
        plannedVisitDate: draft.plannedVisitDate,
        totalStops: draft.stops.length,
        savedAt: new Date().toISOString(),
      });
      setLocalReceipts(await listLocalReceipts());
    } catch {
      setSubmitError("Network error submitting your travel plan. Your local draft is still safe.");
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
        setRetError(data.error || "Invalid reference number or private retrieval code.");
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
      {/* Mobile Segmented Tab Switcher */}
      <div className="no-print grid grid-cols-3 gap-1 bg-white rounded-2xl border border-[#E5E0D5] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("builder")}
          className={`inline-flex items-center justify-center gap-1 rounded-xl py-2 px-2 text-xs font-bold transition cursor-pointer ${
            activeTab === "builder"
              ? "bg-[#123F35] text-white shadow-2xs"
              : "text-[#5A6B66]"
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span>Plan ({draft.stops.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("retrieve")}
          className={`inline-flex items-center justify-center gap-1 rounded-xl py-2 px-2 text-xs font-bold transition cursor-pointer ${
            activeTab === "retrieve"
              ? "bg-[#123F35] text-white shadow-2xs"
              : "text-[#5A6B66]"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Retrieve</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`inline-flex items-center justify-center gap-1 rounded-xl py-2 px-2 text-xs font-bold transition cursor-pointer ${
            activeTab === "saved"
              ? "bg-[#123F35] text-white shadow-2xs"
              : "text-[#5A6B66]"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved ({savedPlaces.length + localReceipts.length})</span>
        </button>
      </div>

      {/* TAB 1: ACCOUNT-FREE ITINERARY BUILDER */}
      {activeTab === "builder" && (
        <div className="space-y-4">
          {submissionResult ? (
            <div className="bg-white rounded-2xl border-2 border-[#123F35] p-4 space-y-4 shadow-md">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Submitted to Salcedo CEDO
                  </p>
                  <h2 className="font-display text-lg font-bold text-[#202B28] truncate">
                    {submissionResult.title}
                  </h2>
                  <p className="text-xs text-[#5A6B66]">
                    Visit: <strong>{submissionResult.plannedVisitDate}</strong> •{" "}
                    {submissionResult.totalStops} stops
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6B66]">
                    Reference Number
                  </p>
                  <p className="font-mono text-base font-bold text-[#123F35] select-all">
                    {submissionResult.referenceNumber}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-300 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                    One-Time Private Retrieval Code
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="font-mono text-base font-bold text-amber-950 select-all">
                      {submissionResult.privateCode}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `Reference: ${submissionResult.referenceNumber}\nPrivate Code: ${submissionResult.privateCode}`
                        );
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-[11px] font-bold text-amber-950 cursor-pointer shrink-0"
                    >
                      {copiedCode ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copiedCode ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>

              <p className="rounded-xl bg-[#123F35]/6 border border-[#123F35]/20 p-3 text-xs text-[#202B28]">
                {submissionResult.warning}
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const txt = `PROJECT CEDO: TURI APP — TRIP ACCESS RECEIPT\nTitle: ${submissionResult.title}\nDate: ${submissionResult.plannedVisitDate}\nReference Number: ${submissionResult.referenceNumber}\nPrivate Retrieval Code: ${submissionResult.privateCode}\n\nKeep this receipt confidential. Required to retrieve or erase your submission at /app/trips.`;
                    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${submissionResult.referenceNumber}-access-receipt.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#123F35] text-white py-2.5 text-xs font-bold cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Access Receipt (.txt)
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRetRef(submissionResult.referenceNumber);
                      setRetCode(submissionResult.privateCode);
                      setActiveTab("retrieve");
                    }}
                    className="rounded-xl border border-[#E5E0D5] bg-white py-2.5 text-xs font-bold text-[#202B28] cursor-pointer"
                  >
                    Test Retrieval
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissionResult(null);
                      setDraft(createEmptyDraft());
                      setStep(1);
                    }}
                    className="rounded-xl border border-[#E5E0D5] bg-white py-2.5 text-xs font-semibold text-[#5A6B66] cursor-pointer"
                  >
                    New Trip
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Stepper + Quick Actions */}
              <div className="no-print bg-white rounded-2xl border border-[#E5E0D5] p-3 space-y-2.5">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { num: 1, label: "1. Info" },
                    { num: 2, label: `2. Spots (${draft.stops.length})` },
                    { num: 3, label: "3. Route" },
                    { num: 4, label: "4. Preview" },
                    { num: 5, label: "5. Submit" },
                  ].map((s) => (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setStep(s.num as 1 | 2 | 3 | 4 | 5)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                        step === s.num
                          ? "bg-[#123F35] text-white"
                          : "bg-[#F8F7F2] text-[#5A6B66]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E5E0D5]/70 text-[11px]">
                  <span className="text-[#5A6B66] tabular-nums">
                    {draft.stops.length} stops • ~{(totalMinutes / 60).toFixed(1)} hrs
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => void persistDraft(draft, true)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1 font-bold text-[#123F35] cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(createEmptyDraft());
                        setStep(1);
                      }}
                      className="rounded-lg border border-[#E5E0D5] px-2.5 py-1 font-semibold text-[#5A6B66] cursor-pointer"
                    >
                      New
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick-Start Templates (shown when draft is empty) */}
              {draft.stops.length === 0 && step <= 2 && (
                <div className="no-print rounded-2xl bg-[#123F35]/6 border border-[#123F35]/20 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#123F35]">
                    <Sparkles className="w-3.5 h-3.5 text-[#D6A85B]" />
                    <span>1-Tap Starter Routes</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void applyQuickPreset("nature")}
                      className="rounded-xl bg-white border border-[#E5E0D5] p-2.5 text-left hover:border-[#123F35] cursor-pointer"
                    >
                      <p className="font-display font-bold text-xs text-[#202B28]">
                        Falls &amp; Spring Day
                      </p>
                      <p className="text-[10px] text-[#5A6B66]">3 nature &amp; resort stops</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void applyQuickPreset("heritage")}
                      className="rounded-xl bg-white border border-[#E5E0D5] p-2.5 text-left hover:border-[#123F35] cursor-pointer"
                    >
                      <p className="font-display font-bold text-xs text-[#202B28]">
                        Heritage &amp; Cacao
                      </p>
                      <p className="text-[10px] text-[#5A6B66]">Plaza, dining &amp; local crafts</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Local Draft Switcher */}
              {drafts.length > 1 && (
                <div className="no-print flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-semibold text-[#5A6B66] shrink-0">
                    Drafts:
                  </span>
                  {drafts.map((d) => (
                    <div
                      key={d.id}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] shrink-0 ${
                        d.id === draft.id
                          ? "bg-[#123F35]/10 border-[#123F35] font-bold text-[#123F35]"
                          : "bg-white border-[#E5E0D5] text-[#5A6B66]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setDraft(d)}
                        className="cursor-pointer truncate max-w-[140px]"
                      >
                        {d.title} ({d.stops.length})
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteLocalDraft(d.id);
                          const next = await listLocalDrafts();
                          setDrafts(next);
                          if (draft.id === d.id) {
                            setDraft(next[0] ?? createEmptyDraft());
                          }
                          await refreshCounts();
                        }}
                        aria-label="Delete local draft"
                        className="text-rose-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 1: TRIP OVERVIEW */}
              {step === 1 && (
                <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#202B28]">
                      Step 1: Trip Details
                    </h2>
                    <p className="text-xs text-[#5A6B66]">
                      Stored privately on your phone—no sign-in needed.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#202B28]">Trip Title</label>
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => void persistDraft({ ...draft, title: e.target.value })}
                        placeholder="e.g., Baluarte Falls & Bago Weekend"
                        className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#202B28]">
                        Planned Travel Date
                      </label>
                      <input
                        type="date"
                        value={draft.plannedVisitDate}
                        onChange={(e) =>
                          void persistDraft({ ...draft, plannedVisitDate: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#202B28]">
                        Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={draft.description}
                        onChange={(e) =>
                          void persistDraft({ ...draft, description: e.target.value })
                        }
                        placeholder="Meeting point, swim gear reminders..."
                        className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full rounded-xl bg-[#123F35] text-white py-3 text-xs font-bold cursor-pointer"
                  >
                    Next: Choose Destinations →
                  </button>
                </section>
              )}

              {/* STEP 2: PICK SALCEDO DESTINATIONS */}
              {step === 2 && (
                <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3.5">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#202B28]">
                      Step 2: Pick Spots ({draft.stops.length} selected)
                    </h2>
                    <p className="text-xs text-[#5A6B66]">
                      Tap any verified Salcedo destination to add or remove it.
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-[#5A6B66] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={placeSearch}
                      onChange={(e) => setPlaceSearch(e.target.value)}
                      placeholder="Filter places or barangays..."
                      className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] pl-9 pr-3 py-2 text-xs"
                    />
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
                    {filteredPlaces.map((p) => {
                      const selected = draft.stops.some((s) => s.placeId === p.id);
                      return (
                        <div
                          key={p.id}
                          className={`rounded-xl border p-2.5 flex gap-2.5 items-center transition ${
                            selected
                              ? "border-[#123F35] bg-[#123F35]/6"
                              : "border-[#E5E0D5] bg-[#F8F7F2]/60"
                          }`}
                        >
                          <img
                            src={p.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-display font-bold text-xs text-[#202B28] truncate">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-[#168A8A] truncate">
                              {p.barangay ? `Brgy. ${p.barangay.name}` : p.placeType}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void toggleStop(p)}
                            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold shrink-0 cursor-pointer ${
                              selected
                                ? "bg-[#123F35] text-white"
                                : "bg-white border border-[#E5E0D5] text-[#123F35]"
                            }`}
                          >
                            {selected ? "Added ✓" : "+ Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 rounded-xl border border-[#E5E0D5] py-2.5 text-xs font-semibold text-[#5A6B66] cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-[2] rounded-xl bg-[#123F35] text-white py-2.5 text-xs font-bold cursor-pointer"
                    >
                      Order &amp; Schedule →
                    </button>
                  </div>
                </section>
              )}

              {/* STEP 3: ORDER & SCHEDULE */}
              {step === 3 && (
                <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#202B28]">
                      Step 3: Route Order &amp; Time
                    </h2>
                    <p className="text-xs text-[#5A6B66]">
                      Use arrows or drag cards to reorder your Salcedo stops.
                    </p>
                  </div>

                  {draft.stops.length === 0 ? (
                    <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-6 text-center space-y-2.5">
                      <p className="text-xs text-[#5A6B66]">No stops selected yet.</p>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="rounded-xl bg-[#123F35] text-white px-4 py-2 text-xs font-bold cursor-pointer"
                      >
                        Choose Destinations
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {draft.stops.map((stop, idx) => (
                        <div
                          key={stop.placeId}
                          draggable
                          onDragStart={() => setDragIndex(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragIndex !== null && dragIndex !== idx) {
                              void moveStop(dragIndex, idx);
                            }
                            setDragIndex(null);
                          }}
                          className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical className="w-4 h-4 text-[#5A6B66] shrink-0" />
                              <span className="w-6 h-6 rounded-full bg-[#123F35] text-white text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-display font-bold text-xs text-[#202B28] truncate">
                                  {stop.placeName}
                                </p>
                                <p className="text-[10px] text-[#168A8A]">
                                  {stop.barangayName
                                    ? `Brgy. ${stop.barangayName}`
                                    : stop.placeType}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => void moveStop(idx, idx - 1)}
                                aria-label="Move stop up"
                                className="w-8 h-8 rounded-lg border border-[#E5E0D5] bg-white flex items-center justify-center disabled:opacity-35 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === draft.stops.length - 1}
                                onClick={() => void moveStop(idx, idx + 1)}
                                aria-label="Move stop down"
                                className="w-8 h-8 rounded-lg border border-[#E5E0D5] bg-white flex items-center justify-center disabled:opacity-35 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void persistDraft({
                                    ...draft,
                                    stops: draft.stops.filter((s) => s.placeId !== stop.placeId),
                                  })
                                }
                                aria-label="Remove stop"
                                className="w-8 h-8 rounded-lg border border-rose-200 bg-white text-rose-700 flex items-center justify-center cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-[#5A6B66]">
                                Time
                              </label>
                              <input
                                type="time"
                                value={stop.visitTime}
                                onChange={(e) =>
                                  void updateStopField(idx, "visitTime", e.target.value)
                                }
                                className="w-full rounded-lg border border-[#E5E0D5] bg-white px-2.5 py-1.5 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#5A6B66]">
                                Duration (mins)
                              </label>
                              <input
                                type="number"
                                min={15}
                                max={720}
                                step={15}
                                value={stop.durationMinutes}
                                onChange={(e) =>
                                  void updateStopField(
                                    idx,
                                    "durationMinutes",
                                    Number(e.target.value) || 60
                                  )
                                }
                                className="w-full rounded-lg border border-[#E5E0D5] bg-white px-2.5 py-1.5 text-xs tabular-nums"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {[30, 60, 90, 120].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() =>
                                  void updateStopField(idx, "durationMinutes", mins)
                                }
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold border cursor-pointer ${
                                  stop.durationMinutes === mins
                                    ? "bg-[#123F35] text-white border-[#123F35]"
                                    : "bg-white text-[#5A6B66] border-[#E5E0D5]"
                                }`}
                              >
                                {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            value={stop.personalNotes}
                            onChange={(e) =>
                              void updateStopField(idx, "personalNotes", e.target.value)
                            }
                            placeholder="Stop note (lunch, photo spot...)"
                            className="w-full rounded-lg border border-[#E5E0D5] bg-white px-2.5 py-1.5 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 rounded-xl border border-[#E5E0D5] py-2.5 text-xs font-semibold text-[#5A6B66] cursor-pointer"
                    >
                      ← Stops
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void trackItineraryEvent({
                          eventType: "preview_completed",
                          stopCount: draft.stops.length,
                          placeIds: draft.stops.map((s) => s.placeId),
                        });
                        setStep(4);
                      }}
                      className="flex-[2] rounded-xl bg-[#123F35] text-white py-2.5 text-xs font-bold cursor-pointer"
                    >
                      Preview Itinerary →
                    </button>
                  </div>
                </section>
              )}

              {/* STEP 4: PREVIEW & STANDALONE LOCAL EXPORT */}
              {step === 4 && (
                <section className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                      Free Standalone Preview
                    </p>
                    <h2 className="font-display text-lg font-bold text-[#202B28]">
                      {draft.title || "My Salcedo Trip"}
                    </h2>
                    <p className="text-xs text-[#5A6B66] tabular-nums">
                      Date: {draft.plannedVisitDate} • {draft.stops.length} stops • ~
                      {(totalMinutes / 60).toFixed(1)} hrs
                    </p>
                  </div>

                  <div className="no-print grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadItineraryText(draft.title, draft.plannedVisitDate, draft.stops)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] py-2 text-xs font-bold text-[#202B28] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download .txt
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] py-2 text-xs font-bold text-[#202B28] cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </button>
                  </div>

                  {draft.description && (
                    <p className="text-xs text-[#5A6B66] bg-[#F8F7F2] rounded-xl p-3 border border-[#E5E0D5]">
                      {draft.description}
                    </p>
                  )}

                  <ol className="space-y-2.5">
                    {draft.stops.map((s, idx) => (
                      <li
                        key={s.placeId}
                        className="flex gap-2.5 items-start rounded-xl border border-[#E5E0D5] p-3"
                      >
                        <span className="w-6 h-6 rounded-full bg-[#123F35] text-white text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h3 className="font-display font-bold text-xs text-[#202B28] truncate">
                            {s.placeName}
                          </h3>
                          <p className="text-[11px] font-semibold text-[#168A8A] tabular-nums">
                            {s.visitTime ? `${s.visitTime} • ` : ""}
                            {s.durationMinutes} mins
                          </p>
                          {s.personalNotes && (
                            <p className="text-[11px] text-[#5A6B66]">{s.personalNotes}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="no-print rounded-xl bg-[#123F35]/6 border border-[#123F35]/20 p-3 text-xs text-[#202B28]">
                    Keep this locally with <strong>zero personal data</strong>, or submit at Step
                    5 to receive an official cross-device CEDO Reference Number.
                  </div>

                  <div className="no-print flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 rounded-xl border border-[#E5E0D5] py-2.5 text-xs font-semibold text-[#5A6B66] cursor-pointer"
                    >
                      ← Edit
                    </button>
                    <button
                      type="button"
                      disabled={draft.stops.length === 0}
                      onClick={() => setStep(5)}
                      className="flex-[2] rounded-xl bg-[#D6A85B] text-[#0D3029] py-2.5 text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Complete Travel Plan →
                    </button>
                  </div>
                </section>
              )}

              {/* STEP 5: POST-ITINERARY VISITOR INFORMATION FORM (RA 10173 COMPLIANT) */}
              {step === 5 && (
                <form
                  onSubmit={handleSubmitPlan}
                  className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-4"
                >
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1 rounded-full bg-[#123F35]/10 text-[#123F35] px-2.5 py-0.5 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      RA 10173 Compliant
                    </div>
                    <h2 className="font-display text-lg font-bold text-[#202B28]">
                      Complete Your Travel Plan
                    </h2>
                    <p className="text-xs text-[#5A6B66]">
                      Receive a Reference Number &amp; Private Retrieval Code. No government ID or
                      home street address is collected.
                    </p>
                  </div>

                  {submitError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
                      {submitError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#202B28]">
                        Municipality / City of Origin *
                      </label>
                      <input
                        required
                        type="text"
                        value={originMunicipality}
                        onChange={(e) => setOriginMunicipality(e.target.value)}
                        placeholder="e.g., Candon City / Quezon City"
                        className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#202B28]">Province *</label>
                        <input
                          required
                          type="text"
                          value={originProvince}
                          onChange={(e) => setOriginProvince(e.target.value)}
                          placeholder="e.g., Ilocos Sur"
                          className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#202B28]">Country</label>
                        <input
                          type="text"
                          value={originCountry}
                          onChange={(e) => setOriginCountry(e.target.value)}
                          className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#202B28]">Travelers *</label>
                        <input
                          required
                          type="number"
                          min={1}
                          max={500}
                          value={travelerCount}
                          onChange={(e) => setTravelerCount(Number(e.target.value) || 1)}
                          className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm tabular-nums"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#202B28]">Length of Stay</label>
                        <select
                          value={lengthOfStay}
                          onChange={(e) => setLengthOfStay(e.target.value)}
                          className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-2.5 py-2 text-xs"
                        >
                          <option>Day Trip</option>
                          <option>Overnight (1 Night)</option>
                          <option>Weekend (2–3 Nights)</option>
                          <option>Extended Stay (4+ Nights)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#202B28]">Purpose of Visit</label>
                      <select
                        value={purposeOfVisit}
                        onChange={(e) => setPurposeOfVisit(e.target.value)}
                        className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
                      >
                        <option>Leisure &amp; Nature Sightseeing</option>
                        <option>Family / Resort Getaway</option>
                        <option>Festival / Cultural Event</option>
                        <option>Eco-Adventure / Hiking</option>
                        <option>Local Products / Agri-Tourism</option>
                        <option>Official / Business</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#202B28]">Transportation</label>
                        <select
                          value={transportationType}
                          onChange={(e) => setTransportationType(e.target.value)}
                          className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-2.5 py-2 text-xs"
                        >
                          <option>Private Vehicle</option>
                          <option>Motorcycle / Mototourism</option>
                          <option>Public Bus / Van &amp; Tricycle</option>
                          <option>Tour Van / Group Charter</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[#202B28]">First Visit?</label>
                        <select
                          value={firstTimeVisitor}
                          onChange={(e) =>
                            setFirstTimeVisitor(
                              e.target.value as "yes" | "no" | "prefer_not_to_say"
                            )
                          }
                          className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-2.5 py-2 text-xs"
                        >
                          <option value="yes">Yes, first time</option>
                          <option value="no">Returning visitor</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#202B28]">
                        Preferred Experience
                      </label>
                      <input
                        type="text"
                        value={preferredExperience}
                        onChange={(e) => setPreferredExperience(e.target.value)}
                        className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#202B28]">
                        How did you discover Salcedo?
                      </label>
                      <select
                        value={discoverySource}
                        onChange={(e) => setDiscoverySource(e.target.value)}
                        className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
                      >
                        <option>Social Media / Online Search</option>
                        <option>Friends or Family Recommendation</option>
                        <option>Municipality / Ilocos Sur Tourism Office</option>
                        <option>Road Trip / Passing Through</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Contact Details */}
                  <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3.5 space-y-2.5">
                    <div>
                      <h3 className="font-display font-bold text-xs text-[#202B28]">
                        Optional Contact Details (Voluntary)
                      </h3>
                      <p className="text-[11px] text-[#5A6B66]">
                        Leave blank to submit origin &amp; group size only.
                      </p>
                    </div>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Full Name or Nickname (Optional)"
                      className="w-full rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-xs"
                    />
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="Mobile Number (Optional)"
                      className="w-full rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-xs"
                    />
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="Email Address (Optional)"
                      className="w-full rounded-xl border border-[#E5E0D5] bg-white px-3 py-2 text-xs"
                    />
                  </div>

                  {/* RA 10173 Privacy Notice Box */}
                  <div className="rounded-xl border border-[#123F35]/25 bg-[#123F35]/5 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-bold text-xs text-[#123F35]">
                        {privacyNotice.title}
                      </h3>
                      <span className="text-[10px] font-mono bg-white border border-[#E5E0D5] rounded px-1.5 py-0.5 text-[#5A6B66]">
                        v{privacyNotice.version}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A6B66] whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto pr-1">
                      {privacyNotice.bodyMarkdown}
                    </p>

                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={privacyAcknowledged}
                        onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#123F35] shrink-0"
                      />
                      <span className="text-xs font-semibold text-[#202B28]">
                        I acknowledge the Salcedo CEDO Data Privacy Notice (RA 10173) for this
                        travel plan. *
                      </span>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={followUpConsentGiven}
                        onChange={(e) => setFollowUpConsentGiven(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#168A8A] shrink-0"
                      />
                      <span className="text-[11px] text-[#5A6B66]">
                        (Optional) I separately consent to receive Salcedo tourism advisories via
                        my optional contact details.
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="flex-1 rounded-xl border border-[#E5E0D5] py-2.5 text-xs font-semibold text-[#5A6B66] cursor-pointer"
                    >
                      ← Preview
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="flex-[2] rounded-xl bg-[#123F35] text-white py-3 text-xs font-bold hover:bg-[#0D3029] disabled:opacity-50 transition cursor-pointer"
                    >
                      {submitLoading ? "Submitting..." : "Submit & Get Trip Code"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: RETRIEVE / MANAGE SUBMITTED TRIP */}
      {activeTab === "retrieve" && (
        <div className="space-y-4">
          <form
            onSubmit={handleRetrieveTrip}
            className="no-print bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3.5"
          >
            <div>
              <h2 className="font-display text-base font-bold text-[#202B28]">
                Retrieve Submitted Itinerary
              </h2>
              <p className="text-xs text-[#5A6B66]">
                Requires <strong>both</strong> your Reference Number and Private Retrieval Code.
              </p>
            </div>

            {localReceipts.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#168A8A]">
                  Tap Saved Reference to Auto-Fill:
                </p>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {localReceipts.map((r) => (
                    <button
                      key={r.referenceNumber}
                      type="button"
                      onClick={() => setRetRef(r.referenceNumber)}
                      className="shrink-0 rounded-full bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1 text-[11px] font-mono font-bold text-[#123F35] cursor-pointer"
                    >
                      {r.referenceNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {retError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                {retError}
              </div>
            )}
            {deleteSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                {deleteSuccess}
              </div>
            )}

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#202B28]">Reference Number</label>
                <input
                  required
                  type="text"
                  value={retRef}
                  onChange={(e) => setRetRef(e.target.value)}
                  placeholder="CEDO-TRIP-2026-000001"
                  className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2.5 text-sm font-mono uppercase"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#202B28]">
                  Private Retrieval Code
                </label>
                <input
                  required
                  type="text"
                  value={retCode}
                  onChange={(e) => setRetCode(e.target.value)}
                  placeholder="SALCEDO-XXXX-XXXX-XXXX"
                  className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2.5 text-sm font-mono uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={retLoading}
              className="w-full rounded-xl bg-[#123F35] text-white py-2.5 text-xs font-bold cursor-pointer"
            >
              {retLoading ? "Verifying..." : "Retrieve Itinerary"}
            </button>
          </form>

          {retrieved && (
            <div className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-4">
              <div className="space-y-1">
                <span className="font-mono text-[11px] font-bold text-[#168A8A]">
                  {retrieved.referenceNumber}
                </span>
                <h3 className="font-display text-lg font-bold text-[#202B28]">
                  {retrieved.title}
                </h3>
                <p className="text-xs text-[#5A6B66]">
                  Visit: <strong>{retrieved.plannedVisitDate}</strong> • {retrieved.totalStops} stops
                  {retrieved.tripSummary
                    ? ` • ${retrieved.tripSummary.travelerCount} from ${retrieved.tripSummary.originMunicipality}`
                    : ""}
                </p>
              </div>

              <div className="no-print grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadItineraryText(
                      retrieved.title,
                      retrieved.plannedVisitDate,
                      retrieved.stops,
                      retrieved.referenceNumber
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] py-2 text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] py-2 text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>

              {rotatedCode && (
                <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-950 space-y-1">
                  <p className="font-bold">New Private Retrieval Code Issued:</p>
                  <p className="font-mono text-sm font-bold select-all">{rotatedCode}</p>
                  <p>Save immediately — previous code has been invalidated.</p>
                </div>
              )}

              <ol className="space-y-2.5">
                {retrieved.stops.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-2.5 rounded-xl border border-[#E5E0D5] p-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#123F35] text-white text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                      {s.stopOrder}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/app/places/${s.placeSlug}`}
                        className="font-display font-bold text-xs text-[#202B28] hover:text-[#168A8A]"
                      >
                        {s.placeName}
                      </Link>
                      <p className="text-[11px] text-[#5A6B66] truncate">{s.placeAddress}</p>
                      {s.personalNotes && (
                        <p className="text-[11px] text-[#202B28] mt-0.5">{s.personalNotes}</p>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-[#168A8A] tabular-nums shrink-0">
                      {s.visitTime ? `${s.visitTime} • ` : ""}
                      {s.durationMinutes}m
                    </span>
                  </li>
                ))}
              </ol>

              {/* Privacy Controls: Rotate Code or Inline 2-Step Erasure */}
              <div className="no-print pt-3 border-t border-[#E5E0D5] space-y-2">
                <button
                  type="button"
                  onClick={() => void handleRotateCode()}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-white py-2.5 text-xs font-bold text-[#202B28] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Rotate Private Retrieval Code
                </button>

                {!confirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-800 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Trip &amp; Personal Data (RA 10173)
                  </button>
                ) : (
                  <div className="rounded-xl bg-rose-50 border border-rose-300 p-3 space-y-2">
                    <p className="text-xs font-bold text-rose-900">
                      Permanently delete {retrieved.referenceNumber} under RA 10173? This cannot be
                      undone.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        className="rounded-xl border border-[#E5E0D5] bg-white py-2 text-xs font-semibold text-[#5A6B66] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteRetrieved()}
                        className="rounded-xl bg-rose-700 text-white py-2 text-xs font-bold cursor-pointer"
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

      {/* TAB 3: SAVED PLACES & LOCAL RECEIPTS */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3">
            <h2 className="font-display text-base font-bold text-[#202B28]">
              Bookmarked Trip References ({localReceipts.length})
            </h2>
            {localReceipts.length === 0 ? (
              <p className="text-xs text-[#5A6B66]">
                Submitted trip references saved on this device will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {localReceipts.map((r) => (
                  <div
                    key={r.referenceNumber}
                    className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-bold text-[#123F35]">
                        {r.referenceNumber}
                      </p>
                      <p className="font-display font-bold text-xs text-[#202B28] truncate">
                        {r.title}
                      </p>
                      <p className="text-[11px] text-[#5A6B66]">
                        {r.plannedVisitDate} • {r.totalStops} stops
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRetRef(r.referenceNumber);
                        setActiveTab("retrieve");
                      }}
                      className="rounded-xl bg-[#123F35] text-white px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Retrieve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E0D5] p-4 space-y-3">
            <h2 className="font-display text-base font-bold text-[#202B28]">
              Saved Salcedo Places ({savedPlaces.length})
            </h2>
            {savedPlaces.length === 0 ? (
              <p className="text-xs text-[#5A6B66]">
                Tap the bookmark icon on any waterfall, resort, or eatery to save it offline.
              </p>
            ) : (
              <div className="space-y-2">
                {savedPlaces.map((p) => (
                  <Link
                    key={p.id}
                    href={`/app/places/${p.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-[#E5E0D5] p-2.5"
                  >
                    <img
                      src={p.featuredImageUrl || "/images/salcedo/hero-salcedo-valley.png"}
                      alt={p.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-display font-bold text-xs text-[#202B28] truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-[#168A8A] truncate">
                        {p.barangay ? `Brgy. ${p.barangay.name}` : p.address}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
