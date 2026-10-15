import { SLUG, IMAGE_ID } from "./patterns";
import { parseBody, hasBodyContent } from "./rich-text";
import type { BodyFormat } from "./rich-text-format";
import { parseReleaseFields, type ReleaseFields } from "./releases";
// Version 1 public contract, mirrored in the independent dashboard project.
export type ContentKind = "events" | "interviews" | "releases";
export type ContentImage = { id: string; alt: string };
type CommonContent = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  bodyFormat?: BodyFormat;
  cover: ContentImage | null;
  gallery: ContentImage[];
  seoDescription: string;
};
export type EventContent = CommonContent & {
  kind: "events";
  startsAt: string;
  endsAt: string;
  timeZone: string;
  venue: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  lineup: string[];
  eventType: string;
  ticketStatus: "available" | "free" | "sold-out" | "cancelled";
  ticketUrl: string;
  price: string;
  websiteUrl: string;
  facebookUrl: string;
  contactEmail: string;
};
export type InterviewContent = CommonContent & {
  kind: "interviews";
  artist: string;
  interviewer: string;
  publishedDate: string;
  category: string;
};
export type ReleaseContent = CommonContent & ReleaseFields;
export type ContentEntry = EventContent | InterviewContent | ReleaseContent;
export type ContentPage = {
  items: ContentEntry[];
  cursor: string | null;
  source: "firebase" | "mock";
};
export type EntryDocument = {
  schemaVersion: 1;
  revision: number;
  draft: ContentEntry;
  published: ContentEntry | null;
  publishedAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};
export { SLUG, IMAGE_ID } from "./patterns";
export function isContentKind(value: string): value is ContentKind {
  return value === "events" || value === "interviews" || value === "releases";
}
export function emptyEntry(kind: ContentKind, slug: string): EntryDocument {
  const common = {
    slug,
    title: "",
    summary: "",
    body: "",
    cover: null,
    gallery: [],
    seoDescription: "",
  };
  const draft: ContentEntry =
    kind === "events"
      ? {
          ...common,
          kind,
          startsAt: "",
          endsAt: "",
          timeZone: "Europe/Madrid",
          venue: "",
          address: "",
          city: "",
          region: "",
          postalCode: "",
          country: "",
          lineup: [],
          eventType: "Club night",
          ticketStatus: "available",
          ticketUrl: "",
          price: "",
          websiteUrl: "",
          facebookUrl: "",
          contactEmail: "",
        }
      : kind === "releases"
        ? {
            ...common,
            kind,
            genres: [],
            purchaseUrl: "",
            format: "vinyl",
            tracks: [],
          }
        : {
            ...common,
            kind,
            artist: "",
            interviewer: "",
            publishedDate: "",
            category: "Conversation",
          };
  return {
    schemaVersion: 1,
    revision: 0,
    draft,
    published: null,
    publishedAt: null,
    updatedAt: null,
    updatedBy: null,
  };
}
export function validateEntry(
  value: unknown,
  kind: ContentKind,
  slug: string,
  publishing: boolean,
): ContentEntry {
  const fail = (message: string): never => {
    throw new Error(message);
  };
  if (!value || typeof value !== "object") return fail("Contenido inválido.");
  const data = value as Record<string, unknown>;
  if (
    !SLUG.test(slug) ||
    slug.length > 120 ||
    data.slug !== slug ||
    data.kind !== kind
  )
    return fail("URL o tipo inválido.");
  const text = (key: string, max = 300): string => {
    const value = data[key];
    if (typeof value !== "string" || value.length > max)
      return fail(`Revisá ${key} (máximo ${max} caracteres).`);
    return value.trim();
  };
  const image = (value: unknown): ContentImage => {
    if (!value || typeof value !== "object") return fail("Imagen inválida.");
    const item = value as Record<string, unknown>;
    if (
      typeof item.id !== "string" ||
      !IMAGE_ID.test(item.id) ||
      typeof item.alt !== "string" ||
      item.alt.length > 300
    )
      return fail("Imagen inválida.");
    return {
      id: item.id,
      alt:
        item.alt.trim() ||
        (typeof data.title === "string" ? data.title.trim() : ""),
    };
  };
  if (!Array.isArray(data.gallery) || data.gallery.length > 12)
    return fail("Máximo 12 imágenes en la galería.");
  const common = {
    slug,
    title: text("title", 160),
    summary: text("summary", 1000),
    ...parseBody(data.body, data.bodyFormat),
    seoDescription: text("seoDescription", 320),
    cover: data.cover === null ? null : image(data.cover),
    gallery: data.gallery.map(image),
  };
  if (
    publishing &&
    (!common.title ||
      !common.summary ||
      !hasBodyContent(common.body, common.bodyFormat) ||
      !common.cover)
  )
    return fail(
      "Para publicar completá título, resumen, texto e imagen principal.",
    );
  if (kind === "releases")
    return { ...common, ...parseReleaseFields(data, publishing) };
  const url = (key: string) => {
    const result = text(key, 2000);
    if (result) {
      try {
        const parsed = new URL(result);
        if (parsed.protocol !== "https:" || parsed.username || parsed.password)
          return fail("Los enlaces deben usar HTTPS.");
      } catch {
        return fail("Enlace inválido.");
      }
    }
    return result;
  };
  const date = (key: string) => {
    const result = text(key, 50);
    if (
      result &&
      (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
        result,
      ) ||
        !Number.isFinite(Date.parse(result)))
    )
      return fail("Fecha inválida: usá ISO con zona horaria.");
    if (result) {
      const day = result.slice(0, 10),
        clock = result.slice(11, 19);
      const local = new Date(`${day}T${clock}Z`);
      if (
        !Number.isFinite(local.getTime()) ||
        local.toISOString().slice(0, 19) !== `${day}T${clock}`
      )
        return fail("Fecha o hora inexistente.");
    }
    if (publishing && !result)
      return fail("Completá las fechas antes de publicar.");
    return result ? new Date(result).toISOString() : "";
  };
  if (kind === "interviews") {
    const entry: InterviewContent = {
      ...common,
      kind,
      artist: text("artist", 160),
      interviewer: text("interviewer", 160),
      category: text("category", 100),
      publishedDate: date("publishedDate"),
    };
    if (publishing && !entry.artist) return fail("Completá el artista.");
    return entry;
  }
  const startsAt = date("startsAt"),
    endsAt = date("endsAt"),
    timeZone = text("timeZone", 100);
  if (startsAt && endsAt && endsAt <= startsAt)
    return fail("La fecha final debe ser posterior al inicio.");
  try {
    new Intl.DateTimeFormat("en", { timeZone });
  } catch {
    return fail("Zona horaria inválida.");
  }
  if (
    !Array.isArray(data.lineup) ||
    data.lineup.length > 50 ||
    !data.lineup.every((item) => typeof item === "string" && item.length <= 160)
  )
    return fail("Line-up inválido (máximo 50 artistas).");
  const status = data.ticketStatus;
  if (
    !["available", "free", "sold-out", "cancelled"].includes(status as string)
  )
    return fail("Estado de entradas inválido.");
  const entry: EventContent = {
    ...common,
    kind,
    startsAt,
    endsAt,
    timeZone,
    venue: text("venue"),
    address: text("address"),
    city: text("city"),
    region: text("region"),
    postalCode: text("postalCode", 30),
    country: text("country", 100),
    lineup: data.lineup.map((item) => (item as string).trim()).filter(Boolean),
    eventType: text("eventType", 100),
    ticketStatus: status as EventContent["ticketStatus"],
    ticketUrl: url("ticketUrl"),
    websiteUrl: url("websiteUrl"),
    facebookUrl: url("facebookUrl"),
    price: text("price", 100),
    contactEmail: text("contactEmail", 200),
  };
  if (
    entry.contactEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.contactEmail)
  )
    return fail("Email inválido.");
  if (
    publishing &&
    (!entry.venue || !entry.city || !entry.country || !entry.lineup.length)
  )
    return fail("Completá sala, ciudad, país y line-up.");
  return entry;
}
