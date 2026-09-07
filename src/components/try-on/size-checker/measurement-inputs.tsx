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
    const inVal = cmValue / 2.54;
    return String(Math.round(inVal * 10) / 10);
  }
  return String(Math.round(cmValue));
}

export function MeasurementInputs({
  unit,
  onUnitChange,
  measurements,
  onChangeMeasurement,
}: MeasurementInputsProps) {
  // Sync local display values for smooth typing in both cm & inches
  const [displayValues, setDisplayValues] = React.useState<
    Record<keyof BodyMeasurements, string>
  >({
    height: formatValue(measurements.height, unit),
    chest: formatValue(measurements.chest, unit),
    waist: formatValue(measurements.waist, unit),
    hips: formatValue(measurements.hips, unit),
  });

  React.useEffect(() => {
    setDisplayValues({
      height: formatValue(measurements.height, unit),
      chest: formatValue(measurements.chest, unit),
      waist: formatValue(measurements.waist, unit),
      hips: formatValue(measurements.hips, unit),
    });
  }, [unit, measurements.height, measurements.chest, measurements.waist, measurements.hips]);

  const handleInputChange = (
    field: keyof BodyMeasurements,
    rawValue: string
  ) => {
    setDisplayValues((prev) => ({ ...prev, [field]: rawValue }));

    const num = parseFloat(rawValue);
    if (!isNaN(num) && num > 0) {
      const cmVal = unit === "in" ? num * 2.54 : num;
      onChangeMeasurement(field, cmVal);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with Unit Switcher */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
          Body Measurements
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
            value={displayValues.height}
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
            value={displayValues.chest}
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
            value={displayValues.waist}
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
            value={displayValues.hips}
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
