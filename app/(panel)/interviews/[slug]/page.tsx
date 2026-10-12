import { requireEditorPage } from "lib/auth/session";
import { getEntry } from "lib/content/entry-repository";
import { imageIds } from "lib/content/entry-publication";
import { getMedia, listMedia } from "lib/content/repository";
import { EntryEditor } from "components/entry-editor";
import type { MediaAsset } from "lib/content/types";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireEditorPage();
  const { slug } = await params;
  const [initial, media] = await Promise.all([
    getEntry("interviews", slug),
    listMedia(),
  ]);
  const selected = (
    await Promise.all(imageIds(initial.draft).map(getMedia))
  ).filter((asset): asset is MediaAsset => asset !== null);
  return (
    <EntryEditor
      key={slug}
      initial={initial}
      initialMedia={media}
      selected={selected}
    />
  );
}
