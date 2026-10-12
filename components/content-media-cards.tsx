"use client";
import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useStorageAssetSrc } from "@/hooks/use-storage-asset-src";
import type { MediaDoc } from "@/lib/media-upload";
import { cn } from "@/lib/utils";
function getPreviewPath(media: MediaDoc) {
  if (media.type === "video") {
    return media.paths?.poster?.storagePath ?? null;
  }

  return (
    media.paths?.derivatives?.webp_thumb?.storagePath ??
    media.paths?.derivatives?.webp_small?.storagePath ??
    media.paths?.original?.storagePath ??
    null
  );
}

export function MediaPreviewCard({
  media,
  onRemove,
  actions,
}: {
  media: MediaDoc;
  onRemove?: () => void;
  actions?: ReactNode;
}) {
  const previewPath = getPreviewPath(media);
  const { src, hasSource, handleError } = useStorageAssetSrc(
    previewPath ? { storagePath: previewPath } : null,
    { preferDirect: false },
  );

  return (
    <div className="border-border/60 bg-card flex max-w-[25rem] min-w-0 items-center gap-3 rounded-lg border px-3 py-2 shadow-xs">
      <div className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md">
        {hasSource ? (
          <img
            src={src}
            alt={media.id}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={handleError}
          />
        ) : (
          <span className="text-muted-foreground text-[11px]">
            {media.processed ? "Sin vista previa" : "Procesando…"}
          </span>
        )}
      </div>
      <div className="grid flex-1">
        <div className="text-sm font-medium">
          {media.type === "video" ? "Video" : "Imagen"}
        </div>
        <div className="text-muted-foreground truncate text-xs">{media.id}</div>
      </div>
      {actions ? (
        actions
      ) : onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="cursor-pointer"
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export function SortableAttachmentCard({
  media,
  onRemove,
}: {
  media: MediaDoc;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging ? "opacity-70" : null)}
    >
      <MediaPreviewCard
        media={media}
        onRemove={onRemove}
        actions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              ref={setActivatorNodeRef}
              className="text-muted-foreground hover:text-foreground inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md transition-colors active:cursor-grabbing"
              aria-label="Reordenar adjunto"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="cursor-pointer"
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        }
      />
    </div>
  );
}
