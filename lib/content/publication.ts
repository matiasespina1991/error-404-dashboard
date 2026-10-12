import { inlineImageIds } from "./rich-text";
import type { AboutContent, AboutDocument } from "./types";
import { EditorialError } from "./validation";

export type PublicationIntent = "save" | "publish" | "unpublish";

export function nextAbout(
  current: AboutDocument,
  content: AboutContent,
  revision: number,
  intent: PublicationIntent,
  uid: string,
  now: string,
): AboutDocument {
  if (current.revision !== revision)
    throw new EditorialError(
      "Otra sesión modificó About. Recargá para ver los cambios antes de guardar.",
      409,
    );
  return {
    schemaVersion: 1,
    revision: current.revision + 1,
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

export function aboutImageIds(content: AboutContent | null): string[] {
  return content
    ? [
        ...new Set(
          [
            content.imageId,
            ...inlineImageIds(content.body, content.bodyFormat),
          ].filter(Boolean) as string[],
        ),
      ]
    : [];
}

export function aboutReferences(
  id: string,
  document: AboutDocument,
  existing: string[],
): string[] {
  const references = existing.filter(
    (reference) => !["about:draft", "about:published"].includes(reference),
  );
  if (aboutImageIds(document.draft).includes(id))
    references.push("about:draft");
  if (aboutImageIds(document.published).includes(id))
    references.push("about:published");
  return references;
}
