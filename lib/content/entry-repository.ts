import "server-only";
import { randomUUID } from "node:crypto";
import { createWithUniqueSlug, SlugCollisionError } from "./slug";
import { FieldPath } from "firebase-admin/firestore";
import { editorialDb, editorialConfigured } from "./firebase-admin";
import { mediaCollection } from "./repository";
import {
  emptyEntry,
  validateEntry,
  SLUG,
  type ContentKind,
  type EntryDocument,
  type ContentEntry,
  type ContentPage,
} from "./entries";
import { nextEntry, imageIds, entryReferences } from "./entry-publication";
import type { PublicationIntent } from "./publication";
import { EditorialError } from "./validation";
const entries = (kind: ContentKind) =>
  editorialDb().collection(`content_${kind}`);
const published = (kind: ContentKind) =>
  editorialDb().collection(`published_${kind}`);
export function checkedSlug(slug: string) {
  if (!SLUG.test(slug) || slug.length > 120)
    throw new EditorialError("URL inválida.");
  return slug;
}
export async function getEntry(
  kind: ContentKind,
  slug: string,
): Promise<EntryDocument> {
  const snapshot = await entries(kind).doc(checkedSlug(slug)).get();
  return snapshot.exists
    ? (snapshot.data() as EntryDocument)
    : emptyEntry(kind, slug);
}
export async function getPublicEntry(
  kind: ContentKind,
  slug: string,
): Promise<ContentEntry | null> {
  checkedSlug(slug);
  if (!editorialConfigured()) return null;
  const snapshot = await published(kind).doc(slug).get();
  return snapshot.exists ? (snapshot.data()!.content as ContentEntry) : null;
}
type AdminPage = { items: EntryDocument[]; cursor: string | null };
export async function listEntries(
  kind: ContentKind,
  cursor?: string,
): Promise<AdminPage> {
  let query = entries(kind).orderBy(FieldPath.documentId(), "asc").limit(25);
  if (cursor) query = query.startAfter(checkedSlug(cursor));
  const snapshot = await query.get(),
    docs = snapshot.docs.slice(0, 24);
  return {
    items: docs.map((doc) => doc.data() as EntryDocument),
    cursor: snapshot.size > 24 ? docs[23]!.id : null,
  };
}
// Admin lists use the complete dataset so search and sorting span every page.
// The HTTP collection endpoint remains paginated.
export async function listAllEntries(
  kind: ContentKind,
): Promise<EntryDocument[]> {
  const items: EntryDocument[] = [];
  let cursor: string | undefined;
  do {
    const page = await listEntries(kind, cursor);
    items.push(...page.items);
    cursor = page.cursor ?? undefined;
  } while (cursor);
  return items;
}
export async function listPublished(
  kind: ContentKind,
  timeline: string,
  cursor?: string,
): Promise<ContentPage> {
  if (!editorialConfigured())
    return { items: [], cursor: null, source: "mock" };
  const asc = kind === "events" && timeline !== "past";
  let query = published(kind)
    .orderBy("sortDate", asc ? "asc" : "desc")
    .orderBy(FieldPath.documentId(), asc ? "asc" : "desc")
    .limit(25);
  if (kind === "events")
    query = query.where(
      "sortDate",
      timeline === "past" ? "<" : ">=",
      new Date().toISOString(),
    );
  if (cursor) {
    if (cursor.length > 500) throw new EditorialError("Cursor inválido.");
    let values: unknown;
    try {
      values = JSON.parse(Buffer.from(cursor, "base64url").toString());
    } catch {
      throw new EditorialError("Cursor inválido.");
    }
    if (
      !Array.isArray(values) ||
      values.length !== 2 ||
      typeof values[0] !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T/.test(values[0]) ||
      !Number.isFinite(Date.parse(values[0])) ||
      typeof values[1] !== "string"
    )
      throw new EditorialError("Cursor inválido.");
    query = query.startAfter(values[0], checkedSlug(values[1]));
  }
  const snapshot = await query.get(),
    docs = snapshot.docs.slice(0, 24),
    last = docs[23];
  return {
    items: docs.map((doc) => doc.data().content as ContentEntry),
    cursor:
      snapshot.size > 24 && last
        ? Buffer.from(JSON.stringify([last.data().sortDate, last.id])).toString(
            "base64url",
          )
        : null,
    source: "firebase",
  };
}
export async function saveEntry(
  content: ContentEntry,
  revision: number,
  intent: PublicationIntent,
  uid: string,
  createOnly = false,
): Promise<EntryDocument> {
  const db = editorialDb();
  return db.runTransaction(async (transaction) => {
    const ref = entries(content.kind).doc(checkedSlug(content.slug)),
      snapshot = await transaction.get(ref);
    if (createOnly && snapshot.exists)
      throw new SlugCollisionError("La URL ya existe.");
    const current = snapshot.exists
      ? (snapshot.data() as EntryDocument)
      : emptyEntry(content.kind, content.slug);
    const next = nextEntry(
      current,
      content,
      revision,
      intent,
      uid,
      new Date().toISOString(),
    );
    const ids = [
      ...new Set([
        ...imageIds(current.draft),
        ...imageIds(current.published),
        ...imageIds(next.draft),
        ...imageIds(next.published),
      ]),
    ];
    const assets = ids.length
      ? await transaction.getAll(...ids.map((id) => mediaCollection().doc(id)))
      : [];
    const required = new Set([
      ...imageIds(next.draft),
      ...imageIds(next.published),
    ]);
    for (const asset of assets) {
      if (
        required.has(asset.id) &&
        (!asset.exists || asset.data()?.status !== "ready")
      )
        throw new EditorialError(
          "Una imagen ya no está disponible. Elegí otra.",
          409,
        );
    }
    for (const asset of assets) {
      if (asset.exists)
        transaction.update(asset.ref, {
          references: entryReferences(
            asset.id,
            next,
            asset.data()?.references || [],
          ),
        });
    }
    transaction.set(ref, next);
    const publicRef = published(content.kind).doc(content.slug);
    if (next.published) {
      const item = next.published;
      transaction.set(publicRef, {
        content: item,
        sortDate:
          item.kind === "events"
            ? item.endsAt
            : item.kind === "interviews"
              ? item.publishedDate
              : next.publishedAt,
        updatedAt: next.updatedAt,
      });
    } else transaction.delete(publicRef);
    return next;
  });
}

export async function createEntry(
  value: unknown,
  kind: ContentKind,
  intent: "save" | "publish",
  uid: string,
): Promise<EntryDocument> {
  if (
    !value ||
    typeof value !== "object" ||
    !("title" in value) ||
    typeof value.title !== "string" ||
    !value.title.trim()
  )
    throw new EditorialError("Agregá un título antes de guardar.");
  return createWithUniqueSlug(
    value.title,
    async (slug) => {
      let content: ContentEntry;
      try {
        content = validateEntry(
          { ...value, slug },
          kind,
          slug,
          intent === "publish",
        );
      } catch (error) {
        throw new EditorialError(
          error instanceof Error ? error.message : "Contenido inválido.",
        );
      }
      return saveEntry(content, 0, intent, uid, true);
    },
    randomUUID,
  );
}
