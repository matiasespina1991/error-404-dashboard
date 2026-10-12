import { requireEditorPage } from "lib/auth/session";
import { getAbout, getMedia, listMedia } from "lib/content/repository";
import { AboutEditor } from "components/about-editor";

export default async function AboutPage() {
  await requireEditorPage();
  const [document, media] = await Promise.all([getAbout(), listMedia()]);
  const selected = document.draft.imageId
    ? await getMedia(document.draft.imageId)
    : null;
  return (
    <AboutEditor initial={document} initialMedia={media} selected={selected} />
  );
}
