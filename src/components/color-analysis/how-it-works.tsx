"use client";

import React from "react";
import { Sparkles, ScanFace, Palette, ShoppingBag } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: <ScanFace className="w-4 h-4 text-accent" />,
      title: "Facial Scanning",
      desc: "Upload a photo under natural light",
    },
    {
      number: "02",
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      title: "Undertone Analysis",
      desc: "Detects skin tone & warm/cool undertones",
    },
    {
      number: "03",
      icon: <Palette className="w-4 h-4 text-accent" />,
      title: "Seasonal Archetype",
      desc: "Matches your 12-season color swatches",
    },
    {
      number: "04",
      icon: <ShoppingBag className="w-4 h-4 text-accent" />,
      title: "Curated Wardrobe",
      desc: "Recommends apparel tailored to your complexion",
    },
  ];

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 space-y-5 shadow-2xs h-full flex flex-col justify-between">
      <div className="flex items-center justify-between pb-1 border-b border-border/50">
        <h3 className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
          Analysis Methodology
        </h3>
        <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-accent" /> Aeternum Intelligence
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
        {steps.map((step, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex flex-col justify-between gap-3 hover:border-foreground/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-2xs">
                {step.icon}
              </div>
              <span className="text-[10px] font-mono font-extrabold text-muted-foreground/60">
                {step.number}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-foreground">{step.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
