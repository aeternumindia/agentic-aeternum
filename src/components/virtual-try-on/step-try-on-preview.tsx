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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOutfitBuilder } from "@/contexts/outfit-builder";
import { useShopifyCart } from "@/contexts/shopify-cart";
import { calculateFitScore } from "@/services/virtual-try-on";
import { getSizeChart } from "@/services/api";
import { FitScoreGauge } from "./fit-score-gauge";
import { SilhouetteView } from "./silhouette-view";
import { AiPreviewPanel } from "./ai-preview-panel";
import apiClient from "@/services/api";
import type { TryOnSession, TryOnResult, ProductSizeChart, SizeChartData } from "@/types/virtual-try-on";

type Variant = {
  id: string;
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
    } catch {
      // Fallback: compute without size charts
      const topSess: TryOnSession | null = pair.top
        ? {
            productId: pair.top.id,
            productHandle: pair.top.handle,
            productTitle: pair.top.title,
            productImage: pair.top.image,
            productCategory: pair.top.productType,
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
            selectedSize: pair.bottomSize,
            selectedColor: pair.bottomColor,
            measurements: parsed,
          }
        : null;
      setFitResults({
        top: topSess ? calculateFitScore(topSess) : null,
        bottom: bottomSess ? calculateFitScore(bottomSess) : null,
      });
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
    } catch {
      setError("Failed to add items to cart. Please try again.");
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

  const total =
    Number(pair.top?.price ?? 0) + Number(pair.bottom?.price ?? 0);

  return (
    <div className="animate-fade-in space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div>
        <h2 className="text-lg font-medium text-foreground">AI Try-On Preview</h2>
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

      <div className={tab === "ai" ? "block" : "hidden"}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {pair.top ? (
              <AiPreviewPanel
                fullBodyFile={fullBodyFile}
                selfieFile={selfieFile}
                garmentImageUrl={pair.top.image}
                garmentName={pair.top.title}
                bottomGarmentImageUrl={pair.bottom?.image}
                bottomGarmentName={pair.bottom?.title}
              />
            ) : (
              <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
                <p className="text-xs text-muted-foreground">
                  No garments selected
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                  {pair.top?.image && (
                    <img
                      src={pair.top.image}
                      alt={pair.top.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {pair.top?.title ?? "No top"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Size {pair.topSize}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                  {pair.bottom?.image && (
                    <img
                      src={pair.bottom.image}
                      alt={pair.bottom.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {pair.bottom?.title ?? "No bottom"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Size {pair.bottomSize}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-medium text-foreground">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={tab === "fit" ? "block" : "hidden"}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center">
            <SilhouetteView
              hasTop={!!pair.top}
              hasBottom={!!pair.bottom}
            />
            <p className="mt-3 text-xs text-muted-foreground text-center">
              {pair.top?.title} &times; {pair.bottom?.title}
            </p>
          </div>

          <div className="space-y-4">
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
              <div className="grid grid-cols-4 gap-2">
                {["height", "chest", "waist", "hips"].map((key) => (
                  <div key={key}>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <input
                      type="number"
                      placeholder="--"
                      value={localMeasurements[key] ?? ""}
                      onChange={(e) => {
                        setComputedMeasurements(null);
                        setFitResults({ top: null, bottom: null });
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
                disabled={calculating}
              >
                {calculating ? (
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                ) : (
                  <Ruler className="mr-1.5 h-3 w-3" />
                )}
                {calculating ? "Calculating..." : "Calculate Fit Score"}
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
              />
            )}

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-medium text-foreground">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onStartOver}>
          <RotateCcw className="mr-2 h-3 w-3" />
          Start Over
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={handleAddToCart}
          disabled={adding || done}
        >
          {adding ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-3 w-3" />
              Add Both to Cart
            </>
          )}
        </Button>
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
}: {
  title: string;
  selectedSize: string;
  sizes: string[];
  onSizeChange: (size: string) => void;
  result: TryOnResult;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const sc = result.sizeChart;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <FitScoreGauge score={result.fitScore.overall} size="sm" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {result.fitScore.label}
          </p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedSize}
          onChange={(e) => onSizeChange(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {sizes.map((s) => (
            <option key={s} value={s}>
              Size {s}
            </option>
          ))}
        </select>
        {result.recommendedSize && result.recommendedSize !== selectedSize && (
          <span className="text-[10px] text-accent font-medium whitespace-nowrap">
            Try {result.recommendedSize}
          </span>
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
                  {row.userValue}
                  {row.sizeRange.min !== row.sizeRange.max
                    ? ` (${row.sizeRange.min}-${row.sizeRange.max})`
                    : ` (${row.sizeRange.min})`}
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

      {sc && (sc.chartData || sc.image || sc.fitNotes) && (
        <>
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            View Size Chart
          </button>

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
      )}
    </div>
  );
}

function SizeChartModal({
  title,
  chartData,
  image,
  fitNotes,
  onClose,
}: {
  title: string;
  chartData: SizeChartData | null;
  image: string | null;
  fitNotes: string | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-card border border-border p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">Size Chart — {title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {image && (
            <img
              src={image}
              alt="Size chart"
              className="w-full max-h-64 object-contain rounded bg-muted/30"
            />
          )}

          {chartData && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {chartData.headers.map((h) => (
                      <th
                        key={h}
                        className="border border-border px-2 py-1.5 text-left font-medium text-muted-foreground bg-muted/30"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.sizes.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`border border-border px-2 py-1.5 ${
                            j === 0
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {fitNotes && (
            <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/30 rounded-md px-3 py-2">
              {fitNotes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
