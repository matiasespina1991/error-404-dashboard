"use client";
import Link from "next/link";
import PageContainer from "@/components/layout/page-container";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { EntryTable } from "./entry-table";
import type { ContentKind, EntryDocument } from "lib/content/entries";

export function EntryList({
  kind,
  items,
}: {
  kind: ContentKind;
  items: EntryDocument[];
}) {
  const title =
    kind === "events"
      ? "Eventos"
      : kind === "interviews"
        ? "Entrevistas"
        : "Releases";
  return (
    <PageContainer
      scrollable={false}
      className="h-[calc(100dvh-4rem)] min-h-[32rem] group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100dvh-3rem)]"
      pageTitle={title}
      pageHeaderAction={
        <Button asChild className="text-xs md:text-sm">
          <Link href={`/${kind}/new`}>
            <IconPlus className="mr-2 h-4 w-4" />
            {kind === "events"
              ? "Agregar evento"
              : kind === "interviews"
                ? "Agregar entrevista"
                : "Agregar release"}
          </Link>
        </Button>
      }
    >
      <EntryTable kind={kind} items={items} />
    </PageContainer>
  );
}
