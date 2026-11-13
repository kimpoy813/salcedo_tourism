import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasPermission, recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type ContentStatus = "draft" | "pending_review" | "published" | "archived";

function toSlug(input: string, fallbackPrefix = "item"): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || `${fallbackPrefix}-${Date.now()}`;
}

function parseStringArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof val === "string") {
    return val
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function revalidatePublicMunicipalPages() {
  try {
    revalidatePath("/app");
    revalidatePath("/app/salcedo");
    revalidatePath("/app/discover");
    revalidatePath("/app/more");
  } catch {
    // Non-Next test runners may not provide incremental cache store
  }
}

export async function GET() {
  const auth = await requireAdminApiAuth("content.edit");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const db = await getDb();
  const [
    municipalInfo,
    events,
    products,
    historicalArticles,
    culturalArticles,
    travelGuides,
    announcements,
    emergencyContacts,
    barangays,
    collections,
  ] = await Promise.all([
    db.select().from(schema.municipalInformation).orderBy(asc(schema.municipalInformation.category), asc(schema.municipalInformation.title)),
    db.select().from(schema.events).orderBy(asc(schema.events.startDate)),
    db.select().from(schema.localProducts).orderBy(asc(schema.localProducts.name)),
    db.select().from(schema.historicalArticles).orderBy(asc(schema.historicalArticles.displayOrder)),
    db.select().from(schema.culturalArticles).orderBy(desc(schema.culturalArticles.updatedAt)),
    db.select().from(schema.travelGuides).orderBy(desc(schema.travelGuides.updatedAt)),
    db.select().from(schema.announcements).orderBy(desc(schema.announcements.createdAt)),
    db.select().from(schema.emergencyContacts).orderBy(asc(schema.emergencyContacts.displayOrder)),
    db.select().from(schema.barangays).orderBy(asc(schema.barangays.name)),
    db.select().from(schema.curatedCollections).orderBy(asc(schema.curatedCollections.displayOrder)),
  ]);

  return NextResponse.json({
    municipalInfo,
    events,
    products,
    historicalArticles,
    culturalArticles,
    travelGuides,
    announcements,
    emergencyContacts,
    barangays,
    collections,
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApiAuth("content.edit");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { entityType, payload } = body as {
      entityType:
        | "municipal_info"
        | "historical_article"
        | "cultural_article"
        | "event"
        | "product"
        | "guide"
        | "announcement"
        | "emergency_contact";
      payload: Record<string, unknown>;
    };

    const requestedStatus = ((payload.status as string) || "draft") as ContentStatus;
    if (
      (requestedStatus === "published" || requestedStatus === "archived") &&
      !hasPermission(auth.principal, "content.publish")
    ) {
      return NextResponse.json(
        { error: "Publishing requires Tourism Administrator or Super Administrator permission." },
        { status: 403 }
      );
    }

    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    let created: unknown = null;

    if (entityType === "municipal_info") {
      const title = String(payload.title || "").trim();
      const content = String(payload.content || "").trim();
      if (!title || !content) {
        return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
      }
      const key = toSlug(String(payload.key || title), "info").replace(/-/g, "_");
      const [row] = await db
        .insert(schema.municipalInformation)
        .values({
          key,
          title,
          category: String(payload.category || "overview"),
          content,
          sourceReference: String(payload.sourceReference || "Municipality of Salcedo — CEDO"),
          verificationDate: String(payload.verificationDate || today),
        })
        .returning();
      created = row;
    } else if (entityType === "historical_article") {
      const title = String(payload.title || "").trim();
      if (!title) {
        return NextResponse.json({ error: "Article title is required." }, { status: 400 });
      }
      const [row] = await db
        .insert(schema.historicalArticles)
        .values({
          title,
          slug: toSlug(String(payload.slug || title), "history"),
          eraOrYear: String(payload.eraOrYear || "1957"),
          summary: String(payload.summary || ""),
          content: String(payload.content || payload.summary || ""),
          imageUrl: payload.imageUrl ? String(payload.imageUrl) : null,
          imageCaption: payload.imageCaption ? String(payload.imageCaption) : null,
          displayOrder: Number(payload.displayOrder ?? 10),
          sourceReference: String(payload.sourceReference || "Municipality of Salcedo — CEDO"),
          verificationDate: today,
          status: requestedStatus,
        })
        .returning();
      created = row;
    } else if (entityType === "cultural_article") {
      const title = String(payload.title || "").trim();
      if (!title) {
        return NextResponse.json({ error: "Article title is required." }, { status: 400 });
      }
      const [row] = await db
        .insert(schema.culturalArticles)
        .values({
          title,
          slug: toSlug(String(payload.slug || title), "culture"),
          category: String(payload.category || "heritage"),
          summary: String(payload.summary || ""),
          content: String(payload.content || payload.summary || ""),
          imageUrl: payload.imageUrl ? String(payload.imageUrl) : null,
          imageCaption: payload.imageCaption ? String(payload.imageCaption) : null,
          isFeatured: Boolean(payload.isFeatured),
          sourceReference: String(payload.sourceReference || "Municipality of Salcedo — CEDO"),
          verificationDate: today,
          status: requestedStatus,
        })
        .returning();
      created = row;
    } else if (entityType === "event") {
      const title = String(payload.title || "").trim();
      if (!title) {
        return NextResponse.json({ error: "Event title is required." }, { status: 400 });
      }
      const [row] = await db
        .insert(schema.events)
        .values({
          title,
          slug: toSlug(String(payload.slug || title), "event"),
          description: String(payload.description || payload.summary || ""),
          category: String(payload.category || "community"),
          startDate: String(payload.startDate || today),
          endDate: payload.endDate ? String(payload.endDate) : null,
          venueName: String(payload.venueName || "Salcedo, Ilocos Sur"),
          barangayId: payload.barangayId ? String(payload.barangayId) : null,
          scheduleNotes: payload.scheduleNotes ? String(payload.scheduleNotes) : null,
          organizer: payload.organizer ? String(payload.organizer) : null,
          imageUrl: payload.imageUrl ? String(payload.imageUrl) : null,
          sourceReference: String(payload.sourceReference || "CEDO Salcedo"),
          verificationDate: today,
          status: requestedStatus,
          isFeatured: Boolean(payload.isFeatured),
        })
        .returning();
      created = row;
    } else if (entityType === "product") {
      const name = String(payload.name || payload.title || "").trim();
      if (!name) {
        return NextResponse.json({ error: "Product name is required." }, { status: 400 });
      }
      const [row] = await db
        .insert(schema.localProducts)
        .values({
          name,
          slug: toSlug(String(payload.slug || name), "product"),
          category: String(payload.category || "delicacy"),
          description: String(payload.description || payload.summary || ""),
          traditionNotes: payload.traditionNotes ? String(payload.traditionNotes) : null,
          seasonalAvailability: payload.seasonalAvailability
            ? String(payload.seasonalAvailability)
            : null,
          priceNote: payload.priceNote ? String(payload.priceNote) : null,
          imageUrl: payload.imageUrl ? String(payload.imageUrl) : null,
          barangayId: payload.barangayId ? String(payload.barangayId) : null,
          sourceReference: String(payload.sourceReference || "CEDO Salcedo"),
          verificationDate: today,
          status: requestedStatus,
          isFeatured: Boolean(payload.isFeatured),
        })
        .returning();
      created = row;
    } else if (entityType === "announcement") {
      const title = String(payload.title || "").trim();
      if (!title) {
        return NextResponse.json({ error: "Announcement title is required." }, { status: 400 });
      }
      const [row] = await db
        .insert(schema.announcements)
        .values({
          title,
          slug: toSlug(String(payload.slug || title), "advisory"),
          summary: String(payload.summary || ""),
          content: String(payload.content || payload.body || payload.summary || ""),
          priority: String(payload.priority || "normal"),
          sourceReference: String(payload.sourceReference || "Municipality of Salcedo — CEDO"),
          verificationDate: today,
          status: requestedStatus,
          publishedAt: requestedStatus === "published" ? new Date() : null,
        })
        .returning();
      created = row;
    } else if (entityType === "guide") {
      const title = String(payload.title || "").trim();
      if (!title) {
        return NextResponse.json({ error: "Guide title is required." }, { status: 400 });
      }
      const [row] = await db
        .insert(schema.travelGuides)
        .values({
          title,
          slug: toSlug(String(payload.slug || title), "guide"),
          summary: String(payload.summary || ""),
          content: String(payload.content || payload.body || ""),
          category: String(payload.category || payload.guideType || "getting_here"),
          tipsJson: parseStringArray(payload.tipsJson ?? payload.tips),
          imageUrl: payload.imageUrl ? String(payload.imageUrl) : null,
          sourceReference: String(payload.sourceReference || "Municipality of Salcedo — CEDO"),
          verificationDate: today,
          status: requestedStatus,
          isFeatured: Boolean(payload.isFeatured),
        })
        .returning();
      created = row;
    } else if (entityType === "emergency_contact") {
      const agencyName = String(payload.agencyName || payload.officeName || "").trim();
      if (!agencyName) {
        return NextResponse.json({ error: "Agency name is required." }, { status: 400 });
      }
      const phones = Array.isArray(payload.phoneNumbers)
        ? parseStringArray(payload.phoneNumbers)
        : [payload.phoneNumber, payload.alternatePhone]
            .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      const [row] = await db
        .insert(schema.emergencyContacts)
        .values({
          agencyName,
          category: String(payload.category || "municipal"),
          phoneNumbers: phones,
          address: String(payload.address || payload.location || "Salcedo, Ilocos Sur"),
          operatingHours: String(payload.operatingHours || payload.hours || "24/7"),
          notes: payload.notes ? String(payload.notes) : null,
          displayOrder: Number(payload.displayOrder ?? 10),
          sourceReference: String(payload.sourceReference || "Municipality of Salcedo"),
          verificationDate: today,
          isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
        })
        .returning();
      created = row;
    } else {
      return NextResponse.json({ error: "Unsupported content entityType." }, { status: 400 });
    }

    await recordAuditLog({
      principal: auth.principal,
      action: `content.${entityType}.create`,
      targetType: entityType,
      summary: `Created ${entityType} record.`,
    });

    revalidatePublicMunicipalPages();
    return NextResponse.json({ created }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/content]", err);
    return NextResponse.json({ error: "Failed to create content record." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApiAuth("content.edit");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as {
      entityType: string;
      id: string;
      status?: ContentStatus;
      [key: string]: unknown;
    };

    const { entityType, id, status } = body;
    if (!id || !entityType) {
      return NextResponse.json({ error: "entityType and id are required." }, { status: 400 });
    }

    if (
      status &&
      (status === "published" || status === "archived") &&
      !hasPermission(auth.principal, "content.publish")
    ) {
      return NextResponse.json(
        { error: "Publishing or archiving requires Tourism Administrator approval." },
        { status: 403 }
      );
    }

    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);

    if (entityType === "municipal_info") {
      await db
        .update(schema.municipalInformation)
        .set({
          ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
          ...(typeof body.category === "string" ? { category: body.category } : {}),
          ...(typeof body.content === "string" ? { content: body.content } : {}),
          ...(typeof body.sourceReference === "string"
            ? { sourceReference: body.sourceReference }
            : {}),
          verificationDate: typeof body.verificationDate === "string" ? body.verificationDate : today,
          updatedAt: new Date(),
        })
        .where(eq(schema.municipalInformation.id, id));
    } else if (entityType === "historical_article") {
      await db
        .update(schema.historicalArticles)
        .set({
          ...(status ? { status } : {}),
          ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
          ...(typeof body.eraOrYear === "string" ? { eraOrYear: body.eraOrYear } : {}),
          ...(typeof body.summary === "string" ? { summary: body.summary } : {}),
          ...(typeof body.content === "string" ? { content: body.content } : {}),
          ...(typeof body.displayOrder === "number" ? { displayOrder: body.displayOrder } : {}),
          ...(typeof body.sourceReference === "string"
            ? { sourceReference: body.sourceReference }
            : {}),
          verificationDate: today,
          updatedAt: new Date(),
        })
        .where(eq(schema.historicalArticles.id, id));
    } else if (entityType === "cultural_article") {
      await db
        .update(schema.culturalArticles)
        .set({
          ...(status ? { status } : {}),
          ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
          ...(typeof body.category === "string" ? { category: body.category } : {}),
          ...(typeof body.summary === "string" ? { summary: body.summary } : {}),
          ...(typeof body.content === "string" ? { content: body.content } : {}),
          ...(typeof body.isFeatured === "boolean" ? { isFeatured: body.isFeatured } : {}),
          ...(typeof body.sourceReference === "string"
            ? { sourceReference: body.sourceReference }
            : {}),
          verificationDate: today,
          updatedAt: new Date(),
        })
        .where(eq(schema.culturalArticles.id, id));
    } else if (entityType === "event") {
      await db
        .update(schema.events)
        .set({
          ...(status ? { status } : {}),
          ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
          ...(typeof body.category === "string" ? { category: body.category } : {}),
          ...(typeof body.description === "string" ? { description: body.description } : {}),
          ...(typeof body.startDate === "string" ? { startDate: body.startDate } : {}),
          ...(body.endDate !== undefined
            ? { endDate: body.endDate ? String(body.endDate) : null }
            : {}),
          ...(typeof body.venueName === "string" ? { venueName: body.venueName } : {}),
          ...(body.barangayId !== undefined
            ? { barangayId: body.barangayId ? String(body.barangayId) : null }
            : {}),
          ...(body.scheduleNotes !== undefined
            ? { scheduleNotes: body.scheduleNotes ? String(body.scheduleNotes) : null }
            : {}),
          ...(body.organizer !== undefined
            ? { organizer: body.organizer ? String(body.organizer) : null }
            : {}),
          ...(typeof body.isFeatured === "boolean" ? { isFeatured: body.isFeatured } : {}),
          ...(typeof body.sourceReference === "string"
            ? { sourceReference: body.sourceReference }
            : {}),
          verificationDate: today,
          updatedAt: new Date(),
        })
        .where(eq(schema.events.id, id));
    } else if (entityType === "product") {
      const nextName =
        typeof body.name === "string"
          ? body.name.trim()
          : typeof body.title === "string"
          ? body.title.trim()
          : undefined;
      await db
        .update(schema.localProducts)
        .set({
          ...(status ? { status } : {}),
          ...(nextName ? { name: nextName } : {}),
          ...(typeof body.category === "string" ? { category: body.category } : {}),
          ...(typeof body.description === "string" ? { description: body.description } : {}),
          ...(body.traditionNotes !== undefined
            ? { traditionNotes: body.traditionNotes ? String(body.traditionNotes) : null }
            : {}),
          ...(body.seasonalAvailability !== undefined
            ? {
                seasonalAvailability: body.seasonalAvailability
                  ? String(body.seasonalAvailability)
                  : null,
              }
            : {}),
          ...(body.priceNote !== undefined
            ? { priceNote: body.priceNote ? String(body.priceNote) : null }
            : {}),
          ...(body.barangayId !== undefined
            ? { barangayId: body.barangayId ? String(body.barangayId) : null }
            : {}),
          ...(typeof body.isFeatured === "boolean" ? { isFeatured: body.isFeatured } : {}),
          ...(typeof body.sourceReference === "string"
            ? { sourceReference: body.sourceReference }
            : {}),
          verificationDate: today,
          updatedAt: new Date(),
        })
        .where(eq(schema.localProducts.id, id));
    } else if (entityType === "announcement") {
      await db
        .update(schema.announcements)
        .set({
          ...(status ? { status } : {}),
          ...(status === "published" ? { publishedAt: new Date() } : {}),
          ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
          ...(typeof body.priority === "string" ? { priority: body.priority } : {}),
          ...(typeof body.summary === "string" ? { summary: body.summary } : {}),
          ...(typeof body.content === "string"
            ? { content: body.content }
            : typeof body.description === "string"
            ? { content: body.description }
            : {}),
          ...(typeof body.sourceReference === "string"
            ? { sourceReference: body.sourceReference }
            : {}),
          verificationDate: today,
          updatedAt: new Date(),
        })
        .where(eq(schema.announcements.id, id));
    } else if (entityType === "guide") {
      await db
        .update(schema.travelGuides)
        .set({
          ...(status ? { status } : {}),
          ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
          ...(typeof body.category === "string" ? { category: body.category } : {}),
          ...(typeof body.summary === "string" ? { summary: body.summary } : {}),
          ...(typeof body.content === "string"
            ? { content: body.content }
            : typeof body.description === "string"
            ? { content: body.description }
            : {}),
          ...(body.tipsJson !== undefined ? { tipsJson: parseStringArray(body.tipsJson) } : {}),
          ...(typeof body.isFeatured === "boolean" ? { isFeatured: body.isFeatured } : {}),
          ...(typeof body.sourceReference === "string"
            ? { sourceReference: body.sourceReference }
            : {}),
          verificationDate: today,
          updatedAt: new Date(),
        })
        .where(eq(schema.travelGuides.id, id));
    } else if (entityType === "emergency_contact") {
      await db
        .update(schema.emergencyContacts)
        .set({
          ...(typeof body.agencyName === "string" ? { agencyName: body.agencyName.trim() } : {}),
          ...(typeof body.category === "string" ? { category: body.category } : {}),
          ...(body.phoneNumbers !== undefined
            ? { phoneNumbers: parseStringArray(body.phoneNumbers) }
            : {}),
          ...(typeof body.address === "string" ? { address: body.address } : {}),
          ...(typeof body.operatingHours === "string"
            ? { operatingHours: body.operatingHours }
            : {}),
          ...(body.notes !== undefined
            ? { notes: body.notes ? String(body.notes) : null }
            : {}),
          ...(typeof body.displayOrder === "number" ? { displayOrder: body.displayOrder } : {}),
          ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
          ...(typeof body.sourceReference === "string"
            ? { sourceReference: body.sourceReference }
            : {}),
          verificationDate: today,
        })
        .where(eq(schema.emergencyContacts.id, id));
    } else if (entityType === "barangay") {
      const updates: Partial<typeof schema.barangays.$inferInsert> = {
        updatedAt: new Date(),
        verificationDate: today,
      };
      if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
      if (typeof body.district === "string") updates.district = body.district;
      if (typeof body.summary === "string") updates.summary = body.summary;
      if (body.historyNotes !== undefined || body.description !== undefined) {
        const nextHist = body.historyNotes ?? body.description;
        updates.historyNotes = nextHist ? String(nextHist) : null;
      }
      if (body.highlights !== undefined) {
        updates.highlights = parseStringArray(body.highlights);
      }
      if (typeof body.population2020 === "number") {
        updates.population2020 = body.population2020;
      }
      if (typeof body.elevationMeters === "number") {
        updates.elevationMeters = body.elevationMeters;
      }
      if (typeof body.latitude === "number") updates.latitude = body.latitude;
      if (typeof body.longitude === "number") updates.longitude = body.longitude;
      if (typeof body.sourceReference === "string") {
        updates.sourceReference = body.sourceReference;
      }

      await db.update(schema.barangays).set(updates).where(eq(schema.barangays.id, id));
    } else {
      return NextResponse.json({ error: "Unsupported entityType." }, { status: 400 });
    }

    await recordAuditLog({
      principal: auth.principal,
      action: `content.${entityType}.update`,
      targetType: entityType,
      targetId: id,
      summary: `Updated ${entityType} (${id}).`,
    });

    revalidatePublicMunicipalPages();
    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error("[PATCH /api/admin/content]", err);
    return NextResponse.json({ error: "Failed to update content." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApiAuth("content.publish");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") || "";
    const id = searchParams.get("id") || "";
    if (!entityType || !id) {
      return NextResponse.json({ error: "entityType and id are required." }, { status: 400 });
    }

    const db = await getDb();
    if (entityType === "historical_article") {
      await db.delete(schema.historicalArticles).where(eq(schema.historicalArticles.id, id));
    } else if (entityType === "cultural_article") {
      await db.delete(schema.culturalArticles).where(eq(schema.culturalArticles.id, id));
    } else if (entityType === "event") {
      await db.delete(schema.events).where(eq(schema.events.id, id));
    } else if (entityType === "product") {
      await db.delete(schema.localProducts).where(eq(schema.localProducts.id, id));
    } else if (entityType === "guide") {
      await db.delete(schema.travelGuides).where(eq(schema.travelGuides.id, id));
    } else if (entityType === "announcement") {
      await db.delete(schema.announcements).where(eq(schema.announcements.id, id));
    } else if (entityType === "emergency_contact") {
      await db.delete(schema.emergencyContacts).where(eq(schema.emergencyContacts.id, id));
    } else if (entityType === "municipal_info") {
      await db.delete(schema.municipalInformation).where(eq(schema.municipalInformation.id, id));
    } else {
      return NextResponse.json(
        { error: "Deletion is not supported for this entityType." },
        { status: 400 }
      );
    }

    await recordAuditLog({
      principal: auth.principal,
      action: `content.${entityType}.delete`,
      targetType: entityType,
      targetId: id,
      summary: `Deleted ${entityType} (${id}).`,
    });

    revalidatePublicMunicipalPages();
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/admin/content]", err);
    return NextResponse.json({ error: "Failed to delete content record." }, { status: 500 });
  }
}
