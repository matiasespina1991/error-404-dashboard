import { requireEditorPage } from "lib/auth/session";
import { listAllEntries } from "lib/content/entry-repository";
import { EntryList } from "components/entry-list";
export default async function Page() {
  await requireEditorPage();
  const items = await listAllEntries("releases");
  return <EntryList kind="releases" items={items} />;
}
