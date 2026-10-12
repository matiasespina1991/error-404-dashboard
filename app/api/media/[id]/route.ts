import { NextResponse } from "next/server";
import { assertSameOrigin, getEditor, requireEditor } from "lib/auth/session";
import { editorialBucket, editorialDb } from "lib/content/firebase-admin";
import { getMedia, mediaCollection } from "lib/content/repository";
import { editorialResponse, limitedBody } from "lib/content/http";
import { EditorialError, MEDIA_ID } from "lib/content/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const media = await getMedia(id);
    if (!media || media.status !== "ready")
      return new NextResponse(null, { status: 404 });
    const publicAsset = media.references.some((reference) =>
      reference.endsWith(":published"),
    );
    if (!publicAsset && !(await getEditor()))
      return new NextResponse(null, { status: 404 });
    const path =
      new URL(request.url).searchParams.get("size") === "thumbnail"
        ? media.thumbnailPath
        : media.path;
    const [buffer] = await editorialBucket().file(path).download();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": publicAsset
          ? "public, max-age=60"
          : "private, no-store",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  } catch (error) {
    return editorialResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    await requireEditor();
    const { id } = await context.params;
    if (!MEDIA_ID.test(id)) throw new EditorialError("Imagen inválida.");
    const input = JSON.parse((await limitedBody(request, 5000)).toString());
    if (
      typeof input.name !== "string" ||
      !input.name.trim() ||
      input.name.length > 160 ||
      typeof input.alt !== "string" ||
      input.alt.length > 300
    )
      throw new EditorialError("Revisá el nombre y la descripción.");
    await editorialDb().runTransaction(async (transaction) => {
      const ref = mediaCollection().doc(id);
      const media = await transaction.get(ref);
      if (!media.exists || media.data()?.status !== "ready")
        throw new EditorialError("Imagen no disponible.", 404);
      transaction.update(ref, {
        name: input.name.trim(),
        originalFilename: media.data()?.originalFilename ?? media.data()?.name,
        alt: input.alt.trim(),
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return editorialResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    await requireEditor();
    const { id } = await context.params;
    if (!MEDIA_ID.test(id)) throw new EditorialError("Imagen inválida.");
    const db = editorialDb();
    const ref = mediaCollection().doc(id);
    const media = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists)
        throw new EditorialError("Imagen no encontrada.", 404);
      const asset = snapshot.data()!;
      if (!["ready", "deleting"].includes(asset.status))
        throw new EditorialError("La imagen no está disponible.", 409);
      if (asset.references?.length)
        throw new EditorialError(
          "Esta imagen está en uso. Quitala del contenido antes de eliminarla.",
          409,
        );
      transaction.update(ref, { status: "deleting" });
      return asset;
    });
    try {
      await editorialBucket().file(media.path).delete({ ignoreNotFound: true });
      await editorialBucket()
        .file(media.thumbnailPath)
        .delete({ ignoreNotFound: true });
      await ref.delete();
    } catch (error) {
      // Keep deletion state: publishing a partially deleted asset must remain impossible.
      console.error("[media-delete] cleanup incomplete", id);
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return editorialResponse(error);
  }
}
