"use client";

import React from "react";
import { Download, RotateCcw, Eye, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { ColorAnalysisData } from "./types";
import { CuratedProductsGrid } from "./curated-products-grid";

interface AnalysisResultCardProps {
  result: ColorAnalysisData;
  previewUrl: string;
  onDownloadPdf: () => void;
  onReset: () => void;
}

export function AnalysisResultCard({
  result,
  previewUrl,
  onDownloadPdf,
  onReset,
}: AnalysisResultCardProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Hero Layout: Image + Core Attributes Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Uploaded Portrait Canvas */}
        <div className="md:col-span-5 rounded-3xl border border-border/80 bg-card p-3 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-muted relative">
            <img
              src={previewUrl}
              alt="Analyzed Complexion"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full border border-border/60 text-[10px] uppercase font-bold tracking-wider text-accent flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AI Verified Analysis</span>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="md:col-span-7 rounded-3xl border border-border/80 bg-card p-6 flex flex-col justify-between gap-5 shadow-2xs">
          <div className="space-y-5">
            {/* Header */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-accent">
                Complexion Profile
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                {result.season} Seasonal Archetype
              </h2>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-muted/20 border border-border/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Skin Tone
                </span>
                <span className="text-xs sm:text-sm font-bold text-foreground capitalize mt-0.5 block">
                  {result.skinTone}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Undertone
                </span>
                <span className="text-xs sm:text-sm font-bold text-foreground capitalize mt-0.5 block">
                  {result.undertone}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Season
                </span>
                <span className="text-xs sm:text-sm font-bold text-accent mt-0.5 block">
                  {result.season}
                </span>
              </div>
            </div>

            {/* Best Colors Swatches */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground block">
                Recommended Complementary Swatches
              </label>
              <div className="flex flex-wrap gap-2">
                {result.bestColors.map((c) => (
                  <div
                    key={c.hex}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-card text-xs font-medium shadow-2xs"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors to Avoid */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground block">
                Colors to Avoid
              </label>
              <div className="flex flex-wrap gap-2">
                {result.avoidColors.map((c) => (
                  <div
                    key={c.hex}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-destructive/20 bg-destructive/5 text-xs font-medium text-destructive"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stylist Summary */}
            <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/60">
              {result.description}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onDownloadPdf}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-accent text-accent-foreground text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Analysis Report</span>
            </button>

            <Link
              href="/virtual-try-on"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Try On Matched Outfits</span>
            </Link>

            <button
              type="button"
              onClick={onReset}
              className="w-full sm:w-auto p-3 rounded-xl border border-border/80 bg-card hover:bg-muted/40 text-foreground transition-all cursor-pointer flex items-center justify-center"
              title="Analyze Another Photo"
            >
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Curated Products Driven by Sales */}
      <CuratedProductsGrid seasonTitle={result.season} />
    </div>
  );
}
