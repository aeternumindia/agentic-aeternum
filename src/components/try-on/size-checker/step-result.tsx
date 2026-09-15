"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Check, Info, RotateCcw, Shirt, ShoppingBag, Loader2, ExternalLink, Ruler, Sparkles, Bell, AlertTriangle } from "lucide-react";
import { GarmentItem } from "../garment-selector/garment-selector";
import { normalizeCategory } from "@/services/outfit-api";
import {
  findRecommendedSize,
  genericFitScore,
  calculateFitScore,
  isSizeMatch,
  detectUnit,
} from "@/services/virtual-try-on";
import { useShopifyCart } from "@/contexts/shopify-cart";
import apiClient, { getSizeChart } from "@/services/api";
import { BodyMeasurements } from "./types";
import { ProductSizeChart, TryOnSession } from "@/types/virtual-try-on";
import { cn } from "@/lib/utils";

interface StepResultProps {
  selectedGarments: GarmentItem[];
  measurements: BodyMeasurements;
  fitPreference?: string;
  onRecalculate: () => void;
  onClose: () => void;
}

export function StepResult({
  selectedGarments,
  measurements,
  onRecalculate,
  onClose,
}: StepResultProps) {
  const { addToCart, openCart } = useShopifyCart();
  const [activeGarmentIndex, setActiveGarmentIndex] = useState(0);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIndices, setAddedIndices] = useState<number[]>([]);
  const [addingAll, setAddingAll] = useState(false);
  const [addedAll, setAddedAll] = useState(false);
  const [notifiedMap, setNotifiedMap] = useState<Record<number, boolean>>({});
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

      await Promise.all(
        selectedGarments.map(async (g) => {
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
        })
      );
    }

    if (selectedGarments.length > 0) {
      fetchAllGarmentDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [selectedGarments]);

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
      measurements,
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

    const effectiveAvailableSizes =
      availableSizeLabels.length > 0
        ? availableSizeLabels
        : ["XS", "S", "M", "L", "XL", "XXL"];

    const fitResult = calculateFitScore(session, effectiveAvailableSizes);

    return {
      garment,
      category,
      recommendedSize,
      activeSize,
      availableSizeLabels: effectiveAvailableSizes,
      fitScore: fitResult.fitScore,
      comparisonRows: fitResult.comparisonRows,
      variantData: { variants: details.variants, loading: details.loading },
      matchedVariant,
      isAvailable,
      isOffered,
      variantId,
      closestInStockVariant,
      closestSizeLabel,
      sizeChart: fitResult.sizeChart || sizeChart,
      isOverExtremeSize: fitResult.isOverExtremeSize || recommendedSize === null,
    };
  });

  const handleNotifyAvailable = (gIdx: number, garmentName: string) => {
    setNotifiedMap((prev) => ({ ...prev, [gIdx]: true }));
    setLastAddedNotice({
      title: garmentName,
      size: "Notify Request Registered",
      image: "",
    });
  };

  const [displayUnit, setDisplayUnit] = useState<"cm" | "in">("cm");

  const formatVal = (cmVal: number) => {
    if (displayUnit === "in") {
      const inVal = cmVal / 2.54;
      return `${Math.round(inVal * 10) / 10} in`;
    }
    return `${Math.round(cmVal)} cm`;
  };

  const convertCellText = (
    cellStr: string,
    chartNativeUnit: "in" | "cm" = "cm"
  ) => {
    if (!cellStr) return cellStr;
    if (chartNativeUnit === displayUnit) return cellStr;

    const numbers = cellStr.match(/\d+(?:\.\d+)?/g);
    if (!numbers) return cellStr;
    let result = cellStr;
    for (const numStr of numbers) {
      const num = parseFloat(numStr);
      if (isNaN(num)) continue;
      if (chartNativeUnit === "in" && displayUnit === "cm") {
        const cmVal = Math.round(num * 2.54);
        result = result.replace(numStr, String(cmVal));
      } else if (chartNativeUnit === "cm" && displayUnit === "in") {
        const inVal = Math.round((num / 2.54) * 10) / 10;
        result = result.replace(numStr, String(inVal));
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
        if (res.isOverExtremeSize || !res.recommendedSize) {
          continue;
        }
        const targetId = res.variantId || res.closestInStockVariant?.id;

        if (targetId) {
          await addToCart(targetId, 1);
          addedCount++;
        }
      }
      if (addedCount > 0) {
        setAddedAll(true);
        const validList = garmentResults.filter((r) => !r.isOverExtremeSize && r.recommendedSize);
        setLastAddedNotice({
          title: `Outfit (${addedCount} item${addedCount > 1 ? "s" : ""})`,
          size: validList.map((r) => r.recommendedSize).join(" / "),
          image: validList[0]?.garment.image || garmentResults[0].garment.image,
        });
        openCart();
      }
    } catch (err) {
      console.error("Add all to cart error:", err);
    } finally {
      setAddingAll(false);
    }
  };

  const isDetailsLoading =
    selectedGarments.length > 0 &&
    (Object.keys(productDetailsMap).length < selectedGarments.length ||
      Object.values(productDetailsMap).some((d) => d.loading));

  if (isDetailsLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3.5 text-center animate-in fade-in duration-200">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">Calculating Sizing & Availability...</h4>
          <p className="text-xs text-muted-foreground">Checking live Shopify size charts for selected items</p>
        </div>
      </div>
    );
  }

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
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F4EFEA] dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#8C3A3F]/10 border border-[#8C3A3F]/20 flex items-center justify-center text-[#8C3A3F] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8C3A3F]">
                  Outfit Recommended Sizing
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold mt-1 text-stone-900 dark:text-stone-100 flex-wrap">
                  {garmentResults.map((res, i) => {
                    const isExceeded = res.isOverExtremeSize || !res.recommendedSize;
                    return (
                      <span key={i} className="inline-flex items-center gap-1.5 bg-white/90 dark:bg-stone-800/90 px-2.5 py-0.5 rounded-md border border-stone-200/80 dark:border-stone-700/60 font-mono text-xs">
                        <span className="text-stone-500 font-normal">
                          {i === 0 ? "Top:" : "Bottom:"}
                        </span>
                        {isExceeded ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">Unavailable</span>
                        ) : (
                          <span className="font-bold text-stone-900 dark:text-stone-100">Size {res.recommendedSize}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Add Entire Outfit Button */}
            {(() => {
              const validGarments = garmentResults.filter((r) => !r.isOverExtremeSize && r.recommendedSize);
              const allValid = validGarments.length === garmentResults.length;

              if (validGarments.length === 0) {
                return (
                  <button
                    type="button"
                    disabled
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-400 text-xs font-semibold flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed shrink-0 border border-stone-300 dark:border-stone-700"
                  >
                    <span>Sizes Unavailable</span>
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  disabled={addingAll}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#8C3A3F] hover:bg-[#772F34] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] transition-all shrink-0"
                >
                  {addingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding Items...</span>
                    </>
                  ) : addedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white font-bold" />
                      <span>Added to Cart ✓</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{allValid ? "Add Entire Outfit to Cart" : `Add Available Item (${validGarments.map(r => `Size ${r.recommendedSize}`).join(", ")})`}</span>
                    </>
                  )}
                </button>
              );
            })()}
          </div>

          {/* Garment Switcher Tabs */}
          <div className="flex items-center gap-2 sm:gap-2.5 pb-1">
            {garmentResults.map((res, idx) => {
              const isActive = activeGarmentIndex === idx;
              const isExceeded = res.isOverExtremeSize || !res.recommendedSize;
              return (
                <button
                  key={res.garment.id || idx}
                  type="button"
                  onClick={() => setActiveGarmentIndex(idx)}
                  className={`flex-1 p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 sm:gap-3 ${
                    isActive
                      ? "bg-[#1C1917] text-white border-[#1C1917] shadow-sm ring-1 ring-black/10"
                      : "bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 border-stone-200/90 dark:border-stone-800 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  <div className="w-8 h-10 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-black/10">
                    <img
                      src={res.garment.image}
                      alt={res.garment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[9px] sm:text-[10px] uppercase font-mono tracking-widest font-semibold truncate ${
                      isActive ? "text-[#EAE3D6]" : "text-stone-500"
                    }`}>
                      {idx === 0 ? "Top Garment" : "Bottom Garment"}
                    </p>
                    <p className="text-xs sm:text-[13px] font-bold truncate mt-0.5">
                      {isExceeded ? (
                        <span className="text-amber-400 font-bold">Unavailable</span>
                      ) : (
                        `Size ${res.recommendedSize}`
                      )}{" "}
                      <span className={`font-normal text-[11px] ${isActive ? "text-stone-300" : "text-stone-500"}`}>
                        · {isExceeded ? "Exceeds Range" : res.fitScore.label}
                      </span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Recommended Size Hero Banner for Active Garment */}
      {activeResult && (activeResult.isOverExtremeSize || !activeResult.recommendedSize) ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/20 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                <span>Size Unavailable</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                We don't have a size that fits your measurements
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your body measurements exceed the largest available size for <strong>{activeResult.garment.name}</strong>.
              </p>
            </div>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleNotifyAvailable(activeGarmentIndex, activeResult.garment.name)}
              disabled={notifiedMap[activeGarmentIndex]}
              className={`inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-all ${
                notifiedMap[activeGarmentIndex]
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-amber-600 text-white hover:bg-amber-700 active:scale-95"
              }`}
            >
              {notifiedMap[activeGarmentIndex] ? (
                <>
                  <Check className="w-4 h-4 text-white font-bold" />
                  <span>✓ Notification Requested</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Notify Us When Available</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : activeResult && (
        <>
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-3.5">
            {/* Top Bar: Category Pill on Left, Refined Fit Status Badge on Right */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-mono uppercase tracking-wider font-semibold">
                <ShieldCheck className="w-3 h-3 text-[#8C3A3F]" />
                <span>
                  {isSizeMatch(activeResult.activeSize, activeResult.recommendedSize)
                    ? `AI Optimal Sizing · ${activeResult.category}`
                    : `Inspecting Size ${activeResult.activeSize} · AI Rec: Size ${activeResult.recommendedSize}`}
                </span>
              </div>

              {/* Editorial Luxury Fit Status Pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 text-[10px] sm:text-[11px] font-mono shadow-2xs">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    !activeResult.isAvailable
                      ? "bg-stone-400"
                      : activeResult.fitScore.quality === "perfect" ||
                        activeResult.fitScore.quality === "great" ||
                        activeResult.fitScore.quality === "good"
                      ? "bg-emerald-600"
                      : activeResult.fitScore.quality === "acceptable"
                      ? "bg-[#8C3A3F]"
                      : "bg-amber-500"
                  )}
                />
                <span className="font-sans font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                  {!activeResult.isAvailable
                    ? activeResult.isOffered
                      ? "Out of Stock"
                      : "Not Offered"
                    : activeResult.fitScore.label}
                </span>
              </div>
            </div>

            {/* Main Row: Size, Title, Cart Action (left) & Garment Image Thumbnail (right) */}
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-1.5 text-left flex-1 min-w-0">
                <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  Size {activeResult.activeSize}
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 truncate">
                  {activeResult.garment.name}
                </p>

                <div className="pt-1 sm:pt-1.5">
                  {activeResult.isAvailable ? (
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
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl text-[11px] sm:text-xs font-semibold cursor-pointer shadow-xs transition-all disabled:opacity-50 ${
                        addedIndices.includes(activeGarmentIndex)
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-[#8C3A3F] hover:bg-[#772F34] text-white active:scale-[0.99]"
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
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#8C3A3F] hover:bg-[#772F34] text-white text-xs font-semibold cursor-pointer transition-all"
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

              {/* Garment Image Thumbnail */}
              {activeResult.garment.image ? (
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 shrink-0 shadow-2xs">
                  <img
                    src={activeResult.garment.image}
                    alt={activeResult.garment.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-[#FAF8F5] dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 shrink-0 flex items-center justify-center shadow-2xs">
                  <Shirt className="w-7 h-7 text-stone-400" />
                </div>
              )}
            </div>
          </div>

          {/* Size Comparison & Selection Tabs Bar */}
          <div className="space-y-2 p-3.5 bg-[#FAF8F5] dark:bg-stone-900/60 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono font-bold uppercase tracking-widest text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8C3A3F]" />
                <span>Compare Sizes & Fits</span>
              </label>
              <span className="text-[10px] text-stone-500 font-mono">
                AI Optimal:{" "}
                {activeResult.isOverExtremeSize || !activeResult.recommendedSize ? (
                  <strong className="text-amber-600 dark:text-amber-400">Unavailable</strong>
                ) : (
                  <strong className="text-stone-900 dark:text-stone-100">Size {activeResult.recommendedSize}</strong>
                )}
              </span>
            </div>

            <div
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden"
            >
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
                    className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                      isSelected
                        ? "bg-[#1C1917] text-white border-[#1C1917] shadow-xs"
                        : isRec
                        ? "bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 hover:border-stone-400"
                        : "bg-white dark:bg-stone-800 border-stone-200/80 dark:border-stone-700/60 text-stone-600 dark:text-stone-400 hover:border-stone-300 hover:text-stone-900"
                    }`}
                  >
                    <span>Size {sz}</span>
                    {isRec && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                          isSelected
                            ? "bg-[#8C3A3F] text-white"
                            : "bg-[#8C3A3F]/15 text-[#8C3A3F]"
                        }`}
                      >
                        AI Rec
                      </span>
                    )}
                    {isSelected && !isRec && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-white font-bold uppercase">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>



          {/* Measurement Comparison Breakdown */}
          {activeResult.comparisonRows.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100 uppercase tracking-widest">
                  Fit Analysis Breakdown ({activeResult.category})
                </h4>

                {/* Inches / CM Toggle Tabs */}
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200/80 dark:border-stone-700 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setDisplayUnit("cm")}
                    className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                      displayUnit === "cm"
                        ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayUnit("in")}
                    className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] transition-all cursor-pointer ${
                      displayUnit === "in"
                        ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs"
                        : "text-stone-500 hover:text-stone-900"
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
                    className="p-3.5 rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-2"
                  >
                    {/* Card Header: Measurement Name & Fit Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                        {row.label}
                      </span>
                      <div>
                        {!activeResult.isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[10px] font-semibold">
                            <Info className="w-3 h-3" />
                            {activeResult.isOffered ? "Out of Stock" : "Not Offered"}
                          </span>
                        ) : row.fitStatus === "optimal" || (row.withinRange && !row.fitStatus) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 text-[10px] font-semibold">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Optimal Fit
                          </span>
                        ) : row.fitStatus === "too_tight" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/80 text-[10px] font-semibold">
                            Too Tight
                          </span>
                        ) : row.fitStatus === "too_loose" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 text-[10px] font-semibold">
                            Too Loose
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200/80 text-[10px] font-semibold">
                            <Info className="w-3 h-3 text-stone-500" />
                            Acceptable Fit
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 dark:border-stone-800 text-xs">
                      {/* Metric 1: User Body Measurement */}
                      <div className="bg-[#FAF8F5] dark:bg-stone-800/60 p-2.5 rounded-lg border border-stone-200/70 dark:border-stone-700/60">
                        <span className="text-[10px] text-stone-500 font-mono uppercase font-semibold block">
                          Your Body
                        </span>
                        <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-xs mt-0.5 block">
                          {formatVal(row.userValue)}
                        </span>
                      </div>

                      {/* Metric 2: Garment Spec */}
                      {row.garmentValue ? (
                        <div className="bg-[#FAF8F5] dark:bg-stone-800/60 p-2.5 rounded-lg border border-stone-200/70 dark:border-stone-700/60">
                          <span className="text-[10px] text-[#8C3A3F] font-mono uppercase font-semibold block">
                            Garment Spec ({activeResult.activeSize})
                          </span>
                          <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-xs mt-0.5 block">
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
              {activeResult.sizeChart?.chartData?.headers && activeResult.sizeChart.chartData.sizes ? (() => {
                const chartNativeUnit = detectUnit(
                  activeResult.sizeChart.chartData.sizes,
                  activeResult.sizeChart.chartData.headers
                );
                return (
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
                                  convertCellText(cell, chartNativeUnit)
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })() : (
                /* Fallback Standard Size Chart Table */
                (() => {
                  const isBottomCat =
                    activeResult.category.toLowerCase().includes("pant") ||
                    activeResult.category.toLowerCase().includes("jean") ||
                    activeResult.category.toLowerCase().includes("trouser") ||
                    activeResult.category.toLowerCase().includes("short") ||
                    activeResult.category.toLowerCase().includes("skirt") ||
                    activeResult.category.toLowerCase().includes("bottom");
                  return (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="px-3.5 py-2.5">Size</th>
                          {isBottomCat ? (
                            <>
                              <th className="px-3.5 py-2.5">Waist ({displayUnit})</th>
                              <th className="px-3.5 py-2.5">Hips ({displayUnit})</th>
                            </>
                          ) : (
                            <th className="px-3.5 py-2.5">Chest ({displayUnit})</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {(() => {
                          const fallbackEntries = Object.entries(
                            isBottomCat
                              ? {
                                  "28": { waist: [66, 71], hips: [89, 94] },
                                  "30": { waist: [71, 76], hips: [94, 99] },
                                  "32": { waist: [76, 81], hips: [99, 104] },
                                  "34": { waist: [81, 86], hips: [104, 109] },
                                  "36": { waist: [86, 91], hips: [109, 114] },
                                  "38": { waist: [91, 96], hips: [114, 119] },
                                  "40": { waist: [96, 101], hips: [119, 124] },
                                }
                              : {
                                  XS: { chest: [81, 86] },
                                  S: { chest: [86, 91] },
                                  M: { chest: [91, 96] },
                                  L: { chest: [96, 101] },
                                  XL: { chest: [101, 106] },
                                  XXL: { chest: [106, 111] },
                                }
                          );
                          const filteredFallback = (activeResult.availableSizeLabels && activeResult.availableSizeLabels.length > 0)
                            ? fallbackEntries.filter(([szLabel]) =>
                                activeResult.availableSizeLabels.some((s) => isSizeMatch(szLabel, s))
                              )
                            : fallbackEntries;
                          const entriesToUse = filteredFallback.length > 0 ? filteredFallback : fallbackEntries;
                          return entriesToUse.map(([szLabel, range]: [string, any]) => {
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
                              {isBottomCat ? (
                                <>
                                  <td className="px-3.5 py-2.5 whitespace-nowrap">{formatVal(range.waist[0])}–{formatVal(range.waist[1])}</td>
                                  <td className="px-3.5 py-2.5 whitespace-nowrap">{formatVal(range.hips[0])}–{formatVal(range.hips[1])}</td>
                                </>
                              ) : (
                                <td className="px-3.5 py-2.5 whitespace-nowrap">{formatVal(range.chest[0])}–{formatVal(range.chest[1])}</td>
                              )}
                            </tr>
                          );
                        });
                      })()}
                      </tbody>
                    </table>
                  );
                })()
              )}
            </div>
          </div>
        </>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 p-3 sm:p-4 border-t border-stone-200/90 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-md flex items-center justify-between gap-2.5 sm:gap-3 shrink-0 z-20">
        <button
          type="button"
          onClick={onRecalculate}
          className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-[11px] sm:text-xs font-semibold transition-all cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
          <span>Recalculate</span>
        </button>

        {selectedGarments.length > 1 ? (
          /* Multi-garment / Outfit Add to Cart */
          (() => {
            const validGarments = garmentResults.filter((r) => !r.isOverExtremeSize && r.recommendedSize);
            const allValid = validGarments.length === garmentResults.length;

            if (validGarments.length === 0) {
              return (
                <button
                  type="button"
                  disabled
                  className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 opacity-60 cursor-not-allowed border border-stone-200 dark:border-stone-700"
                >
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  <span>Outfit Sizes Unavailable (Exceeds Range)</span>
                </button>
              );
            }

            return (
              <button
                type="button"
                onClick={handleAddAllToCart}
                disabled={addingAll}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs transition-all ${
                  addedAll
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-[#8C3A3F] hover:bg-[#772F34] text-white active:scale-[0.99]"
                }`}
              >
                {addingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding to Cart...</span>
                  </>
                ) : addedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white font-bold" />
                    <span>Added to Cart ✓</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      {allValid
                        ? `Add Recommended Sizes (${garmentResults
                            .map((r) => r.activeSize)
                            .join(", ")}) to Cart`
                        : `Add Available Recommended Size (${validGarments
                            .map((r) => `Size ${r.recommendedSize}`)
                            .join(", ")}) to Cart`}
                    </span>
                  </>
                )}
              </button>
            );
          })()
        ) : (
          /* Single garment Add to Cart (Recommended or Closest In-Stock) */
          (() => {
            const activeResult = garmentResults[activeGarmentIndex] || garmentResults[0];
            if (!activeResult) return null;

            if (activeResult.variantData?.loading) {
              return (
                <button
                  type="button"
                  disabled
                  className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2 opacity-70 cursor-not-allowed"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking Availability...</span>
                </button>
              );
            }

            // Recommended / Active size is in stock
            if (activeResult.isAvailable && activeResult.variantId) {
              const isAdding = addingIndex === activeGarmentIndex;
              const isAdded = addedIndices.includes(activeGarmentIndex);

              return (
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
                  disabled={isAdding}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs transition-all ${
                    isAdded
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-[#8C3A3F] hover:bg-[#772F34] text-white active:scale-[0.99]"
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding Size {activeResult.activeSize}...</span>
                    </>
                  ) : isAdded ? (
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
              );
            }

            // Recommended size is out of stock, but closest size is available
            if (activeResult.closestInStockVariant && activeResult.closestSizeLabel) {
              const isAdding = addingIndex === activeGarmentIndex;
              const isAdded = addedIndices.includes(activeGarmentIndex);

              return (
                <button
                  type="button"
                  onClick={() =>
                    handleAddSingleToCart(
                      activeResult.garment,
                      activeResult.closestInStockVariant.id,
                      activeResult.closestSizeLabel!,
                      activeGarmentIndex
                    )
                  }
                  disabled={isAdding}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-xs transition-all ${
                    isAdded
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-[#8C3A3F] hover:bg-[#772F34] text-white active:scale-[0.99]"
                  }`}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding Closest Size {activeResult.closestSizeLabel}...</span>
                    </>
                  ) : isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white font-bold" />
                      <span>Closest Size {activeResult.closestSizeLabel} Added ✓</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add Closest Size {activeResult.closestSizeLabel} to Cart</span>
                    </>
                  )}
                </button>
              );
            }

            // Completely out of stock
            return (
              <button
                type="button"
                disabled
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2 opacity-60 cursor-not-allowed border border-stone-200 dark:border-stone-700"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Size {activeResult.activeSize} Out of Stock</span>
              </button>
            );
          })()
        )}
      </div>
    </div>
  );
}
