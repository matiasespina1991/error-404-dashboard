import { requireEditorPage } from "lib/auth/session";
import { emptyEntry } from "lib/content/entries";
import { listMedia } from "lib/content/repository";
import { EntryEditor } from "components/entry-editor";
export default async function NewEntryPage() {
  await requireEditorPage();
  const media = await listMedia();
  return (
    <EntryEditor
      initial={emptyEntry("interviews", "new")}
      initialMedia={media}
      selected={[]}
      newEntry
    />
  );
}
