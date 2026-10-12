import { requireEditorPage } from "lib/auth/session";
import { cookies } from "next/headers";
import { Shell } from "components/shell";

export const dynamic = "force-dynamic";
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const editor = await requireEditorPage();
  const sidebarState = (await cookies()).get("sidebar_state")?.value;
  return (
    <Shell
      email={editor.email || ""}
      photoURL={
        typeof editor.picture === "string" &&
        editor.picture.startsWith("https://")
          ? editor.picture
          : undefined
      }
      name={typeof editor.name === "string" ? editor.name : undefined}
      defaultOpen={sidebarState === "true"}
    >
      {children}
    </Shell>
  );
}
