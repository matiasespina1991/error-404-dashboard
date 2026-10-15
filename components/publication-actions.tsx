"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
export function PublicationActions({
  dirty,
  busy,
  published,
  onUndo,
  onPublish,
  onUnpublish,
  preview,
}: {
  dirty: boolean;
  busy: boolean;
  published: boolean;
  onUndo: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  preview?: string;
}) {
  return (
    <div className="space-y-4">
      {dirty && (
        <div className="mb-1 flex items-center text-sm">
          <span className="text-red-500">Hay cambios sin guardar.</span>
          <Button
            type="button"
            variant="link"
            className="text-foreground ml-1 h-auto p-0 text-sm underline underline-offset-2"
            disabled={busy}
            onClick={onUndo}
          >
            Deshacer
          </Button>
          <span>.</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" disabled={busy || !dirty}>
          {busy ? "Guardando..." : "Guardar borrador"}
        </Button>
        <Button type="button" disabled={busy} onClick={onPublish}>
          Publicar
        </Button>
        {preview && (
          <Button type="button" variant="outline" asChild>
            <Link href={preview} target="_blank">
              Ver borrador guardado
            </Link>
          </Button>
        )}
        {published && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onUnpublish}
          >
            Retirar de la web
          </Button>
        )}
        <Badge variant="secondary">
          {published ? "Publicado" : "Borrador"}
        </Badge>
      </div>
    </div>
  );
}
