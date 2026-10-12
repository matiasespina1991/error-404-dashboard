"use client";
import PageContainer from "@/components/layout/page-container";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormQuill } from "@/components/forms/form-quill";
import { FormDateTime } from "@/components/forms/form-date-time";
import { ContentMediaField } from "@/components/content-media-field";
import { PublicationActions } from "@/components/publication-actions";
import { useContentMedia, useEditorImages } from "@/hooks/use-content-media";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { bodyAsHtml } from "@/lib/content/rich-text-format";
import type { ContentEntry, EntryDocument } from "@/lib/content/entries";
import type { MediaAsset, MediaPage } from "@/lib/content/types";
import type { MediaDoc } from "@/lib/media-upload";
import { requestJson } from "./client";

const editorValues = (content: ContentEntry): ContentEntry => ({
  ...content,
  body: bodyAsHtml(content.body, content.bodyFormat),
  bodyFormat: "html",
});

export function EntryEditor({
  initial,
  initialMedia,
  selected,
}: {
  initial: EntryDocument;
  initialMedia: MediaPage;
  selected: MediaAsset[];
}) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const form = useForm<ContentEntry>({
    defaultValues: editorValues(initial.draft),
  });
  const content = form.watch();
  const isEvent = content.kind === "events";
  const { items, remember } = useContentMedia(initialMedia, selected);
  const { requestImage, dialog } = useEditorImages(remember);
  const cover = content.cover ? items.get(content.cover.id) : undefined;
  const gallery = content.gallery
    .map((image) => items.get(image.id))
    .filter((item): item is MediaDoc => Boolean(item));
  const dirty = form.formState.isDirty;
  useUnsavedChanges(dirty);

  async function save(intent: "save" | "publish" | "unpublish") {
    if (
      intent === "unpublish" &&
      !window.confirm(
        "¿Retirar este contenido de la web? El borrador se conserva.",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const next = await requestJson<EntryDocument>(
        `/api/content/${content.kind}/${content.slug}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: form.getValues(),
            revision: saved.revision,
            intent,
          }),
        },
      );
      setSaved(next);
      form.reset(editorValues(next.draft));
      const message =
        intent === "publish"
          ? "Publicado. Ya está disponible en la web."
          : intent === "unpublish"
            ? "Retirado de la web. Borrador conservado."
            : "Borrador guardado.";
      setMessage(message);
      toast.success(message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar.";
      setMessage(message);
      setError(true);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer
      pageTitle={`${saved.revision ? "Editar" : "Agregar"} ${isEvent ? "evento" : "entrevista"}`}
      pageDescription="Actualizá el contenido y las imágenes."
    >
      <Link
        href={`/${content.kind}`}
        className="mb-4 inline-block text-sm text-muted-foreground"
      >
        ← {isEvent ? "Eventos" : "Entrevistas"}
      </Link>
      <Card className="mx-auto w-full">
        <CardContent>
          <Form
            form={form}
            onSubmit={form.handleSubmit(() => save("save"))}
            className="space-y-8"
          >
            <fieldset disabled={busy} className="min-w-0 space-y-8">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-6 lg:flex-[3]">
                  <FormInput
                    control={form.control}
                    name="title"
                    label="Título"
                    placeholder={
                      isEvent
                        ? "Ingresá el título del evento"
                        : "Ingresá el título de la entrevista"
                    }
                    required
                  />
                  <FormTextarea
                    control={form.control}
                    name="summary"
                    label="Resumen"
                    placeholder="Una breve presentación..."
                    config={{ rows: 3, maxLength: 1000 }}
                  />
                  <FormQuill
                    control={form.control}
                    name="body"
                    label="Contenido"
                    placeholder={
                      isEvent
                        ? "Escribí el texto del evento..."
                        : "Escribí la entrevista..."
                    }
                    disabled={busy}
                    onRequestImage={requestImage}
                  />
                  {isEvent ? (
                    <div className="space-y-6">
                      <h2 className="text-lg font-semibold">
                        Fecha, lugar y artistas
                      </h2>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormDateTime
                          control={form.control}
                          name="startsAt"
                          label="Inicio"
                          timeZone={
                            content.kind === "events"
                              ? content.timeZone || "Europe/Madrid"
                              : "Europe/Madrid"
                          }
                        />
                        <FormDateTime
                          control={form.control}
                          name="endsAt"
                          label="Final"
                          timeZone={
                            content.kind === "events"
                              ? content.timeZone || "Europe/Madrid"
                              : "Europe/Madrid"
                          }
                        />
                        <FormInput
                          control={form.control}
                          name="timeZone"
                          label="Zona horaria"
                          placeholder="Europe/Madrid"
                        />
                        <FormInput
                          control={form.control}
                          name="eventType"
                          label="Tipo de evento"
                        />
                        <FormInput
                          control={form.control}
                          name="venue"
                          label="Sala / espacio"
                        />
                        <FormInput
                          control={form.control}
                          name="city"
                          label="Ciudad"
                        />
                        <FormInput
                          control={form.control}
                          name="address"
                          label="Dirección"
                        />
                        <FormInput
                          control={form.control}
                          name="region"
                          label="Provincia / región"
                        />
                        <FormInput
                          control={form.control}
                          name="postalCode"
                          label="Código postal"
                        />
                        <FormInput
                          control={form.control}
                          name="country"
                          label="País"
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="lineup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Line-up · Un artista por línea
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                rows={5}
                                ref={field.ref}
                                name={field.name}
                                onBlur={field.onBlur}
                                value={(field.value ?? []).join("\n")}
                                onChange={(event) =>
                                  field.onChange(event.target.value.split("\n"))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <h2 className="text-lg font-semibold">
                        Entradas y contacto
                      </h2>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormSelect
                          control={form.control}
                          name="ticketStatus"
                          label="Estado"
                          options={[
                            {
                              value: "available",
                              label: "Entradas disponibles",
                            },
                            { value: "free", label: "Gratis" },
                            { value: "sold-out", label: "Agotado" },
                            { value: "cancelled", label: "Cancelado" },
                          ]}
                        />
                        <FormInput
                          control={form.control}
                          name="price"
                          label="Precio / texto de entrada"
                        />
                        <FormInput
                          control={form.control}
                          name="ticketUrl"
                          label="Enlace a entradas"
                          type="url"
                          placeholder="https://"
                        />
                        <FormInput
                          control={form.control}
                          name="websiteUrl"
                          label="Web del evento"
                          type="url"
                          placeholder="https://"
                        />
                        <FormInput
                          control={form.control}
                          name="facebookUrl"
                          label="Evento en Facebook"
                          type="url"
                          placeholder="https://"
                        />
                        <FormInput
                          control={form.control}
                          name="contactEmail"
                          label="Email de contacto"
                          type="email"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h2 className="text-lg font-semibold">
                        Datos de la entrevista
                      </h2>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormInput
                          control={form.control}
                          name="artist"
                          label="Artista"
                          required
                        />
                        <FormInput
                          control={form.control}
                          name="interviewer"
                          label="Entrevistador"
                        />
                        <FormInput
                          control={form.control}
                          name="category"
                          label="Categoría"
                        />
                        <FormDateTime
                          control={form.control}
                          name="publishedDate"
                          label="Fecha de la entrevista"
                          timeZone="Europe/Madrid"
                        />
                      </div>
                    </div>
                  )}
                  <FormTextarea
                    control={form.control}
                    name="seoDescription"
                    label="Descripción para buscadores"
                    config={{ rows: 3, maxLength: 320 }}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-6 lg:flex-[1]">
                  <ContentMediaField
                    label="Imagen principal"
                    media={cover ? [cover] : []}
                    disabled={busy}
                    onChange={(media) => {
                      remember(media);
                      const image = media[0];
                      form.setValue(
                        "cover",
                        image
                          ? {
                              id: image.id,
                              alt:
                                content.cover?.id === image.id
                                  ? content.cover.alt
                                  : (image.alt ?? ""),
                            }
                          : null,
                        { shouldDirty: true },
                      );
                    }}
                  />
                  {content.cover && (
                    <FormInput
                      control={form.control}
                      name="cover.alt"
                      label="Descripción de portada"
                      required
                    />
                  )}
                  <ContentMediaField
                    label="Galería"
                    media={gallery}
                    max={12}
                    disabled={busy}
                    onChange={(media) => {
                      remember(media);
                      form.setValue(
                        "gallery",
                        media.map((item) => ({
                          id: item.id,
                          alt:
                            content.gallery.find(
                              (image) => image.id === item.id,
                            )?.alt ??
                            item.alt ??
                            "",
                        })),
                        { shouldDirty: true },
                      );
                    }}
                  />
                  {content.gallery.map((image, index) => (
                    <FormInput
                      key={image.id}
                      control={form.control}
                      name={`gallery.${index}.alt`}
                      label={`Descripción de imagen ${index + 1}`}
                      required
                    />
                  ))}
                </div>
              </div>
            </fieldset>
            {message && (
              <p
                role={error ? "alert" : "status"}
                className={`message ${error ? "error" : ""}`}
              >
                {message}
              </p>
            )}
            <PublicationActions
              dirty={dirty}
              busy={busy}
              published={Boolean(saved.published)}
              onUndo={() => form.reset(editorValues(saved.draft))}
              onPublish={() => void save("publish")}
              onUnpublish={() => void save("unpublish")}
              preview={`/${content.kind}/${content.slug}/preview`}
            />
          </Form>
        </CardContent>
      </Card>
      {dialog}
    </PageContainer>
  );
}
