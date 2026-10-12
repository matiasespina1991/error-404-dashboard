import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { getEditor } from "lib/auth/session";
import { editorialConfigured } from "lib/content/firebase-admin";
import { Login } from "components/login";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getEditor()) redirect("/");
  const configured = editorialConfigured();
  return (
    <main className="relative min-h-dvh flex-col items-center justify-center lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full min-h-dvh flex-col bg-zinc-900 p-10 text-white lg:flex">
        <img
          src="/assets/sign-in-cover.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      <div className="relative flex min-h-dvh items-center justify-center p-4 lg:p-8">
        <div className="flex w-full max-w-md flex-col items-center justify-center space-y-6">
          <BrandLogo className="w-48" />
          <h1 className="text-center text-lg font-bold">Hola de nuevo 👋</h1>
          <div className="w-full">
            {configured ? (
              <Login />
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Conectá el panel</h2>
                <p className="muted text-sm leading-relaxed">
                  Falta configurar Firebase y las cuentas que pueden ingresar.
                  El panel permanece cerrado hasta completar la conexión.
                </p>
                <ol className="muted list-decimal space-y-3 pl-5 text-sm leading-relaxed">
                  <li>
                    Creá el proyecto Firebase de Error404 con Authentication,
                    Firestore y Storage.
                  </li>
                  <li>
                    Completá las variables de <code>.env.example</code> en{" "}
                    <code>.env.local</code>.
                  </li>
                  <li>
                    Agregá tu correo a <code>DASHBOARD_ADMIN_EMAILS</code> y
                    reiniciá el panel.
                  </li>
                </ol>
                <p className="text-xs muted">
                  Los pasos completos están en el README de este proyecto.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
