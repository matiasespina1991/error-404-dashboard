import { NextResponse } from "next/server";
import { EditorialError } from "./validation";

export function editorialResponse(error: unknown) {
  if (error instanceof EditorialError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error(
    "[editorial]",
    error instanceof Error ? error.message : "Unknown backend error",
  );
  return NextResponse.json(
    { error: "No se pudo completar la operación. Intentá nuevamente." },
    { status: 500 },
  );
}

export async function limitedBody(
  request: Request,
  limit: number,
): Promise<Buffer> {
  const reader = request.body?.getReader();
  if (!reader) throw new EditorialError("Solicitud vacía.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > limit) {
        await reader.cancel();
        throw new EditorialError("El archivo supera el tamaño permitido.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
