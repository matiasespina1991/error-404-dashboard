import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export function editorialConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_STORAGE_BUCKET &&
      process.env.DASHBOARD_ADMIN_EMAILS &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}

function adminApp() {
  const existing = getApps().find((app) => app.name === "error404-dashboard");
  if (existing) return existing;
  if (!editorialConfigured())
    throw new Error("Editorial backend is not configured.");
  return initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    },
    "error404-dashboard",
  );
}

export const editorialAuth = () => getAuth(adminApp());
export const editorialDb = () => getFirestore(adminApp());
export const editorialBucket = () => getStorage(adminApp()).bucket();
