import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slugFromTitle,
  createWithUniqueSlug,
  SlugCollisionError,
} from "../lib/content/slug.ts";

test("Automatic URLs normalize accents, punctuation and long titles and reserve the new route", () => {
  assert.equal(
    slugFromTitle("  Sebastián & Enrico — EP / 02!  "),
    "sebastian-enrico-ep-02",
  );
  assert.equal(slugFromTitle("New"), "new-entry");
  assert.equal(slugFromTitle("🎵"), "entry");
  const long = slugFromTitle("Título largo ".repeat(30));
  assert.ok(long.length <= 100);
  assert.match(long, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test("New entries use the title directly; existing titles get an ID without overwriting", async () => {
  const existing = new Map<string, string>([["sun-ray", "Original entry"]]);
  const create = async (slug: string) => {
    if (existing.has(slug)) throw new SlugCollisionError();
    existing.set(slug, "New entry");
    return slug;
  };
  assert.equal(
    await createWithUniqueSlug(
      "A different release",
      create,
      () => "12345678-abcd",
    ),
    "a-different-release",
  );
  assert.equal(
    await createWithUniqueSlug("Sun Ray", create, () => "12345678-abcd"),
    "sun-ray-12345678abcd",
  );
  assert.equal(existing.get("sun-ray"), "Original entry");
});

test("Simultaneous creations retry atomic collisions and preserve both entries", async () => {
  const entries = new Set<string>();
  const create = async (slug: string) => {
    await Promise.resolve();
    if (entries.has(slug)) throw new SlugCollisionError();
    entries.add(slug);
    return slug;
  };
  const results = await Promise.all([
    createWithUniqueSlug("Same title", create, () => "aaaaaaaa"),
    createWithUniqueSlug("Same title", create, () => "bbbbbbbb"),
  ]);
  assert.equal(new Set(results).size, 2);
  assert.ok(results.includes("same-title"));
  assert.equal(entries.size, 2);
});

test("Validation or infrastructure errors are propagated rather than retried as URL collisions", async () => {
  let calls = 0;
  await assert.rejects(
    createWithUniqueSlug(
      "Title",
      async () => {
        calls++;
        throw new Error("Invalid content");
      },
      () => "id",
    ),
    /Invalid content/,
  );
  assert.equal(calls, 1);
});
