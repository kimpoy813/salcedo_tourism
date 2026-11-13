"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

export function HomeSearchBar({
  placeholder = "Search waterfalls, resorts, cafés...",
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
    <form onSubmit={handleSubmit} className="w-full min-w-0">
      <div className="w-full flex items-center bg-white rounded-full border border-[#EAE7E0] pl-3.5 pr-1.5 py-1 shadow-2xs focus-within:border-[#164237]/40 transition">
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
  );
}
