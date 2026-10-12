"use client";
import { useCallback, useRef, useState } from "react";
import MediaPickerDialog from "@/components/media-picker-dialog";
import { toGalleryMedia } from "@/lib/gallery-media";
import type { MediaDoc } from "@/lib/media-upload";
import type { MediaAsset, MediaPage } from "@/lib/content/types";

export function useContentMedia(initial: MediaPage, selected: MediaAsset[]) {
  const [items, setItems] = useState<Map<string, MediaDoc>>(
    () =>
      new Map(
        [...initial.items, ...selected].map((asset) => [
          asset.id,
          toGalleryMedia(asset),
        ]),
      ),
  );
  const remember = useCallback(
    (media: MediaDoc[]) =>
      setItems(
        (current) =>
          new Map([
            ...current,
            ...media.map((item) => [item.id, item] as const),
          ]),
      ),
    [],
  );
  return { items, remember };
}
export function useEditorImages(remember: (media: MediaDoc[]) => void) {
  const [open, setOpen] = useState(false);
  const pending = useRef<((url: string, alt?: string) => void) | null>(null);
  const requestImage = useCallback(
    (insert: (url: string, alt?: string) => void) => {
      pending.current = insert;
      setOpen(true);
    },
    [],
  );
  const dialog = (
    <MediaPickerDialog
      open={open}
      onOpenChange={setOpen}
      title="Insertar imagen en el texto"
      description="Elegí una imagen de la galería."
      selectionMode="single"
      allowedTypes={["image"]}
      onConfirm={(media) => {
        const image = media[0];
        if (!image) return;
        remember(media);
        pending.current?.(
          `/api/media/${encodeURIComponent(image.id)}`,
          image.alt || image.title || "Imagen de Error404",
        );
        pending.current = null;
      }}
    />
  );
  return { requestImage, dialog };
}
