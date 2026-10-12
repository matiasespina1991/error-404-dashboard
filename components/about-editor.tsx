"use client";
import PageContainer from "@/components/layout/page-container";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormQuill } from "@/components/forms/form-quill";
import { ContentMediaField } from "@/components/content-media-field";
import { PublicationActions } from "@/components/publication-actions";
import { useContentMedia, useEditorImages } from "@/hooks/use-content-media";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { bodyAsHtml } from "@/lib/content/rich-text-format";
import type {
  AboutContent,
  AboutDocument,
  MediaAsset,
  MediaPage,
} from "@/lib/content/types";
import { requestJson } from "./client";

const editorValues = (content: AboutContent): AboutContent => ({
  ...content,
  body: bodyAsHtml(content.body, content.bodyFormat),
  bodyFormat: "html",
});

export function AboutEditor({
  initial,
  initialMedia,
  selected,
}: {
  initial: AboutDocument;
  initialMedia: MediaPage;
  selected: MediaAsset | null;
}) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const form = useForm<AboutContent>({
    defaultValues: editorValues(initial.draft),
  });
  const content = form.watch();
  const { items, remember } = useContentMedia(
    initialMedia,
    selected ? [selected] : [],
  );
  const { requestImage, dialog } = useEditorImages(remember);
  const image = content.imageId ? items.get(content.imageId) : undefined;
  const dirty = form.formState.isDirty;
  useUnsavedChanges(dirty);

  async function save(intent: "save" | "publish" | "unpublish") {
    if (
      intent === "unpublish" &&
      !window.confirm("¿Retirar About de la web? El borrador se conserva.")
    )
      return;
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const next = await requestJson<AboutDocument>("/api/content/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: form.getValues(),
          revision: saved.revision,
          intent,
        }),
      });
      setSaved(next);
      form.reset(editorValues(next.draft));
      const message =
        intent === "publish"
          ? "About publicado."
          : intent === "unpublish"
            ? "About retirado de la web."
            : "Borrador guardado.";
      setMessage(message);
      toast.success(message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar About.";
      setMessage(message);
      setError(true);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer
      pageTitle="About"
      pageDescription="Editá el contenido de la sección About."
      className="justify-self-start"
    >
      <Card className="mx-auto w-full">
        <CardHeader>
          <CardTitle className="text-left text-2xl font-bold">About</CardTitle>
        </CardHeader>
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
                    placeholder="Ingresá el título"
                    required
                  />
                  <FormTextarea
                    control={form.control}
                    name="intro"
                    label="Introducción"
                    placeholder="Presentá Error404..."
                    config={{ rows: 3, maxLength: 1000 }}
                  />
                  <FormQuill
                    control={form.control}
                    name="body"
                    label="Contenido"
                    placeholder="Escribí el texto principal..."
                    disabled={busy}
                    onRequestImage={requestImage}
                  />
                  <FormTextarea
                    control={form.control}
                    name="seoDescription"
                    label="Descripción para buscadores"
                    config={{ rows: 3, maxLength: 320 }}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-6 lg:flex-[1]">
                  <ContentMediaField
                    label="Imagen"
                    media={image ? [image] : []}
                    disabled={busy}
                    onChange={(media) => {
                      remember(media);
                      form.setValue("imageId", media[0]?.id ?? null, {
                        shouldDirty: true,
                      });
                      form.setValue("imageAlt", media[0]?.alt ?? "", {
                        shouldDirty: true,
                      });
                    }}
                  />
                  {content.imageId && (
                    <FormInput
                      control={form.control}
                      name="imageAlt"
                      label="Descripción de imagen"
                      description="Describí lo que muestra la imagen."
                      required
                    />
                  )}
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
              preview="/about/preview"
            />
          </Form>
        </CardContent>
      </Card>
      {dialog}
    </PageContainer>
  );
}
