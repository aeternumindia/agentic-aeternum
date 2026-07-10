"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type StepMeasurementsProps = {
  onSubmit: (data: Record<string, number>) => void;
  onBack: () => void;
};

const FIELDS = [
  { key: "height", label: "Height (cm)", placeholder: "e.g. 170" },
  { key: "chest", label: "Chest (cm)", placeholder: "e.g. 96" },
  { key: "waist", label: "Waist (cm)", placeholder: "e.g. 76" },
  { key: "hips", label: "Hips (cm)", placeholder: "e.g. 90" },
] as const;

export function StepMeasurements({ onSubmit, onBack }: StepMeasurementsProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed: Record<string, number> = {};
    const newErrors: Record<string, string> = {};

    for (const field of FIELDS) {
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
    <div className="animate-fade-in space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center gap-2">
        <Ruler className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Your Measurements
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your body measurements for accurate fit scores
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {FIELDS.map((field) => (
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
              <p className="mt-1 text-xs text-destructive">
                {errors[field.key]}
              </p>
            )}
          </div>
        ))}

        <Button type="submit" size="default" className="w-full">
          See My Fit Scores
        </Button>
      </form>
    </div>
  );
}
