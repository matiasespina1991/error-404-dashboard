"use client";
import { useCallback, useState } from "react";
type Asset =
  | { storagePath?: string | null; downloadURL?: string | null }
  | null
  | undefined;
export function useStorageAssetSrc(
  asset: Asset,
  _options?: { preferDirect?: boolean },
) {
  const candidate = asset?.downloadURL || asset?.storagePath || "";
  const source = /^\/api\/media\/[^/?]+(?:\?size=thumbnail)?$/.test(candidate)
    ? candidate
    : "";
  const [failedSource, setFailedSource] = useState("");
  const handleError = useCallback(() => setFailedSource(source), [source]);
  const forceSigned = useCallback(async () => source, [source]);
  return {
    src: failedSource && failedSource === source ? "" : source,
    hasSource: Boolean(source) && failedSource !== source,
    usingSignedUrl: false,
    handleError,
    forceSigned,
  };
}
