"use client";
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export function browserAuth() {
  const app =
    getApps().find((app) => app.name === "error404-dashboard-client") ||
    initializeApp(
      {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      },
      "error404-dashboard-client",
    );
  return getAuth(app);
}
