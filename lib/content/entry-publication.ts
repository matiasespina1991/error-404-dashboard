import { inlineImageIds } from "./rich-text";
import type { ContentEntry, EntryDocument } from "./entries";
import type { PublicationIntent } from "./publication";
import { EditorialError } from "./validation";
export function nextEntry(
  current: EntryDocument,
  content: ContentEntry,
  revision: number,
  intent: PublicationIntent,
  uid: string,
  now: string,
): EntryDocument {
  if (current.revision !== revision)
    throw new EditorialError(
      "Otra sesión modificó este contenido. Recargá antes de guardar.",
      409,
    );
  return {
    schemaVersion: 1,
    revision: revision + 1,
    draft: content,
    published:
      intent === "publish"
        ? content
        : intent === "unpublish"
          ? null
          : current.published,
    publishedAt:
      intent === "publish"
        ? now
        : intent === "unpublish"
          ? null
          : current.publishedAt,
    updatedAt: now,
    updatedBy: uid,
  };
}
export function imageIds(content: ContentEntry | null): string[] {
  return content
    ? [
        ...new Set(
          [
            content.cover?.id,
            ...content.gallery.map((image) => image.id),
            ...inlineImageIds(content.body, content.bodyFormat),
          ].filter(Boolean) as string[],
        ),
      ]
    : [];
}
export function entryReferences(
  id: string,
  next: EntryDocument,
  existing: string[],
): string[] {
  const prefix = `${next.draft.kind}:${next.draft.slug}:`;
  const refs = existing.filter((ref) => !ref.startsWith(prefix));
  if (imageIds(next.draft).includes(id)) refs.push(`${prefix}draft`);
  if (imageIds(next.published).includes(id)) refs.push(`${prefix}published`);
  return refs;
}
