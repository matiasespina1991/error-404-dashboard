import sanitizeHtml from "sanitize-html";
import type { BodyFormat } from "./rich-text-format";

const INLINE_IMAGE = /^\/api\/media\/([a-z0-9]+-[a-f0-9-]{36})$/;

export function sanitizeRichText(html: string, imageOrigin = ""): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ol",
      "ul",
      "li",
      "a",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "loading"],
      li: ["data-list"],
    },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https", "http"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attrs) => ({
        tagName: "a",
        attribs: {
          href: attrs.href || "",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      img: (_tag, attrs): sanitizeHtml.Tag => ({
        tagName: "img",
        attribs: INLINE_IMAGE.test(attrs.src || "")
          ? {
              src: `${imageOrigin}${attrs.src}`,
              alt: attrs.alt || "",
              loading: "lazy",
            }
          : {},
      }),
      li: (_tag, attrs): sanitizeHtml.Tag => ({
        tagName: "li",
        attribs: ["bullet", "ordered"].includes(attrs["data-list"] || "")
          ? { "data-list": attrs["data-list"]! }
          : {},
      }),
    },
    exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
  });
}

export function inlineImageIds(body: string, format?: BodyFormat): string[] {
  if (format !== "html") return [];
  const html = sanitizeRichText(body);
  return [
    ...new Set(
      [
        ...html.matchAll(
          /<img\b[^>]*\bsrc="\/api\/media\/([a-z0-9]+-[a-f0-9-]{36})"/g,
        ),
      ].map((match) => match[1]!),
    ),
  ];
}

export function hasBodyContent(body: string, format?: BodyFormat): boolean {
  if (format !== "html") return Boolean(body.trim());
  return (
    inlineImageIds(body, format).length > 0 ||
    Boolean(
      sanitizeHtml(sanitizeRichText(body), {
        allowedTags: [],
        allowedAttributes: {},
      }).replace(/&nbsp;|\s|\u200B/g, ""),
    )
  );
}

export function parseBody(
  body: unknown,
  format: unknown,
): { body: string; bodyFormat?: BodyFormat } {
  if (format !== undefined && format !== "html" && format !== "text")
    throw new Error("Formato de texto inválido.");
  if (
    typeof body !== "string" ||
    body.length > (format === "html" ? 120000 : 30000)
  )
    throw new Error(
      `Texto: revisá el texto (máximo ${format === "html" ? 120000 : 30000} caracteres).`,
    );
  if (format === "html")
    return { body: sanitizeRichText(body), bodyFormat: "html" };
  return {
    body: body.trim(),
    ...(format === "text" ? { bodyFormat: "text" as const } : {}),
  };
}
