// The gallery presentation is copied from Laura; Error404 media stays behind its session API.
import { requestJson } from "@/components/client";
import type { MediaAsset, MediaPage } from "@/lib/content/types";
import { toGalleryMedia } from "./gallery-media";
export type MediaOriginContext = "gallery" | "exhibition";
export type MediaOriginRole = "gallery" | "feature" | "attachment";

export type MediaOrigin = {
  context: MediaOriginContext;
  role?: MediaOriginRole;
  exhibitionId?: string | null;
};

export type UploadResult = {
  uploadId: string;
  storagePath: string;
  fileName: string;
};

export type MediaDoc = {
  id: string;
  type: "image" | "video";
  uploadId: string;
  originalFilename?: string;
  title?: string;
  createdAt?: unknown;
  deletedAt?: unknown | null;
  origin: {
    context: MediaOriginContext;
    exhibitionId?: string | null;
    role?: MediaOriginRole;
  };
  processed: boolean;
  processing?: {
    stage?: string;
    progress?: number;
    updatedAt?: unknown;
  };
  paths?: {
    original?: {
      storagePath?: string | null;
      downloadURL?: string | null;
      sizeBytes?: number;
    };
    derivatives?: Record<
      string,
      {
        storagePath?: string | null;
        downloadURL?: string | null;
        sizeBytes?: number;
      }
    >;
    poster?: {
      storagePath?: string | null;
      downloadURL?: string | null;
      sizeBytes?: number;
    };
  };
  sizeBytes?: number;
  alt?: string;
  references?: string[];
};

export const GALLERY_CHANGED = "error404:media-changed";
function notifyChanged() {
  window.dispatchEvent(new Event(GALLERY_CHANGED));
}

export async function listGalleryMedia(
  initial?: MediaPage,
  signal?: AbortSignal,
): Promise<MediaDoc[]> {
  let page =
    initial ??
    (await requestJson<MediaPage>("/api/media", { cache: "no-store", signal }));
  const items = new Map(
    page.items.map((asset) => [asset.id, toGalleryMedia(asset)]),
  );
  const seenCursors = new Set<string>();
  while (page.cursor) {
    if (seenCursors.has(page.cursor))
      throw new Error("No se pudo completar la carga de la galería.");
    seenCursors.add(page.cursor);
    page = await requestJson<MediaPage>(
      `/api/media?cursor=${encodeURIComponent(page.cursor)}`,
      { cache: "no-store", signal },
    );
    for (const asset of page.items) items.set(asset.id, toGalleryMedia(asset));
  }
  return [...items.values()];
}

export async function updateGalleryMedia(media: MediaDoc, title: string) {
  await requestJson(`/api/media/${encodeURIComponent(media.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: title, alt: media.alt ?? "" }),
  });
  notifyChanged();
}

export async function deleteGalleryMedia(id: string) {
  await requestJson(`/api/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  notifyChanged();
}

export async function uploadMediaFiles(
  files: File[],
  _origin: MediaOrigin,
  onProgress?: (name: string, progress: number) => void,
) {
  if (files.length > 10) throw new Error("Elegí hasta 10 imágenes por carga.");
  const uploaded: MediaAsset[] = [];
  try {
    // Sequential uploads avoid spiking the server's image processing memory.
    for (const file of files) {
      const asset = await new Promise<MediaAsset>((resolve, reject) => {
        const form = new FormData();
        form.append("file", file);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/media");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable)
            onProgress?.(
              file.name,
              Math.round((event.loaded / event.total) * 100),
            );
        };
        xhr.onerror = () =>
          reject(new Error("Se interrumpió la subida. Intentá nuevamente."));
        xhr.onload = () => {
          if (xhr.status === 401) window.location.assign("/login");
          try {
            const result = JSON.parse(xhr.responseText);
            if (xhr.status < 200 || xhr.status >= 300)
              reject(new Error(result.error || "No se pudo subir la imagen."));
            else resolve(result as MediaAsset);
          } catch {
            reject(new Error("No se pudo subir la imagen."));
          }
        };
        xhr.send(form);
      });
      uploaded.push(asset);
      onProgress?.(file.name, 100);
    }
    return uploaded;
  } finally {
    // Refresh also after a partial batch so successfully stored images remain visible.
    notifyChanged();
  }
}
