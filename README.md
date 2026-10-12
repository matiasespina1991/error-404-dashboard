# Error404 Dashboard

Proyecto independiente para administrar el contenido de la web de Error404. Su dominio previsto es `dashboard.tudominio.com`; el panel abre en `/`, con login en `/login`. No se monta dentro de la tienda ni necesita una ruta `/dashboard` en ella.

## Responsabilidades

- Este panel: biblioteca de imágenes y About, con borrador, vista previa y publicación.
- La web `web-vercel-nextjs`: muestra el contenido publicado y la tienda.
- Shopify: productos, precios, variantes, stock, carrito, checkout y pedidos.
- WordPress: se sustituye. No es dependencia del panel ni de la nueva web.

Las entrevistas se incorporarán como un módulo futuro. No hay un editor de entrevistas implementado en esta entrega.

## Desarrollo local

Se necesita Node 22 y pnpm 9.15.4. Este proyecto tiene su propio `package.json`, lockfile y variables; no se copian credenciales de Laura ni de la tienda.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

El dashboard usa `http://localhost:3002`. La tienda puede seguir en `http://localhost:3001`.

Sin Firebase configurado, `/login` muestra los pasos de conexión y el acceso permanece cerrado. No hay una sesión demo que permita escribir.

## Configurar Firebase

1. Crear un proyecto Firebase propio para Error404. Activar Authentication con Google, Firestore y Storage. Confirmar los requisitos de facturación del bucket en la consola antes de activarlo.
2. Registrar una aplicación web y copiar su configuración pública a `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` y `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
3. Añadir `localhost` y el dominio definitivo del dashboard a los dominios autorizados de Authentication. El dominio de autenticación debe corresponder al proyecto registrado.
4. Preparar una cuenta de servicio con acceso al proyecto y bucket. Configurar `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` y `FIREBASE_STORAGE_BUCKET` solo en el servidor. Se admiten saltos de línea escapados `\n` en la clave. No subir archivos de claves al repositorio.
5. Configurar `DASHBOARD_ADMIN_EMAILS` con los correos autorizados separados por comas. Se exige correo verificado y la lista se comprueba en servidor, también en cada operación.
6. Aplicar las reglas `firestore.rules` y `storage.rules` al proyecto correcto. Estas reglas deniegan el acceso directo de clientes; las operaciones pasan por el servidor con Admin SDK y control de sesión. No reutilizar las reglas abiertas de la referencia de Laura.
7. En local, usar `DASHBOARD_ORIGIN=http://localhost:3002`. En producción, el origen exacto `https://dashboard.tudominio.com`, sin slash final. Reiniciar después de cambiar variables.

La cuenta de servicio debe pertenecer al mismo proyecto y bucket que la configuración pública. No configurar credenciales Shopify en el dashboard: el enlace a Shopify abre su administrador.

## Publicación en subdominio

Crear un proyecto de hosting separado para este directorio. Configurar sus variables y asociar `dashboard.tudominio.com`; aplicar el registro DNS que indique el proveedor. El dominio real y la infraestructura no se configuraron durante el desarrollo.

La web y el dashboard se pueden desplegar por separado. Para conectar la web, definir en ella:

```dotenv
DASHBOARD_URL=https://dashboard.tudominio.com
```

Y en este panel:

```dotenv
DASHBOARD_ORIGIN=https://dashboard.tudominio.com
NEXT_PUBLIC_SITE_URL=https://tudominio.com
```

La web obtiene el contenido por servidor. No comparte cookies de sesión, claves privadas ni Firebase Admin con el dashboard. El endpoint de contenido y las imágenes publicadas necesitan ser accesibles públicamente; no colocar una protección global del hosting que los bloquee. El panel y los endpoints de escritura sí requieren sesión.

## Datos y flujos

`content_pages/about` conserva `schemaVersion`, `revision`, `draft`, `published`, fechas y autor. Guardar no cambia la versión pública; publicar copia el contenido actual a `published`; retirar conserva el borrador. La revisión evita sobrescribir cambios de otra sesión. La vista previa requiere sesión.

`media_assets` registra imágenes optimizadas, dimensiones, alt, autor y referencias de uso. Los objetos privados viven en `media/{id}/`. Se reciben JPG/PNG/WebP de hasta 3 MB, se valida el archivo real y se generan WebP de hasta 1600 px y miniaturas de 320 px. El original no se conserva; no usar esta biblioteca como archivo maestro de diseño o impresión.

La biblioteca pagina de a 24. La UI sube hasta 10 archivos por tanda, uno por vez, con errores por archivo. El límite de 3 MB contempla los límites habituales de funciones serverless; archivos grandes y vídeo requieren otro flujo de carga/procesamiento, no ampliar el límite sin revisar el hosting.

Las referencias de About y las del medio se actualizan en una transacción. Una imagen en uso no se elimina. Un fallo parcial de borrado mantiene el estado `deleting`, impide asignarla y permite reintentar su eliminación. No se habilita al público una imagen sin una referencia publicada. Un navegador puede conservar una imagen pública en caché hasta 60 segundos después de retirarla.

## API entre proyectos

| Endpoint                        | Acceso                                               | Función                                                                            |
| ------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `GET /api/content/about`        | Público                                              | `{ schemaVersion: 1, content: AboutContent \| null }`; nunca devuelve el borrador. |
| `PUT /api/content/about`        | Sesión + origen válido                               | Guardar, publicar o retirar; requiere la revisión actual.                          |
| `GET /api/media`                | Sesión                                               | Biblioteca paginada, con cursor opcional.                                          |
| `POST /api/media`               | Sesión + origen válido                               | Subida y optimización.                                                             |
| `GET /api/media/[id]`           | Público si está publicada; sesión en los demás casos | Imagen o miniatura con `?size=thumbnail`.                                          |
| `PATCH /api/media/[id]`         | Sesión + origen válido                               | Nombre y descripción del medio.                                                    |
| `DELETE /api/media/[id]`        | Sesión + origen válido                               | Eliminar un medio que no esté en uso.                                              |
| `POST/DELETE /api/auth/session` | Origen válido; POST valida token y cuenta            | Crear/cerrar cookie HttpOnly, restringida a este host.                             |

El About público de la tienda usa lectura sin caché persistente para reflejar la publicación. Si se incorpora caché en el futuro, agregar un webhook autenticado de revalidación entre proyectos y comprobar publicación/retirada antes de habilitarlo.

## Estructura y ampliación

```text
app/(auth)/login/      Acceso
app/(panel)/          Layout protegido, About, biblioteca y preview
app/api/              Sesión, contenido público y operaciones protegidas
components/           Pantallas y shell del panel
lib/auth/             Sesión de servidor y login de cliente
lib/content/          Contratos, validación, publicación y persistencia
tests/                Invariantes de publicación y validación
```

Para entrevistas, añadir entidad con ID estable, borrador/publicado y revisión, formularios propios y API pública de lectura. Las referencias de medios deben distinguir módulo, entidad y estado, por ejemplo `interview:ID:published`. El helper actual de About conserva referencias de otros módulos.

No hay multitenencia, roles diferenciados ni historial completo de versiones: la lista inicial da permisos de administrador a todas las cuentas autorizadas. Esas capacidades requieren una ampliación explícita antes de incorporar editores con permisos distintos.

## Verificación

```sh
pnpm typecheck
pnpm test
pnpm build
```

Las pruebas cubren límites de texto, publicación con imagen y alt, revisiones, aislamiento de borrador, retirada y conservación de referencias de otros módulos. La conexión real, login Google, subidas, transacciones en Firestore y publicación entre dominios requieren la configuración de Firebase y pruebas en ese entorno.

Referencias oficiales usadas para la implementación: [sesiones Firebase](https://firebase.google.com/docs/auth/admin/manage-cookies), [Admin SDK](https://firebase.google.com/docs/admin/setup), [Storage de servidor](https://firebase.google.com/docs/storage/admin/start).

## Eventos y entrevistas

El panel incluye `/events` y `/interviews` con listado paginado, creación por slug fijo, edición, imágenes de biblioteca, borrador, preview privada, publicación y retirada. El home público toma los eventos y las entrevistas publicados; Shopify sigue siendo responsable de los discos. Las fechas del editor se introducen en ISO con offset explícito y se guardan normalizadas en UTC.

Colecciones: `content_events`, `content_interviews` (documentos administrativos) y `published_events`, `published_interviews` (proyecciones públicas). Publicación y referencias de imágenes se actualizan por transacción. La API pública sirve páginas de 24 con cursor; la consulta administrativa requiere sesión. Las reglas existentes siguen denegando acceso directo.

Sin Firebase configurado, las APIs nuevas indican `source: mock`; los ejemplos y fotos viven en la web pública. No se insertaron eventos o entrevistas ficticias en Firebase ni se añadieron credenciales.

El contrato `lib/content/entries.ts` está replicado en cada proyecto; hay que mantener ambas copias sincronizadas cuando cambie la versión. La estructura, endpoints y validación están documentados en `../web-vercel-nextjs/docs/10-home-eventos-entrevistas.md`.

## Interfaz del template

La interfaz reutiliza los componentes shadcn/Radix copiados de `laura-butallo-web/apps/admin-dashboard`: sidebar plegable, sheet móvil, breadcrumb, dropdown, avatar, tablas, tarjetas y campos. Usa los tokens de color del template, Inter local y tema claro/oscuro. Las rutas, autorización y operaciones de Firebase pertenecen a Error404; no se importaron cuentas, datos ni configuración Firebase de Laura. Se conserva la licencia original en `LICENSE.template`.

## Importación de los ejemplos locales

Se importaron 5 eventos y 4 entrevistas a `content_events`, `published_events`, `content_interviews` y `published_interviews`, con 3 imágenes y sus miniaturas en Storage, registradas en Galería. Los eventos pasados aparecen en Archive.

El script reutiliza la validación y las referencias de publicación. No reemplaza entradas existentes y usa IDs estables de imágenes para poder reanudarlo.

```sh
node scripts/import-local-content.cjs          # simulación
node scripts/import-local-content.cjs --apply  # crear y publicar solo lo que falta
```

Requiere el proyecto web hermano como fuente de los ejemplos y Node >=22.12.0. Lee las credenciales privadas de `.env.local`. La web usa `DASHBOARD_URL` para obtener los datos publicados, sin claves de administración.

Para crear contenido nuevo: Eventos o Entrevistas → completar la URL → Crear evento/Crear entrevista → completar campos y elegir una imagen de Galería → Guardar borrador o Publicar. Los borradores no se muestran en el sitio público.
# error-404-dashboard
