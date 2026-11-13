"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HomeSearchBar({
  placeholder = "Search Baluarte Falls, Bago Resort, barangays, tablea...",
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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-[#E5E0D5] p-1.5">
        <Search className="w-5 h-5 text-[#5A6B66] ml-3 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search Salcedo tourism directory"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm sm:text-base text-[#202B28] placeholder:text-[#5A6B66]/75 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#123F35] text-white px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold hover:bg-[#0D3029] transition cursor-pointer shrink-0"
        >
          Explore
        </button>
      </div>
    </form>
  );
}
