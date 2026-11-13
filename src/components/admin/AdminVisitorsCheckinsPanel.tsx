"use client";

import React, { useState } from "react";
import { CheckCircle2, Download, Lock, ShieldAlert, Trash2, UserX, X } from "lucide-react";

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
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    action: "anonymize" | "delete";
  } | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "err" } | null>(null);

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
    setBusyId(id);
    setConfirmAction(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/visitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        setNotice({ text: err.error || "Retention action failed.", tone: "err" });
      } else {
        setNotice({
          text:
            action === "delete"
              ? "Record permanently deleted under RA 10173."
              : "Personal identifiers anonymized.",
          tone: "ok",
        });
        await onReload();
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#F3F2EE] p-3.5 flex items-start gap-2.5 text-xs text-[#1A2421]">
        <Lock className="w-4 h-4 text-[#164237] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">
            {canReadPii
              ? "Authorized PII Access Active (Audit Logged)"
              : "Personal Contact Details Restricted by Server RBAC"}
          </p>
          <p className="text-[#616E69]">
            {canReadPii
              ? "Your role holds 'visitor.pii.read'. Access is recorded in the audit log under RA 10173."
              : "Your role inspects de-identified origin and itinerary aggregates only."}
          </p>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-xl border px-3.5 py-2 text-xs flex items-center justify-between ${
            notice.tone === "err"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-white border-[#EAE7E0] text-[#164237]"
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[#616E69] hover:text-[#1A2421] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter & Export Bar */}
      <div className="bg-white rounded-2xl border border-[#EAE7E0] p-3 flex flex-wrap items-center justify-between gap-2.5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reference #, city, province..."
          className="w-full sm:w-72 rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-1.5 text-xs focus:outline-none"
        />

        {canExport && (
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/reports/export?format=csv"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-1.5 text-xs font-medium text-[#1A2421] hover:bg-[#F3F2EE]"
            >
              <Download className="w-3.5 h-3.5" />
              De-Identified CSV
            </a>
            {canReadPii && (
              <a
                href="/api/admin/reports/export?format=csv&includeContact=true"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-[#10322A]"
              >
                <Download className="w-3.5 h-3.5" />
                Full CSV
              </a>
            )}
          </div>
        )}
      </div>

      {/* Submissions */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE7E0] p-8 text-center text-xs text-[#616E69]">
            No visitor itinerary submissions found.
          </div>
        ) : (
          filtered.map((s) => {
            const isConfirming = confirmAction?.id === s.id;
            return (
              <article
                key={s.id}
                className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#164237]">
                        {s.referenceNumber}
                      </span>
                      {s.anonymizedAt && (
                        <span className="rounded-full bg-[#F3F2EE] text-[#616E69] px-2.5 py-0.5 text-[10px] font-medium">
                          Anonymized
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-sm text-[#1A2421]">
                      {s.itineraryTitle}
                    </h3>
                    <p className="text-xs text-[#616E69]">
                      {s.originMunicipality}, {s.originProvince} ({s.originCountry}) •{" "}
                      {s.plannedVisitDate} •{" "}
                      <strong className="text-[#1A2421] tabular-nums">
                        {s.travelerCount}
                      </strong>{" "}
                      guest(s)
                    </p>
                  </div>

                  {canDeletePii && (
                    <div className="flex items-center gap-1.5">
                      {isConfirming ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === s.id}
                            onClick={() =>
                              void handleRetentionAction(s.id, confirmAction.action)
                            }
                            className="rounded-full bg-rose-700 text-white px-3 py-1 text-[11px] font-semibold cursor-pointer"
                          >
                            Confirm{" "}
                            {confirmAction.action === "delete" ? "Delete" : "Anonymize"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmAction(null)}
                            className="rounded-full border border-[#EAE7E0] bg-white px-2.5 py-1 text-[11px] text-[#616E69] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {!s.anonymizedAt && (
                            <button
                              type="button"
                              disabled={busyId === s.id}
                              onClick={() =>
                                setConfirmAction({ id: s.id, action: "anonymize" })
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-[#EAE7E0] px-2.5 py-1 text-[11px] font-medium text-[#1A2421] hover:bg-[#FAF9F6] cursor-pointer"
                            >
                              <UserX className="w-3 h-3" /> Anonymize
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busyId === s.id}
                            onClick={() =>
                              setConfirmAction({ id: s.id, action: "delete" })
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-[#616E69]">
                  {s.purposeOfVisit && (
                    <span className="rounded-full bg-[#FAF9F6] border border-[#EAE7E0] px-2.5 py-0.5">
                      {s.purposeOfVisit}
                    </span>
                  )}
                  {s.transportationType && (
                    <span className="rounded-full bg-[#FAF9F6] border border-[#EAE7E0] px-2.5 py-0.5">
                      {s.transportationType}
                    </span>
                  )}
                  {s.lengthOfStay && (
                    <span className="rounded-full bg-[#FAF9F6] border border-[#EAE7E0] px-2.5 py-0.5">
                      {s.lengthOfStay}
                    </span>
                  )}
                </div>

                {s.stops.length > 0 && (
                  <p className="text-xs text-[#616E69]">
                    Route: {s.stops.map((st) => `${st.stopOrder}. ${st.placeName}`).join(" → ")}
                  </p>
                )}

                {canReadPii && s.contact && (
                  <div className="rounded-xl bg-[#FAF9F6] border border-[#EAE7E0] p-2.5 text-xs flex flex-wrap gap-4">
                    <span>
                      <strong>Name:</strong> {s.contact.visitorName || "—"}
                    </span>
                    <span>
                      <strong>Phone:</strong> {s.contact.contactNumber || "—"}
                    </span>
                    <span>
                      <strong>Email:</strong> {s.contact.emailAddress || "—"}
                    </span>
                    <span>
                      <strong>Follow-Up:</strong>{" "}
                      {s.contact.followUpConsentGiven ? "Yes" : "No"}
                    </span>
                  </div>
                )}
              </article>
            );
          })
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
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#F3F2EE] p-3.5 flex items-start gap-2.5 text-xs text-[#1A2421]">
        <ShieldAlert className="w-4 h-4 text-[#B88A44] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Verification-Gated Physical Arrival Policy</p>
          <p className="text-[#616E69]">
            Verified physical arrivals require staff check-in, official logbook entry, or
            rotating verification tokens.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-3 text-xs"
        >
          <h3 className="font-display text-sm font-bold text-[#1A2421]">
            Record Verified Arrival
          </h3>

          {err && (
            <p className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-rose-800">
              {err}
            </p>
          )}

          <div>
            <label className="font-medium text-[#616E69]">Destination *</label>
            <select
              required
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
            >
              {places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-medium text-[#616E69]">Method *</label>
            <select
              value={methodCode}
              onChange={(e) => setMethodCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
            >
              {methods.map((m) => (
                <option key={m.id} value={m.code}>
                  {m.name} ({m.reliabilityLabel})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-medium text-[#616E69]">Itinerary Ref</label>
              <input
                type="text"
                value={itineraryRef}
                onChange={(e) => setItineraryRef(e.target.value.toUpperCase())}
                placeholder="SLCD-..."
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2 font-mono uppercase"
              />
            </div>
            <div>
              <label className="font-medium text-[#616E69]">Group Size *</label>
              <input
                required
                type="number"
                min={1}
                max={200}
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="font-medium text-[#616E69]">Check-In Point *</label>
            <input
              required
              type="text"
              value={checkInSource}
              onChange={(e) => setCheckInSource(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
            />
          </div>

          <div>
            <label className="font-medium text-[#616E69]">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional logbook ref"
              className="mt-1 w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#164237] text-white py-2.5 text-xs font-semibold cursor-pointer"
          >
            {submitting ? "Recording..." : "Verify & Record"}
          </button>
        </form>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-bold text-[#1A2421]">
              Verified Arrival Log
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F2EE] text-[#164237] px-3 py-1 text-[11px] font-semibold tabular-nums">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {totalVerifiedArrivals} verified
            </span>
          </div>

          {checkins.length === 0 ? (
            <p className="text-xs text-[#616E69]">No verified check-ins logged yet.</p>
          ) : (
            <ul className="divide-y divide-[#EAE7E0] text-xs">
              {checkins.map((c) => (
                <li key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1A2421]">{c.placeName}</p>
                    <p className="text-[11px] text-[#616E69]">
                      {c.methodName} • {c.checkInSource}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-[#164237] tabular-nums">
                      +{c.groupSize}
                    </p>
                    <p className="text-[10px] text-[#616E69] tabular-nums">
                      {new Date(c.checkedInAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
