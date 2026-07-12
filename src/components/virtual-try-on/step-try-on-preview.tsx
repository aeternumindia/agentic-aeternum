"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ShoppingBag,
  RotateCcw,
  Loader2,
  Check,
  Sparkles,
  Eye,
  Ruler,
  X,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOutfitBuilder } from "@/contexts/outfit-builder";
import { useShopifyCart } from "@/contexts/shopify-cart";
import { calculateFitScore } from "@/services/virtual-try-on";
import { getSizeChart } from "@/services/api";
import { FitScoreGauge } from "./fit-score-gauge";
import { SizeChartModal } from "./size-chart-modal";
import { AiPreviewPanel } from "./ai-preview-panel";
import apiClient, { getTryOnStatus, type TryOnStatus } from "@/services/api";
import type { TryOnSession, TryOnResult, ProductSizeChart, SizeChartData } from "@/types/virtual-try-on";

type Variant = {
  id: string;
  available: boolean;
  options: { name: string; value: string }[];
};

type StepTryOnPreviewProps = {
  fullBodyFile: File;
  selfieFile: File;
  measurements?: Record<string, number>;
  onStartOver: () => void;
  onBack: () => void;
};

export function StepTryOnPreview({
  fullBodyFile,
  selfieFile,
  measurements = {},
  onStartOver,
  onBack,
}: StepTryOnPreviewProps) {
  const { pair, setTopSize, setBottomSize } = useOutfitBuilder();
  const { addToCart } = useShopifyCart();
  const [tab, setTab] = useState<"ai" | "fit">("ai");
  const [topOpen, setTopOpen] = useState(false);
  const [bottomOpen, setBottomOpen] = useState(false);
  const [topImageIdx, setTopImageIdx] = useState(0);
  const [bottomImageIdx, setBottomImageIdx] = useState(0);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  function scrollSlider(ref: React.RefObject<HTMLDivElement | null>, dir: "prev" | "next") {
    if (!ref.current) return;
    const w = ref.current.clientWidth;
    ref.current.scrollBy({ left: dir === "next" ? w : -w, behavior: "smooth" });
  }

  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [localMeasurements, setLocalMeasurements] = useState<Record<string, string>>({});
  const [computedMeasurements, setComputedMeasurements] = useState<Record<string, number> | null>(null);
  const [fitResults, setFitResults] = useState<{
    top: TryOnResult | null;
    bottom: TryOnResult | null;
  }>({ top: null, bottom: null });
  const [calculating, setCalculating] = useState(false);
  const [expandedChart, setExpandedChart] = useState<"top" | "bottom" | null>(null);
  const [tryOnStatus, setTryOnStatus] = useState<TryOnStatus | null>(null);
  const lastCalcStringRef = useRef<string>(JSON.stringify({}));
  const hasCalculatedRef = useRef(false);
  const measurementsString = JSON.stringify(localMeasurements);
  const isStale = fitResults.top !== null && measurementsString !== lastCalcStringRef.current;
  const allFieldsFilled = ["height", "chest", "waist", "hips"].every(
    (k) => localMeasurements[k]?.trim() !== ""
  );

  // ── Sticky bar helpers ──
  const colorToHex = (name: string): string => {
    const map: Record<string, string> = {
      white: "#ffffff", black: "#000000", navy: "#1e3a5f", grey: "#6b7280",
      gray: "#6b7280", khaki: "#c3b091", olive: "#556b2f", burgundy: "#800020",
      charcoal: "#36454f", beige: "#f5f5dc", cream: "#fffdd0", forest: "#228b22",
      cobalt: "#0047ab", red: "#dc2626", blue: "#2563eb", green: "#16a34a",
      brown: "#8b4513", tan: "#d2b48c", pink: "#ec4899", purple: "#7c3aed",
      orange: "#ea580c", yellow: "#eab308", maroon: "#800000", teal: "#0d9488",
    };
    return map[name.toLowerCase().trim()] ?? "#cbd5e1";
  };

  const topVariants = pair.top?.variants ?? [];
  const bottomVariants = pair.bottom?.variants ?? [];
  const topAvailableVariants = topVariants.filter((v) => v.available);
  const bottomAvailableVariants = bottomVariants.filter((v) => v.available);
  const topUniqueColors = [...new Set(topVariants.map((v) => v.color))];
  const bottomUniqueColors = [...new Set(bottomVariants.map((v) => v.color))];
  const topCurrentColor = topVariants.find((v) => v.size === pair.topSize)?.color;
  const bottomCurrentColor = bottomVariants.find((v) => v.size === pair.bottomSize)?.color;
  const topCurrentVariant = topVariants.find((v) => v.size === pair.topSize);
  const bottomCurrentVariant = bottomVariants.find((v) => v.size === pair.bottomSize);
  const topCurrentPrice = topCurrentVariant?.price ?? pair.top?.price ?? "0";
  const bottomCurrentPrice = bottomCurrentVariant?.price ?? pair.bottom?.price ?? "0";
  const topCompareAtPrice = topCurrentVariant?.compareAtPrice;
  const bottomCompareAtPrice = bottomCurrentVariant?.compareAtPrice;

  // Auto-correct size if current selection is no longer available
  useEffect(() => {
    if (topAvailableVariants.length > 0 && !topAvailableVariants.some((v) => v.size === pair.topSize)) {
      setTopSize(topAvailableVariants[0].size);
    }
  }, [topAvailableVariants, pair.topSize, setTopSize]);

  useEffect(() => {
    if (bottomAvailableVariants.length > 0 && !bottomAvailableVariants.some((v) => v.size === pair.bottomSize)) {
      setBottomSize(bottomAvailableVariants[0].size);
    }
  }, [bottomAvailableVariants, pair.bottomSize, setBottomSize]);

  // Reset image index when product or panel changes
  useEffect(() => { setTopImageIdx(0); }, [pair.top]);
  useEffect(() => { setBottomImageIdx(0); }, [pair.bottom]);
  useEffect(() => {
    getTryOnStatus().then(setTryOnStatus).catch(() => {});
  }, []);

  const toCm = (v: number, u: "cm" | "in") => (u === "in" ? Math.round(v * 2.54) : v);

  const handleCalculate = useCallback(async () => {
    const parsed: Record<string, number> = {};
    for (const [k, v] of Object.entries(localMeasurements)) {
      const n = parseFloat(v);
      if (!isNaN(n)) parsed[k] = toCm(n, unit);
    }
    if (Object.keys(parsed).length === 0) return;

    setComputedMeasurements(parsed);
    setCalculating(true);
    setFitResults({ top: null, bottom: null });

    try {
      const [topChartRes, bottomChartRes] = await Promise.all([
        pair.top?.handle ? getSizeChart(pair.top.handle) : Promise.resolve(null),
        pair.bottom?.handle ? getSizeChart(pair.bottom.handle) : Promise.resolve(null),
      ]);

      function parseChart(raw: typeof topChartRes): ProductSizeChart | null {
        if (!raw?.success || !raw.data) return null;
        const d = raw.data;
        let chartData = null;
        if (d.chart_data) {
          try {
            chartData = JSON.parse(
              typeof d.chart_data === "string" ? d.chart_data : d.chart_data
            );
          } catch {}
        }
        return {
          chartData,
          image: d.image || null,
          fitNotes: d.fit_notes || null,
        };
      }

      const topChart = parseChart(topChartRes);
      const bottomChart = parseChart(bottomChartRes);

      const topSess: TryOnSession | null = pair.top
        ? {
            productId: pair.top.id,
            productHandle: pair.top.handle,
            productTitle: pair.top.title,
            productImage: pair.top.image,
            productCategory: pair.top.productType,
            price: pair.top.price ?? "0",
            currency: pair.top.currency ?? "INR",
            selectedSize: pair.topSize,
            selectedColor: pair.topColor,
            measurements: parsed,
            sizeChart: topChart,
          }
        : null;

      const bottomSess: TryOnSession | null = pair.bottom
        ? {
            productId: pair.bottom.id,
            productHandle: pair.bottom.handle,
            productTitle: pair.bottom.title,
            productImage: pair.bottom.image,
            productCategory: pair.bottom.productType,
            price: pair.bottom.price ?? "0",
            currency: pair.bottom.currency ?? "INR",
            selectedSize: pair.bottomSize,
            selectedColor: pair.bottomColor,
            measurements: parsed,
            sizeChart: bottomChart,
          }
        : null;

      setFitResults({
        top: topSess ? calculateFitScore(topSess) : null,
        bottom: bottomSess ? calculateFitScore(bottomSess) : null,
      });
      hasCalculatedRef.current = true;
      lastCalcStringRef.current = JSON.stringify(localMeasurements);
    } catch {
      // Fallback: compute without size charts
      const topSess: TryOnSession | null = pair.top
        ? {
            productId: pair.top.id,
            productHandle: pair.top.handle,
            productTitle: pair.top.title,
            productImage: pair.top.image,
            productCategory: pair.top.productType,
            price: pair.top.price ?? "0",
            currency: pair.top.currency ?? "INR",
            selectedSize: pair.topSize,
            selectedColor: pair.topColor,
            measurements: parsed,
          }
        : null;
      const bottomSess: TryOnSession | null = pair.bottom
        ? {
            productId: pair.bottom.id,
            productHandle: pair.bottom.handle,
            productTitle: pair.bottom.title,
            productImage: pair.bottom.image,
            productCategory: pair.bottom.productType,
            price: pair.bottom.price ?? "0",
            currency: pair.bottom.currency ?? "INR",
            selectedSize: pair.bottomSize,
            selectedColor: pair.bottomColor,
            measurements: parsed,
          }
        : null;
      setFitResults({
        top: topSess ? calculateFitScore(topSess) : null,
        bottom: bottomSess ? calculateFitScore(bottomSess) : null,
      });
      hasCalculatedRef.current = true;
      lastCalcStringRef.current = JSON.stringify(localMeasurements);
    } finally {
      setCalculating(false);
    }
  }, [localMeasurements, unit, pair, pair.topSize, pair.bottomSize, pair.topColor, pair.bottomColor]);

  const hasComputedOnce = useRef(false);
  const calculateRef = useRef(handleCalculate);
  calculateRef.current = handleCalculate;

  useEffect(() => {
    if (!hasComputedOnce.current) {
      hasComputedOnce.current = true;
      return;
    }
    if (computedMeasurements) {
      calculateRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.topSize, pair.bottomSize, pair.topColor, pair.bottomColor]);

  const handleAddToCart = useCallback(async () => {
    if (adding) return;
    setAdding(true);
    setError(null);
    try {
      const items = [pair.top, pair.bottom].filter(Boolean);
      for (const item of items) {
        if (!item) continue;
        const size = item === pair.top ? pair.topSize : pair.bottomSize;
        const color = item === pair.top ? pair.topColor : pair.bottomColor;
        const { data } = await apiClient.get(`/cart/variants/${item.handle}`);
        if (data.success) {
          const variants = data.data.variants as Variant[];
          const match = variants.find(
            (v) =>
              v.available &&
              v.options.some(
                (o) => o.value.toLowerCase() === size.toLowerCase()
              ) &&
              (color === "" ||
                v.options.some(
                  (o) => o.value.toLowerCase() === color.toLowerCase()
                ))
          );
          if (match) {
            await addToCart(match.id, 1);
          }
        }
      }
      setDone(true);
    } catch (err) {
      let msg = "Failed to add items to cart.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: unknown } };
        msg = `Server error (${axiosErr.response?.status ?? "?"})`;
        if (axiosErr.response?.data) {
          msg += `: ${JSON.stringify(axiosErr.response.data)}`;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setAdding(false);
    }
  }, [adding, pair, addToCart]);

  if (done) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-lg font-medium text-foreground">Added to Cart!</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your outfit has been added. Continue shopping or proceed to checkout.
        </p>
        <Button variant="outline" size="sm" onClick={onStartOver}>
          <RotateCcw className="mr-2 h-3 w-3" />
          Try Another Outfit
        </Button>
      </div>
    );
  }

  const topVariantPrice = topVariants.find((v) => v.size === pair.topSize)?.price;
  const bottomVariantPrice = bottomVariants.find((v) => v.size === pair.bottomSize)?.price;
  const total =
    Number(topVariantPrice ?? pair.top?.price ?? 0) +
    Number(bottomVariantPrice ?? pair.bottom?.price ?? 0);

  return (
    <div className="animate-fade-in flex-1 flex flex-col min-h-0">
      {/* Single relative container that owns both the scrollable area and the sticky CTA */}
      <div className="flex-1 relative min-h-0">
        {/* Scrollable content fills the container */}
        <div className="absolute inset-0 overflow-y-auto">
          <div className="space-y-6 pb-24">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              <h2 className="text-xl font-semibold text-foreground">AI Try-On Preview</h2>
              <p className="text-xs text-muted-foreground mt-1">
                See yourself wearing your outfit
              </p>
            </div>

            <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
              <button
                type="button"
                onClick={() => setTab("ai")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  tab === "ai"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Preview
              </button>
              <button
                type="button"
                onClick={() => setTab("fit")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  tab === "fit"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Fit Scores
              </button>
            </div>

            {tryOnStatus && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                {tryOnStatus.remaining} of {tryOnStatus.limit} free try-ons remaining today
              </div>
            )}

            <div className={tab === "ai" ? "block" : "hidden"}>
              {pair.top ? (
                <div className="mx-auto w-full max-w-sm">
                  <AiPreviewPanel
                    fullBodyFile={fullBodyFile}
                    selfieFile={selfieFile}
                    garmentImageUrl={pair.top.image}
                    garmentName={pair.top.title}
                    bottomGarmentImageUrl={pair.bottom?.image}
                    bottomGarmentName={pair.bottom?.title}
                  />
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
                  <p className="text-xs text-muted-foreground">
                    No garments selected
                  </p>
                </div>
              )}
            </div>

            <div className={tab === "fit" ? "block" : "hidden"}>
                     <div className="space-y-4 max-w-lg mx-auto">
                   {/* Intro text */}
                   <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                     <p className="text-xs text-muted-foreground leading-relaxed">
                       Get your best fit — enter your measurements for personalized size recommendations
                       and fit scores for each garment.
                     </p>
                   </div>

                   {/* Stale-state banner */}
                   {isStale && (
                     <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-900/20 px-4 py-3">
                       <span className="mt-0.5 text-amber-600 dark:text-amber-400 text-xs font-medium">△</span>
                       <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                         Measurements changed — tap <span className="font-medium">Recalculate</span> for updated scores.
                       </p>
                     </div>
                   )}

                   <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Ruler className="h-4 w-4 text-muted-foreground" />
                         <p className="text-xs font-medium text-foreground">Your Measurements</p>
                       </div>
                       <div className="flex rounded-lg bg-muted p-0.5">
                         <button
                           type="button"
                           onClick={() => {
                             if (unit === "in") {
                               setLocalMeasurements((prev) => {
                                 const next: Record<string, string> = {};
                                 for (const [k, v] of Object.entries(prev)) {
                                   const n = parseFloat(v);
                                   next[k] = isNaN(n) ? "" : Math.round(n * 2.54).toString();
                                 }
                                 return next;
                               });
                             }
                             setUnit("cm");
                           }}
                           className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                             unit === "cm"
                               ? "bg-background text-foreground shadow-sm"
                               : "text-muted-foreground"
                           }`}
                         >
                           cm
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             if (unit === "cm") {
                               setLocalMeasurements((prev) => {
                                 const next: Record<string, string> = {};
                                 for (const [k, v] of Object.entries(prev)) {
                                   const n = parseFloat(v);
                                   next[k] = isNaN(n) ? "" : Math.round(n / 2.54).toString();
                                 }
                                 return next;
                               });
                             }
                             setUnit("in");
                           }}
                           className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                             unit === "in"
                               ? "bg-background text-foreground shadow-sm"
                               : "text-muted-foreground"
                           }`}
                         >
                           in
                         </button>
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                       {["height", "chest", "waist", "hips"].map((key) => (
                         <div key={key}>
                           <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                             {key.charAt(0).toUpperCase() + key.slice(1)}
                           </label>
                           <input
                             type="number"
                             placeholder={key === "height" ? "170" : key === "chest" ? "96" : key === "waist" ? "76" : "92"}
                             value={localMeasurements[key] ?? ""}
                             onChange={(e) => {
                               setLocalMeasurements((prev) => ({
                                 ...prev,
                                 [key]: e.target.value,
                               }));
                             }}
                             className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-accent"
                           />
                         </div>
                       ))}
                     </div>
                     <Button
                       size="sm"
                       variant="outline"
                       className="w-full text-xs"
                       onClick={handleCalculate}
                       disabled={calculating || !allFieldsFilled}
                     >
                       {calculating ? (
                         <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                       ) : (
                         <Ruler className="mr-1.5 h-3 w-3" />
                       )}
                       {calculating
                         ? "Calculating..."
                         : hasCalculatedRef.current
                           ? "Recalculate Fit Scores"
                           : "Calculate Fit Score"}
                     </Button>
                   </div>

                  {calculating && (
                    <div className="rounded-xl border border-border bg-card p-6 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-2">Fetching size chart data...</p>
                    </div>
                  )}

                  {fitResults.top && pair.top && (
                    <FitScoreCard
                      title={pair.top.title}
                      selectedSize={pair.topSize}
                      sizes={pair.top.variants
                        .filter((v) => !pair.topColor || v.color === pair.topColor)
                        .map((v) => v.size)}
                      onSizeChange={setTopSize}
                      result={fitResults.top}
                      expanded={expandedChart === "top"}
                      onToggleExpand={() =>
                        setExpandedChart(expandedChart === "top" ? null : "top")
                      }
                      unit={unit}
                    />
                  )}

                  {fitResults.bottom && pair.bottom && (
                    <FitScoreCard
                      title={pair.bottom.title}
                      selectedSize={pair.bottomSize}
                      sizes={pair.bottom.variants
                        .filter((v) => !pair.bottomColor || v.color === pair.bottomColor)
                        .map((v) => v.size)}
                      onSizeChange={setBottomSize}
                      result={fitResults.bottom}
                      expanded={expandedChart === "bottom"}
                      onToggleExpand={() =>
                        setExpandedChart(expandedChart === "bottom" ? null : "bottom")
                      }
                      unit={unit}
                    />
                  )}
                </div>
            </div>

          </div>
        </div>

        {/* Backdrop — catches taps outside sliders to close */}
        {(topOpen || bottomOpen) && (
          <div
            className="fixed inset-0 z-10 hidden max-md:block"
            onClick={() => { setTopOpen(false); setBottomOpen(false); }}
          />
        )}

        {/* ── Mobile size sliders (right edge, hidden on desktop) ── */}
        <div className="hidden max-md:flex flex-col gap-2 absolute right-0 bottom-24 z-20">
          {pair.top && topAvailableVariants.length > 0 && (
            <div className="relative flex justify-end min-h-[48px]">
              <button
                onClick={() => setTopOpen(!topOpen)}
                className={`
                  flex items-center gap-1 bg-primary text-primary-foreground border border-primary/80 shadow-md
                  px-2 py-3 text-[10px] font-medium
                  hover:bg-primary/90 transition-all duration-200 min-h-[48px] shrink-0
                  ${topOpen ? "bg-primary/80 border-r-0" : ""}
                  [clip-path:polygon(100%_0%,100%_100%,0%_85%,0%_15%)]
                `}
                aria-label="Toggle top size"
              >
                <span className="[writing-mode:vertical-rl] rotate-180 tracking-widest uppercase">Top</span>
              </button>
              <div
                className={`
                  absolute right-full bottom-0 flex overflow-hidden
                  transition-all duration-300 ease-out
                  ${topOpen ? "max-w-[220px] opacity-100" : "max-w-0 opacity-0 pointer-events-none"}
                `}
              >
                <div className="flex flex-col gap-1.5 bg-card border border-border shadow-lg px-2 py-2 w-[220px]">
                  {/* Image slider */}
                  <div className="relative w-full aspect-[4/5] bg-muted overflow-hidden group">
                    <div
                      ref={topScrollRef}
                      className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth h-full [&::-webkit-scrollbar]:hidden"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        const idx = Math.round(el.scrollLeft / el.clientWidth);
                        setTopImageIdx(idx);
                      }}
                    >
                      {(pair.top.images?.length ? pair.top.images : [pair.top.image]).map((src, i) => (
                        <div key={i} className="w-full h-full shrink-0 snap-start">
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>
                    {(pair.top.images?.length ?? 0) > 1 && (
                      <>
                        {/* Prev */}
                        <button
                          type="button"
                          onClick={() => scrollSlider(topScrollRef, "prev")}
                          className="absolute left-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                        {/* Next */}
                        <button
                          type="button"
                          onClick={() => scrollSlider(topScrollRef, "next")}
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                        {/* Dots */}
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                          {pair.top.images.map((_, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                i === topImageIdx ? "bg-white" : "bg-white/40"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 px-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {topUniqueColors.length > 1 && topCurrentColor && (
                        <span
                          className="inline-block rounded-full shrink-0 border border-border/60 w-2 h-2"
                          style={{ backgroundColor: colorToHex(topCurrentColor) }}
                          title={topCurrentColor}
                          aria-label={`Top colour: ${topCurrentColor}`}
                        />
                      )}
                      <p className="text-[11px] font-medium text-foreground leading-tight truncate">
                        {pair.top.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">
                        ₹{Number(topCurrentPrice).toLocaleString("en-IN")}
                      </span>
                      {topCompareAtPrice && Number(topCompareAtPrice) > Number(topCurrentPrice) && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          ₹{Number(topCompareAtPrice).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative inline-flex px-0.5">
                    <select
                      value={pair.topSize}
                      onChange={(e) => setTopSize(e.target.value)}
                      className="appearance-none rounded-md border border-border bg-muted/50 text-foreground pl-2 pr-5 text-[11px] font-medium leading-tight w-full min-h-[30px] focus:outline-none focus:ring-1 focus:ring-ring focus:border-foreground/30 hover:border-foreground/30 transition-colors cursor-pointer"
                    >
                      {topAvailableVariants.map((v) => (
                        <option key={v.size} value={v.size}>{v.size}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {pair.bottom && bottomAvailableVariants.length > 0 && (
            <div className="relative flex justify-end min-h-[48px]">
              <button
                onClick={() => setBottomOpen(!bottomOpen)}
                className={`
                  flex items-center gap-1 bg-primary text-primary-foreground border border-primary/80 shadow-md
                  px-2 py-3 text-[10px] font-medium
                  hover:bg-primary/90 transition-all duration-200 min-h-[48px] shrink-0
                  ${bottomOpen ? "bg-primary/80 border-r-0" : ""}
                  [clip-path:polygon(100%_0%,100%_100%,0%_85%,0%_15%)]
                `}
                aria-label="Toggle bottom size"
              >
                <span className="[writing-mode:vertical-rl] rotate-180 tracking-widest uppercase">Bottom</span>
              </button>
              <div
                className={`
                  absolute right-full bottom-0 flex overflow-hidden
                  transition-all duration-300 ease-out
                  ${bottomOpen ? "max-w-[220px] opacity-100" : "max-w-0 opacity-0 pointer-events-none"}
                `}
              >
                <div className="flex flex-col gap-1.5 bg-card border border-border shadow-lg px-2 py-2 w-[220px]">
                  {/* Image slider */}
                  <div className="relative w-full aspect-[4/5] bg-muted overflow-hidden group">
                    <div
                      ref={bottomScrollRef}
                      className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth h-full [&::-webkit-scrollbar]:hidden"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        const idx = Math.round(el.scrollLeft / el.clientWidth);
                        setBottomImageIdx(idx);
                      }}
                    >
                      {(pair.bottom.images?.length ? pair.bottom.images : [pair.bottom.image]).map((src, i) => (
                        <div key={i} className="w-full h-full shrink-0 snap-start">
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>
                    {(pair.bottom.images?.length ?? 0) > 1 && (
                      <>
                        {/* Prev */}
                        <button
                          type="button"
                          onClick={() => scrollSlider(bottomScrollRef, "prev")}
                          className="absolute left-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                        {/* Next */}
                        <button
                          type="button"
                          onClick={() => scrollSlider(bottomScrollRef, "next")}
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                        {/* Dots */}
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                          {pair.bottom.images.map((_, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                i === bottomImageIdx ? "bg-white" : "bg-white/40"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 px-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {bottomUniqueColors.length > 1 && bottomCurrentColor && (
                        <span
                          className="inline-block rounded-full shrink-0 border border-border/60 w-2 h-2"
                          style={{ backgroundColor: colorToHex(bottomCurrentColor) }}
                          title={bottomCurrentColor}
                          aria-label={`Bottom colour: ${bottomCurrentColor}`}
                        />
                      )}
                      <p className="text-[11px] font-medium text-foreground leading-tight truncate">
                        {pair.bottom.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground">
                        ₹{Number(bottomCurrentPrice).toLocaleString("en-IN")}
                      </span>
                      {bottomCompareAtPrice && Number(bottomCompareAtPrice) > Number(bottomCurrentPrice) && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          ₹{Number(bottomCompareAtPrice).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative inline-flex px-0.5">
                    <select
                      value={pair.bottomSize}
                      onChange={(e) => setBottomSize(e.target.value)}
                      className="appearance-none rounded-md border border-border bg-muted/50 text-foreground pl-2 pr-5 text-[11px] font-medium leading-tight w-full min-h-[30px] focus:outline-none focus:ring-1 focus:ring-ring focus:border-foreground/30 hover:border-foreground/30 transition-colors cursor-pointer"
                    >
                      {bottomAvailableVariants.map((v) => (
                        <option key={v.size} value={v.size}>{v.size}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom bar container */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          {/* Error toast — floats above the bar */}
          {error && (
            <div className="absolute bottom-full left-4 right-4 mb-2 animate-fade-in">
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5 text-xs text-destructive shadow-lg backdrop-blur-sm">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            </div>
          )}

          {/* Compact bar: product size selectors + total + buttons */}
          <div className="border-t border-border bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 max-[420px]:gap-0.5 justify-between">
              {/* ── Zone A: Size selectors (left, grows) — hidden on mobile, right-edge panels handle that ── */}
              <div className="hidden md:flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                {/* Top product slot */}
                {pair.top && (
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 max-[420px]:w-full max-[420px]:justify-between">
                    <img
                      src={pair.top.image}
                      alt={pair.top.title}
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-sm border border-border object-cover shrink-0"
                    />
                    {topUniqueColors.length > 1 && topCurrentColor && (
                      <span
                        className="inline-block rounded-full shrink-0 border border-border w-[8px] h-[8px] sm:w-[10px] sm:h-[10px]"
                        style={{ backgroundColor: colorToHex(topCurrentColor) }}
                        title={topCurrentColor}
                        aria-label={`Top: ${topCurrentColor}`}
                      />
                    )}
                    {topAvailableVariants.length === 0 ? (
                      <div className="inline-flex items-center justify-center rounded-md border px-2 h-9 min-h-[36px] sm:h-10 sm:min-h-[44px] text-[11px] sm:text-xs font-medium border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 cursor-default select-none">
                        Sold Out
                      </div>
                    ) : topAvailableVariants.length === 1 ? (
                      <div className="inline-flex items-center justify-center rounded-md border px-2 h-9 min-h-[36px] sm:h-10 sm:min-h-[44px] text-[11px] sm:text-xs font-medium border-border bg-muted text-muted-foreground cursor-default select-none">
                        {topAvailableVariants[0].size}
                      </div>
                    ) : (
                      <div className="relative inline-flex">
                        <select
                          value={pair.topSize}
                          onChange={(e) => setTopSize(e.target.value)}
                          className="appearance-none rounded-md border bg-background text-foreground pl-2 pr-6 text-[11px] sm:text-xs md:text-sm font-medium leading-none h-9 min-h-[36px] sm:h-10 sm:min-h-[44px] max-w-[68px] xs:max-w-[72px] sm:max-w-[90px] md:max-w-[100px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors duration-150 border-border"
                        >
                          {topAvailableVariants.map((v) => (
                            <option key={v.size} value={v.size}>{v.size}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      </div>
                    )}
                  </div>
                )}

                {/* Separator between products */}
                {pair.top && pair.bottom && (
                  <span className="hidden sm:inline-block w-px h-6 bg-border shrink-0 max-[420px]:hidden" />
                )}

                {/* Bottom product slot */}
                {pair.bottom && (
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 max-[420px]:w-full max-[420px]:justify-between">
                    <img
                      src={pair.bottom.image}
                      alt={pair.bottom.title}
                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-sm border border-border object-cover shrink-0"
                    />
                    {bottomUniqueColors.length > 1 && bottomCurrentColor && (
                      <span
                        className="inline-block rounded-full shrink-0 border border-border w-[8px] h-[8px] sm:w-[10px] sm:h-[10px]"
                        style={{ backgroundColor: colorToHex(bottomCurrentColor) }}
                        title={bottomCurrentColor}
                        aria-label={`Bottom: ${bottomCurrentColor}`}
                      />
                    )}
                    {bottomAvailableVariants.length === 0 ? (
                      <div className="inline-flex items-center justify-center rounded-md border px-2 h-9 min-h-[36px] sm:h-10 sm:min-h-[44px] text-[11px] sm:text-xs font-medium border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 cursor-default select-none">
                        Sold Out
                      </div>
                    ) : bottomAvailableVariants.length === 1 ? (
                      <div className="inline-flex items-center justify-center rounded-md border px-2 h-9 min-h-[36px] sm:h-10 sm:min-h-[44px] text-[11px] sm:text-xs font-medium border-border bg-muted text-muted-foreground cursor-default select-none">
                        {bottomAvailableVariants[0].size}
                      </div>
                    ) : (
                      <div className="relative inline-flex">
                        <select
                          value={pair.bottomSize}
                          onChange={(e) => setBottomSize(e.target.value)}
                          className="appearance-none rounded-md border bg-background text-foreground pl-2 pr-6 text-[11px] sm:text-xs md:text-sm font-medium leading-none h-9 min-h-[36px] sm:h-10 sm:min-h-[44px] max-w-[68px] xs:max-w-[72px] sm:max-w-[90px] md:max-w-[100px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors duration-150 border-border"
                        >
                          {bottomAvailableVariants.map((v) => (
                            <option key={v.size} value={v.size}>{v.size}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Zone B: Total (center) ── */}
              <span className="hidden sm:inline-block w-px h-8 bg-border shrink-0" />
              <div className="hidden min-[420px]:flex flex-col items-start shrink-0">
                <span className="text-[10px] sm:text-xs text-muted-foreground leading-none">Total</span>
                <span className="text-sm sm:text-base md:text-lg font-bold text-foreground whitespace-nowrap">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              {/* ── Zone C: Buttons (right) ── */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="default"
                  className="h-9 min-h-[36px] px-2 sm:h-11 sm:px-4 text-[11px] sm:text-sm font-medium"
                  onClick={onStartOver}
                  disabled={adding}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <span>Start Over</span>
                </Button>
                <Button
                  size="default"
                  className="h-9 min-h-[36px] px-3 sm:h-11 sm:px-5 text-xs sm:text-sm font-semibold"
                  onClick={handleAddToCart}
                  disabled={
                    adding ||
                    done ||
                    topAvailableVariants.length === 0 ||
                    (!!pair.bottom && bottomAvailableVariants.length === 0)
                  }
                  title={
                    topAvailableVariants.length === 0
                      ? "Top is sold out"
                      : pair.bottom && bottomAvailableVariants.length === 0
                        ? "Bottom is sold out"
                        : undefined
                  }
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4 sm:mr-1.5 shrink-0" />
                      <span>Add Both to Cart</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FitScoreCard({
  title,
  selectedSize,
  sizes,
  onSizeChange,
  result,
  expanded,
  onToggleExpand,
  unit = "cm",
}: {
  title: string;
  selectedSize: string;
  sizes: string[];
  onSizeChange: (size: string) => void;
  result: TryOnResult;
  expanded: boolean;
  onToggleExpand: () => void;
  unit?: "cm" | "in";
}) {
  const sc = result.sizeChart;
  const score = result.fitScore.overall;
  const chartUnit = result.chartUnit;
  const unitMismatch = chartUnit && chartUnit !== unit;

  const scoreLegend =
    score >= 90
      ? { label: "Great", color: "text-emerald-600 dark:text-emerald-400" }
      : score >= 70
        ? { label: "Good", color: "text-teal-600 dark:text-teal-400" }
        : score >= 50
          ? { label: "Fair", color: "text-amber-600 dark:text-amber-400" }
          : { label: "Poor", color: "text-red-600 dark:text-red-400" };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Gauge + Label row — stacks on mobile, row on sm+ */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center gap-3">
        <FitScoreGauge score={score} size="sm" />
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <p className="text-sm font-medium text-foreground">
                {result.fitScore.label}
              </p>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${scoreLegend.color}`}>
                {scoreLegend.label}
              </span>
              {chartUnit && (
                <span className="text-[9px] text-muted-foreground/60 border border-border rounded px-1 py-0.5 uppercase tracking-wider">
                  {chartUnit === "in" ? "in" : "cm"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{title}</p>
            {unitMismatch && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                Chart in inches — toggle input to <span className="font-medium">in</span> for matching values
              </p>
            )}
          </div>
      </div>

      {/* Size selector row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <select
          value={selectedSize}
          onChange={(e) => onSizeChange(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
        >
          {sizes.map((s) => (
            <option key={s} value={s}>
              Size {s}
            </option>
          ))}
        </select>
        {result.recommendedSize && result.recommendedSize !== selectedSize && (
          <button
            type="button"
            onClick={() => onSizeChange(result.recommendedSize!)}
            className="rounded-md bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/40 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 whitespace-nowrap hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors min-h-[44px] flex items-center justify-center gap-1"
          >
            Try {result.recommendedSize}
            <Check className="h-3 w-3" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {result.fitScore.description}
      </p>

      {result.comparisonRows.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Fit Details
          </p>
          {result.comparisonRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5"
            >
              <span className="text-xs text-foreground capitalize">{row.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {row.userValue} cm
                  {row.sizeRange.min !== row.sizeRange.max
                    ? ` (${row.sizeRange.min}-${row.sizeRange.max} cm)`
                    : ` (${row.sizeRange.min} cm)`}
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    row.withinRange ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {row.withinRange ? "✓" : "△"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Size chart button + missing data warning */}
      {sc ? (
        <>
          {!sc.chartData && !sc.image && !sc.fitNotes ? (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 italic leading-relaxed">
              Scores estimated without size chart data — may be less accurate.
            </p>
          ) : (
            <button
              type="button"
              onClick={onToggleExpand}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
            >
              View Size Chart
            </button>
          )}

          {expanded && (
            <SizeChartModal
              title={title}
              chartData={sc.chartData}
              image={sc.image}
              fitNotes={sc.fitNotes}
              onClose={onToggleExpand}
            />
          )}
        </>
      ) : (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 italic leading-relaxed">
          Scores estimated without size chart data — may be less accurate.
        </p>
      )}
    </div>
  );
}


