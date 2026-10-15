export function slugFromTitle(title: string): string {
  const base =
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100)
      .replace(/-+$/, "") || "entry";
  return base === "new" ? "new-entry" : base;
}

export class SlugCollisionError extends Error {}

// The create callback must check existence and write in a single transaction.
export async function createWithUniqueSlug<T>(
  title: string,
  create: (slug: string) => Promise<T>,
  generateId: () => string,
): Promise<T> {
  const base = slugFromTitle(title);
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug =
      attempt === 0
        ? base
        : `${base}-${generateId()
            .replace(/[^a-z0-9]/gi, "")
            .toLowerCase()
            .slice(0, 12)}`;
    try {
      return await create(slug);
    } catch (error) {
      if (!(error instanceof SlugCollisionError) || attempt === 4) throw error;
    }
  }
  throw new SlugCollisionError("No se pudo generar una URL única.");
}
