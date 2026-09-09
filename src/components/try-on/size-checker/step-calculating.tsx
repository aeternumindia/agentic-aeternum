"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Sliders, ShieldCheck } from "lucide-react";

interface StepCalculatingProps {
  onComplete: () => void;
}

export function StepCalculating({ onComplete }: StepCalculatingProps) {
  const [calcProgress, setCalcProgress] = useState(10);
  const [calcStepIndex, setCalcStepIndex] = useState(0);

  const steps = [
    "Analyzing garment pattern & fabric ease matrix...",
    "Matching body dimensions against standard size curves...",
    "Generative fit match completed successfully!",
  ];

  useEffect(() => {
    const t1 = setTimeout(() => {
      setCalcProgress(50);
      setCalcStepIndex(1);
    }, 450);

    const t2 = setTimeout(() => {
      setCalcProgress(85);
      setCalcStepIndex(2);
    }, 900);

    const t3 = setTimeout(() => {
      setCalcProgress(100);
      onComplete();
    }, 1300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent relative">
        <Sparkles className="w-8 h-8 animate-pulse text-accent" />
        <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          Evaluating Fit & Sizing Curves
        </h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground transition-all duration-200">
          {steps[calcStepIndex]}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md bg-muted/40 h-2 rounded-full overflow-hidden border border-border/60">
        <div
          style={{ width: `${calcProgress}%` }}
          className="bg-accent h-full transition-all duration-300 ease-out"
        />
      </div>

      <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-muted-foreground pt-2">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Guaranteed Accuracy
        </span>
        <span className="flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-accent" /> Custom Ease Matrix
        </span>
      </div>
    </div>
  );
}
