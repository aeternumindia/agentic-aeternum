"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { GarmentItem } from "./garment-selector";
import { normalizeCategory } from "@/services/outfit-api";
import { cn } from "@/lib/utils";

export interface GarmentCardProps {
  garment: GarmentItem;
  isSelected: boolean;
  selectedSize?: string;
  badgeLabel?: string;
  badgeNumber?: number;
  onSelect: () => void;
  onSelectSize?: (size: string) => void;
}

export function GarmentCard({
  garment,
  isSelected,
  selectedSize: externalSelectedSize,
  badgeLabel = "Selected",
  badgeNumber,
  onSelect,
  onSelectSize,
}: GarmentCardProps) {
  const defaultSize = garment.sizes?.[0] || "M";
  const [internalSize, setInternalSize] = useState<string>(
    externalSelectedSize || defaultSize
  );

  const currentSize = externalSelectedSize || internalSize;

  const handleSizeClick = (e: React.MouseEvent, sz: string) => {
    e.stopPropagation();
    setInternalSize(sz);
    if (onSelectSize) {
      onSelectSize(sz);
    }
    if (!isSelected) {
      onSelect();
    }
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative border rounded-md overflow-hidden text-left cursor-pointer transition-all duration-300 bg-card flex flex-col justify-between",
        isSelected
          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background border-foreground shadow-md -translate-y-0.5"
          : "border-border/70 hover:border-foreground/40 hover:shadow-md hover:-translate-y-0.5"
      )}
    >
      {/* Image Canvas with Portrait 3:4 Aspect Ratio */}
      <div className="w-full aspect-[3/4] relative bg-muted/20 overflow-hidden flex items-center justify-center">
        <img
          src={garment.image}
          alt={garment.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Subtle hover & active gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Selection Badge in Top Right */}
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-foreground text-background px-2.5 py-1 rounded-full shadow-md text-[10px] font-semibold tracking-wider uppercase animate-in fade-in zoom-in-75 duration-200">
            {badgeNumber !== undefined ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full bg-background/20 flex items-center justify-center text-[9px] font-bold">
                  {badgeNumber}
                </span>
                <span>{badgeLabel} {currentSize ? `(${currentSize})` : ""}</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>{badgeLabel} {currentSize ? `(${currentSize})` : ""}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="px-3 py-2.5 sm:px-3.5 sm:py-3 flex flex-col justify-between flex-1 border-t border-border/40 bg-card/90 gap-1.5">
        <div>
          <p className="text-xs sm:text-[13px] font-medium text-foreground tracking-tight line-clamp-1 group-hover:text-accent transition-colors">
            {garment.name}
          </p>
          <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/30 gap-1">
            <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground/80 truncate max-w-[60%]">
              {normalizeCategory(garment.category)}
            </span>
            {garment.price && (
              <span className="text-xs font-semibold text-foreground tracking-tight shrink-0">
                ₹{Number(garment.price).toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>

        {/* Interactive Size Selector Row */}
        {garment.sizes && garment.sizes.length > 0 && (
          <div
            className="mt-0.5 pt-1.5 border-t border-border/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap gap-1">
              {garment.sizes.map((sz) => {
                const isSizeActive = isSelected && currentSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={(e) => handleSizeClick(e, sz)}
                    className={cn(
                      "px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-md border transition-all cursor-pointer shadow-2xs",
                      isSizeActive
                        ? "bg-foreground text-background border-foreground font-bold scale-105 shadow-xs"
                        : "bg-muted/30 border-border/70 text-foreground hover:border-foreground/50 hover:bg-muted/70 active:scale-95"
                    )}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GarmentCard;
