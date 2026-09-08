"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Check, Info, RotateCcw, Shirt, ShoppingBag, Loader2, ExternalLink, Ruler, Sparkles } from "lucide-react";
import { GarmentItem } from "../garment-selector/garment-selector";
import { normalizeCategory } from "@/services/outfit-api";
import {
  findRecommendedSize,
  genericFitScore,
  calculateFitScore,
  isSizeMatch,
} from "@/services/virtual-try-on";
import { useShopifyCart } from "@/contexts/shopify-cart";
import apiClient, { getSizeChart } from "@/services/api";
import { BodyMeasurements, FitPreference } from "./types";
import { ProductSizeChart, TryOnSession } from "@/types/virtual-try-on";

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

  // Map of garment index -> active user-selected size tab override
  const [selectedSizeOverrideMap, setSelectedSizeOverrideMap] = useState<
    Record<number, string>
  >({});

  // Map of handle -> variants and sizeChart fetched from Shopify
  const [productDetailsMap, setProductDetailsMap] = useState<
    Record<
      string,
      {
        variants: any[];
        sizeChart: ProductSizeChart | null;
        loading: boolean;
      }
    >
  >({});

  useEffect(() => {
    let isMounted = true;

    async function fetchAllGarmentDetails() {
      const initialMap: Record<
        string,
        { variants: any[]; sizeChart: ProductSizeChart | null; loading: boolean }
      > = {};
      for (const g of selectedGarments) {
        const handle = g.handle || g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        initialMap[handle] = { variants: [], sizeChart: null, loading: true };
      }
      setProductDetailsMap(initialMap);

      for (const g of selectedGarments) {
        const handle = g.handle || g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        let fetchedVariants: any[] = [];
        let fetchedSizeChart: ProductSizeChart | null = null;

        // Fetch variants
        try {
          const { data } = await apiClient.get(`/cart/variants/admin/${handle}`);
          if (data.success && data.data?.variants?.length > 0) {
            fetchedVariants = data.data.variants;
          }
        } catch {
          try {
            const { data } = await apiClient.get(`/cart/variants/${handle}`);
            if (data.success && data.data?.variants?.length > 0) {
              fetchedVariants = data.data.variants;
            }
          } catch {}
        }

        // Fetch product size chart from backend / Shopify
        try {
          const res = await getSizeChart(handle);
          if (res?.success && res.data) {
            const d = res.data;
            let chartData = null;
            if (d.chart_data) {
              try {
                chartData =
                  typeof d.chart_data === "string"
                    ? JSON.parse(d.chart_data)
                    : d.chart_data;
              } catch {}
            }
            fetchedSizeChart = {
              chartData,
              image: d.image || null,
              fitNotes: d.fit_notes || null,
            };
          }
        } catch {}

        if (isMounted) {
          setProductDetailsMap((prev) => ({
            ...prev,
            [handle]: {
              variants: fetchedVariants,
              sizeChart: fetchedSizeChart,
              loading: false,
            },
          }));
        }
      }
    }

    if (selectedGarments.length > 0) {
      fetchAllGarmentDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [selectedGarments]);

  // Apply fit preference adjustments for AI size recommendation calculation:
  // - Relaxed fit: add +2cm ease offset to target a roomier size tier
  // - Slim fit: subtract -2cm ease offset to target a tighter size tier
  const adjustedForRec = { ...measurements };
  if (fitPreference === "slim") {
    adjustedForRec.chest = Math.max(0, (adjustedForRec.chest || 0) - 2);
    adjustedForRec.waist = Math.max(0, (adjustedForRec.waist || 0) - 2);
  } else if (fitPreference === "relaxed") {
    adjustedForRec.chest = (adjustedForRec.chest || 0) + 2;
    adjustedForRec.waist = (adjustedForRec.waist || 0) + 2;
  }

  // Pre-calculate sizing for all selected garments using actual Shopify product size charts and variant data
  const garmentResults = selectedGarments.map((garment, gIdx) => {
    const handle = garment.handle || garment.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const details = productDetailsMap[handle] || { variants: [], sizeChart: null, loading: false };
    const category = normalizeCategory(garment.category);
    const sizeChart = details.sizeChart;

    // Extract available size labels from Shopify variants
    const availableSizeLabels = Array.from(
      new Set(
        details.variants
          .map((v: any) => {
            const opt =
              v.options?.find(
                (o: any) =>
                  o.name.toLowerCase() === "size" || o.name.toLowerCase() === "title"
              ) || v.options?.[0];
            return opt?.value || v.title;
          })
          .filter(Boolean)
      )
    );

    // AI recommended size calculation using product's actual size chart if available
    const recommendedSize = findRecommendedSize(
      adjustedForRec,
      category,
      availableSizeLabels,
      sizeChart?.chartData
    );

    const activeSize = selectedSizeOverrideMap[gIdx] || recommendedSize;

    const matchedVariant = details.variants.find((v: any) => {
      const sizeOpt =
        v.options?.find(
          (o: any) => o.name.toLowerCase() === "size" || o.name.toLowerCase() === "title"
        ) || v.options?.[0];
      const vSize = sizeOpt?.value || v.title;
      return isSizeMatch(activeSize, vSize) || isSizeMatch(activeSize, v.title);
    });

    const isAvailable = matchedVariant ? Boolean(matchedVariant.available) : false;
    const isOffered = Boolean(matchedVariant);
    const variantId = isAvailable ? matchedVariant?.id || null : null;

    // Closest in-stock fallback variant if recommended size is out of stock or not offered
    const closestInStockVariant = !isAvailable
      ? details.variants.find((v: any) => v.available)
      : null;
    const closestSizeLabel = closestInStockVariant
      ? closestInStockVariant.options?.find(
          (o: any) => o.name.toLowerCase() === "size"
        )?.value || closestInStockVariant.title
      : null;

    // Evaluate fit score & comparison rows for activeSize using raw user measurements for accurate UI breakdown reporting
    const session: TryOnSession = {
      productId: garment.id || handle,
      productHandle: handle,
      productTitle: garment.name,
      productImage: garment.image,
      productCategory: category,
      price: String(garment.price || 0),
      currency: "INR",
      selectedSize: activeSize,
      selectedColor: "",
      measurements: measurements,
      sizeChart: sizeChart,
    };

    const fitResult = calculateFitScore(session);

    return {
      garment,
      category,
      recommendedSize,
      activeSize,
      availableSizeLabels:
        availableSizeLabels.length > 0
          ? availableSizeLabels
          : ["XS", "S", "M", "L", "XL", "XXL"],
      fitScore: fitResult.fitScore,
      comparisonRows: fitResult.comparisonRows,
      variantData: { variants: details.variants, loading: details.loading },
      matchedVariant,
      isAvailable,
      isOffered,
      variantId,
      closestInStockVariant,
      closestSizeLabel,
      sizeChart,
    };
  });

  const [displayUnit, setDisplayUnit] = useState<"cm" | "in">("cm");

  const formatVal = (cmVal: number) => {
    if (displayUnit === "in") {
      const inVal = cmVal / 2.54;
      return `${Math.round(inVal * 10) / 10} in`;
    }
    return `${Math.round(cmVal)} cm`;
  };

  const convertCellText = (cellStr: string) => {
    if (!cellStr) return cellStr;
    const numbers = cellStr.match(/\d+(?:\.\d+)?/g);
    if (!numbers) return cellStr;
    let result = cellStr;
    for (const numStr of numbers) {
      const num = parseFloat(numStr);
      if (isNaN(num)) continue;
      if (displayUnit === "in" && num > 50) {
        const inVal = Math.round((num / 2.54) * 10) / 10;
        result = result.replace(numStr, String(inVal));
      } else if (displayUnit === "cm" && num <= 50 && num > 10) {
        const cmVal = Math.round(num * 2.54);
        result = result.replace(numStr, String(cmVal));
      }
    }
    return result;
  };

  const activeResult = garmentResults[activeGarmentIndex] || garmentResults[0];

  const handleAddSingleToCart = async (
    garment: GarmentItem,
    variantIdToUse: string | null,
    sizeToDisplay: string,
    index: number
  ) => {
    if (!variantIdToUse) return;
    setAddingIndex(index);
    try {
      await addToCart(variantIdToUse, 1);
      setAddedIndices((prev) => [...prev, index]);
      setLastAddedNotice({
        title: garment.name,
        size: sizeToDisplay,
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
      let addedCount = 0;
      for (let i = 0; i < garmentResults.length; i++) {
        const res = garmentResults[i];
        const targetId = res.variantId || res.closestInStockVariant?.id;
        const targetSize = res.variantId ? res.recommendedSize : res.closestSizeLabel || res.recommendedSize;

        if (targetId) {
          await addToCart(targetId, 1);
          addedCount++;
        }
      }
      if (addedCount > 0) {
        setAddedAll(true);
        setLastAddedNotice({
          title: `Outfit (${addedCount} items)`,
          size: garmentResults.map((r) => r.recommendedSize).join(" / "),
          image: garmentResults[0].garment.image,
        });
        openCart();
      }
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
                  {isSizeMatch(activeResult.activeSize, activeResult.recommendedSize)
                    ? `AI Optimal Sizing for ${activeResult.category}`
                    : `Inspecting Size ${activeResult.activeSize} (AI Rec: Size ${activeResult.recommendedSize})`}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Size {activeResult.activeSize}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {activeResult.garment.name}
              </p>

              {/* Add Active Size to Cart Button */}
              <div className="pt-2">
                {activeResult.variantData?.loading ? (
                  <div className="inline-flex items-center gap-2 py-2.5 px-4 text-xs text-muted-foreground bg-muted/40 rounded-xl">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking size availability in Shopify...</span>
                  </div>
                ) : activeResult.isAvailable ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleAddSingleToCart(
                        activeResult.garment,
                        activeResult.variantId,
                        activeResult.activeSize,
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
                        <span>Adding Size {activeResult.activeSize}...</span>
                      </>
                    ) : addedIndices.includes(activeGarmentIndex) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white font-bold" />
                        <span>Size {activeResult.activeSize} Added to Cart ✓</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add Size {activeResult.activeSize} to Cart</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-500/20">
                      <Info className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>
                        {activeResult.isOffered
                          ? `Size ${activeResult.activeSize} is currently out of stock.`
                          : `Size ${activeResult.activeSize} is not offered for this item.`}
                      </span>
                    </div>

                    {activeResult.closestInStockVariant && activeResult.closestSizeLabel && (
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddSingleToCart(
                              activeResult.garment,
                              activeResult.closestInStockVariant.id,
                              activeResult.closestSizeLabel,
                              activeGarmentIndex
                            )
                          }
                          disabled={addingIndex === activeGarmentIndex}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold cursor-pointer transition-all"
                        >
                          {addingIndex === activeGarmentIndex ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Adding Size {activeResult.closestSizeLabel}...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Add Closest Available Size ({activeResult.closestSizeLabel}) to Cart</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
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

          {/* Size Comparison & Selection Tabs Bar */}
          <div className="space-y-2 p-3.5 bg-card rounded-2xl border border-border/70 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Compare Sizes & Fits</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-medium">
                AI Optimal Recommendation: <strong className="text-foreground">Size {activeResult.recommendedSize}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {activeResult.availableSizeLabels.map((sz) => {
                const isRec = isSizeMatch(sz, activeResult.recommendedSize);
                const isSelected = isSizeMatch(sz, activeResult.activeSize);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() =>
                      setSelectedSizeOverrideMap((prev) => ({
                        ...prev,
                        [activeGarmentIndex]: sz,
                      }))
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                      isSelected && isRec
                        ? "bg-accent/20 border-2 border-accent text-accent-foreground shadow-xs scale-102"
                        : isSelected
                        ? "bg-primary/15 border-2 border-primary text-primary font-extrabold shadow-xs scale-102"
                        : isRec
                        ? "bg-amber-500/10 border border-amber-500/40 text-amber-900 dark:text-amber-300 hover:bg-amber-500/20"
                        : "bg-card border-border/80 text-muted-foreground hover:border-foreground/40 hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <span>Size {sz}</span>
                    {isRec && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/25 text-accent font-bold uppercase">
                        AI Rec
                      </span>
                    )}
                    {isSelected && !isRec && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
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
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Fit Analysis Breakdown ({activeResult.category})
                </h4>

                {/* Inches / CM Toggle Tabs */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setDisplayUnit("cm")}
                    className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                      displayUnit === "cm"
                        ? "bg-card text-foreground shadow-2xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayUnit("in")}
                    className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                      displayUnit === "in"
                        ? "bg-card text-foreground shadow-2xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    inches
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {activeResult.comparisonRows.map((row) => (
                  <div
                    key={row.label}
                    className="p-3.5 rounded-2xl border border-border/70 bg-card shadow-2xs space-y-2.5"
                  >
                    {/* Card Header: Measurement Name & Fit Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                        {row.label}
                      </span>
                      <div>
                        {row.fitStatus === "optimal" || (row.withinRange && !row.fitStatus) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            <Check className="w-3 h-3" />
                            Optimal Fit
                          </span>
                        ) : row.fitStatus === "too_tight" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 text-[10px] font-bold">
                            Too Tight
                          </span>
                        ) : row.fitStatus === "too_loose" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 text-[10px] font-bold">
                            Too Loose
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                            <Info className="w-3 h-3" />
                            Acceptable Fit
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-border/40 text-xs">
                      {/* Metric 1: User Body Measurement */}
                      <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Your Body
                        </span>
                        <span className="font-bold text-foreground text-xs mt-0.5 block">
                          {formatVal(row.userValue)}
                        </span>
                      </div>

                      {/* Metric 2: Ideal Body Range */}
                      <div className="bg-muted/30 p-2.5 rounded-xl border border-border/50">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                          Ideal Body Range
                        </span>
                        <span className="font-bold text-foreground text-xs mt-0.5 block">
                          {formatVal(row.sizeRange.min)} – {formatVal(row.sizeRange.max)}
                        </span>
                      </div>

                      {/* Metric 3: Garment Spec */}
                      {row.garmentValue ? (
                        <div className="bg-accent/10 p-2.5 rounded-xl border border-accent/25 col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-accent uppercase font-bold block">
                            Garment Spec ({activeResult.activeSize})
                          </span>
                          <span className="font-bold text-foreground text-xs mt-0.5 block">
                            {formatVal(row.garmentValue)}
                          </span>
                        </div>
                      ) : null}
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
              <strong>Stylist Advice:</strong> {activeResult.fitScore.description} For <strong>{activeResult.garment.name}</strong>, Size <strong>{activeResult.recommendedSize}</strong> delivers an optimal luxury fit.
            </p>
          </div>

          {/* Product Size Chart Table */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-accent" />
                <span>Product Size Chart ({activeResult.category})</span>
              </h4>

              {/* Inches / CM Toggle Tabs */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setDisplayUnit("cm")}
                  className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                    displayUnit === "cm"
                      ? "bg-card text-foreground shadow-2xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayUnit("in")}
                  className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                    displayUnit === "in"
                      ? "bg-card text-foreground shadow-2xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  inches
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-2xs">
              {activeResult.sizeChart?.chartData?.headers && activeResult.sizeChart.chartData.sizes ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {activeResult.sizeChart.chartData.headers.map((h, i) => (
                        <th key={i} className="px-3.5 py-2.5">
                          {h} ({displayUnit})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {activeResult.sizeChart.chartData.sizes.map((row, rIdx) => {
                      const rowLabel = row[0] || "";
                      const isRecommended = isSizeMatch(rowLabel, activeResult.recommendedSize);
                      const isSelected = isSizeMatch(rowLabel, activeResult.activeSize);
                      return (
                        <tr
                          key={rIdx}
                          className={`transition-colors ${
                            isRecommended && isSelected
                              ? "bg-accent/20 font-semibold text-foreground border-l-2 border-accent"
                              : isRecommended
                              ? "bg-accent/15 font-semibold text-foreground"
                              : isSelected
                              ? "bg-primary/10 font-semibold text-foreground border-l-2 border-primary"
                              : "hover:bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3.5 py-2.5 whitespace-nowrap">
                              {cIdx === 0 ? (
                                <span className="inline-flex items-center gap-1 flex-wrap">
                                  {(isRecommended || isSelected) && (
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isRecommended ? "bg-accent" : "bg-primary"
                                      }`}
                                    />
                                  )}
                                  <strong className="text-foreground">{cell}</strong>
                                  {isRecommended && (
                                    <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold uppercase">
                                      AI Rec
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase">
                                      Selected
                                    </span>
                                  )}
                                </span>
                              ) : (
                                convertCellText(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* Fallback Standard Size Chart Table */
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="px-3.5 py-2.5">Size</th>
                      <th className="px-3.5 py-2.5">Chest ({displayUnit})</th>
                      <th className="px-3.5 py-2.5">Waist ({displayUnit})</th>
                      <th className="px-3.5 py-2.5">Hips ({displayUnit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {Object.entries(
                      activeResult.category.toLowerCase().includes("pant") ||
                      activeResult.category.toLowerCase().includes("jean") ||
                      activeResult.category.toLowerCase().includes("trouser") ||
                      activeResult.category.toLowerCase().includes("short") ||
                      activeResult.category.toLowerCase().includes("skirt") ||
                      activeResult.category.toLowerCase().includes("bottom")
                        ? {
                            "28": { chest: [84, 89], waist: [66, 71], hips: [89, 94] },
                            "30": { chest: [89, 94], waist: [71, 76], hips: [94, 99] },
                            "32": { chest: [94, 99], waist: [76, 81], hips: [99, 104] },
                            "34": { chest: [99, 104], waist: [81, 86], hips: [104, 109] },
                            "36": { chest: [104, 109], waist: [86, 91], hips: [109, 114] },
                            "38": { chest: [109, 114], waist: [91, 96], hips: [114, 119] },
                            "40": { chest: [114, 119], waist: [96, 101], hips: [119, 124] },
                          }
                        : {
                            XS: { chest: [81, 86], waist: [61, 66], hips: [86, 91] },
                            S: { chest: [86, 91], waist: [66, 71], hips: [91, 96] },
                            M: { chest: [91, 96], waist: [71, 76], hips: [96, 101] },
                            L: { chest: [96, 101], waist: [76, 81], hips: [101, 106] },
                            XL: { chest: [101, 106], waist: [81, 86], hips: [106, 111] },
                            XXL: { chest: [106, 111], waist: [86, 91], hips: [111, 116] },
                          }
                    ).map(([szLabel, range]) => {
                      const isRecommended = isSizeMatch(szLabel, activeResult.recommendedSize);
                      const isSelected = isSizeMatch(szLabel, activeResult.activeSize);
                      return (
                        <tr
                          key={szLabel}
                          className={`transition-colors ${
                            isRecommended && isSelected
                              ? "bg-accent/20 font-semibold text-foreground border-l-2 border-accent"
                              : isRecommended
                              ? "bg-accent/15 font-semibold text-foreground"
                              : isSelected
                              ? "bg-primary/10 font-semibold text-foreground border-l-2 border-primary"
                              : "hover:bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 flex-wrap">
                              {(isRecommended || isSelected) && (
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isRecommended ? "bg-accent" : "bg-primary"
                                  }`}
                                />
                              )}
                              <strong className="text-foreground">{szLabel}</strong>
                              {isRecommended && (
                                <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold uppercase">
                                  AI Rec
                                </span>
                              )}
                              {isSelected && (
                                <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase">
                                  Selected
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">{formatVal(range.chest[0])}–{formatVal(range.chest[1])}</td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">{formatVal(range.waist[0])}–{formatVal(range.waist[1])}</td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">{formatVal(range.hips[0])}–{formatVal(range.hips[1])}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
