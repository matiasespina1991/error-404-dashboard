import { NextResponse } from "next/server";
import { assertSameOrigin, requireEditor } from "lib/auth/session";
import { editorialConfigured } from "lib/content/firebase-admin";
import { editorialResponse, limitedBody } from "lib/content/http";
import { isContentKind, validateEntry } from "lib/content/entries";
import { EditorialError, parseRevision } from "lib/content/validation";
import { getPublicEntry, saveEntry } from "lib/content/entry-repository";
import type { PublicationIntent } from "lib/content/publication";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ kind: string; slug: string }> };
export async function GET(_request: Request, { params }: Context) {
  try {
    const { kind, slug } = await params;
    if (!isContentKind(kind))
      throw new EditorialError("Sección no encontrada.", 404);
    const content = await getPublicEntry(kind, slug);
    return NextResponse.json(
      {
        schemaVersion: 1,
        source: editorialConfigured() ? "firebase" : "mock",
        content,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return editorialResponse(error);
  }
}
export async function PUT(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const editor = await requireEditor();
    const { kind, slug } = await params;
    if (!isContentKind(kind))
      throw new EditorialError("Sección no encontrada.", 404);
    let input;
    try {
      input = JSON.parse((await limitedBody(request, 600000)).toString());
    } catch (error) {
      if (error instanceof EditorialError) throw error;
      throw new EditorialError("Solicitud inválida.");
    }
    if (!input || !["save", "publish", "unpublish"].includes(input.intent))
      throw new EditorialError("Acción inválida.");
    let content;
    try {
      content = validateEntry(
        input.content,
        kind,
        slug,
        input.intent === "publish",
      );
    } catch (error) {
      throw new EditorialError(
        error instanceof Error ? error.message : "Contenido inválido.",
      );
    }
    return NextResponse.json(
      await saveEntry(
        content,
        parseRevision(input.revision),
        input.intent as PublicationIntent,
        editor.uid,
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return editorialResponse(error);
  }
}
