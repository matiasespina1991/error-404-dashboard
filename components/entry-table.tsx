"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ContentKind, EntryDocument } from "lib/content/entries";
import "@/types/data-table";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import { DataTableViewOptions } from "@/components/ui/table/data-table-view-options";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { entryRows, type EntryRow } from "@/lib/content/entry-rows";

export function EntryTable({
  kind,
  items,
}: {
  kind: ContentKind;
  items: EntryDocument[];
}) {
  const router = useRouter();
  const data = useMemo(() => entryRows(items), [items]);
  const columns = useMemo<ColumnDef<EntryRow>[]>(
    () => [
      {
        accessorKey: "cover",
        header: "",
        meta: { label: "Portada" },
        size: 96,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="bg-muted flex h-20 w-20 items-center justify-center overflow-hidden rounded-md">
            {row.original.cover ? (
              <img
                src={`/api/media/${row.original.cover.id}?size=thumbnail`}
                alt={row.original.cover.alt || row.original.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-muted-foreground text-xs">Sin portada</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "title",
        meta: { label: "Título" },
        size: 270,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Título" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/${kind}/${row.original.slug}`}
            className="block min-w-[220px] font-medium hover:underline"
            data-row-click="ignore"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "date",
        meta: {
          label: kind === "events" ? "Fecha y lugar" : "Fecha y artista",
        },
        size: 320,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={kind === "events" ? "Fecha y lugar" : "Fecha y artista"}
          />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground min-w-[200px]">
            {row.original.details || "Sin información"}
          </div>
        ),
      },
      {
        accessorKey: "body",
        header: "Cuerpo",
        meta: { label: "Cuerpo" },
        size: 400,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-foreground line-clamp-3 min-w-[240px] max-w-[25rem] whitespace-normal text-sm">
            {row.original.body || "Sin texto"}
          </div>
        ),
      },
      {
        accessorKey: "status",
        meta: { label: "Estado" },
        size: 130,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Estado" />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.status}</Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 80,
        enableHiding: false,
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" asChild data-row-click="ignore">
            <Link href={`/${kind}/${row.original.slug}`}>Editar</Link>
          </Button>
        ),
      },
    ],
    [kind],
  );
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.slug,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: "date", desc: true }],
    },
    globalFilterFn: (row, _columnId, value) =>
      row.original.search.includes(
        String(value).trim().toLocaleLowerCase("es"),
      ),
  });
  const search = (table.getState().globalFilter as string) ?? "";
  return (
    <DataTable
      table={table}
      onRowClick={(row) => router.push(`/${kind}/${row.original.slug}`)}
    >
      <div
        role="toolbar"
        aria-label="Herramientas del listado"
        aria-orientation="horizontal"
        className="flex w-full items-start justify-between gap-2 p-1"
      >
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            aria-label={
              kind === "events" ? "Buscar eventos" : "Buscar entrevistas"
            }
            placeholder={
              kind === "events" ? "Buscar eventos..." : "Buscar entrevistas..."
            }
            value={search}
            onChange={(event) => {
              table.setGlobalFilter(event.target.value);
              table.setPageIndex(0);
            }}
            className="h-8 w-40 lg:w-56"
          />
          {search && (
            <Button
              variant="outline"
              size="sm"
              className="border-dashed"
              onClick={() => {
                table.setGlobalFilter("");
                table.setPageIndex(0);
              }}
            >
              <X />
              Reiniciar
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
    </DataTable>
  );
}
