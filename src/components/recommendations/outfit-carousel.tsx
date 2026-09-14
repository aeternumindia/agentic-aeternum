"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { OutfitRecommendation } from "@/types/chat";
import { OutfitCard } from "./outfit-card";
import { cn } from "@/lib/utils";

interface OutfitCarouselProps {
  outfits: OutfitRecommendation[];
  onShopTheLook: (outfit: OutfitRecommendation) => void;
  onTryTheLook: (outfit: OutfitRecommendation) => void;
  className?: string;
}

export function OutfitCarousel({
  outfits,
  onShopTheLook,
  onTryTheLook,
  className,
}: OutfitCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);

    // Approximate active card index based on scroll position
    const cardWidth = 360 + 16; // card width + gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(index, 0), outfits.length - 1));
  }, [outfits.length]);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    // Initial recheck after rendering
    const timer = setTimeout(updateScrollState, 150);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      clearTimeout(timer);
    };
  }, [updateScrollState]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 370; // width of one card + gap
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToCard = (index: number) => {
    if (!scrollRef.current) return;
    const cardWidth = 360 + 16;
    scrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative group/carousel w-full", className)}>
      {/* Left Floating Carousel Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label="Scroll left to previous look"
          className="absolute left-1.5 sm:left-2 top-[36%] -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 shadow-md border border-stone-200/90 dark:border-stone-700/80 flex items-center justify-center hover:bg-[#8C3A3F] hover:text-white hover:border-[#8C3A3F] hover:scale-105 active:scale-95 transition-all backdrop-blur-md cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5 -translate-x-0.5" />
        </button>
      )}

      {/* Right Floating Carousel Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label="Scroll right to next look"
          className="absolute right-1.5 sm:right-2 top-[36%] -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 shadow-md border border-stone-200/90 dark:border-stone-700/80 flex items-center justify-center hover:bg-[#8C3A3F] hover:text-white hover:border-[#8C3A3F] hover:scale-105 active:scale-95 transition-all backdrop-blur-md cursor-pointer"
        >
          <ChevronRight className="h-5 w-5 translate-x-0.5" />
        </button>
      )}

      {/* Scrollable Container with Snapping */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar"
      >
        {outfits.map((outfit) => (
          <div key={outfit.id} className="snap-start shrink-0">
            <OutfitCard
              outfit={outfit}
              onShopTheLook={onShopTheLook}
              onTryTheLook={onTryTheLook}
            />
          </div>
        ))}
      </div>

      {/* Mobile / Visual Dot Indicators if multiple looks exist */}
      {outfits.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {outfits.map((outfit, idx) => (
            <button
              key={outfit.id}
              type="button"
              onClick={() => scrollToCard(idx)}
              aria-label={`Go to look ${idx + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                idx === activeIndex
                  ? "w-6 bg-[#8C3A3F]"
                  : "w-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
