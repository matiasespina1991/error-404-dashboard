"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="heading">No pudimos abrir el panel</h1>
      <p className="muted mb-6">
        Revisá la conexión con Firebase e intentá nuevamente. No se confirmó
        ningún cambio de contenido.
      </p>
      <button className="button" onClick={reset}>
        Intentar nuevamente
      </button>
    </main>
  );
}
