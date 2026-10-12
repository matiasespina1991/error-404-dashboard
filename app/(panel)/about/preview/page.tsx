import { RichText } from "@/components/rich-text";
import { requireEditorPage } from "lib/auth/session";
import { getAbout } from "lib/content/repository";
import Link from "next/link";

export default async function PreviewPage() {
  await requireEditorPage();
  const { draft } = await getAbout();
  return (
    <>
      <div className="message mb-8 flex flex-wrap justify-between gap-3">
        <span>Vista del borrador guardado · solo visible para vos</span>
        <Link href="/about" className="underline">
          Volver al editor
        </Link>
      </div>
      <article className="mx-auto max-w-3xl">
        <p className="eyebrow mb-4">Error404</p>
        <h1 className="heading mb-6">{draft.title || "Sin título"}</h1>
        <p className="mb-8 text-xl leading-relaxed text-neutral-300 whitespace-pre-line">
          {draft.intro}
        </p>
        {draft.imageId && (
          <img
            src={`/api/media/${draft.imageId}`}
            alt={draft.imageAlt}
            className="mb-8 max-h-[600px] w-full rounded-lg object-contain"
          />
        )}
        <RichText
          body={draft.body}
          format={draft.bodyFormat}
          className="leading-8"
        />
      </article>
    </>
  );
}
