"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const QUICK_SEARCHES = ["Baluarte Falls", "Spring Resort", "Tablea", "Poblacion"];

export function HomeSearchBar({
  placeholder = "Search waterfalls, resorts, barangays...",
}: {
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/app/discover");
      return;
    }
    router.push(`/app/discover?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="w-full space-y-2">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-[#E5E0D5] p-1">
          <Search className="w-4 h-4 text-[#5A6B66] ml-3 shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="Search Salcedo tourism directory"
            className="flex-1 min-w-0 bg-transparent px-2.5 py-2 text-sm text-[#202B28] placeholder:text-[#5A6B66]/75 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#123F35] text-white px-3.5 py-2 text-xs font-bold hover:bg-[#0D3029] transition cursor-pointer shrink-0"
          >
            Search
          </button>
        </div>
      </form>

      {/* 1-Tap Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70 shrink-0">
          Try:
        </span>
        {QUICK_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => router.push(`/app/discover?q=${encodeURIComponent(term)}`)}
            className="shrink-0 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 px-2.5 py-1 text-[11px] font-medium text-white transition cursor-pointer"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
