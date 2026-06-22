"use client";

import { ArrowLeft, Shirt, Check, RotateCcw } from "lucide-react";
import { useOutfitBuilder } from "@/contexts/outfit-builder";
import { getUniqueColors } from "@/services/outfit-api";
import { Button } from "@/components/ui/button";

type OutfitCardProps = {
  onContinue: () => void;
  onBack: () => void;
  onChangeTop: () => void;
  onChangeBottom: () => void;
};

const TOP_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const BOTTOM_SIZE_ORDER = ["28", "30", "32", "34", "36", "38", "40"];

export function OutfitCard({ onContinue, onBack, onChangeTop, onChangeBottom }: OutfitCardProps) {
  const {
    pair,
    hasTop,
    hasBottom,
    setTopSize,
    setBottomSize,
    setTopColor,
    setBottomColor,
  } = useOutfitBuilder();

  const topColors = pair.top ? getUniqueColors(pair.top) : [];
  const bottomColors = pair.bottom ? getUniqueColors(pair.bottom) : [];

  const topSizes = pair.top
    ? [...new Set(pair.top.variants.map((v) => v.size))]
    : [];
  const bottomSizes = pair.bottom
    ? [...new Set(pair.bottom.variants.map((v) => v.size))]
    : [];

  topSizes.sort(
    (a, b) => TOP_SIZE_ORDER.indexOf(a) - TOP_SIZE_ORDER.indexOf(b)
  );
  bottomSizes.sort(
    (a, b) => BOTTOM_SIZE_ORDER.indexOf(a) - BOTTOM_SIZE_ORDER.indexOf(b)
  );

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
        <h2 className="text-lg font-medium text-foreground">Review Your Outfit</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Choose sizes and colors for each piece
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shirt className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Top</span>
            {hasTop && <Check className="h-3 w-3 text-green-500" />}
          </div>

          {hasTop && pair.top ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="relative aspect-[4/5] bg-muted group">
                <img
                  src={pair.top.image}
                  alt={pair.top.title}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={onChangeTop}
                  className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 bg-black/0 text-white/0 transition-all group-hover:bg-black/40 group-hover:text-white text-xs font-medium"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Change
                </button>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-foreground font-medium truncate">
                  {pair.top.title}
                </p>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Size</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setTopSize(size)}
                        className={`rounded border px-2.5 py-1 text-xs transition-all ${
                          pair.topSize === size
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-muted-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                {topColors.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Color</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setTopColor(color)}
                          className={`rounded border px-2.5 py-1 text-xs transition-all ${
                            pair.topColor === color
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:border-muted-foreground"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-accent font-medium">
                  ₹{Number(pair.top.price).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
              <p className="text-xs text-muted-foreground">
                No top selected yet
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shirt className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Bottom</span>
            {hasBottom && <Check className="h-3 w-3 text-green-500" />}
          </div>

          {hasBottom && pair.bottom ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="relative aspect-[4/5] bg-muted group">
                <img
                  src={pair.bottom.image}
                  alt={pair.bottom.title}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={onChangeBottom}
                  className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 bg-black/0 text-white/0 transition-all group-hover:bg-black/40 group-hover:text-white text-xs font-medium"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Change
                </button>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-foreground font-medium truncate">
                  {pair.bottom.title}
                </p>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Size</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bottomSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setBottomSize(size)}
                        className={`rounded border px-2.5 py-1 text-xs transition-all ${
                          pair.bottomSize === size
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-muted-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                {bottomColors.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Color</p>
                    <div className="flex flex-wrap gap-1.5">
                      {bottomColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setBottomColor(color)}
                          className={`rounded border px-2.5 py-1 text-xs transition-all ${
                            pair.bottomColor === color
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:border-muted-foreground"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-accent font-medium">
                  ₹{Number(pair.bottom.price).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
              <p className="text-xs text-muted-foreground">
                No bottom selected yet
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onBack}>
          <ArrowLeft className="mr-2 h-3 w-3" />
          Back
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={!hasTop || !hasBottom}
          onClick={onContinue}
        >
          Continue to Measurements
        </Button>
      </div>
    </div>
  );
}
