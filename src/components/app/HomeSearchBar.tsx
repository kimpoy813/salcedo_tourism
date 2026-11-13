"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

const QUICK_SEARCHES = ["Baluarte Falls", "Spring Resort", "Tablea", "Cafés", "Poblacion"];

export function HomeSearchBar({
  placeholder = "Search falls, springs, cafés...",
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
    <div className="w-full space-y-2.5">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center bg-white rounded-full border border-[#EAE7E0] pl-3.5 pr-1.5 py-1 shadow-2xs focus-within:border-[#164237]/40 transition">
          <Search className="w-4 h-4 text-[#616E69] shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            aria-label="Search Salcedo tourism directory"
            className="flex-1 min-w-0 bg-transparent px-2.5 py-1.5 text-sm text-[#1A2421] placeholder:text-[#616E69]/70 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="w-8 h-8 rounded-full bg-[#164237] text-white flex items-center justify-center active:scale-90 transition cursor-pointer shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
        {QUICK_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => router.push(`/app/discover?q=${encodeURIComponent(term)}`)}
            className="shrink-0 rounded-full bg-white border border-[#EAE7E0] active:scale-95 px-3 py-1 text-[11px] font-medium text-[#1A2421] transition cursor-pointer"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
