"use client";

import React, { useState } from "react";
import { Palette, ChevronRight, Check } from "lucide-react";
import { SEASONAL_PALETTES, SeasonalPalette } from "./types";

export function SeasonalPalettesPreview() {
  const [selectedPalette, setSelectedPalette] = useState<SeasonalPalette>(
    SEASONAL_PALETTES[0]
  );

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Explore Seasonal Color Archetypes
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Discover how undertone harmonics dictate optimal clothing colors
          </p>
        </div>
      </div>

      {/* Season Selection Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SEASONAL_PALETTES.map((palette) => {
          const isSelected = selectedPalette.id === palette.id;
          return (
            <button
              key={palette.id}
              type="button"
              onClick={() => setSelectedPalette(palette)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden ${
                isSelected
                  ? "bg-foreground text-background border-foreground shadow-xs font-semibold"
                  : "bg-muted/20 hover:bg-muted/40 border-border/70 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold">{palette.name}</span>
                <span
                  className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? "bg-background/20 text-background"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  {palette.undertone}
                </span>
              </div>

              {/* Swatch Mini Preview Bar */}
              <div className="flex items-center gap-1">
                {palette.swatches.map((swatch) => (
                  <div
                    key={swatch.hex}
                    style={{ backgroundColor: swatch.hex }}
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                    title={swatch.name}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Season Details Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-foreground">
              {selectedPalette.name} Palette Guide
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedPalette.description}
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-full shrink-0">
            {selectedPalette.undertone} Undertone
          </span>
        </div>

        {/* Full Swatches Display */}
        <div className="pt-1 space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
            Core Signature Colors
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedPalette.swatches.map((swatch) => (
              <div
                key={swatch.hex}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/80 shadow-2xs text-xs font-medium"
              >
                <span
                  style={{ backgroundColor: swatch.hex }}
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                />
                <span className="text-foreground">{swatch.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {swatch.hex}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
