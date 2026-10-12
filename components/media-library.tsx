"use client";
import MediaPage from "@/features/gallery/components/media-page";
import type { MediaPage as MediaPageData } from "@/lib/content/types";
export function MediaLibrary({ initial }: { initial: MediaPageData }) {
  return <MediaPage initial={initial} />;
}
