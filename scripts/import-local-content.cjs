#!/usr/bin/env node
/* Import the existing local preview content into the Error404 Firebase project.
 * Default is a dry run. --apply creates missing entries and never replaces existing ones.
 */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { createHash } = require("node:crypto");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const req = createRequire(path.join(root, "package.json"));
createRequire(req.resolve("next/package.json"))("@next/env").loadEnvConfig(
  root,
);
const ts = req("typescript");
const { initializeApp, cert } = req("firebase-admin/app");
const { getFirestore } = req("firebase-admin/firestore");
const { getStorage } = req("firebase-admin/storage");
const sharp = req("sharp");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "error404-content-import-"));
function compile(relative, destination) {
  const source = path.resolve(root, relative);
  const result = ts.transpileModule(fs.readFileSync(source, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const target = path.join(temp, destination);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    result.outputText.replaceAll(
      'require("sanitize-html")',
      `require(${JSON.stringify(req.resolve("sanitize-html"))})`,
    ),
  );
}
for (const group of ["web", "dashboard"]) {
  compile("lib/content/patterns.ts", `${group}/patterns.js`);
  compile("lib/content/rich-text.ts", `${group}/rich-text.js`);
  compile("lib/content/rich-text-format.ts", `${group}/rich-text-format.js`);
}
compile("../web-vercel-nextjs/lib/content/mock.ts", "web/mock.js");
compile("../web-vercel-nextjs/lib/content/entries.ts", "web/entries.js");
compile("lib/content/entry-publication.ts", "dashboard/entry-publication.js");
compile("lib/content/validation.ts", "dashboard/validation.js");
const { mockEntries } = require(path.join(temp, "web/mock.js"));
const { emptyEntry, validateEntry } = require(
  path.join(temp, "web/entries.js"),
);
const { nextEntry, entryReferences, imageIds } = require(
  path.join(temp, "dashboard/entry-publication.js"),
);
function mediaId(name) {
  const h = createHash("sha256")
    .update("error404-local-preview-v1:" + name)
    .digest("hex")
    .slice(0, 32);
  return (
    "import-" +
    [
      h.slice(0, 8),
      h.slice(8, 12),
      h.slice(12, 16),
      h.slice(16, 20),
      h.slice(20),
    ].join("-")
  );
}
async function main() {
  if (process.env.FIREBASE_PROJECT_ID !== "error-404-9a984")
    throw new Error("Expected Firebase project error-404-9a984.");
  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  try {
    const db = getFirestore(app),
      bucket = getStorage(app).bucket();
    const prepared = mockEntries.map((original) => {
      const entry = structuredClone(original);
      const replace = (image) => ({
        ...image,
        id: mediaId(image.id.replace("demo-", "")),
      });
      entry.cover = entry.cover ? replace(entry.cover) : null;
      entry.gallery = entry.gallery.map(replace);
      return validateEntry(entry, entry.kind, entry.slug, true);
    });
    const pending = [];
    for (const content of prepared) {
      const [draft, published] = await db.getAll(
        db.collection("content_" + content.kind).doc(content.slug),
        db.collection("published_" + content.kind).doc(content.slug),
      );
      if (draft.exists || published.exists)
        console.log("Conservado:", content.kind + "/" + content.slug);
      else pending.push(content);
    }
    console.log(
      "Proyecto:",
      process.env.FIREBASE_PROJECT_ID,
      "; por importar:",
      pending.length,
      "; modo:",
      process.argv.includes("--apply") ? "aplicar" : "simulación",
    );
    if (!process.argv.includes("--apply") || !pending.length) return;
    const now = new Date().toISOString(),
      actor = "migration:local-preview-v1";
    const assets = [];
    for (const [name, alt] of [
      ["club", "Audience and stage lights at a concert"],
      ["studio", "Microphone in a recording studio"],
      ["crowd", "Audience at an open-air concert"],
    ]) {
      const id = mediaId(name);
      if (!pending.some((entry) => imageIds(entry).includes(id))) continue;
      const ref = db.collection("media_assets").doc(id),
        existing = await ref.get();
      if (existing.exists) {
        if (existing.data().status !== "ready")
          throw new Error("Imported media is not ready: " + id);
        assets.push(existing.data());
        continue;
      }
      const source = path.resolve(
        root,
        "../web-vercel-nextjs/public/demo/" + name + ".jpg",
      );
      const image = await sharp(source, { limitInputPixels: 20000000 })
        .rotate()
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      const thumbnail = await sharp(image)
        .resize(320, 320, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();
      const info = await sharp(image).metadata();
      const imagePath = `media/${id}/image.webp`,
        thumbnailPath = `media/${id}/thumbnail.webp`;
      for (const [object, buffer] of [
        [imagePath, image],
        [thumbnailPath, thumbnail],
      ]) {
        try {
          await bucket.file(object).save(buffer, {
            resumable: false,
            preconditionOpts: { ifGenerationMatch: 0 },
            metadata: { contentType: "image/webp" },
          });
        } catch (error) {
          if (Number(error.code) !== 412) throw error;
        }
      }
      const asset = {
        id,
        name: name + ".webp",
        alt,
        path: imagePath,
        thumbnailPath,
        width: info.width,
        height: info.height,
        bytes: image.length,
        createdAt: now,
        createdBy: actor,
        references: [],
        status: "ready",
      };
      try {
        await ref.create(asset);
      } catch (error) {
        if (Number(error.code) !== 6) throw error;
      }
      assets.push(asset);
      console.log("Imagen preparada:", name);
    }
    const created = await db.runTransaction(async (transaction) => {
      const draftRefs = pending.map((entry) =>
        db.collection("content_" + entry.kind).doc(entry.slug),
      );
      const publicRefs = pending.map((entry) =>
        db.collection("published_" + entry.kind).doc(entry.slug),
      );
      const snapshots = await transaction.getAll(...draftRefs, ...publicRefs);
      const mediaRefs = assets.map((asset) =>
        db.collection("media_assets").doc(asset.id),
      );
      const mediaSnapshots = await transaction.getAll(...mediaRefs);
      const references = new Map(
        mediaSnapshots.map((snapshot) => {
          if (!snapshot.exists || snapshot.data().status !== "ready")
            throw new Error("Media unavailable.");
          return [snapshot.id, snapshot.data().references || []];
        }),
      );
      let count = 0;
      pending.forEach((entry, index) => {
        if (snapshots[index].exists || snapshots[index + pending.length].exists)
          return;
        const document = nextEntry(
          emptyEntry(entry.kind, entry.slug),
          entry,
          0,
          "publish",
          actor,
          now,
        );
        transaction.create(draftRefs[index], document);
        transaction.create(publicRefs[index], {
          content: document.published,
          sortDate:
            entry.kind === "events" ? entry.endsAt : entry.publishedDate,
          updatedAt: now,
        });
        for (const id of imageIds(entry))
          references.set(
            id,
            entryReferences(id, document, references.get(id) || []),
          );
        count++;
      });
      for (const ref of mediaRefs)
        transaction.update(ref, { references: references.get(ref.id) });
      return count;
    });
    console.log(
      "Importados y publicados:",
      created,
      "; las entradas existentes se conservaron.",
    );
  } finally {
    await app.delete();
  }
}
main()
  .catch((error) => {
    console.error("Importación fallida:", error.message);
    process.exitCode = 1;
  })
  .finally(() => fs.rmSync(temp, { recursive: true, force: true }));
