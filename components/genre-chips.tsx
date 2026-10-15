"use client";

import { useState, type Ref } from "react";
import type { Control } from "react-hook-form";
import type { ContentEntry } from "@/lib/content/entries";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

function GenreInput({
  value,
  onChange,
  onBlur,
  inputRef,
}: {
  value: string[];
  onChange: (genres: string[]) => void;
  onBlur: () => void;
  inputRef: Ref<HTMLInputElement>;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  function add(text: string) {
    const incoming = text
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean);
    const next = [...value];
    for (const genre of incoming) {
      if (genre.length > 80) {
        setError("Cada género puede tener hasta 80 caracteres.");
        return false;
      }
      if (
        !next.some(
          (item) => item.toLocaleLowerCase() === genre.toLocaleLowerCase(),
        )
      )
        next.push(genre);
    }
    if (next.length > 20) {
      setError("Podés agregar hasta 20 géneros.");
      return false;
    }
    onChange(next);
    setError("");
    return true;
  }
  function commit() {
    if (add(draft)) setDraft("");
  }
  return (
    <FormItem>
      <FormLabel>Géneros</FormLabel>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-input/30 p-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50">
        {value.map((genre) => (
          <span
            key={genre}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-sm text-secondary-foreground"
          >
            {genre}
            <button
              type="button"
              aria-label={`Quitar género ${genre}`}
              className="inline-flex size-6 items-center justify-center rounded-sm hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                onChange(value.filter((item) => item !== genre));
                setError("");
              }}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <FormControl>
          <Input
            ref={inputRef}
            value={draft}
            placeholder="Agrega géneros separados por comas…"
            className="h-8 min-w-32 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "genres-error" : undefined}
            onChange={(event) => {
              const text = event.target.value;
              if (text.includes(",")) {
                const parts = text.split(",");
                const remainder = parts.pop() || "";
                if (add(parts.join(","))) setDraft(remainder);
                else setDraft(text);
              } else {
                setDraft(text);
                setError("");
              }
            }}
            onBlur={() => {
              commit();
              onBlur();
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
              if (event.key === "Backspace" && !draft && value.length) {
                onChange(value.slice(0, -1));
                setError("");
              }
            }}
          />
        </FormControl>
      </div>
      {error && (
        <p id="genres-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <FormMessage />
    </FormItem>
  );
}

export function GenreChips({ control }: { control: Control<ContentEntry> }) {
  return (
    <FormField
      control={control}
      name="genres"
      render={({ field }) => (
        <GenreInput
          value={field.value || []}
          onChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
        />
      )}
    />
  );
}
