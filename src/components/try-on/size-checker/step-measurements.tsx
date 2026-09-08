"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, Shirt } from "lucide-react";
import { GarmentItem } from "../garment-selector/garment-selector";
import { normalizeCategory } from "@/services/outfit-api";
import { PresetSelector } from "./preset-selector";
import { MeasurementInputs } from "./measurement-inputs";
import {
  UnitType,
  BodyMeasurements,
  PresetProfile,
} from "./types";

interface StepMeasurementsProps {
  selectedGarments: GarmentItem[];
  measurements: BodyMeasurements;
  onChangeMeasurement: (field: keyof BodyMeasurements, value: number) => void;
  fitPreference?: string;
  onSelectFitPreference?: (fit: any) => void;
  onApplyPreset: (preset: PresetProfile) => void;
  onCalculate: () => void;
}

export function StepMeasurements({
  selectedGarments,
  measurements,
  onChangeMeasurement,
  onApplyPreset,
  onCalculate,
}: StepMeasurementsProps) {
  const [unit, setUnit] = useState<UnitType>("cm");

  const handleCustomMeasurementChange = (
    field: keyof BodyMeasurements,
    value: number
  ) => {
    onChangeMeasurement(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate();
  };

  return (
    <form id="size-checker-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Selected Garments Banner */}
      {selectedGarments.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Target Garment{selectedGarments.length > 1 ? "s" : ""}</span>
            <span className="text-accent font-semibold">
              {selectedGarments.length} item{selectedGarments.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedGarments.map((garment, idx) => {
              const cat = normalizeCategory(garment.category);
              return (
                <div
                  key={garment.id || garment.name + idx}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/20 border border-border/60"
                >
                  <div className="w-9 h-11 rounded-lg overflow-hidden bg-muted/40 shrink-0 border border-border/40">
                    <img
                      src={garment.image}
                      alt={garment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-accent bg-accent/10 px-1 py-0.5 rounded">
                        {idx === 0 ? "Top / Item 1" : "Bottom / Item 2"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">• {cat}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                      {garment.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Body Measurements Inputs */}
      <div className="space-y-4 animate-in fade-in duration-200">
        <MeasurementInputs
          unit={unit}
          onUnitChange={setUnit}
          measurements={measurements}
          onChangeMeasurement={handleCustomMeasurementChange}
        />
      </div>
    </form>
  );
}
