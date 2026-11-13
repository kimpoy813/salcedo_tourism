import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import {
  getPlaceRatingsSummary,
  resolvePublishedPlace,
} from "@/lib/queries/public-tourism";
import {
  VISITOR_SESSION_COOKIE,
  resolveOrCreateAnonymousSession,
} from "@/lib/analytics";
import { checkRateLimit, getClientThrottleKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const submitRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  reviewerName: z.string().trim().max(60).optional().nullable(),
  originLabel: z.string().trim().max(80).optional().nullable(),
  travelerType: z
    .enum(["Solo", "Couple", "Family", "Barkada", "Leisure"])
    .optional()
    .default("Leisure"),
  comment: z.string().trim().max(500).optional().nullable(),
  reviewerToken: z.string().trim().min(6).max(128).optional().nullable(),
});

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const place = await resolvePublishedPlace(id);
    if (!place) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }
    const summary = await getPlaceRatingsSummary(place.id);
    return NextResponse.json({
      placeId: place.id,
      placeName: place.name,
      ...summary,
    });
  } catch (err) {
    console.error("[GET /api/places/[id]/ratings]", err);
    return NextResponse.json({ error: "Failed to load tourist ratings." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rl = checkRateLimit(getClientThrottleKey(req, "place_rating"), 30, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many rating requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const { id } = await context.params;
    const place = await resolvePublishedPlace(id);
    if (!place) {
      return NextResponse.json({ error: "Destination not found." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = submitRatingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please select 1 to 5 stars and check your feedback length." },
        { status: 400 }
      );
    }

    const session = await resolveOrCreateAnonymousSession({
      req,
      entryPath: `/app/places/${place.slug}`,
    });

    const reviewerToken =
      parsed.data.reviewerToken?.trim() || `anon-${session.sessionToken}`;
    const reviewerName =
      parsed.data.reviewerName && parsed.data.reviewerName.length > 0
        ? parsed.data.reviewerName
        : "Salcedo Visitor";
    const originLabel =
      parsed.data.originLabel && parsed.data.originLabel.length > 0
        ? parsed.data.originLabel
        : null;
    const comment =
      parsed.data.comment && parsed.data.comment.length > 0
        ? parsed.data.comment
        : null;

    const db = await getDb();
    const now = new Date();

    const [saved] = await db
      .insert(schema.placeRatings)
      .values({
        placeId: place.id,
        anonymousSessionId: session.sessionId,
        reviewerToken,
        reviewerName,
        originLabel,
        rating: parsed.data.rating,
        comment,
        travelerType: parsed.data.travelerType,
        status: "published",
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [schema.placeRatings.placeId, schema.placeRatings.reviewerToken],
        set: {
          rating: parsed.data.rating,
          reviewerName,
          originLabel,
          comment,
          travelerType: parsed.data.travelerType,
          updatedAt: now,
        },
      })
      .returning();

    const summary = await getPlaceRatingsSummary(place.id);
    const res = NextResponse.json(
      {
        review: {
          id: saved.id,
          reviewerName: saved.reviewerName,
          originLabel: saved.originLabel,
          rating: saved.rating,
          comment: saved.comment,
          travelerType: saved.travelerType,
          createdAt: saved.createdAt.toISOString(),
          updatedAt: saved.updatedAt.toISOString(),
        },
        summary,
      },
      { status: 201 }
    );

    res.cookies.set(VISITOR_SESSION_COOKIE, session.sessionToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    console.error("[POST /api/places/[id]/ratings]", err);
    return NextResponse.json({ error: "Could not save your rating." }, { status: 500 });
  }
}
