"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
// Quill uses the DOM; load the original editor only in the browser.
export const FormQuill = dynamic(
  () => import("./form-quill-client").then((module) => module.FormQuill),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[490px] w-full rounded-lg" />,
  },
) as typeof import("./form-quill-client").FormQuill;
