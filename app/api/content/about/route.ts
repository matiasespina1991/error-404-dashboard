import { NextResponse } from "next/server";
import { assertSameOrigin, requireEditor } from "lib/auth/session";
import { getPublishedAbout, saveAbout } from "lib/content/repository";
import { editorialResponse, limitedBody } from "lib/content/http";
import {
  EditorialError,
  parseAbout,
  parseRevision,
} from "lib/content/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only the published snapshot is exposed to the website. Drafts never leave the panel.
export async function GET() {
  try {
    const content = await getPublishedAbout();
    return NextResponse.json(
      { schemaVersion: 1, content },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return editorialResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const editor = await requireEditor();
    const input = JSON.parse((await limitedBody(request, 600000)).toString());
    if (!["save", "publish", "unpublish"].includes(input.intent))
      throw new EditorialError("Acción inválida.");
    const revision = parseRevision(input.revision);
    const content = parseAbout(input.content, input.intent === "publish");
    return NextResponse.json(
      await saveAbout(content, revision, input.intent, editor.uid),
    );
  } catch (error) {
    return editorialResponse(error);
  }
}
