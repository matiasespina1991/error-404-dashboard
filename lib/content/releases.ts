export const releaseFormats = [
  { value: "vinyl", label: "Vinyl" },
  { value: "cassette", label: "Cassette" },
  { value: "cd", label: "CD" },
  { value: "digital", label: "Digital" },
  { value: "other", label: "Other" },
] as const;

export type ReleaseFormat = (typeof releaseFormats)[number]["value"];
export type TrackAudio =
  | { type: "none" }
  | { type: "external"; url: string }
  | { type: "gallery"; mediaId: null };
export type ReleaseTrack = {
  position: string;
  title: string;
  audio: TrackAudio;
};
export type ReleaseFields = {
  kind: "releases";
  genres: string[];
  purchaseUrl: string;
  format: ReleaseFormat;
  tracks: ReleaseTrack[];
};

export const usesSides = (format: ReleaseFormat) =>
  format === "vinyl" || format === "cassette";
export const releaseFormatLabel = (format: ReleaseFormat) =>
  releaseFormats.find((item) => item.value === format)?.label || format;

export function parseReleaseFields(
  data: Record<string, unknown>,
  publishing: boolean,
): ReleaseFields {
  const fail = (message: string): never => {
    throw new Error(message);
  };
  if (!releaseFormats.some((item) => item.value === data.format))
    return fail("Elegí un formato válido.");
  const format = data.format as ReleaseFormat;
  if (
    !Array.isArray(data.genres) ||
    data.genres.length > 20 ||
    !data.genres.every((item) => typeof item === "string" && item.length <= 80)
  )
    return fail("Géneros inválidos (máximo 20, de hasta 80 caracteres).");
  const genres = [
    ...new Set(data.genres.map((item: string) => item.trim()).filter(Boolean)),
  ];
  const httpsUrl = (
    value: unknown,
    label: string,
    required = false,
  ): string => {
    if (typeof value !== "string" || value.length > 2000)
      return fail(`${label}: enlace inválido.`);
    const result = value.trim();
    if (!result && !required) return "";
    try {
      const url = new URL(result);
      if (url.protocol !== "https:" || url.username || url.password)
        return fail(`${label}: usá un enlace HTTPS sin credenciales.`);
    } catch {
      return fail(`${label}: usá un enlace HTTPS válido.`);
    }
    return result;
  };
  const purchaseUrl = httpsUrl(data.purchaseUrl, "Link de compra");
  if (!Array.isArray(data.tracks) || data.tracks.length > 60)
    return fail("La lista admite hasta 60 tracks.");
  if (publishing && !data.tracks.length)
    return fail("Para publicar agregá al menos un track.");
  const positions = new Set<string>();
  const tracks = data.tracks.map((value: unknown, index): ReleaseTrack => {
    if (!value || typeof value !== "object") return fail("Track inválido.");
    const track = value as Record<string, unknown>;
    if (
      typeof track.position !== "string" ||
      typeof track.title !== "string" ||
      track.title.length > 200
    )
      return fail(`Revisá el track ${index + 1}.`);
    const position = track.position.trim().toUpperCase();
    if (
      usesSides(format)
        ? !/^[A-Z][1-9]\d?$/.test(position)
        : position !== String(index + 1)
    )
      return fail(
        usesSides(format)
          ? "En vinyl/cassette usá posiciones como A1, A2, B1."
          : "Los tracks deben numerarse consecutivamente desde 1.",
      );
    if (positions.has(position))
      return fail(`La posición ${position} está repetida.`);
    positions.add(position);
    const title = track.title.trim();
    if (publishing && !title)
      return fail(`Agregá el título del track ${position}.`);
    if (!track.audio || typeof track.audio !== "object")
      return fail("Elegí un tipo de audio.");
    const input = track.audio as Record<string, unknown>;
    let audio: TrackAudio;
    if (input.type === "none") audio = { type: "none" };
    else if (input.type === "external") {
      audio = {
        type: "external",
        url: httpsUrl(input.url, `Audio ${position}`, publishing),
      };
    } else if (input.type === "gallery" && input.mediaId === null) {
      // Reserved for the future audio library. No media URL is published yet.
      audio = { type: "gallery", mediaId: null };
    } else return fail("El audio de galería todavía no está disponible.");
    return { position, title, audio };
  });
  return { kind: "releases", genres, purchaseUrl, format, tracks };
}
