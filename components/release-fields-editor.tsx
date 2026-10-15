"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenreChips } from "@/components/genre-chips";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormInput } from "@/components/forms/form-input";
import type { ContentEntry } from "@/lib/content/entries";
import {
  releaseFormats,
  usesSides,
  type ReleaseFormat,
  type ReleaseTrack,
} from "@/lib/content/releases";

export function ReleaseFieldsEditor() {
  const form = useFormContext<ContentEntry>();
  const { fields, append, replace } = useFieldArray({
    control: form.control,
    name: "tracks",
  });
  const format = form.watch("format");
  const tracks = form.watch("tracks") || [];
  const sided = usesSides(format);
  const renumber = (items: ReleaseTrack[]) =>
    items.map((track, index) => ({
      ...track,
      position: sided ? track.position : String(index + 1),
    }));
  function move(index: number, direction: number) {
    const next = [...form.getValues("tracks")];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    replace(renumber(next));
  }
  function changeFormat(value: ReleaseFormat) {
    const old = form.getValues("format");
    form.setValue("format", value, { shouldDirty: true });
    replace(
      form.getValues("tracks").map((track, index) => ({
        ...track,
        position: usesSides(value)
          ? usesSides(old)
            ? track.position
            : `A${index + 1}`
          : String(index + 1),
      })),
    );
  }
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Datos del release</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="release-format">Formato</Label>
          <Select
            value={format}
            onValueChange={(value) => changeFormat(value as ReleaseFormat)}
          >
            <SelectTrigger id="release-format" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {releaseFormats.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FormInput
          control={form.control}
          name="purchaseUrl"
          label="Link de compra"
          type="url"
          placeholder="https://"
        />
      </div>
      <GenreChips control={form.control} />
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Tracklist</h2>
        </div>
        {fields.map((field, index) => {
          const audio = tracks[index]?.audio;
          const id = `track-${field.id}`;
          return (
            <div key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Track {index + 1}</p>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Subir track ${index + 1}`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Bajar track ${index + 1}`}
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      replace(
                        renumber(
                          form
                            .getValues("tracks")
                            .filter((_, i) => i !== index),
                        ),
                      )
                    }
                  >
                    Quitar
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-20 shrink-0 space-y-2">
                  <Label htmlFor={`${id}-position`}>Posición</Label>
                  <Input
                    id={`${id}-position`}
                    readOnly={!sided}
                    maxLength={3}
                    {...form.register(`tracks.${index}.position`)}
                    aria-describedby="track-position-help"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <FormInput
                    control={form.control}
                    name={`tracks.${index}.title`}
                    label="Título"
                    placeholder="Nombre del track"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-audio`}>Preescucha</Label>
                <Select
                  value={audio?.type || "none"}
                  onValueChange={(type) => {
                    form.setValue(
                      `tracks.${index}.audio`,
                      type === "external"
                        ? { type, url: "" }
                        : type === "gallery"
                          ? { type, mediaId: null }
                          : { type: "none" },
                      { shouldDirty: true },
                    );
                  }}
                >
                  <SelectTrigger id={`${id}-audio`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No</SelectItem>
                    <SelectItem value="external">Link Externo</SelectItem>
                    <SelectItem value="gallery">Audio desde Galería</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {audio?.type === "external" && (
                <div className="space-y-2">
                  <FormInput
                    control={form.control}
                    name={`tracks.${index}.audio.url`}
                    label="URL del audio"
                    type="url"
                    placeholder="https://ejemplo.com/preview.mp3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Link directo a un audio reproducible (por ejemplo MP3). Una
                    página de Spotify, YouTube o SoundCloud no es un archivo de
                    audio.
                  </p>
                </div>
              )}
              {audio?.type === "gallery" && (
                <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  Próximamente: seleccionar audio desde Galería. Por ahora este
                  track se publica sin preescucha.
                </p>
              )}
            </div>
          );
        })}
        {!fields.length && (
          <p className="text-sm text-muted-foreground">
            Todavía no hay tracks. Agregá el primero para armar el release.
          </p>
        )}
        <p id="track-position-help" className="text-xs text-muted-foreground">
          Las posiciones deben ser únicas. Cambiar a CD/Digital/Otro o reordenar
          esos formatos actualiza la numeración.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={fields.length >= 60}
          onClick={() => {
            const used = new Set(tracks.map((track) => track.position));
            let position = tracks.length + 1;
            if (sided) {
              position = 1;
              while (used.has(`A${position}`)) position++;
            }
            append({
              position: sided ? `A${position}` : String(position),
              title: "",
              audio: { type: "none" },
            });
          }}
        >
          Agregar track
        </Button>
      </div>
    </div>
  );
}
