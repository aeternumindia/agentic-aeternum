"use client";

import React from "react";
import { Check } from "lucide-react";
import { GarmentItem } from "./garment-selector";
import { normalizeCategory } from "@/services/outfit-api";

export interface GarmentCardProps {
  garment: GarmentItem;
  isSelected: boolean;
  badgeLabel?: string;
  badgeNumber?: number;
  onSelect: () => void;
}

export function GarmentCard({
  garment,
  isSelected,
  badgeLabel = "Selected",
  badgeNumber,
  onSelect,
}: GarmentCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative border rounded-lg overflow-hidden text-left cursor-pointer transition-all duration-300 bg-card flex flex-col ${
        isSelected
          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background border-foreground shadow-md -translate-y-0.5"
          : "border-border/70 hover:border-foreground/40 hover:shadow-md hover:-translate-y-0.5"
      }`}
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
                <span>{badgeLabel}</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>{badgeLabel}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="px-4 py-3 sm:px-4 sm:py-3.5 flex flex-col justify-between flex-1 border-t border-border/40 bg-card/90">
        <p className="text-xs sm:text-[13px] font-medium text-foreground tracking-tight line-clamp-1 group-hover:text-accent transition-colors">
          {garment.name}
        </p>
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/30">
          <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground/80">
            {normalizeCategory(garment.category)}
          </span>
          {garment.price && (
            <span className="text-xs font-semibold text-foreground tracking-tight">
              ₹{Number(garment.price).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default GarmentCard;
