"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, type FormEvent } from "react";
import type { Product } from "@/types/product";

type MeasurementsScreenProps = {
  product: Product;
  onSubmit: (data: Record<string, number>) => void;
};

const MEASUREMENT_FIELDS = [
  { key: "height", label: "Height (cm)", placeholder: "e.g. 170" },
  { key: "chest", label: "Chest (cm)", placeholder: "e.g. 96" },
  { key: "waist", label: "Waist (cm)", placeholder: "e.g. 76" },
  { key: "hips", label: "Hips (cm)", placeholder: "e.g. 90" },
] as const;

export function MeasurementsScreen({
  product,
  onSubmit,
}: MeasurementsScreenProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed: Record<string, number> = {};
    const newErrors: Record<string, string> = {};

    for (const field of MEASUREMENT_FIELDS) {
      const v = Number(values[field.key]);
      if (!values[field.key] || values[field.key].trim() === "") {
        newErrors[field.key] = "Required";
      } else if (v <= 0 || v > 300) {
        newErrors[field.key] = "Enter a valid value";
      } else {
        parsed[field.key] = v;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(parsed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4 sm:px-6 animate-fade-in">
      <p className="text-xs text-muted-foreground">
        To find your perfect size in the <strong>{product.title}</strong>, I
        need a few measurements
      </p>
      {MEASUREMENT_FIELDS.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-xs text-muted-foreground">
            {field.label}
          </label>
          <Input
            type="number"
            placeholder={field.placeholder}
            value={values[field.key] ?? ""}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, [field.key]: e.target.value }));
              if (errors[field.key]) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next[field.key];
                  return next;
                });
              }
            }}
          />
          {errors[field.key] && (
            <p className="mt-1 text-xs text-destructive">{errors[field.key]}</p>
          )}
        </div>
      ))}
      <Button type="submit" className="w-full" size="sm">
        Get Size Recommendation
      </Button>
    </form>
  );
}
