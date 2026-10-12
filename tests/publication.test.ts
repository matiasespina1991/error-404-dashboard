import test from "node:test";
import assert from "node:assert/strict";
import { emptyAbout } from "../lib/content/types.ts";
import { nextAbout, aboutReferences } from "../lib/content/publication.ts";

test("saving a draft preserves the published snapshot", () => {
  const initial = emptyAbout();
  const original = { ...initial.draft, title: "Published", imageId: "old" };
  const published = nextAbout(
    initial,
    original,
    0,
    "publish",
    "user",
    "2026-10-11T10:00:00Z",
  );
  const draft = nextAbout(
    published,
    { ...original, title: "Private draft", imageId: "new" },
    1,
    "save",
    "user",
    "2026-10-11T11:00:00Z",
  );
  assert.equal(draft.published?.title, "Published");
  assert.equal(draft.draft.title, "Private draft");
  assert.equal(draft.publishedAt, published.publishedAt);
  assert.deepEqual(
    aboutReferences("old", draft, ["about:draft", "about:published"]),
    ["about:published"],
  );
  assert.deepEqual(aboutReferences("new", draft, []), ["about:draft"]);
});

test("unpublishing preserves the draft and removes its public reference", () => {
  const initial = emptyAbout();
  const content = { ...initial.draft, imageId: "image" };
  const published = nextAbout(initial, content, 0, "publish", "user", "now");
  const unpublished = nextAbout(
    published,
    content,
    1,
    "unpublish",
    "user",
    "later",
  );
  assert.equal(unpublished.published, null);
  assert.equal(unpublished.publishedAt, null);
  assert.equal(unpublished.draft.imageId, "image");
  assert.deepEqual(
    aboutReferences("image", unpublished, ["about:draft", "about:published"]),
    ["about:draft"],
  );
});

test("stale revisions cannot overwrite another editor's changes", () => {
  const current = { ...emptyAbout(), revision: 3 };
  assert.throws(
    () => nextAbout(current, current.draft, 2, "save", "user", "now"),
    (error: unknown) =>
      Boolean(
        error &&
          typeof error === "object" &&
          "status" in error &&
          error.status === 409,
      ),
  );
});

test("updating About does not remove other modules' media references", () => {
  assert.deepEqual(
    aboutReferences("old", emptyAbout(), [
      "about:draft",
      "about:published",
      "interview:123:published",
    ]),
    ["interview:123:published"],
  );
});
