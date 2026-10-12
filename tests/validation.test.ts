import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAbout,
  parseRevision,
  MEDIA_ID,
} from "../lib/content/validation.ts";

const content = {
  title: "Error404",
  intro: "Independent label",
  body: "First paragraph.\n\nSecond paragraph.",
  imageId: null,
  imageAlt: "",
  seoDescription: "About the label",
};

test("drafts allow incomplete text; publication rejects it", () => {
  const draft = { ...content, intro: "", body: "" };
  assert.equal(parseAbout(draft, false).intro, "");
  assert.throws(() => parseAbout(draft, true), /completá/);
});

test("published images require alternative text and a valid asset ID", () => {
  const imageId = "mabc123-123e4567-e89b-42d3-a456-426614174000";
  assert.equal(MEDIA_ID.test(imageId), true);
  assert.throws(() => parseAbout({ ...content, imageId }, true), /descripción/);
  assert.equal(
    parseAbout({ ...content, imageId, imageAlt: "The team" }, true).imageId,
    imageId,
  );
  assert.throws(
    () => parseAbout({ ...content, imageId: "../../private" }, false),
    /inválida/,
  );
});

test("text limits and runtime types are enforced", () => {
  assert.throws(
    () => parseAbout({ ...content, body: "x".repeat(30001) }, false),
    /máximo/,
  );
  assert.throws(() => parseAbout({ ...content, title: {} }, true));
  assert.equal(
    parseAbout({ ...content, title: "  Error404  " }, true).title,
    "Error404",
  );
});

test("revision must be a non-negative safe integer", () => {
  assert.equal(parseRevision(0), 0);
  assert.equal(parseRevision(4), 4);
  for (const invalid of [
    -1,
    1.5,
    "1",
    null,
    Number.NaN,
    Number.MAX_SAFE_INTEGER + 1,
  ])
    assert.throws(() => parseRevision(invalid));
});
