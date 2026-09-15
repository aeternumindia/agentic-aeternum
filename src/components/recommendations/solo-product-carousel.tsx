"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, User } from "lucide-react";
import type { ProductResult } from "@/types/chat";
import { getProductUrl } from "@/lib/shopify";
import { cn } from "@/lib/utils";

interface SoloProductCarouselProps {
  products: ProductResult[];
  onAddToCart: (product: ProductResult) => void;
  onTryOn: (product: ProductResult) => void;
  className?: string;
}

export function SoloProductCarousel({
  products,
  onAddToCart,
  onTryOn,
  className,
}: SoloProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Approximate active card index based on scroll position
    const cardWidth = 200 + 14; // card width + gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(index, 0), products.length - 1));
  }, [products.length]);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    const timer = setTimeout(updateScrollState, 150);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      clearTimeout(timer);
    };
  }, [updateScrollState]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 210; // width of one card + gap
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToProduct = (index: number) => {
    if (!scrollRef.current) return;
    const cardWidth = 210;
    scrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
  };

  const cleanTitle = (title: string) => {
    return (title || "").split("|")[0].trim();
  };

  const getSubtitle = (product: ProductResult) => {
    const parts = (product.title || "").split("|");
    if (parts.length > 1) {
      return parts.slice(1).join(" · ").trim();
    }
    return product.productType || "Apparel";
  };

  return (
    <div className={cn("relative group/carousel w-full mt-3 animate-fade-in", className)}>
      {/* Left Floating Carousel Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label="Scroll left to previous product"
          className="absolute -left-1.5 sm:-left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 shadow-md border border-stone-200/90 dark:border-stone-700/80 flex items-center justify-center hover:bg-[#8C3A3F] hover:text-white hover:border-[#8C3A3F] hover:scale-105 active:scale-95 transition-all backdrop-blur-md cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 -translate-x-0.5" />
        </button>
      )}

      {/* Right Floating Carousel Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label="Scroll right to next product"
          className="absolute -right-1.5 sm:-right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 shadow-md border border-stone-200/90 dark:border-stone-700/80 flex items-center justify-center hover:bg-[#8C3A3F] hover:text-white hover:border-[#8C3A3F] hover:scale-105 active:scale-95 transition-all backdrop-blur-md cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 translate-x-0.5" />
        </button>
      )}

      {/* Scrollable Container with Hidden Scrollbar */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-3.5 overflow-x-auto pb-2.5 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[160px] min-[380px]:w-[175px] sm:w-[195px] shrink-0 snap-start rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col justify-between"
          >
            {/* Clickable Image & Info Section */}
            <a
              href={getProductUrl(product.handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="block group/link"
            >
              {/* Product Image Showcase */}
              <div className="aspect-[4/5] bg-[#F4EFEA] dark:bg-stone-950/70 overflow-hidden relative group/img">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.imageAlt || product.title}
                    className="h-full w-full object-cover object-top group-hover/img:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground bg-stone-100">
                    {cleanTitle(product.title).charAt(0)}
                  </div>
                )}
                {product.productType && (
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                    {product.productType}
                  </span>
                )}
              </div>

              {/* Product Title & Subtitle */}
              <div className="p-2.5 sm:p-3 pb-1 sm:pb-1.5">
                <p
                  className="text-[11px] sm:text-xs font-medium text-stone-900 dark:text-stone-100 truncate group-hover/link:text-[#8C3A3F] transition-colors"
                  title={cleanTitle(product.title)}
                >
                  {cleanTitle(product.title)}
                </p>
                <p className="text-[10px] sm:text-[11px] text-stone-500 truncate mt-0.5">
                  {getSubtitle(product)}
                </p>
                <p className="mt-1 sm:mt-1.5 text-xs sm:text-[13px] font-semibold text-stone-950 dark:text-stone-50 font-mono">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </p>
              </div>
            </a>

            {/* Action Buttons: Add to Cart & Virtual Try-On */}
            <div className="p-2.5 sm:p-3 pt-0 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => onAddToCart(product)}
                className="w-full rounded-lg sm:rounded-xl bg-[#8C3A3F] text-white py-1.5 sm:py-2 px-2 text-[11px] sm:text-xs font-semibold hover:bg-[#772F34] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                onClick={() => onTryOn(product)}
                className="w-full rounded-lg sm:rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 py-1.5 sm:py-2 px-2 text-[11px] sm:text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800/60 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-stone-500 shrink-0" />
                <span>Try the Look</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dot Indicators */}
      {products.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {products.map((p, idx) => (
            <button
              key={p.id || idx}
              type="button"
              onClick={() => scrollToProduct(idx)}
              aria-label={`Go to product ${idx + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                idx === activeIndex
                  ? "w-5 bg-[#8C3A3F]"
                  : "w-1.5 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
