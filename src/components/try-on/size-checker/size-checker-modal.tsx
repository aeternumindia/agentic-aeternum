"use client";

import React, { useState, useEffect } from "react";
import { Ruler, RotateCcw, Sparkles, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { normalizeCategory } from "@/services/outfit-api";
import {
  AISizeCheckerModalProps,
  BodyMeasurements,
  PresetProfile,
} from "./types";
import { StepMeasurements } from "./step-measurements";
import { StepCalculating } from "./step-calculating";
import { StepResult } from "./step-result";

export function AISizeCheckerModal({
  isOpen,
  onClose,
  selectedGarments,
}: AISizeCheckerModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: 176,
    chest: 96,
    waist: 80,
    hips: 98,
  });

  // Reset steps when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  const handleChangeMeasurement = (
    field: keyof BodyMeasurements,
    value: number
  ) => {
    setMeasurements((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyPreset = (preset: PresetProfile) => {
    setMeasurements({
      height: preset.height,
      chest: preset.chest,
      waist: preset.waist,
      hips: preset.hips,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        {/* Modal Header */}
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-border/70 text-left pr-10 sm:pr-12">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <DialogTitle className="text-sm sm:text-base md:text-lg font-semibold tracking-tight text-foreground">
                  AI Size & Fit Recommender
                </DialogTitle>
                <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  {selectedGarments.length > 1 ? (
                    <span>
                      Calculating sizes for <strong className="text-foreground">{selectedGarments.length} selected garments</strong>
                    </span>
                  ) : selectedGarments[0] ? (
                    <span>
                      Calculating fit for <strong className="text-foreground">{selectedGarments[0].name}</strong> ({normalizeCategory(selectedGarments[0].category)})
                    </span>
                  ) : (
                    <span>Calculating precise AI sizing from body measurements</span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Wizard Step Indicator */}
          <div className="flex items-center gap-2 sm:gap-3 pt-2.5 sm:pt-3">
            <div className="flex-1 flex items-center gap-1.5">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-accent" : "bg-muted/50"}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-accent" : "bg-muted/50"}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 3 ? "bg-accent" : "bg-muted/50"}`} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground shrink-0">
              {step === 1
                ? "Step 1/2: Body Profile"
                : step === 2
                ? "Calculating..."
                : "Step 2/2: Sizing Result"}
            </span>
          </div>
        </DialogHeader>

        {/* Modal Content Body */}
        <div
          className={`max-h-[68vh] sm:max-h-[480px] overflow-y-auto overscroll-contain shrink-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full ${
            step === 3 ? "p-4 sm:p-6 pb-0 sm:pb-0" : "p-4 sm:p-6"
          }`}
        >
          {step === 1 && (
            <StepMeasurements
              selectedGarments={selectedGarments}
              measurements={measurements}
              onChangeMeasurement={handleChangeMeasurement}
              onApplyPreset={handleApplyPreset}
              onCalculate={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <StepCalculating onComplete={() => setStep(3)} />
          )}

          {step === 3 && (
            <StepResult
              selectedGarments={selectedGarments}
              measurements={measurements}
              onRecalculate={() => {
                setStep(1);
              }}
              onClose={onClose}
            />
          )}
        </div>

        {/* Modal Footer */}
        {step !== 3 && (
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
            {step === 1 ? (
              <div className="w-full flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-border/80 bg-card hover:bg-muted/40 text-foreground text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="size-checker-form"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Calculate AI Recommended Size{selectedGarments.length > 1 ? "s" : ""}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
