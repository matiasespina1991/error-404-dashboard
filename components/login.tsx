"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  GoogleAuthProvider,
  inMemoryPersistence,
  setPersistence,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { browserAuth } from "lib/auth/firebase-client";
import { requestJson } from "./client";

export function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login() {
    setBusy(true);
    setError("");
    let auth: ReturnType<typeof browserAuth> | undefined;
    try {
      auth = browserAuth();
      await setPersistence(auth, inMemoryPersistence);
      const user = await signInWithPopup(auth, new GoogleAuthProvider());
      await requestJson("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await user.user.getIdToken() }),
      });
      await signOut(auth);
      window.location.assign("/");
    } catch (error) {
      if (auth) await signOut(auth).catch(() => {});
      setError(
        error instanceof Error && !error.message.startsWith("Firebase:")
          ? error.message
          : "No se pudo iniciar sesión. Revisá tu cuenta o intentá nuevamente.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="flex w-full flex-col items-center space-y-4">
      <Button
        type="button"
        variant="outline"
        className="flex h-11 w-full max-w-[16rem] items-center justify-center gap-3 rounded-full border border-[#747775] text-[15px] font-semibold"
        disabled={busy}
        onClick={login}
      >
        <img src="/assets/google.svg" alt="" className="size-4" />
        {busy ? "Ingresando…" : "Iniciar sesión con Google"}
      </Button>
      {error && (
        <p role="alert" className="message error">
          {error}
        </p>
      )}
      <p className="muted text-center text-xs">
        Acceso exclusivo para las cuentas autorizadas de Error404.
      </p>
    </div>
  );
}
