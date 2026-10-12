import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  isEditor,
  SESSION_COOKIE,
  SESSION_SECONDS,
} from "lib/auth/session";
import { editorialAuth } from "lib/content/firebase-admin";
import { editorialResponse, limitedBody } from "lib/content/http";
import { EditorialError } from "lib/content/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { idToken } = JSON.parse(
      (await limitedBody(request, 20000)).toString(),
    );
    if (typeof idToken !== "string")
      throw new EditorialError("Sesión inválida.", 401);
    const auth = editorialAuth();
    const token = await auth.verifyIdToken(idToken, true);
    if (!isEditor(token))
      throw new EditorialError("Tu cuenta no tiene acceso a este panel.", 403);
    if (Math.floor(Date.now() / 1000) - token.auth_time > 300)
      throw new EditorialError("Volvé a iniciar sesión.", 401);
    const session = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_SECONDS * 1000,
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    return editorialResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (error) {
    return editorialResponse(error);
  }
}
