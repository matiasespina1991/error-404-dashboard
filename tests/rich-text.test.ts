import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeRichText,
  inlineImageIds,
  parseBody,
  hasBodyContent,
} from "../lib/content/rich-text.ts";
import { bodyAsHtml } from "../lib/content/rich-text-format.ts";
import {
  imageIds,
  entryReferences,
  nextEntry,
} from "../lib/content/entry-publication.ts";
import { emptyEntry, validateEntry } from "../lib/content/entries.ts";
import {
  aboutImageIds,
  aboutReferences,
  nextAbout,
} from "../lib/content/publication.ts";
import { emptyAbout } from "../lib/content/types.ts";
import { parseAbout } from "../lib/content/validation.ts";
import { dateTimeInput, dateTimeISO } from "../lib/content/date-time.ts";
const id = "import-00000000-0000-0000-0000-000000000001";
const url = `/api/media/${id}`;
const html = `<h2>Heading</h2><p><strong>Bold</strong> <em>Italic</em> <u>Underlined</u></p><ol><li data-list="bullet">One</li><li data-list="ordered">Two</li></ol><p><a href="https://example.com">Link</a></p><p><img src="${url}" alt="Concert" /></p>`;

test("Quill formatting survives sanitization, image references are stable, public images use dashboard origin", () => {
  const sanitized = sanitizeRichText(html);
  assert.match(sanitized, /<h2>Heading<\/h2>/);
  assert.match(sanitized, /<strong>Bold<\/strong>/);
  assert.match(sanitized, /<em>Italic<\/em>/);
  assert.match(sanitized, /<u>Underlined<\/u>/);
  assert.match(sanitized, /data-list="bullet"/);
  assert.match(sanitized, /rel="noopener noreferrer"/);
  assert.deepEqual(inlineImageIds(html + html, "html"), [id]);
  assert.equal(sanitizeRichText(sanitized), sanitized);
  assert.match(
    sanitizeRichText(html, "https://dashboard.example.com"),
    /src="https:\/\/dashboard.example.com\/api\/media\//,
  );
});
test("HTML filtering drops executable markup, unsafe links and images outside the media API", () => {
  const result = sanitizeRichText(
    `<script>alert(1)</script><svg onload="alert(2)"></svg><p onclick="bad()" style="color:red">Safe</p><a href="javascript:alert(1)">Bad link</a><img src="https://evil.test/x" onerror="bad()"><iframe src="https://evil.test"></iframe><img src="data:image/svg+xml,x">`,
  );
  assert.equal(
    /script|svg|onload|onclick|onerror|style=|javascript:|iframe|<img/.test(
      result,
    ),
    false,
  );
  assert.match(result, /<p>Safe<\/p>/);
  assert.equal(hasBodyContent("<p><br></p><p>&nbsp;</p>", "html"), false);
  assert.equal(hasBodyContent("<script>alert(1)</script>", "html"), false);
  assert.throws(() => parseBody("text", "other"), /Formato/);
});
test("Legacy plain text remains plain and converts to escaped editable paragraphs without changing stored content", () => {
  const text = "One <script>literal</script>\nnext line\n\nSecond & final";
  assert.deepEqual(parseBody(text, undefined), { body: text });
  assert.equal(
    bodyAsHtml(text),
    "<p>One &lt;script&gt;literal&lt;/script&gt;<br>next line</p><p>Second &amp; final</p>",
  );
  assert.deepEqual(inlineImageIds(`<img src="${url}">`), []);
  const draft = emptyEntry("interviews", "sample").draft;
  assert.equal(
    validateEntry({ ...draft, body: text }, "interviews", "sample", false).body,
    text,
  );
  assert.equal(
    validateEntry(
      { ...draft, body: html, bodyFormat: "html" },
      "interviews",
      "sample",
      false,
    ).bodyFormat,
    "html",
  );
  assert.throws(
    () =>
      parseAbout(
        {
          ...emptyAbout().draft,
          body: "<p><br></p>",
          bodyFormat: "html",
          title: "About",
          intro: "Introduction",
        },
        true,
      ),
    /completá/,
  );
});
test("Inline event/interview images participate in atomic draft and published references", () => {
  const initial = emptyEntry("events", "night");
  const content = { ...initial.draft, body: html, bodyFormat: "html" as const };
  const published = nextEntry(
    initial,
    content,
    0,
    "publish",
    "editor",
    "2026-10-12T10:00:00Z",
  );
  assert.deepEqual(imageIds(content), [id]);
  assert.deepEqual(entryReferences(id, published, []), [
    "events:night:draft",
    "events:night:published",
  ]);
  const draft = nextEntry(
    published,
    { ...content, body: "<p>Removed in draft</p>" },
    1,
    "save",
    "editor",
    "2026-10-12T11:00:00Z",
  );
  assert.deepEqual(
    entryReferences(id, draft, [
      "about:published",
      "events:night:draft",
      "events:night:published",
    ]),
    ["about:published", "events:night:published"],
  );
});
test("Inline About images remain protected when present only in the published snapshot", () => {
  const initial = emptyAbout();
  const content = { ...initial.draft, body: html, bodyFormat: "html" as const };
  const published = nextAbout(
    initial,
    content,
    0,
    "publish",
    "editor",
    "2026-10-12T10:00:00Z",
  );
  assert.deepEqual(aboutImageIds(content), [id]);
  const draft = nextAbout(
    published,
    { ...content, body: "" },
    1,
    "save",
    "editor",
    "2026-10-12T11:00:00Z",
  );
  assert.deepEqual(
    aboutReferences(id, draft, [
      "events:night:published",
      "about:draft",
      "about:published",
    ]),
    ["events:night:published", "about:published"],
  );
});
test("Date inputs round-trip event timezones, handle DST and reject nonexistent local times", () => {
  assert.equal(
    dateTimeISO("2026-11-14T23:00", "Europe/Madrid"),
    "2026-11-14T22:00:00.000Z",
  );
  assert.equal(
    dateTimeISO("2026-07-14T23:00", "Europe/Madrid"),
    "2026-07-14T21:00:00.000Z",
  );
  assert.equal(
    dateTimeInput("2026-07-14T21:00:00Z", "Europe/Madrid"),
    "2026-07-14T23:00",
  );
  assert.equal(dateTimeISO("", "Europe/Madrid"), "");
  assert.throws(
    () => dateTimeISO("2026-03-29T02:30", "Europe/Madrid"),
    /no existe/,
  );
  assert.throws(
    () => dateTimeISO("2026-02-31T12:00", "Europe/Madrid"),
    /no existe/,
  );
});
