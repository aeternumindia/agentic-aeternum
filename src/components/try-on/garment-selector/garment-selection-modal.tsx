"use client";

import React, { useState } from "react";
import { Check, Search } from "lucide-react";
import { GarmentItem, DEFAULT_GARMENTS } from "./garment-selector";
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
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
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
                style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}
                className="grid grid-cols-2 gap-4"
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
                style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}
                className="grid grid-cols-2 gap-4"
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
                      <div className="w-full aspect-[3/4] relative bg-muted/20 overflow-hidden flex items-center justify-center">
                        <img
                          src={garment.image}
                          alt={garment.name}
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Subtle hover vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Selection Badge in Top Right */}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-foreground text-background px-2 py-0.5 rounded-full shadow-md text-[10px] font-semibold tracking-wider uppercase animate-in fade-in zoom-in-75 duration-200">
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
