"use client";

import React from "react";
import { FitPreference } from "./types";

interface FitPreferenceSelectorProps {
  fitPreference: FitPreference;
  onSelectFitPreference: (fit: FitPreference) => void;
}

export function FitPreferenceSelector({
  fitPreference,
  onSelectFitPreference,
}: FitPreferenceSelectorProps) {
  const options: { id: FitPreference; label: string; desc: string }[] = [
    { id: "slim", label: "Slim Fit", desc: "Body-hugging cut" },
    { id: "regular", label: "Regular Fit", desc: "Classic standard ease" },
    { id: "relaxed", label: "Relaxed Fit", desc: "Loose & comfortable" },
  ];

  return (
    <div className="space-y-2">
      <label className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground block">
        Step 3: Preferred Garment Fit
      </label>

      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isSelected = fitPreference === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectFitPreference(opt.id)}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                isSelected
                  ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                  : "bg-card hover:bg-muted/30 border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-xs font-semibold">{opt.label}</span>
              <span
                className={`text-[10px] ${
                  isSelected ? "text-background/80" : "text-muted-foreground"
                }`}
              >
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
