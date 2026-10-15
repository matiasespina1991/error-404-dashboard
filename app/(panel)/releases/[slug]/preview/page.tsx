import Link from "next/link";
import { requireEditorPage } from "lib/auth/session";
import { getEntry } from "lib/content/entry-repository";
import { RichText } from "@/components/rich-text";
import { ReleaseTrackPlayer } from "@/components/releases/track-player";
import { releaseFormatLabel } from "@/lib/content/releases";

export default async function Preview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireEditorPage();
  const { slug } = await params;
  const { draft } = await getEntry("releases", slug);
  if (draft.kind !== "releases") return null;
  return (
    <article>
      <p className="message mb-6">
        Vista previa privada · Último borrador guardado
      </p>
      <Link
        href={`/releases/${slug}`}
        className="text-sm text-muted-foreground"
      >
        ← Volver a editar
      </Link>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          {draft.cover && (
            <img
              src={`/api/media/${draft.cover.id}`}
              alt={draft.cover.alt}
              width={600}
              height={600}
              className="aspect-square w-full max-w-md rounded-md object-contain"
            />
          )}
        </div>
        <div className="min-w-0 space-y-5">
          <h1 className="text-2xl font-semibold">
            {draft.title || "Sin título"}
          </h1>
          <p>{draft.summary}</p>
          <p className="text-sm text-muted-foreground">
            {releaseFormatLabel(draft.format)} · {draft.genres.join(" / ")}
          </p>
          {draft.purchaseUrl && (
            <a
              href={draft.purchaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block underline"
            >
              Comprar release ↗
            </a>
          )}
          <h2 className="text-lg font-semibold">Tracklist</h2>
          <ReleaseTrackPlayer tracks={draft.tracks} />
          <h2 className="text-lg font-semibold">Contenido</h2>
          <RichText
            body={draft.body}
            format={draft.bodyFormat}
            className="leading-7"
          />
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {draft.gallery.map((image, index) => (
          <img
            key={`${image.id}-${index}`}
            src={`/api/media/${image.id}`}
            alt={image.alt}
            width={400}
            height={400}
            className="aspect-square rounded-md object-contain"
          />
        ))}
      </div>
    </article>
  );
}
