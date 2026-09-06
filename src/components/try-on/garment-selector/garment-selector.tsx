"use client";

import React, { useState } from "react";
import { Check, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GarmentItem {
  id?: string;
  name: string;
  category: string;
  image: string;
  price?: string | number;
  handle?: string;
  images?: string[];
}

export interface GarmentSelectorProps {
  garments?: GarmentItem[];
  garmentMode: "single" | "multiple";
  onGarmentModeChange: (mode: "single" | "multiple") => void;
  selectedGarments: string[];
  onToggleGarment: (name: string) => void;
  onClearSelection?: () => void;
  onTryOn?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const DEFAULT_GARMENTS: GarmentItem[] = [
  {
    name: "Formal Shirt",
    category: "Shirts",
    image: "https://placehold.co/240x300?text=Formal+Shirt",
    price: "1999",
  },
  {
    name: "Polo T-Shirt",
    category: "T-Shirts",
    image: "https://placehold.co/240x300?text=Polo",
    price: "1499",
  },
  {
    name: "Sweater",
    category: "Tops",
    image: "https://placehold.co/240x300?text=Sweater",
    price: "2499",
  },
  {
    name: "Jacket",
    category: "Jackets",
    image: "https://placehold.co/240x300?text=Jacket",
    price: "4999",
  },
  {
    name: "Formal Pants",
    category: "Pants",
    image: "https://placehold.co/240x300?text=Formal+Pants",
    price: "2299",
  },
  {
    name: "Chinos",
    category: "Pants",
    image: "https://placehold.co/240x300?text=Chinos",
    price: "1899",
  },
  {
    name: "Jeans",
    category: "Pants",
    image: "https://placehold.co/240x300?text=Jeans",
    price: "2599",
  },
  {
    name: "Blazer",
    category: "Jackets",
    image: "https://placehold.co/240x300?text=Blazer",
    price: "6999",
  },
];

import { normalizeCategory } from "@/services/outfit-api";

export function GarmentSelector({
  garments = DEFAULT_GARMENTS,
  garmentMode,
  onGarmentModeChange,
  selectedGarments,
  onToggleGarment,
  onClearSelection,
  onTryOn,
  isLoading = false,
  className,
}: GarmentSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = React.useMemo(() => {
    const rawCategories = Array.from(
      new Set(
        garments
          .map((g) => normalizeCategory(g.category))
          .filter(Boolean)
      )
    );
    return ["All", ...rawCategories];
  }, [garments]);

  const filteredGarments = garments.filter((garment) => {
    const normalizedGarmentCat = normalizeCategory(garment.category);
    const matchesCategory =
      selectedCategory === "All" ||
      normalizedGarmentCat.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = garment.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleClear = () => {
    if (onClearSelection) {
      onClearSelection();
    } else {
      selectedGarments.forEach((g) => onToggleGarment(g));
    }
  };

  return (
    <div
      style={{ flex: "2 1 480px", minWidth: "320px" }}
      className={cn(
        "hidden md:flex flex-col justify-between border border-border/80 bg-card/95 rounded-3xl p-6 sm:p-7 shadow-xs gap-6 self-start backdrop-blur-sm",
        className
      )}
    >
      <div className="space-y-5">
        {/* Header with Title & Mode Switch */}
        <div className="flex items-center justify-between gap-4 pb-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                Select Garments
              </h2>
            </div>
            <p className="text-xs text-muted-foreground pl-9">
              Choose garments to try on your selected model
            </p>
          </div>

          {/* Segmented Mode Switch */}
          <div className="inline-flex p-1 rounded-full bg-muted/60 border border-border/70 gap-1 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => onGarmentModeChange("single")}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                garmentMode === "single"
                  ? "bg-foreground text-background shadow-xs font-semibold scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => onGarmentModeChange("multiple")}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                garmentMode === "multiple"
                  ? "bg-foreground text-background shadow-xs font-semibold scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Multiple
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          className="flex gap-2.5 overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`border rounded-full px-4 py-1.5 text-xs font-medium cursor-pointer whitespace-nowrap transition-all shadow-2xs ${
                  isSelected
                    ? "bg-foreground text-background border-foreground font-semibold shadow-xs scale-[1.02]"
                    : "text-muted-foreground bg-muted/30 border-border/80 hover:text-foreground hover:border-foreground/30 hover:bg-muted/50"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center w-full group">
          <Search className="w-4 h-4 absolute left-4 text-muted-foreground/60 group-focus-within:text-foreground transition-colors pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search garments by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2.6rem", paddingRight: searchQuery ? "2.6rem" : "1.25rem" }}
            className="w-full bg-muted/20 hover:bg-muted/30 focus:bg-background border border-border/80 focus:border-foreground/40 rounded-xl py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Selection Status Strip */}
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground pt-1 pb-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {filteredGarments.length} {filteredGarments.length === 1 ? "Garment" : "Garments"} Available
            </span>
            {selectedGarments.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-accent/10 text-accent font-medium text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {selectedGarments.length} Selected
              </span>
            )}
          </div>

          {selectedGarments.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-muted-foreground hover:text-foreground font-medium underline underline-offset-2 cursor-pointer transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Garment Grid with Generous Gaps & Full Padding */}
        {isLoading ? (
          <div
            style={{ maxHeight: "490px", overflowY: "auto" }}
            className="p-2 sm:p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="border border-border rounded-lg overflow-hidden bg-card animate-pulse"
              >
                <div className="w-full aspect-[3/4] bg-muted/60" />
                <div className="p-3.5 space-y-2 border-t border-border/40">
                  <div className="h-3.5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredGarments.length === 0 ? (
          <div className="text-center py-16 text-xs text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/80 my-2">
            No garments match your search or filter
          </div>
        ) : (
          <div
            style={{ maxHeight: "490px", overflowY: "auto" }}
            className="p-2 sm:p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
          >
            {filteredGarments.map((garment, idx) => {
              const selectedIndex = selectedGarments.indexOf(garment.name);
              const isSelected = selectedIndex !== -1;

              return (
                <button
                  key={garment.id || `${garment.name}-${idx}`}
                  type="button"
                  onClick={() => onToggleGarment(garment.name)}
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

                    {/* Refined Selection Badge in Top Right */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-foreground text-background px-2.5 py-1 rounded-full shadow-md text-[10px] font-semibold tracking-wider uppercase animate-in fade-in zoom-in-75 duration-200">
                        {garmentMode === "multiple" ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full bg-background/20 flex items-center justify-center text-[9px] font-bold">
                              {selectedIndex + 1}
                            </span>
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Selected</span>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default GarmentSelector;
