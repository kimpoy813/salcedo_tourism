"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Compass, Lightbulb, Route, Send, X } from "lucide-react";
import { useMobileApp } from "./MobileAppContext";

const WELCOME_KEY = "cedo_welcome_dismissed_v1";

/**
 * The whole tourist journey in 3 easy steps — no account, nothing mandatory.
 * Step state is live: it reflects how many stops are already in the trip.
 */
export function JourneySteps() {
  const { draftStopCount } = useMobileApp();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(WELCOME_KEY) === "1";
    } catch {
      return false;
    }
  });

  const hasTrip = draftStopCount > 0;

  const steps = [
    {
      icon: Compass,
      title: "Explore",
      desc: "Browse waterfalls, food & stays",
      done: hasTrip,
      active: !hasTrip,
    },
    {
      icon: Route,
      title: hasTrip ? `${draftStopCount} in your trip` : "Add to Trip",
      desc: "Tap “+ Add” on any place — that’s it",
      done: false,
      active: hasTrip,
    },
    {
      icon: Send,
      title: "Save & go",
      desc: "Download, print, or just show up",
      done: false,
      active: false,
    },
  ];

  return (
    <section className="bg-white rounded-2xl border border-[#EAE7E0] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-bold text-[#1A2421]">
            Plan your Salcedo trip in 3 easy steps
          </h2>
          <p className="text-[11px] text-[#616E69]">
            No account. No forms unless you want them. Everything else is optional.
          </p>
        </div>
        {!dismissed && (
          <button
            type="button"
            aria-label="Dismiss welcome"
            onClick={() => {
              setDismissed(true);
              try {
                window.localStorage.setItem(WELCOME_KEY, "1");
              } catch { /* ignore */ }
            }}
            className="p-1 text-[#616E69] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <ol className="grid grid-cols-3 gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              className={`rounded-xl border p-2.5 text-center space-y-1 ${
                s.active
                  ? "border-[#164237] bg-[#164237]/5"
                  : "border-[#EAE7E0] bg-[#FAF9F6]"
              }`}
            >
              <span
                className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center ${
                  s.done
                    ? "bg-[#164237] text-white"
                    : s.active
                      ? "bg-[#164237] text-white"
                      : "bg-white border border-[#EAE7E0] text-[#616E69]"
                }`}
              >
                {s.done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </span>
              <p className="text-[11px] font-bold text-[#1A2421] leading-tight">
                {i + 1}. {s.title}
              </p>
              <p className="text-[10px] text-[#616E69] leading-snug">{s.desc}</p>
            </li>
          );
        })}
      </ol>

      <Link
        href={hasTrip ? "/app/trips" : "/app/discover"}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#164237] text-white py-3 text-xs font-semibold active:scale-[0.98] transition"
      >
        {hasTrip ? `Continue my trip (${draftStopCount} ${draftStopCount === 1 ? "stop" : "stops"}) →` : "Start exploring →"}
      </Link>
      {!hasTrip && !dismissed && (
        <p className="text-[11px] text-[#616E69] text-center inline-flex items-center justify-center gap-1 w-full">
          <Lightbulb className="w-3.5 h-3.5 text-[#B88A44] shrink-0" />
          Registration and ratings are always optional — they just help Salcedo count and thank its visitors.
        </p>
      )}
    </section>
  );
}
