import { sanitizeRichText } from "lib/content/rich-text";
import type { BodyFormat } from "lib/content/rich-text-format";

export function RichText({
  body,
  format,
  className = "",
}: {
  body: string;
  format?: BodyFormat;
  className?: string;
}) {
  if (format === "html")
    return (
      <div
        className={`rich-content ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }}
      />
    );
  return (
    <div className={`rich-content ${className}`}>
      {body
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
    </div>
  );
}
