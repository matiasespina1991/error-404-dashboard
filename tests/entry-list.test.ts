import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { emptyEntry } from "../lib/content/entries.ts";
import { entryRows, type EntryRow } from "../lib/content/entry-rows.ts";

function fixtures() {
  return Array.from({ length: 31 }, (_, index) => {
    const entry = emptyEntry("events", `event-${index}`);
    if (entry.draft.kind !== "events") throw new Error("Expected event");
    entry.draft.title = `Evento ${index}`;
    entry.draft.startsAt = new Date(
      Date.UTC(2026, 9, index + 1, 23),
    ).toISOString();
    entry.draft.venue = index === 30 ? "Unique warehouse" : "Club";
    entry.draft.city = "Barcelona";
    entry.draft.bodyFormat = "html";
    entry.draft.body = "<p><strong>Music</strong> &amp; friends</p>";
    return entry;
  });
}
function listing(search = "", pageIndex = 0, pageSize = 10) {
  return createTable<EntryRow>({
    data: entryRows(fixtures()),
    columns: [{ accessorKey: "title" }, { accessorKey: "date" }],
    state: {
      globalFilter: search,
      sorting: [{ id: "date", desc: true }],
      pagination: { pageIndex, pageSize },
    },
    onStateChange: () => {},
    renderFallbackValue: null,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, value) =>
      row.original.search.includes(String(value).toLocaleLowerCase("es")),
  });
}
test("Search includes events beyond the first 24 records and resets the visible result set", () => {
  const table = listing("unique warehouse");
  assert.equal(table.getFilteredRowModel().rows.length, 1);
  assert.equal(table.getRowModel().rows[0]!.original.slug, "event-30");
});
test("Pagination counts every record and chronological sorting works across pages", () => {
  assert.equal(listing().getPageCount(), 4);
  assert.equal(listing().getRowModel().rows.length, 10);
  assert.equal(listing().getRowModel().rows[0]!.original.slug, "event-30");
  assert.equal(listing("", 3).getRowModel().rows.length, 1);
  assert.equal(listing("", 3).getRowModel().rows[0]!.original.slug, "event-0");
  assert.equal(listing("", 0, 20).getPageCount(), 2);
});
test("Row summaries preserve readable text and event details use the event time zone", () => {
  const row = entryRows(fixtures())[0]!;
  assert.equal(row.body, "Music & friends");
  assert.match(row.details, /2 oct 2026/);
  assert.equal(row.status, "Borrador");
  const interview = emptyEntry("interviews", "conversation");
  if (interview.draft.kind !== "interviews")
    throw new Error("Expected interview");
  interview.draft.artist = "Artist name";
  interview.draft.body = "Legacy plain text";
  interview.published = { ...interview.draft };
  const result = entryRows([interview])[0]!;
  assert.equal(result.details, "Artist name");
  assert.equal(result.body, "Legacy plain text");
  assert.equal(result.status, "Publicado");
});
