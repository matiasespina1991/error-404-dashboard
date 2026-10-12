"use client";

export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) window.location.assign("/login");
    throw new Error(result.error || "No se pudo completar la operación.");
  }
  return result;
}
