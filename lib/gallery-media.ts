import type { MediaAsset } from "./content/types";

export function toGalleryMedia(asset: MediaAsset) {
  const url = `/api/media/${encodeURIComponent(asset.id)}`;
  const full = { storagePath: url, downloadURL: url, sizeBytes: asset.bytes };
  const thumbnail = {
    storagePath: `${url}?size=thumbnail`,
    downloadURL: `${url}?size=thumbnail`,
  };
  return {
    id: asset.id,
    type: "image" as const,
    uploadId: asset.id,
    originalFilename: asset.originalFilename ?? asset.name,
    title: asset.name,
    alt: asset.alt,
    references: asset.references,
    createdAt: asset.createdAt,
    origin: { context: "gallery" as const, role: "gallery" as const },
    processed: asset.status === "ready",
    sizeBytes: asset.bytes,
    paths: {
      original: full,
      derivatives: {
        webp_large: full,
        webp_medium: thumbnail,
        webp_small: thumbnail,
      },
    },
  };
}
