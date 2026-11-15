"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

export interface GalleryImage {
  url: string;
  caption?: string | null;
}

function Lightbox({
  name,
  images,
  index,
  setIndex,
  onClose,
}: {
  name: string;
  images: GalleryImage[];
  index: number;
  setIndex: (i: number) => void;
  onClose: () => void;
}) {
  const total = images.length;
  const current = images[Math.min(index, total - 1)];
  const go = (dir: 1 | -1) => setIndex((index + dir + total) % total);

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Photos of ${name}`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-white text-xs font-semibold tabular-nums">
          {index + 1} / {total} · {name}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photos"
          className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="relative flex-1">
        <Image
          key={current.url}
          src={current.url}
          alt={current.caption || name}
          fill
          sizes="100vw"
          className="object-contain"
        />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
      {current.caption && (
        <p className="px-4 pb-3 text-center text-xs text-white/80">{current.caption}</p>
      )}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {images.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Photo ${i + 1}`}
            aria-current={i === index}
            className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer ${
              i === index ? "ring-2 ring-[#1D7874]" : "opacity-60"
            }`}
          >
            <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Hero gallery: arrows, counter, caption, expand-to-lightbox.
 * Fills its (relative) parent.
 */
export function PlaceGallery({
  name,
  images,
}: {
  name: string;
  images: GalleryImage[];
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const total = images.length;
  if (total === 0) return null;
  const current = images[Math.min(index, total - 1)];
  const go = (dir: 1 | -1) => setIndex((index + dir + total) % total);

  return (
    <>
      <div className="relative w-full h-full">
        <Image
          key={current.url}
          src={current.url}
          alt={current.caption || name}
          fill
          priority={index === 0}
          sizes="100vw"
          className="object-cover animate-in fade-in duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/30 pointer-events-none" />

        <div className="absolute bottom-10 right-3 flex items-center gap-1.5 z-10">
          <span className="rounded-full bg-black/55 backdrop-blur-md text-white px-2.5 py-1 text-[11px] font-semibold tabular-nums">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="View photos fullscreen"
            className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition cursor-pointer"
          >
            <Expand className="w-4 h-4" />
          </button>
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition cursor-pointer z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {current.caption && (
          <p className="absolute bottom-10 left-3 z-10 max-w-[62%] rounded-full bg-black/55 backdrop-blur-md text-white px-3 py-1 text-[11px] font-medium truncate">
            {current.caption}
          </p>
        )}
      </div>

      {lightbox && (
        <Lightbox
          name={name}
          images={images}
          index={index}
          setIndex={setIndex}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
}

/** "Photos" strip in the page body — tap any photo to open the lightbox there. */
export function PlacePhotosSection({
  name,
  images,
}: {
  name: string;
  images: GalleryImage[];
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  if (images.length === 0) return null;

  const openAt = (i: number) => {
    setIndex(i);
    setLightbox(true);
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {images.map((img, i) => (
          <button
            key={`${img.url}-${i}`}
            type="button"
            onClick={() => openAt(i)}
            aria-label={`View photo ${i + 1} of ${name}${img.caption ? `: ${img.caption}` : ""}`}
            className="relative w-[68%] max-w-[260px] aspect-[4/3] rounded-2xl overflow-hidden shrink-0 active:scale-[0.99] transition cursor-pointer bg-[#F3F2EE]"
          >
            <Image
              src={img.url}
              alt={img.caption || name}
              fill
              sizes="(max-width: 430px) 68vw, 260px"
              className="object-cover"
            />
            {img.caption && (
              <span className="absolute bottom-2 left-2 max-w-[85%] rounded-full bg-black/55 backdrop-blur-md text-white px-2.5 py-0.5 text-[10px] font-medium truncate">
                {img.caption}
              </span>
            )}
          </button>
        ))}
      </div>
      {lightbox && (
        <Lightbox
          name={name}
          images={images}
          index={index}
          setIndex={setIndex}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
}
