"use client";

import React, { useState, useMemo } from "react";
import { Check, Search, Sparkles, X, Shirt, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { GarmentItem, DEFAULT_GARMENTS } from "./garment-selector";
import { GarmentCard } from "./garment-card";
import { normalizeCategory } from "@/services/outfit-api";

export interface MultipleGarmentSelectorProps {
  garments?: GarmentItem[];
  garmentMode: "single" | "multiple";
  onGarmentModeChange: (mode: "single" | "multiple") => void;
  selectedGarments: string[];
  onToggleGarment: (name: string) => void;
  onClearSelection?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function isTopCategory(category: string): boolean {
  const cat = normalizeCategory(category).toLowerCase();
  return (
    cat.includes("shirt") ||
    cat.includes("polo") ||
    cat.includes("top") ||
    cat.includes("jacket") ||
    cat.includes("sweater") ||
    cat.includes("blazer") ||
    cat.includes("hoodie") ||
    cat.includes("coat")
  );
}

export function isBottomCategory(category: string): boolean {
  const cat = normalizeCategory(category).toLowerCase();
  return (
    cat.includes("trouser") ||
    cat.includes("pant") ||
    cat.includes("chino") ||
    cat.includes("jean") ||
    cat.includes("short") ||
    cat.includes("skirt")
  );
}

export function MultipleGarmentSelector({
  garments = DEFAULT_GARMENTS,
  garmentMode,
  onGarmentModeChange,
  selectedGarments,
  onToggleGarment,
  onClearSelection,
  isLoading = false,
  className,
}: MultipleGarmentSelectorProps) {
  const [activeSlot, setActiveSlot] = useState<"top" | "bottom">("top");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Identify currently selected Top and Bottom items
  const selectedTop = useMemo(
    () => garments.find((g) => selectedGarments.includes(g.name) && isTopCategory(g.category)),
    [garments, selectedGarments]
  );

  const selectedBottom = useMemo(
    () => garments.find((g) => selectedGarments.includes(g.name) && isBottomCategory(g.category)),
    [garments, selectedGarments]
  );

  // Filter garments for the active slot
  const slotGarments = useMemo(() => {
    return garments.filter((g) => {
      if (activeSlot === "top") {
        return isTopCategory(g.category);
      }
      return isBottomCategory(g.category);
    });
  }, [garments, activeSlot]);

  // Extract category filters for active slot
  const categories = useMemo(() => {
    const rawCategories = Array.from(
      new Set(
        slotGarments
          .map((g) => normalizeCategory(g.category))
          .filter(Boolean)
      )
    );
    const prefix = activeSlot === "top" ? "All Tops" : "All Bottoms";
    return [prefix, ...rawCategories];
  }, [slotGarments, activeSlot]);

  // Filter slot garments by category and search
  const filteredGarments = useMemo(() => {
    const defaultAllPrefix = activeSlot === "top" ? "All Tops" : "All Bottoms";
    return slotGarments.filter((garment) => {
      const normalizedGarmentCat = normalizeCategory(garment.category);
      const matchesCategory =
        selectedCategory === defaultAllPrefix ||
        selectedCategory === "All" ||
        normalizedGarmentCat.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = garment.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [slotGarments, selectedCategory, searchQuery, activeSlot]);

  const handleSelectGarmentForSlot = (garment: GarmentItem) => {
    // In multiple mode with Top & Bottom slots:
    // If selecting a top, replace any existing top in selectedGarments
    // If selecting a bottom, replace any existing bottom in selectedGarments
    const currentlySelectedTop = selectedTop?.name;
    const currentlySelectedBottom = selectedBottom?.name;

    if (activeSlot === "top") {
      if (currentlySelectedTop === garment.name) {
        // Toggle off
        onToggleGarment(garment.name);
      } else {
        // Remove old top if exists, add new top
        if (currentlySelectedTop) {
          onToggleGarment(currentlySelectedTop);
        }
        onToggleGarment(garment.name);
      }
    } else {
      if (currentlySelectedBottom === garment.name) {
        // Toggle off
        onToggleGarment(garment.name);
      } else {
        // Remove old bottom if exists, add new bottom
        if (currentlySelectedBottom) {
          onToggleGarment(currentlySelectedBottom);
        }
        onToggleGarment(garment.name);
      }
    }
  };

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
        "hidden md:flex flex-col justify-between border border-border/80 bg-card/95 rounded-3xl p-4 sm:p-5 md:p-6 shadow-xs gap-4 sm:gap-5 self-start backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      <div className="space-y-5">
        {/* Header with Title & Mode Switch */}
        <div className="flex items-center justify-between gap-4 pb-1 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                Outfit Selector
              </h2>
            </div>
            <p className="text-xs text-muted-foreground pl-9">
              Build a complete outfit by selecting a Top and Bottom
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

        {/* Workflow Slot Selector Tabs (Choose Top / Choose Bottom) */}
        <div className="grid grid-cols-2 gap-3.5 pt-1 shrink-0">
          {/* Top Slot Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveSlot("top");
              setSelectedCategory("All Tops");
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer relative flex items-center gap-3.5 ${
              activeSlot === "top"
                ? "bg-foreground text-background border-foreground shadow-md ring-2 ring-foreground/20"
                : "bg-muted/30 border-border/80 hover:border-foreground/40 hover:bg-muted/50"
            }`}
          >
            {selectedTop ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-background shrink-0 border border-border/40 relative">
                <img
                  src={selectedTop.image}
                  alt={selectedTop.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                activeSlot === "top" ? "bg-background/10 border-background/20 text-background" : "bg-muted/60 border-border/40 text-muted-foreground"
              }`}>
                <Shirt className="w-6 h-6" />
              </div>
            )}
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                  activeSlot === "top" ? "text-background/80" : "text-muted-foreground"
                }`}>
                  Slot 1
                </span>
                {selectedTop && (
                  <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                    activeSlot === "top" ? "bg-background/20 text-background" : "bg-accent/10 text-accent"
                  }`}>
                    Selected
                  </span>
                )}
              </div>
              <p className={`text-xs sm:text-sm font-semibold truncate ${
                activeSlot === "top" ? "text-background" : "text-foreground"
              }`}>
                {selectedTop ? selectedTop.name : "Choose Top"}
              </p>
            </div>
          </button>

          {/* Bottom Slot Tab */}
          <button
            type="button"
            onClick={() => {
              setActiveSlot("bottom");
              setSelectedCategory("All Bottoms");
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer relative flex items-center gap-3.5 ${
              activeSlot === "bottom"
                ? "bg-foreground text-background border-foreground shadow-md ring-2 ring-foreground/20"
                : "bg-muted/30 border-border/80 hover:border-foreground/40 hover:bg-muted/50"
            }`}
          >
            {selectedBottom ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-background shrink-0 border border-border/40 relative">
                <img
                  src={selectedBottom.image}
                  alt={selectedBottom.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                activeSlot === "bottom" ? "bg-background/10 border-background/20 text-background" : "bg-muted/60 border-border/40 text-muted-foreground"
              }`}>
                <Layers className="w-6 h-6" />
              </div>
            )}
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                  activeSlot === "bottom" ? "text-background/80" : "text-muted-foreground"
                }`}>
                  Slot 2
                </span>
                {selectedBottom && (
                  <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                    activeSlot === "bottom" ? "bg-background/20 text-background" : "bg-accent/10 text-accent"
                  }`}>
                    Selected
                  </span>
                )}
              </div>
              <p className={`text-xs sm:text-sm font-semibold truncate ${
                activeSlot === "bottom" ? "text-background" : "text-foreground"
              }`}>
                {selectedBottom ? selectedBottom.name : "Choose Bottom"}
              </p>
            </div>
          </button>
        </div>

        {/* Category Filter Pills (Contextual to active slot) */}
        <div
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          className="flex gap-2.5 overflow-x-auto pb-1.5 shrink-0 [&::-webkit-scrollbar]:hidden"
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
        <div className="relative flex items-center w-full group shrink-0">
          <Search className="w-4 h-4 absolute left-4 text-muted-foreground/60 group-focus-within:text-foreground transition-colors pointer-events-none z-10" />
          <input
            type="text"
            placeholder={`Search ${activeSlot === "top" ? "tops" : "bottoms"} by name...`}
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

        {/* Active Slot Status & Clear Strip */}
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground pt-1 pb-0.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Picking {activeSlot === "top" ? "Top" : "Bottom"} • {filteredGarments.length} Available
            </span>
          </div>

          {(selectedTop || selectedBottom) && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-muted-foreground hover:text-foreground font-medium underline underline-offset-2 cursor-pointer transition-colors"
            >
              Clear outfit
            </button>
          )}
        </div>

        {/* Garment Grid with Generous Gaps & Full Padding */}
        {isLoading ? (
          <div
            style={{ maxHeight: "calc(100vh - 25.5rem)", minHeight: "250px", overflowY: "auto" }}
            className="p-1 sm:p-2 grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
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
            No {activeSlot === "top" ? "tops" : "bottoms"} match your search or filter
          </div>
        ) : (
          <div
            style={{ maxHeight: "calc(100vh - 25.5rem)", minHeight: "250px", overflowY: "auto" }}
            className="p-1 sm:p-2 grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
          >
            {filteredGarments.map((garment) => {
              const isSelected =
                (activeSlot === "top" && selectedTop?.name === garment.name) ||
                (activeSlot === "bottom" && selectedBottom?.name === garment.name);

              const badgeText = activeSlot === "top" ? "Top Selected" : "Bottom Selected";

              return (
                <GarmentCard
                  key={garment.id || garment.name}
                  garment={garment}
                  isSelected={isSelected}
                  badgeLabel={badgeText}
                  onSelect={() => handleSelectGarmentForSlot(garment)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MultipleGarmentSelector;
