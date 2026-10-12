"use client";
import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { FileUploader } from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import MediaPickerDialog from "@/components/media-picker-dialog";
import {
  MediaPreviewCard,
  SortableAttachmentCard,
} from "@/components/content-media-cards";
import { uploadMediaFiles, type MediaDoc } from "@/lib/media-upload";
import { toGalleryMedia } from "@/lib/gallery-media";

export function ContentMediaField({
  label,
  media,
  onChange,
  max = 1,
  disabled = false,
}: {
  label: string;
  media: MediaDoc[];
  onChange: (media: MediaDoc[]) => void;
  max?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const remove = (id: string) =>
    onChange(media.filter((item) => item.id !== id));
  const reorder = ({ active, over }: DragEndEvent) => {
    if (disabled || !over || active.id === over.id) return;
    const from = media.findIndex((item) => item.id === active.id),
      to = media.findIndex((item) => item.id === over.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(media, from, to));
  };
  async function upload(files: File[]) {
    const assets = await uploadMediaFiles(
      files,
      { context: "gallery", role: "gallery" },
      (name, progress) =>
        setProgresses((current) => ({ ...current, [name]: progress })),
    );
    const uploaded = assets.map(toGalleryMedia);
    onChange(
      max === 1 ? uploaded.slice(0, 1) : [...media, ...uploaded].slice(0, max),
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold">{label}</div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs"
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          Agregar desde galería
        </Button>
      </div>
      {max === 1 ? (
        media.map((item) => (
          <MediaPreviewCard
            key={item.id}
            media={item}
            onRemove={() => remove(item.id)}
          />
        ))
      ) : media.length ? (
        <DndContext sensors={sensors} onDragEnd={reorder}>
          <SortableContext
            items={media.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {media.map((item) => (
                <SortableAttachmentCard
                  key={item.id}
                  media={item}
                  onRemove={() => remove(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-muted-foreground text-sm">
          No hay imágenes todavía.
        </div>
      )}
      <FileUploader
        onUpload={upload}
        progresses={progresses}
        accept={{ "image/jpeg": [], "image/png": [], "image/webp": [] }}
        maxFiles={max === 1 ? 1 : Math.max(1, Math.min(10, max - media.length))}
        maxSize={3 * 1024 * 1024}
        multiple={max > 1}
        disabled={disabled || (max > 1 && media.length >= max)}
        onPickFromGallery={() => setOpen(true)}
      />
      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        title={max === 1 ? "Seleccionar imagen" : "Seleccionar imágenes"}
        allowedTypes={["image"]}
        selectionMode={max === 1 ? "single" : "multiple"}
        selectedIds={media.map((item) => item.id)}
        maxSelection={max}
        onConfirm={onChange}
      />
    </div>
  );
}
