"use client";

import React, { useState } from "react";
import { ShieldCheck, Check, Info, RotateCcw, Shirt, ShoppingBag, Loader2, ExternalLink } from "lucide-react";
import { GarmentItem } from "../garment-selector/garment-selector";
import { normalizeCategory } from "@/services/outfit-api";
import {
  findRecommendedSize,
  genericFitScore,
} from "@/services/virtual-try-on";
import { useShopifyCart } from "@/contexts/shopify-cart";
import apiClient from "@/services/api";
import { BodyMeasurements, FitPreference } from "./types";

interface StepResultProps {
  selectedGarments: GarmentItem[];
  measurements: BodyMeasurements;
  fitPreference: FitPreference;
  onRecalculate: () => void;
  onClose: () => void;
}

export function StepResult({
  selectedGarments,
  measurements,
  fitPreference,
  onRecalculate,
  onClose,
}: StepResultProps) {
  const { addToCart, openCart } = useShopifyCart();
  const [activeGarmentIndex, setActiveGarmentIndex] = useState(0);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIndices, setAddedIndices] = useState<number[]>([]);
  const [addingAll, setAddingAll] = useState(false);
  const [addedAll, setAddedAll] = useState(false);
  const [lastAddedNotice, setLastAddedNotice] = useState<{
    title: string;
    size: string;
    image: string;
  } | null>(null);

  // Apply fit preference adjustments
  const adjusted = { ...measurements };
  if (fitPreference === "slim") {
    adjusted.chest += 2;
    adjusted.waist += 2;
  } else if (fitPreference === "relaxed") {
    adjusted.chest -= 2;
    adjusted.waist -= 2;
  }

  // Pre-calculate sizing for all selected garments
  const garmentResults = selectedGarments.map((garment) => {
    const recommendedSize = findRecommendedSize(adjusted);
    const category = normalizeCategory(garment.category);
    const { fitScore, comparisonRows } = genericFitScore(
      recommendedSize,
      measurements,
      category
    );
    return {
      garment,
      category,
      recommendedSize,
      fitScore,
      comparisonRows,
    };
  });

  const activeResult = garmentResults[activeGarmentIndex] || garmentResults[0];

  const handleAddSingleToCart = async (garment: GarmentItem, recommendedSize: string, index: number) => {
    setAddingIndex(index);
    try {
      const handle = garment.handle || garment.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      let variantId: string | null = null;

      try {
        const { data } = await apiClient.get(`/cart/variants/admin/${handle}`);
        if (data.success && data.data?.variants?.length > 0) {
          const target = recommendedSize.trim().toLowerCase();
          const matched = data.data.variants.find(
            (v: any) =>
              v.title.toLowerCase() === target ||
              v.title.toLowerCase().includes(target) ||
              v.options?.some((o: any) => o.value.toLowerCase() === target)
          );
          variantId = matched ? matched.id : (data.data.variants.find((v: any) => v.available)?.id || data.data.variants[0].id);
        }
      } catch {
        try {
          const { data } = await apiClient.get(`/cart/variants/${handle}`);
          if (data.success && data.data?.variants?.length > 0) {
            const target = recommendedSize.trim().toLowerCase();
            const matched = data.data.variants.find(
              (v: any) =>
                v.title.toLowerCase() === target ||
                v.title.toLowerCase().includes(target) ||
                v.options?.some((o: any) => o.value.toLowerCase() === target)
            );
            variantId = matched ? matched.id : (data.data.variants.find((v: any) => v.available)?.id || data.data.variants[0].id);
          }
        } catch {}
      }

      if (variantId) {
        await addToCart(variantId, 1);
      }
      setAddedIndices((prev) => [...prev, index]);
      setLastAddedNotice({
        title: garment.name,
        size: recommendedSize,
        image: garment.image,
      });
      openCart();
    } catch (err) {
      console.error("Add to cart error:", err);
    } finally {
      setAddingIndex(null);
    }
  };

  const handleAddAllToCart = async () => {
    setAddingAll(true);
    try {
      for (let i = 0; i < garmentResults.length; i++) {
        const res = garmentResults[i];
        await handleAddSingleToCart(res.garment, res.recommendedSize, i);
      }
      setAddedAll(true);
      setLastAddedNotice({
        title: `Complete Outfit (${garmentResults.length} items)`,
        size: garmentResults.map((r) => r.recommendedSize).join(" / "),
        image: garmentResults[0].garment.image,
      });
      openCart();
    } catch (err) {
      console.error("Add all to cart error:", err);
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Visual Add To Cart Toast Banner */}
      {lastAddedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950 text-white border border-emerald-500/40 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-12 rounded-xl bg-white/10 overflow-hidden shrink-0 border border-white/20">
              <img
                src={lastAddedNotice.image}
                alt={lastAddedNotice.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <Check className="w-3.5 h-3.5" />
                <span>Successfully Added to Cart</span>
              </div>
              <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[260px]">
                {lastAddedNotice.title}
              </p>
              <p className="text-[11px] text-emerald-200/80">
                Recommended Size: <strong className="text-white">{lastAddedNotice.size}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openCart()}
            className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <span>View Cart</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* If Multiple Garments Selected: Outfit Summary Header & Tab Switcher */}
      {garmentResults.length > 1 && (
        <div className="space-y-3">
          {/* Complete Outfit Sizing Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-navy/90 to-black text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
                <Shirt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  Complete Outfit Recommended Sizing
                </p>
                <div className="flex items-center gap-3 text-xs font-bold mt-0.5">
                  {garmentResults.map((res, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-white/70 font-normal">
                        {i === 0 ? "Top:" : "Bottom:"}
                      </span>{" "}
                      Size {res.recommendedSize}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Add Entire Outfit Button */}
            <button
              type="button"
              onClick={handleAddAllToCart}
              disabled={addingAll}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0"
            >
              {addingAll ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding Outfit...</span>
                </>
              ) : addedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black font-bold" />
                  <span>Outfit Added to Cart ✓</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add Entire Outfit to Cart</span>
                </>
              )}
            </button>
          </div>

          {/* Garment Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            {garmentResults.map((res, idx) => {
              const isActive = activeGarmentIndex === idx;
              return (
                <button
                  key={res.garment.id || idx}
                  type="button"
                  onClick={() => setActiveGarmentIndex(idx)}
                  className={`flex-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    isActive
                      ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                      : "bg-card hover:bg-muted/30 border-border/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <img
                    src={res.garment.image}
                    alt={res.garment.name}
                    className="w-7 h-8 rounded-lg object-cover bg-muted/40 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider truncate opacity-80">
                      {idx === 0 ? "Top Garment" : "Bottom Garment"}
                    </p>
                    <p className="text-xs font-bold truncate">
                      Size {res.recommendedSize} ({res.fitScore.overall}%)
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Recommended Size Hero Banner for Active Garment */}
      {activeResult && (
        <>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-card via-muted/20 to-accent/10 border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                <span>
                  AI Sizing for {activeResult.category}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Size {activeResult.recommendedSize}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {activeResult.garment.name}
              </p>

              {/* Add Recommended Size to Cart Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAddSingleToCart(
                      activeResult.garment,
                      activeResult.recommendedSize,
                      activeGarmentIndex
                    )
                  }
                  disabled={addingIndex === activeGarmentIndex}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-all disabled:opacity-50 ${
                    addedIndices.includes(activeGarmentIndex)
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                  }`}
                >
                  {addingIndex === activeGarmentIndex ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding Size {activeResult.recommendedSize}...</span>
                    </>
                  ) : addedIndices.includes(activeGarmentIndex) ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white font-bold" />
                      <span>Size {activeResult.recommendedSize} Added to Cart ✓</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add Size {activeResult.recommendedSize} to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-background border border-border/60 shadow-2xs shrink-0 min-w-[120px]">
              <span className="text-2xl font-extrabold text-foreground">
                {activeResult.fitScore.overall}%
              </span>
              <span className="text-[10px] uppercase font-bold text-accent tracking-wider">
                {activeResult.fitScore.label}
              </span>
            </div>
          </div>

          {/* Visual Fit Scale Indicator */}
          <div className="space-y-1.5 p-3.5 bg-card rounded-xl border border-border/70">
            <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
              <span>Snug / Tight</span>
              <span className="font-bold text-foreground">Ideal Fit Curve</span>
              <span>Loose / Oversized</span>
            </div>
            <div className="w-full bg-muted/40 h-2 rounded-full relative overflow-hidden flex items-center">
              <div className="absolute left-1/2 -translate-x-1/2 w-8 h-full bg-accent rounded-full opacity-90 shadow-2xs" />
            </div>
          </div>

          {/* Measurement Comparison Breakdown */}
          {activeResult.comparisonRows.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Fit Analysis Breakdown ({activeResult.category})</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Standard sizing tolerances
                </span>
              </h4>

              <div className="space-y-2">
                {activeResult.comparisonRows.map((row) => (
                  <div
                    key={row.label}
                    className="p-3 rounded-xl border border-border/60 bg-card flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground">{row.label}</span>
                      <p className="text-[11px] text-muted-foreground">
                        Your measurement: <strong>{row.userValue} cm</strong> (Chart Range: {row.sizeRange.min}–{row.sizeRange.max} cm)
                      </p>
                    </div>
                    <div className="shrink-0">
                      {row.withinRange ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                          <Check className="w-3 h-3" />
                          Optimal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                          Acceptable
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Stylist Note */}
          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 flex items-start gap-3 text-xs text-muted-foreground">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Stylist Advice:</strong> {activeResult.fitScore.description} For <strong>{activeResult.garment.name}</strong>, Size <strong>{activeResult.recommendedSize}</strong> delivers a optimal luxury fit.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
