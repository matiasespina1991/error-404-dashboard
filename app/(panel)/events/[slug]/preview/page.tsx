import { RichText } from "@/components/rich-text";
import { requireEditorPage } from "lib/auth/session";
import { getEntry } from "lib/content/entry-repository";
import Link from "next/link";
export default async function Preview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireEditorPage();
  const { slug } = await params;
  const { draft } = await getEntry("events", slug);
  return (
    <>
      <p className="message mb-8">
        Vista previa privada · Último borrador guardado
      </p>
      <Link href={`/events/${slug}`}>← Volver a editar</Link>
      <h1 className="heading mt-8">{draft.title || "Sin título"}</h1>
      <p className="my-6 text-xl muted">{draft.summary}</p>
      {draft.cover && (
        <img
          src={`/api/media/${draft.cover.id}`}
          alt={draft.cover.alt}
          width={1000}
          height={700}
          className="mb-8 max-h-[480px] w-full rounded-lg object-contain"
        />
      )}
      {draft.kind === "events" && (
        <div className="panel mb-8">
          <p>
            {draft.startsAt} — {draft.endsAt} ({draft.timeZone})
          </p>
          <p>
            {draft.venue} · {draft.city}, {draft.country}
          </p>
          <p>{draft.address}</p>
          <p>{draft.lineup.join(" / ")}</p>
          <p>
            {draft.ticketStatus} · {draft.price}
          </p>
        </div>
      )}
      {draft.kind === "interviews" && (
        <p className="mb-8 muted">
          {draft.artist} · {draft.interviewer} · {draft.publishedDate}
        </p>
      )}
      <RichText
        body={draft.body}
        format={draft.bodyFormat}
        className="max-w-2xl leading-8"
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {draft.gallery.map((image, i) => (
          <img
            key={`${image.id}-${i}`}
            src={`/api/media/${image.id}`}
            alt={image.alt}
            width={800}
            height={600}
            className="w-full rounded-lg"
          />
        ))}
      </div>
    </>
  );
}
