import { NextResponse } from "next/server";
import { assertSameOrigin, requireEditor } from "lib/auth/session";
import { editorialResponse, limitedBody } from "lib/content/http";
import { isContentKind } from "lib/content/entries";
import { EditorialError } from "lib/content/validation";
import {
  createEntry,
  listEntries,
  listPublished,
} from "lib/content/entry-repository";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  try {
    const { kind } = await params;
    if (!isContentKind(kind))
      throw new EditorialError("Sección no encontrada.", 404);
    const query = new URL(request.url).searchParams;
    let result;
    if (query.get("scope") === "admin") {
      await requireEditor();
      result = await listEntries(kind, query.get("cursor") || undefined);
    } else {
      const timeline = query.get("timeline") || "upcoming";
      if (!["upcoming", "past"].includes(timeline))
        throw new EditorialError("Filtro inválido.");
      result = await listPublished(
        kind,
        timeline,
        query.get("cursor") || undefined,
      );
    }
    return NextResponse.json(
      { schemaVersion: 1, ...result },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return editorialResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  try {
    assertSameOrigin(request);
    const editor = await requireEditor();
    const { kind } = await params;
    if (!isContentKind(kind))
      throw new EditorialError("Sección no encontrada.", 404);
    let input;
    try {
      input = JSON.parse((await limitedBody(request, 600000)).toString());
    } catch (error) {
      if (error instanceof EditorialError) throw error;
      throw new EditorialError("Solicitud inválida.");
    }
    if (!input || !["save", "publish"].includes(input.intent))
      throw new EditorialError("Acción inválida.");
    const result = await createEntry(
      input.content,
      kind,
      input.intent,
      editor.uid,
    );
    return NextResponse.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return editorialResponse(error);
  }
}
