import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getPublishedPlaceByIdOrSlug } from "@/lib/queries/public-tourism";
import { guideArtSrc, placeMedia } from "@/lib/visitor-media";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDTH = 1200;
const HEIGHT = 630;

async function sourceBuffer(url: string): Promise<Buffer | null> {
  try {
    if (url.startsWith("/")) {
      return await readFile(path.join(process.cwd(), "public", url.replace(/^\/+/, "")));
    }
    if (/^https:\/\//i.test(url)) {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    }
  } catch {
    return null;
  }
  return null;
}

/** A 1200×630 JPEG share card, because several scrapers still reject WebP. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const place = await getPublishedPlaceByIdOrSlug((await params).slug);
  if (!place) return new NextResponse("Not found", { status: 404 });

  const media = placeMedia(place.featuredImageUrl, place.featuredImageCaption, place.images);
  const lead = media[0]?.url;
  const local = lead ? guideArtSrc(lead, "cover") ?? lead : null;
  const fallback = path.join(process.cwd(), "public", DEFAULT_OG_IMAGE.url.replace(/^\/+/, ""));
  const buffer =
    (local ? await sourceBuffer(local) : null) ??
    (lead ? await sourceBuffer(lead) : null) ??
    (await readFile(fallback));

  const image = await sharp(buffer)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "attention" })
    .jpeg({ quality: 72, mozjpeg: true })
    .toBuffer();

  return new NextResponse(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
