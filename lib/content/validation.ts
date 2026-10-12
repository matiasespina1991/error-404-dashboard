import { parseBody, hasBodyContent } from "./rich-text";
import type { AboutContent } from "./types";

export class EditorialError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MEDIA_ID = /^[a-z0-9]+-[a-f0-9-]{36}$/;

function text(value: unknown, label: string, limit: number): string {
  if (typeof value !== "string" || value.trim().length > limit) {
    throw new EditorialError(
      `${label}: revisá el texto (máximo ${limit} caracteres).`,
    );
  }
  return value.trim();
}

export function parseAbout(value: unknown, publishing: boolean): AboutContent {
  if (!value || typeof value !== "object")
    throw new EditorialError("Contenido inválido.");
  const data = value as Record<string, unknown>;
  let body;
  try {
    body = parseBody(data.body, data.bodyFormat);
  } catch (error) {
    throw new EditorialError(
      error instanceof Error ? error.message : "Texto inválido.",
    );
  }
  const result: AboutContent = {
    title: text(data.title, "Título", 160),
    intro: text(data.intro, "Introducción", 1000),
    ...body,
    imageAlt: text(data.imageAlt, "Descripción de imagen", 300),
    seoDescription: text(data.seoDescription, "Descripción SEO", 320),
    imageId:
      data.imageId === null || data.imageId === ""
        ? null
        : typeof data.imageId === "string"
          ? data.imageId
          : "invalid",
  };
  if (result.imageId && !MEDIA_ID.test(result.imageId))
    throw new EditorialError("Imagen inválida.");
  if (
    publishing &&
    (!result.title ||
      !result.intro ||
      !hasBodyContent(result.body, result.bodyFormat))
  ) {
    throw new EditorialError(
      "Para publicar, completá título, introducción y texto.",
    );
  }
  if (publishing && result.imageId && !result.imageAlt) {
    throw new EditorialError(
      "Agregá una descripción para la imagen antes de publicar.",
    );
  }
  return result;
}

export function parseRevision(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new EditorialError("Revisión inválida. Recargá la página.");
  }
  return value;
}
