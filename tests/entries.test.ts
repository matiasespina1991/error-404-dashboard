import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyEntry,
  validateEntry,
  type EventContent,
} from "../lib/content/entries.ts";
import {
  entryReferences,
  nextEntry,
} from "../lib/content/entry-publication.ts";
const image = {
  id: "abc-12345678-1234-1234-1234-123456789abc",
  alt: "Dance floor",
};
function valid(): EventContent {
  return {
    ...emptyEntry("events", "night-one").draft,
    kind: "events",
    title: "Night",
    summary: "Summary",
    body: "Body",
    cover: image,
    gallery: [],
    startsAt: "2026-11-14T23:00:00+01:00",
    endsAt: "2026-11-15T06:00:00+01:00",
    timeZone: "Europe/Madrid",
    venue: "Venue",
    address: "",
    city: "Barcelona",
    country: "Spain",
    region: "",
    postalCode: "",
    lineup: ["Artist"],
    eventType: "Club night",
    ticketStatus: "available",
    ticketUrl: "",
    price: "",
    websiteUrl: "",
    facebookUrl: "",
    contactEmail: "",
  };
}
test("Incomplete drafts can be saved; incomplete events cannot be published", () => {
  const draft = emptyEntry("events", "night-one").draft;
  assert.doesNotThrow(() => validateEntry(draft, "events", "night-one", false));
  assert.throws(() => validateEntry(draft, "events", "night-one", true));
});
test("Events normalize offsets to UTC and reject reversed or missing-zone dates", () => {
  const entry = validateEntry(
    valid(),
    "events",
    "night-one",
    true,
  ) as EventContent;
  assert.equal(entry.startsAt, "2026-11-14T22:00:00.000Z");
  assert.throws(() =>
    validateEntry(
      { ...valid(), endsAt: "2026-11-14T20:00:00Z" },
      "events",
      "night-one",
      true,
    ),
  );
  assert.throws(() =>
    validateEntry(
      { ...valid(), startsAt: "2026-11-14T23:00:00" },
      "events",
      "night-one",
      true,
    ),
  );
});
test("Reject active URL schemes, invalid timezone and changed slugs", () => {
  for (const patch of [
    { ticketUrl: "javascript:alert(1)" },
    { startsAt: "2026-02-31T20:00:00Z" },
    { timeZone: "Not/AZone" },
    { slug: "other" },
  ])
    assert.throws(() =>
      validateEntry({ ...valid(), ...patch }, "events", "night-one", true),
    );
});
test("Publish/save/unpublish preserve public snapshot and detect concurrent edits", () => {
  const current = emptyEntry("events", "night-one"),
    content = valid();
  const live = nextEntry(current, content, 0, "publish", "uid", "now");
  const draft = nextEntry(
    live,
    { ...content, title: "Edited" },
    1,
    "save",
    "uid",
    "later",
  );
  assert.equal(draft.published?.title, "Night");
  assert.throws(() => nextEntry(draft, content, 1, "publish", "uid", "later"));
  const withdrawn = nextEntry(
    draft,
    draft.draft,
    2,
    "unpublish",
    "uid",
    "later",
  );
  assert.equal(withdrawn.published, null);
  assert.equal(withdrawn.draft.title, "Edited");
});
test("Cover/gallery refs keep other content protected while withdrawn assets lose public reference", () => {
  const content = valid();
  content.gallery = [image];
  const live = nextEntry(
    emptyEntry("events", "night-one"),
    content,
    0,
    "publish",
    "uid",
    "now",
  );
  assert.deepEqual(entryReferences(image.id, live, ["about:published"]), [
    "about:published",
    "events:night-one:draft",
    "events:night-one:published",
  ]);
  const withdrawn = nextEntry(live, content, 1, "unpublish", "uid", "later");
  assert.deepEqual(
    entryReferences(image.id, withdrawn, [
      "about:published",
      "events:night-one:published",
    ]),
    ["about:published", "events:night-one:draft"],
  );
});
test("Interview requires artist/date/cover and uses separate kind", () => {
  const draft = emptyEntry("interviews", "conversation").draft;
  assert.doesNotThrow(() =>
    validateEntry(draft, "interviews", "conversation", false),
  );
  assert.throws(() => validateEntry(draft, "interviews", "conversation", true));
  assert.doesNotThrow(() =>
    validateEntry(
      {
        ...draft,
        title: "Conversation",
        summary: "Summary",
        body: "Body",
        cover: image,
        artist: "Artist",
        publishedDate: "2026-10-11T12:00:00Z",
      },
      "interviews",
      "conversation",
      true,
    ),
  );
});

test("Image descriptions are optional and fall back to the content title", () => {
  const entry = validateEntry(
    {
      ...valid(),
      cover: { ...image, alt: "" },
      gallery: [{ ...image, alt: "" }],
    },
    "events",
    "night-one",
    true,
  );
  assert.equal(entry.cover?.alt, entry.title);
  assert.equal(entry.gallery[0]!.alt, entry.title);
});
