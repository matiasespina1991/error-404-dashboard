import { requireEditorPage } from "lib/auth/session";
import { listAllEntries } from "lib/content/entry-repository";
import { EntryList } from "components/entry-list";
export default async function Page() {
  await requireEditorPage();
  const items = await listAllEntries("events");
  return <EntryList kind="events" items={items} />;
}
