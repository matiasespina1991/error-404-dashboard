import test from "node:test";
import assert from "node:assert/strict";
import { toGalleryMedia } from "../lib/gallery-media.ts";
import type { MediaAsset } from "../lib/content/types.ts";
const asset: MediaAsset = {
  id: "import-example",
  name: "Club night",
  originalFilename: "original.png",
  alt: "Crowd at the show",
  path: "media/import-example/image.webp",
  thumbnailPath: "media/import-example/thumbnail.webp",
  width: 1400,
  height: 933,
  bytes: 43210,
  createdAt: "2026-10-12T12:00:00Z",
  createdBy: "editor",
  references: ["events:club-night:published"],
  status: "ready",
};
test("Laura gallery data uses Error404 session API and retains references and alt text", () => {
  const media = toGalleryMedia(asset);
  assert.equal(media.paths.original.downloadURL, "/api/media/import-example");
  assert.equal(
    media.paths.derivatives.webp_medium.storagePath,
    "/api/media/import-example?size=thumbnail",
  );
  assert.equal(
    media.paths.derivatives.webp_large.downloadURL,
    "/api/media/import-example",
  );
  assert.equal(media.alt, asset.alt);
  assert.deepEqual(media.references, asset.references);
  assert.equal(media.createdAt, asset.createdAt);
  assert.equal(media.sizeBytes, asset.bytes);
});
test("renamed media retains original upload filename and legacy records remain compatible", () => {
  assert.equal(toGalleryMedia(asset).originalFilename, "original.png");
  assert.equal(
    toGalleryMedia({ ...asset, originalFilename: undefined }).originalFilename,
    "Club night",
  );
  assert.equal(
    toGalleryMedia({ ...asset, status: "deleting" }).processed,
    false,
  );
});
