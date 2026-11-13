import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasPermission, recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApiAuth("content.edit");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const db = await getDb();
  const [
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
      entityType: "event" | "product" | "guide" | "announcement" | "emergency_contact";
      payload: Record<string, unknown>;
    };

    const requestedStatus = (payload.status as string) || "draft";
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

    if (entityType === "event") {
      const [row] = await db
        .insert(schema.events)
        .values({
          title: String(payload.title || ""),
          slug: String(payload.slug || ""),
          description: String(payload.description || payload.summary || ""),
          category: String(payload.category || "community"),
          startDate: String(payload.startDate || today),
          endDate: payload.endDate ? String(payload.endDate) : null,
          venueName: String(payload.venueName || "Salcedo, Ilocos Sur"),
          barangayId: payload.barangayId ? String(payload.barangayId) : null,
          sourceReference: String(payload.sourceReference || "CEDO Salcedo"),
          verificationDate: today,
          status: requestedStatus as "draft" | "pending_review" | "published" | "archived",
          isFeatured: Boolean(payload.isFeatured),
        })
        .returning();
      created = row;
    } else if (entityType === "product") {
      const [row] = await db
        .insert(schema.localProducts)
        .values({
          name: String(payload.name || ""),
          slug: String(payload.slug || ""),
          category: String(payload.category || "delicacy"),
          description: String(payload.description || payload.summary || ""),
          barangayId: payload.barangayId ? String(payload.barangayId) : null,
          sourceReference: String(payload.sourceReference || "CEDO Salcedo"),
          verificationDate: today,
          status: requestedStatus as "draft" | "pending_review" | "published" | "archived",
          isFeatured: Boolean(payload.isFeatured),
        })
        .returning();
      created = row;
    } else if (entityType === "announcement") {
      const [row] = await db
        .insert(schema.announcements)
        .values({
          title: String(payload.title || ""),
          slug: String(payload.slug || ""),
          summary: String(payload.summary || ""),
          content: String(payload.content || payload.body || payload.summary || ""),
          priority: String(payload.priority || "normal"),
          sourceReference: String(payload.sourceReference || "Municipality of Salcedo — CEDO"),
          verificationDate: today,
          status: requestedStatus as "draft" | "pending_review" | "published" | "archived",
          publishedAt: requestedStatus === "published" ? new Date() : null,
        })
        .returning();
      created = row;
    } else if (entityType === "guide") {
      const [row] = await db
        .insert(schema.travelGuides)
        .values({
          title: String(payload.title || ""),
          slug: String(payload.slug || ""),
          summary: String(payload.summary || ""),
          content: String(payload.content || payload.body || ""),
          category: String(payload.category || payload.guideType || "getting_here"),
          sourceReference: String(payload.sourceReference || "Municipality of Salcedo — CEDO"),
          verificationDate: today,
          status: requestedStatus as "draft" | "pending_review" | "published" | "archived",
          isFeatured: Boolean(payload.isFeatured),
        })
        .returning();
      created = row;
    } else if (entityType === "emergency_contact") {
      const phones = [payload.phoneNumber, payload.alternatePhone]
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      const [row] = await db
        .insert(schema.emergencyContacts)
        .values({
          agencyName: String(payload.agencyName || payload.officeName || ""),
          category: String(payload.category || "municipal"),
          phoneNumbers: phones,
          address: String(payload.address || payload.location || "Salcedo, Ilocos Sur"),
          operatingHours: String(payload.operatingHours || payload.hours || "24/7"),
          sourceReference: String(payload.sourceReference || "Municipality of Salcedo"),
          verificationDate: today,
          isActive: true,
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
    const body = await req.json();
    const { entityType, id, status, title, summary, description } = body as {
      entityType: string;
      id: string;
      status?: "draft" | "pending_review" | "published" | "archived";
      title?: string;
      summary?: string;
      description?: string;
    };

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
    if (entityType === "event") {
      await db
        .update(schema.events)
        .set({
          ...(status ? { status } : {}),
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.events.id, id));
    } else if (entityType === "product") {
      await db
        .update(schema.localProducts)
        .set({
          ...(status ? { status } : {}),
          ...(title ? { name: title } : {}),
          ...(description ? { description } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.localProducts.id, id));
    } else if (entityType === "announcement") {
      await db
        .update(schema.announcements)
        .set({
          ...(status ? { status } : {}),
          ...(title ? { title } : {}),
          ...(summary ? { summary } : {}),
          ...(description ? { content: description } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.announcements.id, id));
    } else if (entityType === "guide") {
      await db
        .update(schema.travelGuides)
        .set({
          ...(status ? { status } : {}),
          ...(title ? { title } : {}),
          ...(summary ? { summary } : {}),
          ...(description ? { content: description } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.travelGuides.id, id));
    } else if (entityType === "barangay") {
      await db
        .update(schema.barangays)
        .set({
          ...(summary ? { summary } : {}),
          ...(description ? { historyNotes: description } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.barangays.id, id));
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

    return NextResponse.json({ updated: true });
  } catch (err) {
    console.error("[PATCH /api/admin/content]", err);
    return NextResponse.json({ error: "Failed to update content." }, { status: 500 });
  }
}
