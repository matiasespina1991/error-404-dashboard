import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { assertSameOrigin, requireEditor } from "lib/auth/session";
import { editorialBucket } from "lib/content/firebase-admin";
import { listMedia, mediaCollection } from "lib/content/repository";
import { editorialResponse, limitedBody } from "lib/content/http";
import { EditorialError, MAX_IMAGE_BYTES } from "lib/content/validation";
import type { MediaAsset } from "lib/content/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireEditor();
    return NextResponse.json(
      await listMedia(
        new URL(request.url).searchParams.get("cursor") || undefined,
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return editorialResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const editor = await requireEditor();
    const body = await limitedBody(request, MAX_IMAGE_BYTES + 65536);
    const form = await new Response(new Uint8Array(body), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_IMAGE_BYTES)
      throw new EditorialError("Elegí una imagen de hasta 3 MB.");
    const input = Buffer.from(await file.arrayBuffer());
    let image: Buffer, thumbnail: Buffer;
    try {
      const metadata = await sharp(input, {
        limitInputPixels: 20000000,
      }).metadata();
      if (
        !["jpeg", "png", "webp"].includes(metadata.format || "") ||
        (metadata.pages || 1) > 1
      )
        throw new Error("Unsupported image");
      image = await sharp(input, { limitInputPixels: 20000000 })
        .rotate()
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      thumbnail = await sharp(image)
        .resize(320, 320, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();
    } catch {
      throw new EditorialError(
        "La imagen no es válida. Usá JPG, PNG o WebP sin animación.",
      );
    }
    const metadata = await sharp(image).metadata();
    const id = `${Date.now().toString(36)}-${randomUUID()}`;
    const path = `media/${id}/image.webp`;
    const thumbnailPath = `media/${id}/thumbnail.webp`;
    const bucket = editorialBucket();
    try {
      await bucket.file(path).save(image, {
        resumable: false,
        metadata: { contentType: "image/webp" },
      });
      await bucket.file(thumbnailPath).save(thumbnail, {
        resumable: false,
        metadata: { contentType: "image/webp" },
      });
      const asset: MediaAsset = {
        id,
        path,
        thumbnailPath,
        name: file.name.replace(/[\x00-\x1F]/g, "").slice(0, 160),
        originalFilename: file.name.replace(/[\x00-\x1F]/g, "").slice(0, 160),
        alt: "",
        width: metadata.width!,
        height: metadata.height!,
        bytes: image.length,
        createdAt: new Date().toISOString(),
        createdBy: editor.uid,
        references: [],
        status: "ready",
      };
      await mediaCollection().doc(id).create(asset);
      return NextResponse.json(asset, { status: 201 });
    } catch (error) {
      await Promise.allSettled([
        bucket.file(path).delete({ ignoreNotFound: true }),
        bucket.file(thumbnailPath).delete({ ignoreNotFound: true }),
      ]);
      throw error;
    }
  } catch (error) {
    return editorialResponse(error);
  }
}
