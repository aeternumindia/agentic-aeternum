"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, Shirt } from "lucide-react";
import { GarmentItem } from "../garment-selector/garment-selector";
import { normalizeCategory } from "@/services/outfit-api";
import { PresetSelector } from "./preset-selector";
import { MeasurementInputs } from "./measurement-inputs";
import { FitPreferenceSelector } from "./fit-preference-selector";
import {
  UnitType,
  FitPreference,
  BodyMeasurements,
  PresetProfile,
} from "./types";

interface StepMeasurementsProps {
  selectedGarments: GarmentItem[];
  measurements: BodyMeasurements;
  onChangeMeasurement: (field: keyof BodyMeasurements, value: number) => void;
  fitPreference: FitPreference;
  onSelectFitPreference: (fit: FitPreference) => void;
  onApplyPreset: (preset: PresetProfile) => void;
  onCalculate: () => void;
}

export function StepMeasurements({
  selectedGarments,
  measurements,
  onChangeMeasurement,
  fitPreference,
  onSelectFitPreference,
  onApplyPreset,
  onCalculate,
}: StepMeasurementsProps) {
  const [unit, setUnit] = useState<UnitType>("cm");
  const [activePresetId, setActivePresetId] = useState<string | null>("regular");

  const handleSelectPreset = (preset: PresetProfile) => {
    setActivePresetId(preset.id);
    onApplyPreset(preset);
  };

  const handleCustomMeasurementChange = (
    field: keyof BodyMeasurements,
    value: number
  ) => {
    setActivePresetId(null);
    onChangeMeasurement(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate();
  };

  return (
    <form id="size-checker-form" onSubmit={handleSubmit} className="space-y-5">
      {/* Selected Garments Banner (Supports 1 or multiple garments) */}
      {selectedGarments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Target Garment{selectedGarments.length > 1 ? "s" : ""}</span>
            <span className="text-accent font-semibold">
              {selectedGarments.length} item{selectedGarments.length > 1 ? "s" : ""} selected for sizing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedGarments.map((garment, idx) => {
              const cat = normalizeCategory(garment.category);
              return (
                <div
                  key={garment.id || garment.name + idx}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-muted/20 border border-border/60"
                >
                  <div className="w-11 h-13 rounded-xl overflow-hidden bg-muted/40 shrink-0 border border-border/40">
                    <img
                      src={garment.image}
                      alt={garment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">
                        {idx === 0 ? "Top / Item 1" : "Bottom / Item 2"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">• {cat}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                      {garment.name}
                    </p>
                    {garment.price && (
                      <p className="text-[11px] font-semibold text-foreground">
                        ₹{Number(garment.price).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preset Profile Selection */}
      <PresetSelector
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
      />

      {/* Measurement Inputs Grid */}
      <MeasurementInputs
        unit={unit}
        onUnitChange={setUnit}
        measurements={measurements}
        onChangeMeasurement={handleCustomMeasurementChange}
      />

      {/* Fit Preference Selection */}
      <FitPreferenceSelector
        fitPreference={fitPreference}
        onSelectFitPreference={onSelectFitPreference}
      />
    </form>
  );
}
