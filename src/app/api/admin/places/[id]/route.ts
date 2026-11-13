import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasPermission, recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";
import { placeMutationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiAuth("content.edit");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const db = await getDb();

    const [existing] = await db
      .select()
      .from(schema.places)
      .where(eq(schema.places.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Place not found." }, { status: 404 });
    }

    const partialSchema = placeMutationSchema.partial();
    const parsed = partialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update fields.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = parsed.data;
    if (
      input.status &&
      (input.status === "published" || input.status === "archived") &&
      !hasPermission(auth.principal, "content.publish")
    ) {
      return NextResponse.json(
        {
          error:
            "Publishing or archiving requires Tourism Administrator or Super Administrator permission.",
        },
        { status: 403 }
      );
    }

    const nextStatus = input.status ?? existing.status;
    const updated = await db.transaction(async (tx) => {
      const [place] = await tx
        .update(schema.places)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.shortDescription !== undefined
            ? { shortDescription: input.shortDescription }
            : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.placeType !== undefined ? { placeType: input.placeType } : {}),
          ...(input.primaryCategoryId !== undefined
            ? { primaryCategoryId: input.primaryCategoryId }
            : {}),
          ...(input.barangayId !== undefined ? { barangayId: input.barangayId } : {}),
          ...(input.address !== undefined ? { address: input.address } : {}),
          ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
          ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.websiteUrl !== undefined ? { websiteUrl: input.websiteUrl } : {}),
          ...(input.socialMediaUrl !== undefined ? { socialMediaUrl: input.socialMediaUrl } : {}),
          ...(input.featuredImageUrl !== undefined
            ? { featuredImageUrl: input.featuredImageUrl }
            : {}),
          ...(input.featuredImageCaption !== undefined
            ? { featuredImageCaption: input.featuredImageCaption }
            : {}),
          ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
          ...(input.isHiddenGem !== undefined ? { isHiddenGem: input.isHiddenGem } : {}),
          ...(input.isPlaceholder !== undefined ? { isPlaceholder: input.isPlaceholder } : {}),
          ...(input.sourceReference !== undefined
            ? { sourceReference: input.sourceReference }
            : {}),
          ...(input.verificationDate !== undefined
            ? { verificationDate: input.verificationDate }
            : {}),
          status: nextStatus,
          publishedAt:
            nextStatus === "published" && !existing.publishedAt
              ? new Date()
              : existing.publishedAt,
          updatedByAdminId: auth.principal.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.places.id, id))
        .returning();

      if (input.cafeDetails) {
        await tx
          .insert(schema.cafeDetails)
          .values({ placeId: id, ...input.cafeDetails })
          .onConflictDoUpdate({
            target: schema.cafeDetails.placeId,
            set: input.cafeDetails,
          });
      }
      if (input.resortDetails) {
        await tx
          .insert(schema.resortDetails)
          .values({ placeId: id, ...input.resortDetails })
          .onConflictDoUpdate({
            target: schema.resortDetails.placeId,
            set: input.resortDetails,
          });
      }
      if (input.restaurantDetails) {
        await tx
          .insert(schema.restaurantDetails)
          .values({ placeId: id, ...input.restaurantDetails })
          .onConflictDoUpdate({
            target: schema.restaurantDetails.placeId,
            set: input.restaurantDetails,
          });
      }
      if (input.attractionDetails) {
        await tx
          .insert(schema.attractionDetails)
          .values({ placeId: id, ...input.attractionDetails })
          .onConflictDoUpdate({
            target: schema.attractionDetails.placeId,
            set: input.attractionDetails,
          });
      }

      const prevRevs = await tx
        .select({ id: schema.contentRevisions.id })
        .from(schema.contentRevisions)
        .where(eq(schema.contentRevisions.entityId, id));

      await tx.insert(schema.contentRevisions).values({
        entityType: "place",
        entityId: id,
        versionNumber: prevRevs.length + 1,
        status: place.status,
        snapshotJson: place as unknown as Record<string, unknown>,
        editedByAdminId: auth.principal.id,
        changeNote: `Updated (status: ${place.status})`,
      });

      return place;
    });

    await recordAuditLog({
      principal: auth.principal,
      action: "place.update",
      targetType: "place",
      targetId: id,
      summary: `Updated '${updated.name}' (status: ${updated.status}).`,
    });

    return NextResponse.json({ place: updated });
  } catch (err) {
    console.error("[PATCH /api/admin/places/[id]]", err);
    return NextResponse.json({ error: "Failed to update place." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiAuth("content.publish");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const db = await getDb();
    const [existing] = await db
      .select()
      .from(schema.places)
      .where(eq(schema.places.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Place not found." }, { status: 404 });
    }

    // Archive safely if referenced by itinerary stops; otherwise delete
    const stops = await db
      .select({ id: schema.itineraryStops.id })
      .from(schema.itineraryStops)
      .where(eq(schema.itineraryStops.placeId, id))
      .limit(1);

    if (stops.length > 0) {
      await db
        .update(schema.places)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(schema.places.id, id));
      await recordAuditLog({
        principal: auth.principal,
        action: "place.archive",
        targetType: "place",
        targetId: id,
        summary: `Archived '${existing.name}' (referenced by submitted itineraries).`,
      });
      return NextResponse.json({ archived: true });
    }

    await db.delete(schema.places).where(eq(schema.places.id, id));
    await recordAuditLog({
      principal: auth.principal,
      action: "place.delete",
      targetType: "place",
      targetId: id,
      summary: `Deleted place '${existing.name}'.`,
    });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/admin/places/[id]]", err);
    return NextResponse.json({ error: "Failed to delete place." }, { status: 500 });
  }
}
