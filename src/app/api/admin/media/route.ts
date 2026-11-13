import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { put } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";
import { getDb, schema } from "@/db";
import { generateRandomToken } from "@/lib/crypto";
import { recordAuditLog, requireAdminApiAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApiAuth("media.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const db = await getDb();
  const assets = await db
    .select()
    .from(schema.mediaAssets)
    .orderBy(desc(schema.mediaAssets.createdAt));

  return NextResponse.json({
    assets: assets.map((a) => ({
      ...a,
      fileName: a.filename,
      storageProvider: a.blobPath ? "vercel_blob" : "local",
    })),
    vercelBlobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApiAuth("media.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const caption = String(formData.get("caption") || "").trim() || null;
    const altText = String(formData.get("altText") || "").trim() || null;
    const attribution =
      String(formData.get("attribution") || "").trim() || "Municipality of Salcedo — CEDO";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WebP, and GIF images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Maximum file size is 5 MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const safeName = `salcedo-${Date.now()}-${generateRandomToken(4)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let url: string;
    let storageProvider: "vercel_blob" | "local" = "local";
    let blobPath: string | null = null;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`salcedo-media/${safeName}`, buffer, {
        access: "public",
        contentType: file.type,
      });
      url = blob.url;
      storageProvider = "vercel_blob";
      blobPath = blob.pathname;
    } else {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      fs.mkdirSync(uploadsDir, { recursive: true });
      const targetPath = path.join(uploadsDir, safeName);
      fs.writeFileSync(targetPath, buffer);
      url = `/uploads/${safeName}`;
      storageProvider = "local";
    }

    const db = await getDb();
    const [asset] = await db
      .insert(schema.mediaAssets)
      .values({
        filename: file.name,
        url,
        blobPath,
        mimeType: file.type,
        sizeBytes: file.size,
        altText: altText ?? file.name,
        caption,
        attribution,
        uploadedByAdminId: auth.principal.id,
      })
      .returning();

    await recordAuditLog({
      principal: auth.principal,
      action: "media.upload",
      targetType: "media_asset",
      targetId: asset.id,
      summary: `Uploaded media asset '${file.name}' via ${storageProvider}.`,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/media]", err);
    return NextResponse.json({ error: "Failed to upload media asset." }, { status: 500 });
  }
}
