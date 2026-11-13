"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Download,
  Lock,
  ShieldAlert,
  Trash2,
  UserX,
} from "lucide-react";

export interface AdminVisitorRow {
  id: string;
  referenceNumber: string;
  itineraryTitle: string;
  itineraryStatus: string;
  originMunicipality: string;
  originProvince: string;
  originCountry: string;
  plannedVisitDate: string;
  travelerCount: number;
  purposeOfVisit: string | null;
  transportationType: string | null;
  lengthOfStay: string | null;
  privacyNoticeVersion: string;
  anonymizedAt: string | null;
  stops: Array<{ placeName: string; stopOrder: number; visitTime: string | null }>;
  piiRestricted: boolean;
  contact: {
    visitorName: string | null;
    contactNumber: string | null;
    emailAddress: string | null;
    followUpConsentGiven: boolean;
  } | null;
}

export function AdminVisitorsPanel({
  submissions,
  canReadPii,
  canDeletePii,
  canExport,
  onReload,
}: {
  submissions: AdminVisitorRow[];
  canReadPii: boolean;
  canDeletePii: boolean;
  canExport: boolean;
  onReload: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = submissions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.referenceNumber.toLowerCase().includes(q) ||
      s.originMunicipality.toLowerCase().includes(q) ||
      s.originProvince.toLowerCase().includes(q) ||
      (s.contact?.visitorName || "").toLowerCase().includes(q)
    );
  });

  const handleRetentionAction = async (id: string, action: "anonymize" | "delete") => {
    const label =
      action === "delete"
        ? "permanently delete this visitor submission and itinerary"
        : "anonymize all personal contact identifiers while retaining de-identified aggregate statistics";
    if (!window.confirm(`Are you sure you want to ${label} under RA 10173?`)) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/visitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Retention action failed.");
      } else {
        await onReload();
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* RBAC PII Banner */}
      <div
        className={`rounded-2xl border p-4 flex items-start gap-3 text-xs ${
          canReadPii
            ? "bg-emerald-50 border-emerald-200 text-emerald-950"
            : "bg-amber-50 border-amber-200 text-amber-950"
        }`}
      >
        <Lock className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">
            {canReadPii
              ? "Authorized PII Access Active (Audit Logged)"
              : "Personal Contact Details Restricted by Server RBAC"}
          </p>
          <p className="opacity-85">
            {canReadPii
              ? "Your role holds 'visitor.pii.read'. Access to optional contact details is recorded in the immutable audit log under RA 10173."
              : "Your role can inspect de-identified travel origin and planned itinerary aggregates only. Optional names, phones, and emails are withheld server-side."}
          </p>
        </div>
      </div>

      {/* Filter & Export Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E0D5] p-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reference #, municipality, province..."
          className="w-full sm:w-72 rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3.5 py-2 text-xs sm:text-sm"
        />

        {canExport && (
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/reports/export?format=csv"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3.5 py-2 text-xs font-bold text-[#202B28]"
            >
              <Download className="w-3.5 h-3.5" />
              Export De-Identified CSV
            </a>
            {canReadPii && (
              <a
                href="/api/admin/reports/export?format=csv&includeContact=true"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#123F35] text-white px-3.5 py-2 text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                Export Authorized Full CSV
              </a>
            )}
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E5E0D5] p-8 text-center text-sm text-[#5A6B66]">
            No visitor itinerary submissions found yet.
          </div>
        ) : (
          filtered.map((s) => (
            <article
              key={s.id}
              className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#123F35]">
                      {s.referenceNumber}
                    </span>
                    {s.anonymizedAt && (
                      <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[10px] font-bold">
                        ANONYMIZED (RA 10173)
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-base text-[#202B28]">
                    {s.itineraryTitle}
                  </h3>
                  <p className="text-xs text-[#5A6B66]">
                    Origin: <strong>{s.originMunicipality}, {s.originProvince}</strong> (
                    {s.originCountry}) • Planned Visit: <strong>{s.plannedVisitDate}</strong> •{" "}
                    <strong className="tabular-nums">{s.travelerCount}</strong> traveler(s)
                  </p>
                </div>

                {canDeletePii && (
                  <div className="flex gap-2">
                    {!s.anonymizedAt && (
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => void handleRetentionAction(s.id, "anonymize")}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E5E0D5] px-2.5 py-1.5 text-xs font-semibold text-[#202B28] hover:bg-[#F8F7F2] cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" /> Anonymize PII
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === s.id}
                      onClick={() => void handleRetentionAction(s.id, "delete")}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {s.purposeOfVisit && (
                  <span className="rounded-lg bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1">
                    Purpose: {s.purposeOfVisit}
                  </span>
                )}
                {s.transportationType && (
                  <span className="rounded-lg bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1">
                    Transport: {s.transportationType}
                  </span>
                )}
                {s.lengthOfStay && (
                  <span className="rounded-lg bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1">
                    Stay: {s.lengthOfStay}
                  </span>
                )}
                <span className="rounded-lg bg-[#F8F7F2] border border-[#E5E0D5] px-2.5 py-1">
                  Privacy Notice: v{s.privacyNoticeVersion}
                </span>
              </div>

              {s.stops.length > 0 && (
                <p className="text-xs text-[#5A6B66]">
                  <strong>Planned Route:</strong>{" "}
                  {s.stops.map((st) => `${st.stopOrder}. ${st.placeName}`).join(" → ")}
                </p>
              )}

              {canReadPii && s.contact && (
                <div className="rounded-xl bg-[#123F35]/5 border border-[#123F35]/20 p-3 text-xs flex flex-wrap gap-4">
                  <span>
                    <strong>Name:</strong> {s.contact.visitorName || "Not provided"}
                  </span>
                  <span>
                    <strong>Phone:</strong> {s.contact.contactNumber || "Not provided"}
                  </span>
                  <span>
                    <strong>Email:</strong> {s.contact.emailAddress || "Not provided"}
                  </span>
                  <span>
                    <strong>Follow-Up Consent:</strong>{" "}
                    {s.contact.followUpConsentGiven ? "Yes (Affirmative)" : "No"}
                  </span>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminCheckinsPanel({
  methods,
  places,
  checkins,
  totalVerifiedArrivals,
  onReload,
}: {
  methods: Array<{ id: string; code: string; name: string; reliabilityLabel: string }>;
  places: Array<{ id: string; name: string; placeType: string }>;
  checkins: Array<{
    id: string;
    placeName: string;
    methodName: string;
    reliabilityLabel: string;
    groupSize: number;
    checkInSource: string;
    checkedInAt: string;
    notes: string | null;
  }>;
  totalVerifiedArrivals: number;
  onReload: () => Promise<void>;
}) {
  const [placeId, setPlaceId] = useState(places[0]?.id || "");
  const [methodCode, setMethodCode] = useState("staff_assisted");
  const [itineraryRef, setItineraryRef] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [checkInSource, setCheckInSource] = useState("CEDO Tourism Reception Desk");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId,
          verificationMethodCode: methodCode,
          itineraryReferenceNumber: itineraryRef.trim() || null,
          groupSize: Number(groupSize) || 1,
          checkInSource,
          notes: notes.trim() || null,
          clientNonce: `nonce-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Check-in failed.");
        return;
      }
      setItineraryRef("");
      setNotes("");
      await onReload();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-xs text-amber-950">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Verification-Gated Physical Arrival Policy</p>
          <p>
            Static public QR posters alone cannot count toward{" "}
            <strong>Actual Tourist Visits</strong> because they are vulnerable to remote
            re-scanning. Verified arrivals require authorized staff check-in, official municipal
            logbook entry, or rotating token verification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4"
        >
          <h3 className="font-display text-lg font-bold text-[#202B28]">
            Record Verified Physical Arrival
          </h3>

          {err && (
            <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              {err}
            </p>
          )}

          <div>
            <label className="text-xs font-bold text-[#202B28]">Destination *</label>
            <select
              required
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
            >
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#202B28]">Verification Method *</label>
            <select
              value={methodCode}
              onChange={(e) => setMethodCode(e.target.value)}
              className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
            >
              {methods.map((m) => (
                <option key={m.id} value={m.code}>
                  {m.name} ({m.reliabilityLabel})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#202B28]">Group Size *</label>
              <input
                required
                type="number"
                min={1}
                max={500}
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value) || 1)}
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#202B28]">
                Trip Ref # (Optional)
              </label>
              <input
                type="text"
                value={itineraryRef}
                onChange={(e) => setItineraryRef(e.target.value)}
                placeholder="CEDO-TRIP-2026-..."
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#202B28]">Check-In Point / Source *</label>
            <input
              required
              type="text"
              value={checkInSource}
              onChange={(e) => setCheckInSource(e.target.value)}
              className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#202B28]">Verification Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional logbook ref or gate note"
              className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#123F35] text-white py-2.5 text-sm font-bold cursor-pointer"
          >
            {submitting ? "Recording..." : "Verify & Record Arrival"}
          </button>
        </form>

        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-[#202B28]">
              Verified Physical Arrival Log
            </h3>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-900 px-3 py-1 text-xs font-bold tabular-nums">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Total: {totalVerifiedArrivals} verified visitors
            </span>
          </div>

          {checkins.length === 0 ? (
            <p className="text-sm text-[#5A6B66]">
              No verified on-site check-ins logged yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {checkins.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-sm text-[#202B28]">{c.placeName}</p>
                    <p className="text-[#5A6B66]">
                      {c.methodName} • Source: {c.checkInSource}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#123F35] tabular-nums">
                      +{c.groupSize} visitor(s)
                    </p>
                    <p className="text-[11px] text-[#5A6B66]">
                      {new Date(c.checkedInAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
