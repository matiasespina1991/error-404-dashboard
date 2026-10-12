import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { editorialAuth, editorialConfigured } from "lib/content/firebase-admin";
import { EditorialError } from "lib/content/validation";

export const SESSION_COOKIE = "error404_dashboard_session";
export const SESSION_SECONDS = 60 * 60 * 24 * 5;

export function isEditor(token: DecodedIdToken): boolean {
  const allowed = (process.env.DASHBOARD_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return (
    token.email_verified === true &&
    Boolean(token.email) &&
    allowed.includes(token.email!.toLowerCase())
  );
}

export async function getEditor(): Promise<DecodedIdToken | null> {
  if (!editorialConfigured()) return null;
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const token = await editorialAuth().verifySessionCookie(cookie, true);
    return isEditor(token) ? token : null;
  } catch {
    return null;
  }
}

export async function requireEditor() {
  const editor = await getEditor();
  if (!editor)
    throw new EditorialError(
      "La sesión venció. Volvé a ingresar al panel.",
      401,
    );
  return editor;
}

export async function requireEditorPage() {
  const editor = await getEditor();
  if (!editor) redirect("/login");
  return editor;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.DASHBOARD_ORIGIN || new URL(request.url).origin;
  if (!origin || origin !== expected) {
    throw new EditorialError("Origen de solicitud inválido.", 403);
  }
}
