import type { ContentImage, EntryDocument } from "./entries";

export type EntryRow = {
  slug: string;
  title: string;
  date: string;
  details: string;
  body: string;
  cover: ContentImage | null;
  status: string;
  search: string;
};

export function entryRows(items: EntryDocument[]): EntryRow[] {
  return items.map(({ draft, published, publishedAt, updatedAt }) => {
    const date =
      draft.kind === "events"
        ? draft.startsAt
        : draft.kind === "interviews"
          ? draft.publishedDate
          : publishedAt || updatedAt || "";
    const timeZone = draft.kind === "events" ? draft.timeZone : "Europe/Madrid";
    const formattedDate =
      date && Number.isFinite(Date.parse(date))
        ? new Intl.DateTimeFormat("es", {
            dateStyle: "medium",
            timeZone,
          }).format(new Date(date))
        : "";
    const details = [
      formattedDate,
      ...(draft.kind === "events"
        ? [draft.venue, draft.city, draft.country]
        : draft.kind === "interviews"
          ? [draft.artist]
          : [draft.format, draft.genres.join(", ")]),
    ]
      .filter(Boolean)
      .join(" · ");
    // Render as plain React text, never HTML, just like the reference listing.
    const body =
      draft.bodyFormat === "html"
        ? draft.body
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, " ")
            .trim()
        : draft.body;
    const title = draft.title || draft.slug;
    const status = published ? "Publicado" : "Borrador";
    return {
      slug: draft.slug,
      title,
      date,
      details,
      body,
      cover: draft.cover,
      status,
      search: [
        title,
        draft.slug,
        details,
        body,
        status,
        draft.kind === "interviews"
          ? draft.interviewer
          : draft.kind === "events"
            ? draft.lineup.join(" ")
            : draft.tracks.map((track) => track.title).join(" "),
      ]
        .join(" ")
        .toLocaleLowerCase("es"),
    };
  });
}
