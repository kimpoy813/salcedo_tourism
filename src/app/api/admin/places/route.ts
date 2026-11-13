import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasPermission, recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";
import { placeMutationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApiAuth("content.edit");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const db = await getDb();
  const [places, barangays, categories, cafes, resorts, restaurants, attractions] =
    await Promise.all([
      db.select().from(schema.places).orderBy(desc(schema.places.updatedAt)),
      db.select().from(schema.barangays).orderBy(asc(schema.barangays.name)),
      db.select().from(schema.placeCategories).orderBy(asc(schema.placeCategories.displayOrder)),
      db.select().from(schema.cafeDetails),
      db.select().from(schema.resortDetails),
      db.select().from(schema.restaurantDetails),
      db.select().from(schema.attractionDetails),
    ]);

  const brgyMap = new Map(barangays.map((b) => [b.id, b]));
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const cafeMap = new Map(cafes.map((c) => [c.placeId, c]));
  const resortMap = new Map(resorts.map((c) => [c.placeId, c]));
  const restaurantMap = new Map(restaurants.map((c) => [c.placeId, c]));
  const attractionMap = new Map(attractions.map((c) => [c.placeId, c]));

  return NextResponse.json({
    places: places.map((p) => ({
      ...p,
      barangayName: p.barangayId ? brgyMap.get(p.barangayId)?.name ?? null : null,
      categoryName: p.primaryCategoryId ? catMap.get(p.primaryCategoryId)?.name ?? null : null,
      cafeDetails: cafeMap.get(p.id) ?? null,
      resortDetails: resortMap.get(p.id) ?? null,
      restaurantDetails: restaurantMap.get(p.id) ?? null,
      attractionDetails: attractionMap.get(p.id) ?? null,
    })),
    barangays,
    categories,
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApiAuth("content.edit");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = placeMutationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid place fields.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = parsed.data;
    // Content Editors without content.publish cannot publish or archive directly
    if (
      (input.status === "published" || input.status === "archived") &&
      !hasPermission(auth.principal, "content.publish")
    ) {
      return NextResponse.json(
        {
          error:
            "Content Editors can save 'draft' or 'pending_review' records only. Publishing requires Tourism Administrator or Super Administrator approval.",
        },
        { status: 403 }
      );
    }

    const db = await getDb();
    const [existingSlug] = await db
      .select({ id: schema.places.id })
      .from(schema.places)
      .where(eq(schema.places.slug, input.slug))
      .limit(1);

    if (existingSlug) {
      return NextResponse.json({ error: "A place with this slug already exists." }, { status: 409 });
    }

    const created = await db.transaction(async (tx) => {
      const [place] = await tx
        .insert(schema.places)
        .values({
          name: input.name,
          slug: input.slug,
          shortDescription: input.shortDescription,
          description: input.description,
          placeType: input.placeType,
          primaryCategoryId: input.primaryCategoryId ?? null,
          barangayId: input.barangayId ?? null,
          address: input.address,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
          phone: input.phone ?? null,
          email: input.email ?? null,
          websiteUrl: input.websiteUrl ?? null,
          socialMediaUrl: input.socialMediaUrl ?? null,
          featuredImageUrl: input.featuredImageUrl ?? "/images/salcedo/hero-salcedo-valley.png",
          featuredImageCaption: input.featuredImageCaption ?? null,
          isFeatured: input.isFeatured,
          isHiddenGem: input.isHiddenGem,
          isPlaceholder: input.isPlaceholder,
          status: input.status,
          sourceReference: input.sourceReference,
          verificationDate: input.verificationDate ?? null,
          publishedAt: input.status === "published" ? new Date() : null,
          createdByAdminId: auth.principal.id,
          updatedByAdminId: auth.principal.id,
        })
        .returning();

      if (input.primaryCategoryId) {
        await tx
          .insert(schema.placeCategoryAssignments)
          .values({ placeId: place.id, categoryId: input.primaryCategoryId })
          .onConflictDoNothing();
      }

      if (input.cafeDetails) {
        await tx.insert(schema.cafeDetails).values({ placeId: place.id, ...input.cafeDetails });
      }
      if (input.resortDetails) {
        await tx.insert(schema.resortDetails).values({ placeId: place.id, ...input.resortDetails });
      }
      if (input.restaurantDetails) {
        await tx
          .insert(schema.restaurantDetails)
          .values({ placeId: place.id, ...input.restaurantDetails });
      }
      if (input.attractionDetails) {
        await tx
          .insert(schema.attractionDetails)
          .values({ placeId: place.id, ...input.attractionDetails });
      }

      await tx.insert(schema.contentRevisions).values({
        entityType: "place",
        entityId: place.id,
        versionNumber: 1,
        status: place.status,
        snapshotJson: place as unknown as Record<string, unknown>,
        editedByAdminId: auth.principal.id,
        changeNote: "Initial creation",
      });

      return place;
    });

    await recordAuditLog({
      principal: auth.principal,
      action: "place.create",
      targetType: "place",
      targetId: created.id,
      summary: `Created place '${created.name}' with status '${created.status}'.`,
    });

    return NextResponse.json({ place: created }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/places]", err);
    return NextResponse.json({ error: "Failed to create place." }, { status: 500 });
  }
}
