import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import { editorialDb, editorialConfigured } from "./firebase-admin";
import {
  emptyAbout,
  type AboutContent,
  type AboutDocument,
  type MediaAsset,
  type MediaPage,
} from "./types";
import { EditorialError, MEDIA_ID } from "./validation";
import { nextAbout, aboutReferences, aboutImageIds } from "./publication";

const pages = () => editorialDb().collection("content_pages");
export const mediaCollection = () => editorialDb().collection("media_assets");

export async function getAbout(): Promise<AboutDocument> {
  const snapshot = await pages().doc("about").get();
  return snapshot.exists ? (snapshot.data() as AboutDocument) : emptyAbout();
}

export async function getPublishedAbout(): Promise<AboutContent | null> {
  if (!editorialConfigured()) return null;
  return (await getAbout()).published;
}

export async function getMedia(id: string): Promise<MediaAsset | null> {
  if (!MEDIA_ID.test(id)) return null;
  const snapshot = await mediaCollection().doc(id).get();
  return snapshot.exists ? (snapshot.data() as MediaAsset) : null;
}

export async function listMedia(cursor?: string): Promise<MediaPage> {
  if (cursor && !MEDIA_ID.test(cursor))
    throw new EditorialError("Cursor inválido.");
  let query = mediaCollection()
    .orderBy(FieldPath.documentId(), "desc")
    .limit(25);
  if (cursor) query = query.startAfter(cursor);
  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, 24);
  return {
    items: docs.map((doc) => doc.data() as MediaAsset),
    cursor: snapshot.size > 24 ? docs[docs.length - 1]!.id : null,
  };
}

export async function saveAbout(
  content: AboutContent,
  revision: number,
  intent: "save" | "publish" | "unpublish",
  uid: string,
): Promise<AboutDocument> {
  const db = editorialDb();
  return db.runTransaction(async (transaction) => {
    const ref = pages().doc("about");
    const snapshot = await transaction.get(ref);
    const current = snapshot.exists
      ? (snapshot.data() as AboutDocument)
      : emptyAbout();
    const next = nextAbout(
      current,
      content,
      revision,
      intent,
      uid,
      new Date().toISOString(),
    );
    const published = next.published;
    const ids = [
      ...new Set(
        [
          ...aboutImageIds(current.draft),
          ...aboutImageIds(current.published),
          ...aboutImageIds(content),
          ...aboutImageIds(published),
        ].filter(Boolean),
      ),
    ] as string[];
    // All reads precede writes; references and page change atomically.
    const assets = ids.length
      ? await transaction.getAll(...ids.map((id) => mediaCollection().doc(id)))
      : [];
    for (const asset of assets) {
      if (!asset.exists || asset.data()?.status !== "ready") {
        if (
          aboutImageIds(content).includes(asset.id) ||
          aboutImageIds(published).includes(asset.id)
        ) {
          throw new EditorialError("La imagen no está disponible. Elegí otra.");
        }
      }
    }
    for (const asset of assets) {
      if (!asset.exists) continue;
      transaction.update(asset.ref, {
        references: aboutReferences(
          asset.id,
          next,
          asset.data()?.references || [],
        ),
      });
    }
    transaction.set(ref, next);
    return next;
  });
}
