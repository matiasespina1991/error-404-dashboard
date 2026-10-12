import { NextResponse } from "next/server";
import { requireEditor } from "lib/auth/session";
import { editorialResponse } from "lib/content/http";
import { isContentKind } from "lib/content/entries";
import { EditorialError } from "lib/content/validation";
import { listEntries, listPublished } from "lib/content/entry-repository";
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
