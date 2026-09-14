"use client";

import { useState } from "react";
import { ShoppingBag, User, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import type { OutfitRecommendation, OutfitProduct } from "@/types/chat";
import { getProductUrl } from "@/lib/shopify";
import { cn } from "@/lib/utils";

export type OutfitCardProps = {
  outfit: OutfitRecommendation;
  onShopTheLook: (outfit: OutfitRecommendation) => void;
  onTryTheLook: (outfit: OutfitRecommendation) => void;
};

export function OutfitCard({ outfit, onShopTheLook, onTryTheLook }: OutfitCardProps) {
  const [isWhyOpen, setIsWhyOpen] = useState(false);

  const formatPrice = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num)) return "₹0";
    return `₹${Math.round(num).toLocaleString("en-IN")}`;
  };

  const rank = outfit.rank || 1;
  const scoreText = outfit.scoreFormatted || `${(outfit.compatibilityScore / 10).toFixed(1)}/10`;

  const cleanTitle = (p: OutfitProduct) => {
    return (p.title || "").split("|")[0].trim();
  };

  const getVariantSubtitle = (p: OutfitProduct) => {
    const parts = (p.title || "").split("|");
    if (parts.length > 1) {
      return parts.slice(1).join(" · ").trim();
    }
    return p.productType || "Apparel";
  };

  return (
    <div className="w-[285px] min-[380px]:w-[320px] sm:w-[360px] md:w-[375px] shrink-0 rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      {/* ── TOP HERO STUDIO AREA ────────────────────────────────────────── */}
      <div className="bg-[#F4EFEA] dark:bg-stone-950/70 p-3.5 sm:p-5 pb-3 sm:pb-4 border-b border-stone-200/60 dark:border-stone-800 flex flex-col justify-between">
        {/* Top Badges Bar: [Rank] [Badge] ... [Score] */}
        <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1C1917] text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center shrink-0">
              {rank}
            </span>
            <span
              className={cn(
                "px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium tracking-wide",
                rank === 1
                  ? "bg-[#1C1917] text-white"
                  : "bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
              )}
            >
              {outfit.matchLabel}
            </span>
          </div>

          <div className="px-2 sm:px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-[10px] sm:text-xs font-semibold border border-black/5 shadow-2xs font-mono">
            {scoreText}
          </div>
        </div>

        {/* Hero Visual & Typography Layout */}
        <div className="grid grid-cols-[1fr_105px] min-[380px]:grid-cols-[1fr_120px] sm:grid-cols-[1fr_135px] gap-2.5 sm:gap-3 items-stretch">
          {/* Left: Personality Persona & Editorial Description */}
          <div className="flex flex-col justify-between pr-1">
            <div>
              <h3 className="font-serif text-lg min-[380px]:text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917] dark:text-stone-100 leading-snug sm:leading-tight">
                {outfit.title}
              </h3>
              <p className="text-[9px] sm:text-[11px] font-mono tracking-widest text-stone-500 uppercase mt-0.5">
                {outfit.styleTag}
              </p>

              <p className="text-[11px] sm:text-xs leading-relaxed text-stone-700 dark:text-stone-300 mt-1.5 sm:mt-2.5 line-clamp-3 sm:line-clamp-4 font-normal">
                {outfit.description}
              </p>
            </div>

            <div className="mt-2 sm:mt-2.5 pt-0.5 sm:pt-1">
              {outfit.accentNote && (
                <p className="font-cursive text-xs sm:text-base md:text-lg text-[#6B5E54] dark:text-stone-400 block mb-0.5 leading-tight">
                  {outfit.accentNote}
                </p>
              )}

              <button
                type="button"
                onClick={() => setIsWhyOpen(!isWhyOpen)}
                className="text-[11px] sm:text-xs font-medium text-stone-900 dark:text-stone-100 hover:text-[#8C3A3F] inline-flex items-center gap-1 transition-colors cursor-pointer group"
              >
                <span>Why this works</span>
                {isWhyOpen ? (
                  <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform" />
                ) : (
                  <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>
            </div>
          </div>

          {/* Right: Editorial Dual-Split Garment Showcase */}
          <div className="rounded-xl overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs flex flex-col">
            {/* Top Crop: Shirt */}
            <a
              href={getProductUrl(outfit.shirt.handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex-1 block overflow-hidden group/shirt border-b border-stone-200/60 dark:border-stone-800"
              title={outfit.shirt.title}
            >
              {outfit.shirt.image ? (
                <img
                  src={outfit.shirt.image}
                  alt={outfit.shirt.imageAlt || outfit.shirt.title}
                  className="h-full w-full object-cover object-top group-hover/shirt:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground bg-stone-100">
                  Shirt
                </div>
              )}
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                Top
              </span>
            </a>

            {/* Bottom Crop: Trouser */}
            <a
              href={getProductUrl(outfit.trouser.handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex-1 block overflow-hidden group/trouser"
              title={outfit.trouser.title}
            >
              {outfit.trouser.image ? (
                <img
                  src={outfit.trouser.image}
                  alt={outfit.trouser.imageAlt || outfit.trouser.title}
                  className="h-full w-full object-cover object-center group-hover/trouser:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground bg-stone-100">
                  Trouser
                </div>
              )}
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                Bottom
              </span>
            </a>
          </div>
        </div>

        {/* Expandable "Why This Works" Styling Drawer */}
        {isWhyOpen && (
          <div className="mt-2.5 sm:mt-3 p-2.5 sm:p-3 rounded-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 text-[11px] sm:text-xs text-stone-800 dark:text-stone-200 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider text-stone-500 mb-1">
              Stylist Breakdown
            </p>
            {outfit.whyThisWorks}
          </div>
        )}
      </div>

      {/* ── LOWER TRANSACTIONAL BREAKDOWN SECTION ──────────────────────── */}
      <div className="p-3.5 sm:p-5 pt-3 sm:pt-3.5 space-y-3 sm:space-y-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-[11px] sm:text-xs font-bold text-stone-800 dark:text-stone-200 tracking-tight mb-2 sm:mb-2.5">
            Products in this look (2)
          </h4>

          {/* Product 1: Shirt */}
          <div className="flex items-center gap-2.5 sm:gap-3 py-1.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/60 p-0.5 overflow-hidden shrink-0 flex items-center justify-center">
              {outfit.shirt.image ? (
                <img
                  src={outfit.shirt.image}
                  alt={outfit.shirt.title}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs font-serif text-muted-foreground">S</span>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <a
                href={getProductUrl(outfit.shirt.handle)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs font-medium text-stone-900 dark:text-stone-100 truncate block hover:text-[#8C3A3F] transition-colors"
                title={cleanTitle(outfit.shirt)}
              >
                {cleanTitle(outfit.shirt)}
              </a>
              <p className="text-[10px] sm:text-[11px] text-stone-500 truncate mt-0.5">
                {getVariantSubtitle(outfit.shirt)}
              </p>
            </div>

            <span className="text-[11px] sm:text-xs font-semibold text-stone-900 dark:text-stone-100 font-mono shrink-0">
              {formatPrice(outfit.shirt.price)}
            </span>
          </div>

          {/* Product 2: Trouser */}
          <div className="flex items-center gap-2.5 sm:gap-3 py-1.5 border-t border-stone-100 dark:border-stone-800/80">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/60 p-0.5 overflow-hidden shrink-0 flex items-center justify-center">
              {outfit.trouser.image ? (
                <img
                  src={outfit.trouser.image}
                  alt={outfit.trouser.title}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs font-serif text-muted-foreground">T</span>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <a
                href={getProductUrl(outfit.trouser.handle)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs font-medium text-stone-900 dark:text-stone-100 truncate block hover:text-[#8C3A3F] transition-colors"
                title={cleanTitle(outfit.trouser)}
              >
                {cleanTitle(outfit.trouser)}
              </a>
              <p className="text-[10px] sm:text-[11px] text-stone-500 truncate mt-0.5">
                {getVariantSubtitle(outfit.trouser)}
              </p>
            </div>

            <span className="text-[11px] sm:text-xs font-semibold text-stone-900 dark:text-stone-100 font-mono shrink-0">
              {formatPrice(outfit.trouser.price)}
            </span>
          </div>
        </div>

        {/* Total for the Look Row */}
        <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800 flex items-center justify-between">
          <span className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 font-medium">
            Total for the look
          </span>
          <span className="text-sm sm:text-base font-bold text-stone-950 dark:text-stone-50 font-mono tracking-tight">
            {formatPrice(outfit.totalPrice)}
          </span>
        </div>

        {/* Action Buttons: Solid Maroon "Shop the Look" & Outline "Try the Look" */}
        <div className="space-y-1.5 sm:space-y-2 pt-1">
          <button
            type="button"
            onClick={() => onShopTheLook(outfit)}
            className="w-full rounded-xl bg-[#8C3A3F] text-white py-2 sm:py-2.5 px-3.5 sm:px-4 text-[11px] sm:text-xs font-semibold hover:bg-[#772F34] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs cursor-pointer"
          >
            <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Shop the Look</span>
          </button>

          <button
            type="button"
            onClick={() => onTryTheLook(outfit)}
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 py-2 sm:py-2.5 px-3.5 sm:px-4 text-[11px] sm:text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800/60 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
          >
            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-stone-500" />
            <span>Try the Look</span>
          </button>
        </div>
      </div>
    </div>
  );
}
