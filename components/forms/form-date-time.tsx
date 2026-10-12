"use client";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { dateTimeISO, dateTimeInput } from "@/lib/content/date-time";
import { useState } from "react";
export function FormDateTime<T extends FieldValues>({
  control,
  name,
  label,
  timeZone,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  timeZone: string;
}) {
  const [error, setError] = useState("");
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        let value = "";
        try {
          value = dateTimeInput(field.value ?? "", timeZone);
        } catch {
          /* Keep the input available while editing the timezone. */
        }
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                ref={field.ref}
                name={field.name}
                onBlur={field.onBlur}
                type="datetime-local"
                value={value}
                onChange={(event) => {
                  try {
                    const iso = dateTimeISO(event.target.value, timeZone);
                    setError("");
                    field.onChange(iso);
                  } catch (error) {
                    setError(
                      error instanceof Error
                        ? error.message
                        : "Revisá la fecha.",
                    );
                  }
                }}
                aria-invalid={Boolean(error)}
              />
            </FormControl>
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
