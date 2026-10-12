import { requireEditorPage } from "lib/auth/session";
import { listMedia } from "lib/content/repository";
import { MediaLibrary } from "components/media-library";

export default async function MediaPage() {
  await requireEditorPage();
  return <MediaLibrary initial={await listMedia()} />;
}
