import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyEntry,
  validateEntry,
  type ReleaseContent,
} from "../lib/content/entries.ts";
import {
  nextEntry,
  entryReferences,
  imageIds,
} from "../lib/content/entry-publication.ts";
import { entryRows } from "../lib/content/entry-rows.ts";

function release(): ReleaseContent {
  return {
    ...emptyEntry("releases", "sun-ray").draft,
    kind: "releases",
    title: "Sun Ray",
    summary: "A record",
    body: "Release notes",
    cover: {
      id: "abc-12345678-1234-1234-1234-123456789abc",
      alt: "Record sleeve",
    },
    genres: ["House", " Electro ", "House"],
    purchaseUrl: "https://example.com/product/sun-ray",
    format: "vinyl",
    tracks: [
      {
        position: "A1",
        title: "Sun Ray",
        audio: { type: "external", url: "https://example.com/preview.mp3" },
      },
      { position: "B1", title: "Remix", audio: { type: "none" } },
    ],
  };
}
const validate = (value: unknown, publish = true) =>
  validateEntry(value, "releases", "sun-ray", publish) as ReleaseContent;

test("Release drafts allow incomplete content; publication needs common fields and tracks; genres are optional", () => {
  assert.doesNotThrow(() =>
    validate(emptyEntry("releases", "sun-ray").draft, false),
  );
  assert.throws(() => validate(emptyEntry("releases", "sun-ray").draft));
  assert.deepEqual(validate({ ...release(), genres: [] }).genres, []);
  assert.throws(() => validate({ ...release(), tracks: [] }));
  assert.deepEqual(validate(release()).genres, ["House", "Electro"]);
});
test("Physical sides and numeric formats keep distinct unique ordering", () => {
  assert.doesNotThrow(() => validate(release()));
  assert.throws(() => validate({ ...release(), format: "cd" }));
  assert.doesNotThrow(() =>
    validate({
      ...release(),
      format: "digital",
      tracks: release().tracks.map((track, i) => ({
        ...track,
        position: String(i + 1),
      })),
    }),
  );
  assert.throws(() =>
    validate({
      ...release(),
      tracks: release().tracks.map((track) => ({ ...track, position: "A1" })),
    }),
  );
  assert.throws(() => validate({ ...release(), format: "anything" }));
});
test("Audio URLs reject active schemes and credentials; gallery remains a safe placeholder", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:audio/mp3;base64,abc",
    "http://example.com/a.mp3",
    "https://user:pass@example.com/a.mp3",
  ]) {
    assert.throws(() =>
      validate({
        ...release(),
        tracks: [
          { position: "A1", title: "Track", audio: { type: "external", url } },
        ],
      }),
    );
  }
  assert.throws(() =>
    validate({
      ...release(),
      tracks: [
        {
          position: "A1",
          title: "Track",
          audio: { type: "external", url: "" },
        },
      ],
    }),
  );
  const placeholder = validate({
    ...release(),
    tracks: [
      {
        position: "A1",
        title: "Track",
        audio: { type: "gallery", mediaId: null },
      },
    ],
  });
  assert.deepEqual(placeholder.tracks[0]!.audio, {
    type: "gallery",
    mediaId: null,
  });
  assert.throws(() =>
    validate({
      ...release(),
      tracks: [
        {
          position: "A1",
          title: "Track",
          audio: { type: "gallery", mediaId: "fake-audio" },
        },
      ],
    }),
  );
  assert.throws(() =>
    validate({ ...release(), purchaseUrl: "javascript:alert(1)" }),
  );
});
test("Releases preserve draft/publication isolation, revisions and media references", () => {
  const empty = emptyEntry("releases", "sun-ray");
  const published = nextEntry(
    empty,
    validate(release()),
    0,
    "publish",
    "editor",
    "2026-10-15T12:00:00Z",
  );
  const draft = nextEntry(
    published,
    { ...published.draft, title: "Changed draft" },
    1,
    "save",
    "editor",
    "2026-10-15T13:00:00Z",
  );
  assert.equal(draft.published?.title, "Sun Ray");
  assert.throws(() =>
    nextEntry(draft, draft.draft, 1, "publish", "editor", "now"),
  );
  const id = imageIds(published.draft)[0]!;
  assert.deepEqual(entryReferences(id, published, []), [
    "releases:sun-ray:draft",
    "releases:sun-ray:published",
  ]);
  const withdrawn = nextEntry(
    draft,
    draft.draft,
    2,
    "unpublish",
    "editor",
    "2026-10-15T14:00:00Z",
  );
  assert.equal(withdrawn.published, null);
  assert.deepEqual(entryReferences(id, withdrawn, []), [
    "releases:sun-ray:draft",
  ]);
  const row = entryRows([published])[0]!;
  assert.match(row.search, /electro/);
  assert.match(row.search, /remix/);
});
