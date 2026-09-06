"use client";

import React, { useState, useMemo } from "react";
import { Check, Search, Shirt, Layers } from "lucide-react";
import { GarmentItem, DEFAULT_GARMENTS } from "./garment-selector";
import { GarmentCard } from "./garment-card";
import { isTopCategory, isBottomCategory } from "./multiple-garment-selector";
import { normalizeCategory } from "@/services/outfit-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface MultipleGarmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  garments?: GarmentItem[];
  garmentMode: "single" | "multiple";
  onGarmentModeChange: (mode: "single" | "multiple") => void;
  selectedGarments: string[];
  onToggleGarment: (name: string) => void;
  onClearSelection?: () => void;
  isLoading?: boolean;
}

export function MultipleGarmentSelectionModal({
  isOpen,
  onClose,
  garments = DEFAULT_GARMENTS,
  garmentMode,
  onGarmentModeChange,
  selectedGarments,
  onToggleGarment,
  onClearSelection,
  isLoading = false,
}: MultipleGarmentSelectionModalProps) {
  const [activeSlot, setActiveSlot] = useState<"top" | "bottom">("top");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedTop = useMemo(
    () => garments.find((g) => selectedGarments.includes(g.name) && isTopCategory(g.category)),
    [garments, selectedGarments]
  );

  const selectedBottom = useMemo(
    () => garments.find((g) => selectedGarments.includes(g.name) && isBottomCategory(g.category)),
    [garments, selectedGarments]
  );

  const slotGarments = useMemo(() => {
    return garments.filter((g) => {
      if (activeSlot === "top") {
        return isTopCategory(g.category);
      }
      return isBottomCategory(g.category);
    });
  }, [garments, activeSlot]);

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
    const currentlySelectedTop = selectedTop?.name;
    const currentlySelectedBottom = selectedBottom?.name;

    if (activeSlot === "top") {
      if (currentlySelectedTop === garment.name) {
        onToggleGarment(garment.name);
      } else {
        if (currentlySelectedTop) {
          onToggleGarment(currentlySelectedTop);
        }
        onToggleGarment(garment.name);
      }
    } else {
      if (currentlySelectedBottom === garment.name) {
        onToggleGarment(garment.name);
      } else {
        if (currentlySelectedBottom) {
          onToggleGarment(currentlySelectedBottom);
        }
        onToggleGarment(garment.name);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        {/* Header */}
        <DialogHeader className="shrink-0 px-5 pt-4 pb-3 border-b border-border/70 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            Outfit Selector
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Build a complete outfit by selecting a Top and Bottom
          </DialogDescription>
        </DialogHeader>

        {/* Filters and Controls */}
        <div className="shrink-0 px-5 py-3 border-b border-border/60 space-y-3 bg-muted/15">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="inline-flex p-0.5 rounded-xl bg-muted/70 border border-border/50">
              <button
                type="button"
                onClick={() => onGarmentModeChange("single")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  garmentMode === "single"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Single Garment
              </button>
              <button
                type="button"
                onClick={() => onGarmentModeChange("multiple")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  garmentMode === "multiple"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Outfit (Top & Bottom)
              </button>
            </div>
          </div>

          {/* Slot Selector (Top vs Bottom) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setActiveSlot("top");
                setSelectedCategory("All Tops");
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                activeSlot === "top"
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "bg-card border-border hover:border-foreground/30"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeSlot === "top" ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
              }`}>
                <Shirt className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-[9px] uppercase font-bold tracking-wider block ${
                  activeSlot === "top" ? "text-background/80" : "text-muted-foreground"
                }`}>
                  Slot 1
                </span>
                <p className={`text-xs font-medium truncate ${
                  activeSlot === "top" ? "text-background" : "text-foreground"
                }`}>
                  {selectedTop ? selectedTop.name : "Choose Top"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSlot("bottom");
                setSelectedCategory("All Bottoms");
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                activeSlot === "bottom"
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "bg-card border-border hover:border-foreground/30"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeSlot === "bottom" ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"
              }`}>
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={`text-[9px] uppercase font-bold tracking-wider block ${
                  activeSlot === "bottom" ? "text-background/80" : "text-muted-foreground"
                }`}>
                  Slot 2
                </span>
                <p className={`text-xs font-medium truncate ${
                  activeSlot === "bottom" ? "text-background" : "text-foreground"
                }`}>
                  {selectedBottom ? selectedBottom.name : "Choose Bottom"}
                </p>
              </div>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`border rounded-full px-3 py-0.5 text-[11px] cursor-pointer whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? "bg-foreground text-background border-foreground font-medium shadow-xs"
                    : "text-muted-foreground bg-card border-border hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex items-center w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 text-muted-foreground/70 pointer-events-none z-10" />
            <input
              type="text"
              placeholder={`Search ${activeSlot === "top" ? "tops" : "bottoms"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "2.35rem" }}
              className="w-full bg-background border border-border rounded-xl pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
        </div>

        {/* Garment Grid */}
        <div
          style={{ height: "360px", maxHeight: "360px" }}
          className="overflow-y-auto p-4 sm:p-5 overscroll-contain shrink-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
        >
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border border-border rounded-lg overflow-hidden bg-card animate-pulse"
                >
                  <div className="w-full aspect-[3/4] bg-muted/60" />
                  <div className="p-3 space-y-1.5 border-t border-border/40">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredGarments.length === 0 ? (
            <div className="text-center py-16 text-xs text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/80">
              No {activeSlot === "top" ? "tops" : "bottoms"} match your filter
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
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

        {/* Footer */}
        <DialogFooter className="shrink-0 px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedTop && selectedBottom ? (
              <span>Full outfit selected</span>
            ) : selectedTop ? (
              <span>Top selected</span>
            ) : selectedBottom ? (
              <span>Bottom selected</span>
            ) : (
              <span>No items selected</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-foreground text-background rounded-xl px-5 py-2 text-xs font-medium cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MultipleGarmentSelectionModal;
