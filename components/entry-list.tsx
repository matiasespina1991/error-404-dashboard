"use client";
import PageContainer from "@/components/layout/page-container";
import { IconPlus } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntryTable } from "./entry-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentKind, EntryDocument } from "lib/content/entries";
import { SLUG } from "lib/content/patterns";
export function EntryList({
  kind,
  items,
}: {
  kind: ContentKind;
  items: EntryDocument[];
}) {
  const router = useRouter(),
    [slug, setSlug] = useState(""),
    [open, setOpen] = useState(false);
  const title = kind === "events" ? "Eventos" : "Entrevistas";
  return (
    <PageContainer
      scrollable={false}
      className="h-[calc(100dvh-4rem)] min-h-[32rem] group-has-data-[collapsible=icon]/sidebar-wrapper:h-[calc(100dvh-3rem)]"
      pageTitle={title}
      pageDescription={
        kind === "events"
          ? "Administra y agrega nuevos eventos."
          : "Administra y agrega nuevas entrevistas."
      }
      pageHeaderAction={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="text-xs md:text-sm">
              <IconPlus className="mr-2 h-4 w-4" />
              {kind === "events" ? "Agregar evento" : "Agregar entrevista"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {kind === "events" ? "Nuevo evento" : "Nueva entrevista"}
              </DialogTitle>
              <DialogDescription>
                Elegí la URL para abrir el editor.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (SLUG.test(slug) && slug.length <= 120) {
                  setOpen(false);
                  router.push(`/${kind}/${slug}`);
                }
              }}
            >
              <Label className="flex flex-col items-start gap-2">
                URL
                <Input
                  autoFocus
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value.toLowerCase())
                  }
                  placeholder={
                    kind === "events"
                      ? "error404-night-01"
                      : "inside-the-studio"
                  }
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={120}
                  required
                  aria-describedby="slug-help"
                />
              </Label>
              <p id="slug-help" className="text-muted-foreground text-sm">
                Solo letras minúsculas, números y guiones. Si la URL ya existe,
                se abre para editar.
              </p>
              <Button type="submit">Abrir editor</Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <EntryTable kind={kind} items={items} />
    </PageContainer>
  );
}
