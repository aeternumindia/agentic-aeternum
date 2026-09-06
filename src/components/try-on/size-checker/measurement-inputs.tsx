"use client";

import React from "react";
import { Info, HelpCircle } from "lucide-react";
import { UnitType, BodyMeasurements } from "./types";

interface MeasurementInputsProps {
  unit: UnitType;
  onUnitChange: (unit: UnitType) => void;
  measurements: BodyMeasurements;
  onChangeMeasurement: (field: keyof BodyMeasurements, value: number) => void;
}

// Convert internal cm value to display string in active unit
function formatValue(cmValue: number, unit: UnitType): string {
  if (unit === "in") {
    return (cmValue / 2.54).toFixed(1);
  }
  return String(Math.round(cmValue));
}

// Parse input in active unit to internal cm value
function parseValue(displayValue: string, unit: UnitType): number {
  const num = parseFloat(displayValue) || 0;
  if (unit === "in") {
    return Math.round(num * 2.54);
  }
  return num;
}

export function MeasurementInputs({
  unit,
  onUnitChange,
  measurements,
  onChangeMeasurement,
}: MeasurementInputsProps) {
  const handleInputChange = (
    field: keyof BodyMeasurements,
    rawValue: string
  ) => {
    const cmVal = parseValue(rawValue, unit);
    onChangeMeasurement(field, cmVal);
  };

  return (
    <div className="space-y-3">
      {/* Header with Unit Switcher */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
          Step 2: Exact Body Measurements
        </label>

        {/* Unit Switcher */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 text-xs">
          <button
            type="button"
            onClick={() => onUnitChange("cm")}
            className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
              unit === "cm"
                ? "bg-card text-foreground shadow-2xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            cm
          </button>
          <button
            type="button"
            onClick={() => onUnitChange("in")}
            className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
              unit === "in"
                ? "bg-card text-foreground shadow-2xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            inches
          </button>
        </div>
      </div>

      {/* Grid of Inputs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Height Input */}
        <div className="space-y-1 bg-card p-3 rounded-xl border border-border/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Height ({unit})
            </span>
          </div>
          <input
            type="number"
            step={unit === "in" ? "0.1" : "1"}
            required
            value={formatValue(measurements.height, unit)}
            onChange={(e) => handleInputChange("height", e.target.value)}
            className="w-full bg-muted/20 border border-border/80 focus:border-foreground/60 rounded-lg px-3 py-1.5 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Chest Input */}
        <div className="space-y-1 bg-card p-3 rounded-xl border border-border/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Chest / Bust ({unit})
            </span>
          </div>
          <input
            type="number"
            step={unit === "in" ? "0.1" : "1"}
            required
            value={formatValue(measurements.chest, unit)}
            onChange={(e) => handleInputChange("chest", e.target.value)}
            className="w-full bg-muted/20 border border-border/80 focus:border-foreground/60 rounded-lg px-3 py-1.5 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Waist Input */}
        <div className="space-y-1 bg-card p-3 rounded-xl border border-border/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Waist ({unit})
            </span>
          </div>
          <input
            type="number"
            step={unit === "in" ? "0.1" : "1"}
            required
            value={formatValue(measurements.waist, unit)}
            onChange={(e) => handleInputChange("waist", e.target.value)}
            className="w-full bg-muted/20 border border-border/80 focus:border-foreground/60 rounded-lg px-3 py-1.5 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Hips Input */}
        <div className="space-y-1 bg-card p-3 rounded-xl border border-border/70 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Hips ({unit})
            </span>
          </div>
          <input
            type="number"
            step={unit === "in" ? "0.1" : "1"}
            required
            value={formatValue(measurements.hips, unit)}
            onChange={(e) => handleInputChange("hips", e.target.value)}
            className="w-full bg-muted/20 border border-border/80 focus:border-foreground/60 rounded-lg px-3 py-1.5 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Measurement tip info banner */}
      <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-2 text-[11px] text-muted-foreground">
        <Info className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
        <p className="leading-tight">
          <strong>How to measure:</strong> Wrap tape comfortably around fullest part of chest and natural waist. Keep tape level.
        </p>
      </div>
    </div>
  );
}
