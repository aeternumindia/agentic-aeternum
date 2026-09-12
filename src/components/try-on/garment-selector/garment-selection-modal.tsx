"use client";

import React, { useState } from "react";
import { Check, Search } from "lucide-react";
import { GarmentItem, DEFAULT_GARMENTS } from "./garment-selector";
import { GarmentCard } from "./garment-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface GarmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  garments?: GarmentItem[];
  garmentMode: "single" | "multiple";
  onGarmentModeChange: (mode: "single" | "multiple") => void;
  selectedGarments: string[];
  onToggleGarment: (name: string) => void;
  isLoading?: boolean;
}

import { normalizeCategory } from "@/services/outfit-api";

export function GarmentSelectionModal({
  isOpen,
  onClose,
  garments = DEFAULT_GARMENTS,
  garmentMode,
  onGarmentModeChange,
  selectedGarments,
  onToggleGarment,
  isLoading = false,
}: GarmentSelectionModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-4xl">
        {/* Header (Fixed) */}
        <DialogHeader className="shrink-0 px-5 pt-4 pb-3 border-b border-border/70 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            Select Garments
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose garments to try on your selected model
          </DialogDescription>
        </DialogHeader>

        {/* Filters and Search (Fixed) */}
        <div className="shrink-0 px-5 py-3 border-b border-border/60 space-y-2.5 bg-muted/15">
          {/* Segmented Mode Toggle */}
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
                Multiple Garments
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground font-medium">
              {filteredGarments.length} items
            </span>
          </div>

          {/* Category Filter Pills (No scrollbar track) */}
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

          {/* Clean Search Input with Proper Left Padding */}
          <div className="relative flex items-center w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 text-muted-foreground/70 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search garments by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "2.35rem" }}
              className="w-full bg-background border border-border rounded-xl pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>
        </div>

        {/* Garment Grid: Portrait cards with generous gaps, exactly 2 rows visible, remaining scroll */}
          <div
            style={{ height: "380px", maxHeight: "380px" }}
            className="overflow-y-auto p-4 sm:p-5 overscroll-contain shrink-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
          >
            {isLoading ? (
              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
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
                No garments match your filter
              </div>
            ) : (
              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {filteredGarments.map((garment, idx) => {
                  const selectedIndex = selectedGarments.indexOf(garment.name);
                  const isSelected = selectedIndex !== -1;

                  return (
                    <GarmentCard
                      key={garment.id || `${garment.name}-${idx}`}
                      garment={garment}
                      isSelected={isSelected}
                      badgeNumber={garmentMode === "multiple" ? selectedIndex + 1 : undefined}
                      onSelect={() => onToggleGarment(garment.name)}
                    />
                  );
                })}
              </div>
            )}
          </div>

        {/* Footer (Fixed) */}
        <DialogFooter className="shrink-0 px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedGarments.length === 0 ? (
              <span>No garments selected</span>
            ) : (
              <span>
                <strong className="text-foreground">{selectedGarments.length}</strong>{" "}
                selected
              </span>
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

export default GarmentSelectionModal;
