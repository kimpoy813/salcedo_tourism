"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Globe2,
  MapPin,
  Mountain,
  Route,
  Search,
  Waves,
  X,
} from "lucide-react";
import {
  normalizeMapText,
  searchAtlas,
  type MapBarangayItem,
  type MappedPlace,
  type MapHit,
} from "@/lib/geo/atlas";
import { isInsideSalcedo } from "@/lib/geo/salcedo-boundary";

export function AtlasSearch({
  places,
  areas,
  lines,
  online,
  onChoose,
}: {
  places: MappedPlace[];
  areas: MapBarangayItem[];
  lines: MapHit[];
  online: boolean;
  onChoose: (hit: MapHit) => void;
}) {
  const [q, setQ] = useState(""),
    [open, setOpen] = useState(false),
    [idx, setIdx] = useState(-1),
    [remote, setRemote] = useState<MapHit[]>([]),
    [state, setState] = useState<"idle" | "loading" | "done" | "failed">(
      "idle",
    );
  const root = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null),
    req = useRef<AbortController | null>(null),
    id = useId();
  const local = useMemo(
    () => searchAtlas(q, places, areas, lines),
    [q, places, areas, lines],
  );
  const hits = useMemo(() => {
    const keys = new Set(local.map((h) => normalizeMapText(h.label)));
    return [
      ...local,
      ...remote.filter((h) => !keys.has(normalizeMapText(h.label))),
    ];
  }, [local, remote]);
  const expanded = !!q.trim() && open;
  function resetRequest() {
    req.current?.abort();
    setRemote([]);
    setState("idle");
    setIdx(-1);
  }
  function change(text: string) {
    setQ(text);
    setOpen(true);
    resetRequest();
  }
  function choose(hit: MapHit) {
    setQ("");
    setOpen(false);
    resetRequest();
    onChoose(hit);
  }
  function close() {
    setOpen(false);
    setIdx(-1);
  }
  useEffect(() => () => req.current?.abort(), []);
  useEffect(() => {
    function outside(e: PointerEvent) {
      if (root.current && !root.current.contains(e.target as Node)) close();
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => {
    if (expanded && idx >= 0)
      document
        .getElementById(`${id}-${idx}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [idx, id, expanded]);
  // Public Nominatim does not permit autocomplete. The local index handles
  // keystrokes; a remote lookup is only sent when the visitor asks for one.
  async function searchOnline() {
    // Keep focus in the combobox when the lookup button disables or disappears.
    input.current?.focus({ preventScroll: true });
    req.current?.abort();
    const ctrl = new AbortController();
    req.current = ctrl;
    setState("loading");
    try {
      const r = await fetch(
        `/api/geo/search?q=${encodeURIComponent(q.trim())}`,
        { signal: ctrl.signal },
      );
      if (!r.ok) throw Error();
      const d = await r.json();
      if (ctrl.signal.aborted) return;
      setRemote(
        (Array.isArray(d.results) ? d.results : []).filter(
          (h: MapHit) =>
            h.kind === "osm" && isInsideSalcedo(h.latitude, h.longitude),
        ),
      );
      setState(d.osmEnabled ? "done" : "failed");
    } catch {
      if (!ctrl.signal.aborted) setState("failed");
    }
  }
  return (
    <div
      className="atlas-search"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) close();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          input.current?.focus();
          close();
        }
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search the Salcedo map
      </label>
      <Search size={16} aria-hidden="true" />
      <input
        ref={input}
        id={id}
        type="text"
        autoComplete="off"
        maxLength={100}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={id + "-results"}
        aria-expanded={expanded}
        aria-activedescendant={
          expanded && idx >= 0 ? `${id}-${idx}` : undefined
        }
        placeholder="Search places, roads, barangays…"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => {
          if (!q.trim()) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            if (hits.length)
              setIdx((n) =>
                e.key === "ArrowDown"
                  ? (n + 1) % hits.length
                  : n <= 0
                    ? hits.length - 1
                    : n - 1,
              );
          }
          if (e.key === "Enter" && expanded && hits.length) {
            e.preventDefault();
            choose(hits[idx >= 0 ? idx : 0]);
          }
        }}
      />
      {q && (
        <button
          className="atlas-clear"
          type="button"
          aria-label="Clear map search"
          onClick={() => {
            change("");
            input.current?.focus();
          }}
        >
          <X size={14} />
        </button>
      )}
      <div className="atlas-search-popup" hidden={!expanded}>
        <div className="atlas-search-caption">
          <span>Municipal index</span>
          <b>
            {hits.length} {hits.length === 1 ? "match" : "matches"}
          </b>
        </div>
        <div
          role="listbox"
          id={id + "-results"}
          aria-label="Map search results"
        >
          {hits.map((h, i) => {
            const Icon =
              h.kind === "road"
                ? Route
                : h.kind === "water"
                  ? Waves
                  : h.kind === "barangay"
                    ? Mountain
                    : MapPin;
            return (
              <button
                type="button"
                role="option"
                key={h.id}
                id={`${id}-${i}`}
                aria-selected={idx === i}
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(h)}
              >
                <Icon size={16} />
                <span>
                  <b>{h.label}</b>
                  <small>{h.subtitle}</small>
                </span>
                <ArrowUpRight size={14} />
              </button>
            );
          })}
        </div>
        {!hits.length && (
          <p>No matches in the field index. Try another name.</p>
        )}
        <div className="atlas-online-search">
          {online && q.trim().length >= 2 && state !== "done" && (
            <button
              type="button"
              disabled={state === "loading"}
              onClick={searchOnline}
            >
              <Globe2 size={13} />
              {state === "loading"
                ? "Searching…"
                : state === "failed"
                  ? "Retry online search"
                  : "Search OpenStreetMap online"}
            </button>
          )}
          <small role="status">
            {!online
              ? "Offline · using the field index"
              : state === "failed"
                ? "Online search is unavailable. Local results still work."
                : state === "done"
                  ? "Online search complete."
                  : ""}
          </small>
        </div>
      </div>
    </div>
  );
}
