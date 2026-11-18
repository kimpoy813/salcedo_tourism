"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Search } from "lucide-react";
import { FieldStamp, Kicker } from "@/components/ui/FieldGuide";

const scenes = [
  {
    file: "guide-valley.webp",
    title: "Buaya River Valley",
    alt: "An illustrated river winding through rice fields and the green foothills of Salcedo",
  },
  {
    file: "baluarte-falls.png",
    title: "Baluarte Falls",
    alt: "A forest cascade above an emerald pool, an illustration of Baluarte Falls",
  },
  {
    file: "plaza-heritage.png",
    title: "Salcedo Town Plaza",
    alt: "A view of the church and the tree-lined town plaza",
  },
];

export function HomeHero() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const scene = scenes[index];
  return (
    <section className="home-hero" aria-label="Welcome to Salcedo">
      <div className="hero-image" key={scene.file}>
        <Image
          src={`/images/salcedo/${scene.file}`}
          alt={scene.alt}
          fill
          unoptimized={index === 0}
          priority={index === 0}
          sizes="100vw"
        />
      </div>
      <div className="hero-shade" />
      <div className="guide-wrap hero-layout">
        <div className="hero-copy">
          <Kicker>Ilocos Sur, Philippines</Kicker>
          <h1>
            Salcedo, <em>naturally.</em>
          </h1>
          <p className="hero-deck">
            Your local guide to hidden waterfalls, mountain escapes, and the flavors of Ilocos Sur.
          </p>
          <form
            className="hero-search"
            action="/app/discover"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const query = String(new FormData(event.currentTarget).get("q") || "").trim();
              router.push(query ? `/app/discover?q=${encodeURIComponent(query)}` : "/app/discover");
            }}
          >
            <Search size={18} strokeWidth={1.7} />
            <input
              name="q"
              type="search"
              aria-label="Search the place directory"
              placeholder="Search places, cafés, waterfalls…"
            />
            <button aria-label="Search destinations" type="submit">
              <ArrowRight size={19} />
            </button>
          </form>
        </div>
        <FieldStamp />
        <div className="scene-controls">
          <div className="scene-caption" aria-live="polite">
            <span className="scene-label">
              Landscape <b>{String(index + 1).padStart(2, "0")}</b> / 03
            </span>
            <span>
              <MapPin size={13} />
              {scene.title}
            </span>
          </div>
          <button
            aria-label="Previous landscape"
            onClick={() => setIndex((index + scenes.length - 1) % scenes.length)}
          >
            <ChevronLeft size={17} />
          </button>
          <button aria-label="Next landscape" onClick={() => setIndex((index + 1) % scenes.length)}>
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
