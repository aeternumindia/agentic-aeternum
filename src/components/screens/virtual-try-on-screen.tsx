"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shirt,
  RotateCcw,
  ShoppingBag,
  Check,
  Ruler,
  RefreshCw,
} from "lucide-react";
import { useVirtualTryOn } from "@/contexts/virtual-try-on";
import { findRecommendedSize } from "@/services/virtual-try-on";
import type { FitQuality } from "@/types/virtual-try-on";
import type { CartItem } from "@/types/product";

type VirtualTryOnScreenProps = {
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
  productImages?: string[];
  productSizes?: string[];
  productColors?: string[];
  productPrice?: number;
  productCurrency?: string;
};

const QUALITY_COLORS: Record<FitQuality, { stroke: string; bg: string; text: string }> = {
  perfect: { stroke: "#22c55e", bg: "bg-green-500/10", text: "text-green-600" },
  great: { stroke: "#22c55e", bg: "bg-green-500/10", text: "text-green-600" },
  good: { stroke: "#8b5e3a", bg: "bg-amber-500/10", text: "text-amber-700" },
  consider_sizing_up: { stroke: "#8c3a3f", bg: "bg-red-500/10", text: "text-red-600" },
  consider_sizing_down: { stroke: "#8c3a3f", bg: "bg-red-500/10", text: "text-red-600" },
};

const MEASUREMENT_FIELDS = [
  { key: "height", label: "Height", unit: "cm", placeholder: "e.g. 170" },
  { key: "chest", label: "Chest", unit: "cm", placeholder: "e.g. 96" },
  { key: "waist", label: "Waist", unit: "cm", placeholder: "e.g. 76" },
  { key: "hips", label: "Hips", unit: "cm", placeholder: "e.g. 90" },
] as const;

function FitScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedOffset(offset), 200);
    return () => clearTimeout(timer);
  }, [offset]);

  const color =
    score >= 85
      ? "#22c55e"
      : score >= 70
        ? "#8b5e3a"
        : score >= 50
          ? "#eab308"
          : "#8c3a3f";

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="absolute inset-0" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/40"
          strokeWidth="8"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          className="transition-all duration-1000 ease-out"
          transform="rotate(-90 64 64)"
        />
      </svg>
      <span className="text-2xl font-semibold text-foreground">
        {score}
        <span className="text-sm text-muted-foreground">%</span>
      </span>
    </div>
  );
}

export function VirtualTryOnScreen({
  onAddToCart,
  onBack,
  productSizes = ["XS", "S", "M", "L", "XL", "XXL"],
  productPrice = 0,
  productCurrency = "INR",
}: VirtualTryOnScreenProps) {
  const { session, result, updateSize, updateMeasurements } = useVirtualTryOn();
  const [added, setAdded] = useState(false);
  const [editingMeasurements, setEditingMeasurements] = useState(false);
  const [measurementValues, setMeasurementValues] = useState<
    Record<string, string>
  >({});

  const fitScore = result?.fitScore;
  const comparisonRows = result?.comparisonRows ?? [];

  function handleStartEditing() {
    if (session?.measurements) {
      const initial: Record<string, string> = {};
      for (const [key, val] of Object.entries(session.measurements)) {
        initial[key] = String(val);
      }
      setMeasurementValues(initial);
    }
    setEditingMeasurements(true);
  }

  const handleMeasurementSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const parsed: Record<string, number> = {};
      for (const field of MEASUREMENT_FIELDS) {
        const v = Number(measurementValues[field.key]);
        if (v > 0 && v <= 300) {
          parsed[field.key] = v;
        }
      }
      if (Object.keys(parsed).length > 0) {
        updateMeasurements(parsed);
        setEditingMeasurements(false);
      }
    },
    [measurementValues, updateMeasurements]
  );

  const handleAddToCart = useCallback(() => {
    if (!session) return;
    const item: CartItem = {
      id: crypto.randomUUID(),
      product: {
        id: session.productId,
        title: session.productTitle,
        description: "",
        price: productPrice,
        currency: productCurrency,
        images: session.productImage ? [session.productImage] : [],
        category: session.productCategory,
        sizes: productSizes,
        colors: session.selectedColor ? [session.selectedColor] : [],
        material: "",
      },
      quantity: 1,
      selectedSize: session.selectedSize,
      selectedColor: session.selectedColor,
      customizations: [],
    };
    onAddToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [session, onAddToCart, productPrice, productCurrency, productSizes]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <Shirt className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-sm text-muted-foreground">
          Select a product to start virtual try-on
        </p>
      </div>
    );
  }

  const qualityColor = fitScore
    ? QUALITY_COLORS[fitScore.quality]
    : QUALITY_COLORS.good;

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      <div className="px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="px-6">
        <h2 className="text-lg font-medium text-foreground">Virtual Try-On</h2>
        <p className="text-xs text-muted-foreground mt-1">
          See how the <strong>{session.productTitle}</strong> fits your body
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6">
        <div className="aspect-[4/5] rounded-xl bg-muted overflow-hidden">
          {session.productImage ? (
            <img
              src={session.productImage}
              alt={session.productTitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Shirt className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-6">
          <FitScoreGauge score={fitScore?.overall ?? 0} />

          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${qualityColor.bg} ${qualityColor.text}`}
          >
            {fitScore?.label ?? "Analyzing..."}
          </span>

          <div className="flex flex-wrap gap-2 justify-center">
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1 text-xs text-foreground">
              <Shirt className="h-3 w-3 text-muted-foreground" />
              {session.selectedSize}
            </span>
            {session.selectedColor && (
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1 text-xs text-foreground">
                <span
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ backgroundColor: session.selectedColor }}
                />
                {session.selectedColor}
              </span>
            )}
          </div>

          {fitScore && (
            <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-xs">
              {fitScore.description}
            </p>
          )}
        </div>
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Your Measurements</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (editingMeasurements) {
                setEditingMeasurements(false);
              } else {
                handleStartEditing();
              }
            }}
            className="text-xs text-accent hover:text-accent/80 transition-colors"
          >
            {editingMeasurements ? "Cancel" : "Edit"}
          </button>
        </div>

        {editingMeasurements ? (
          <form
            onSubmit={handleMeasurementSubmit}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              {MEASUREMENT_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {field.label} ({field.unit})
                  </label>
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    value={measurementValues[field.key] ?? ""}
                    onChange={(e) =>
                      setMeasurementValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <Button type="submit" size="sm" className="w-full">
              <RefreshCw className="mr-2 h-3 w-3" />
              Update Fit
            </Button>
          </form>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {Object.entries(session.measurements).length > 0 ? (
              Object.entries(session.measurements).map(([key, val]) => {
                const label =
                  MEASUREMENT_FIELDS.find((f) => f.key === key)?.label ?? key;
                const row = comparisonRows.find((r) => r.label.toLowerCase() === key);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-xs text-muted-foreground capitalize">
                      {label}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-foreground font-medium">
                        {val} cm
                      </span>
                      {row && (
                        <span
                          className={`text-xs ${
                            row.withinRange
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {row.withinRange ? "✓ In range" : "✗ Adjust"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No measurements provided. Click Edit to add your measurements
                  for a fit assessment.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6">
        <div className="flex items-center gap-2 mb-3">
          <Shirt className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Try Another Size</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {productSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => updateSize(size)}
              className={`rounded-lg border px-4 py-2 text-xs transition-all ${
                session.selectedSize === size
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-muted-foreground"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {session.measurements &&
          Object.keys(session.measurements).length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Recommended:{" "}
              <span className="text-accent font-medium">
                {findRecommendedSize(session.measurements)}
              </span>
            </p>
          )}
      </div>

      <div className="px-6 flex gap-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onBack}>
          <RotateCcw className="mr-2 h-3 w-3" />
          Back
        </Button>
        <Button size="sm" className="flex-1" onClick={handleAddToCart}>
          {added ? (
            <>
              <Check className="mr-2 h-3 w-3" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-3 w-3" />
              Looks Good, Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
