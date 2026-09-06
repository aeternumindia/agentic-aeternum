"use client";

import React from "react";
import { User, Check } from "lucide-react";
import { PRESET_PROFILES, PresetProfile } from "./types";

interface PresetSelectorProps {
  activePresetId: string | null;
  onSelectPreset: (preset: PresetProfile) => void;
}

export function PresetSelector({
  activePresetId,
  onSelectPreset,
}: PresetSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
          Step 1: Choose Body Profile Preset (Optional)
        </label>
        <span className="text-[10px] text-muted-foreground font-medium">
          Quickly pre-fill standard sizes
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRESET_PROFILES.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden group ${
                isSelected
                  ? "bg-foreground text-background border-foreground shadow-xs font-medium"
                  : "bg-card hover:bg-muted/30 border-border/70 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected
                      ? "bg-background/20 text-background"
                      : "bg-muted/50 text-accent group-hover:bg-muted"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-background font-bold shrink-0" />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold leading-tight">{preset.label}</p>
                <p
                  className={`text-[10px] mt-0.5 leading-tight ${
                    isSelected ? "text-background/80" : "text-muted-foreground"
                  }`}
                >
                  Chest: {preset.chest} cm
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
