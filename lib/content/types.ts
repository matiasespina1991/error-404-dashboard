import type { BodyFormat } from "./rich-text-format";
export type AboutContent = {
  title: string;
  intro: string;
  body: string;
  bodyFormat?: BodyFormat;
  imageId: string | null;
  imageAlt: string;
  seoDescription: string;
};

export type AboutDocument = {
  schemaVersion: 1;
  revision: number;
  draft: AboutContent;
  published: AboutContent | null;
  publishedAt: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type MediaAsset = {
  id: string;
  name: string;
  originalFilename?: string;
  alt: string;
  path: string;
  thumbnailPath: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
  createdBy: string;
  references: string[];
  status: "ready" | "deleting";
};

export type MediaPage = { items: MediaAsset[]; cursor: string | null };

export const emptyAbout = (): AboutDocument => ({
  schemaVersion: 1,
  revision: 0,
  draft: {
    title: "About Error404",
    intro: "",
    body: "",
    imageId: null,
    imageAlt: "",
    seoDescription: "",
  },
  published: null,
  publishedAt: null,
  updatedAt: null,
  updatedBy: null,
});
