"use client";

import { useState, useEffect } from "react";
import { X, ShoppingBag, Loader2, Ruler, Check } from "lucide-react";
import { useShopifyCart } from "@/contexts/shopify-cart";
import { cn } from "@/lib/utils";
import apiClient, { getSizeChart } from "@/services/api";
import { filterSizeChartToShopifySizes } from "@/services/virtual-try-on";

export type AddToCartItem = {
  handle: string;
  title: string;
  image: string;
  price: string;
  category?: string;
};

type Variant = {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  available: boolean;
  inventory?: number | null;
  options: { name: string; value: string }[];
};

type AddToCartModalProps = {
  items?: AddToCartItem[];
  outfitTitle?: string;
  productHandle?: string;
  productTitle?: string;
  productImage?: string;
  productPrice?: string;
  productSizeChart?: string | null;
  onClose: () => void;
};

function parseProductDisplay(rawTitle: string) {
  const parts = rawTitle.split("|").map((s) => s.trim()).filter(Boolean);
  const mainTitle = parts[0] || rawTitle;

  // Filter out pure sizing indicators (e.g., M, L, XL, 32, 34, 38)
  const isSizeToken = (token: string) =>
    /^(xs|s|m|l|xl|xxl|2xl|3xl|28|30|32|34|36|38|40|42|44|46)$/i.test(token.trim());

  const secondaryParts = parts.slice(1).filter((p) => !isSizeToken(p));
  const subtitle = secondaryParts.length > 0 ? secondaryParts.join(" · ") : null;

  return { mainTitle, subtitle };
}

export function AddToCartModal({
  items,
  outfitTitle,
  productHandle,
  productTitle,
  productImage,
  productPrice,
  productSizeChart,
  onClose,
}: AddToCartModalProps) {
  const { addToCart, openCart } = useShopifyCart();

  // Normalize single vs multiple items
  const effectiveItems: AddToCartItem[] =
    items && items.length > 0
      ? items
      : productHandle
      ? [
          {
            handle: productHandle,
            title: productTitle || "",
            image: productImage || "",
            price: productPrice || "",
          },
        ]
      : [];

  const [variantsMap, setVariantsMap] = useState<Record<string, Variant[]>>({});
  const [selectedVariantsMap, setSelectedVariantsMap] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const [activeSizeChartItem, setActiveSizeChartItem] = useState<string | null>(null);
  const [sizeChartDataMap, setSizeChartDataMap] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    let isMounted = true;

    async function loadAllVariants() {
      setLoading(true);
      const newVariantsMap: Record<string, Variant[]> = {};
      const newSelectedMap: Record<string, string> = {};

      for (const item of effectiveItems) {
        try {
          let v: Variant[] = [];
          try {
            const { data } = await apiClient.get(
              `/cart/variants/admin/${item.handle}`
            );
            if (data.success && data.data?.variants?.length > 0) {
              v = data.data.variants as Variant[];
            }
          } catch {
            const { data } = await apiClient.get(
              `/cart/variants/${item.handle}`
            );
            if (data.success && data.data?.variants?.length > 0) {
              v = data.data.variants as Variant[];
            }
          }

          if (v.length > 0) {
            newVariantsMap[item.handle] = v;
            const firstAvail = v.find((x) => x.available) || v[0];
            newSelectedMap[item.handle] = firstAvail.id;
          }
        } catch (err) {
          console.error(`Failed to load variants for ${item.handle}`, err);
        }
      }

      if (isMounted) {
        setVariantsMap(newVariantsMap);
        setSelectedVariantsMap(newSelectedMap);
        setLoading(false);
      }
    }

    if (effectiveItems.length > 0) {
      loadAllVariants();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [items, productHandle]);

  const handleSelectVariant = (handle: string, variantId: string) => {
    setSelectedVariantsMap((prev) => ({
      ...prev,
      [handle]: variantId,
    }));
  };

  const toggleSizeChart = async (handle: string) => {
    if (activeSizeChartItem === handle) {
      setActiveSizeChartItem(null);
      return;
    }

    if (!sizeChartDataMap[handle]) {
      try {
        const res = await getSizeChart(handle);
        if (res?.success && res.data) {
          setSizeChartDataMap((prev) => ({
            ...prev,
            [handle]: JSON.stringify(res.data),
          }));
        }
      } catch {}
    }
    setActiveSizeChartItem(handle);
  };

  const handleAddAll = async () => {
    setAdding(true);
    try {
      for (const item of effectiveItems) {
        const selectedVarId = selectedVariantsMap[item.handle];
        if (selectedVarId) {
          await addToCart(selectedVarId, 1);
        }
      }
      setDone(true);
      openCart();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Failed adding items to cart:", err);
    } finally {
      setAdding(false);
    }
  };

  // Calculate total price
  let totalPrice = 0;
  effectiveItems.forEach((item) => {
    const selectedVarId = selectedVariantsMap[item.handle];
    const variants = variantsMap[item.handle] || [];
    const matched = variants.find((v) => v.id === selectedVarId);
    if (matched) {
      totalPrice += Number(matched.price.amount || 0);
    } else {
      const parsed = Number(item.price.replace(/[^0-9.]/g, ""));
      if (!isNaN(parsed)) totalPrice += parsed;
    }
  });

  const canAdd =
    effectiveItems.length > 0 &&
    effectiveItems.every((item) => Boolean(selectedVariantsMap[item.handle]));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-[#FAF8F5] dark:bg-[#14171A] border border-stone-200/90 dark:border-stone-800/80 shadow-2xl animate-message-in max-h-[88dvh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 pb-3.5 sm:pb-4 border-b border-stone-200/70 dark:border-stone-800/80 bg-white/80 dark:bg-[#1A1D20]/80 backdrop-blur-xs flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-[#8C3A3F] dark:text-[#E8A598]">
                {effectiveItems.length > 1 ? "Curated Ensemble" : "Sizing Selection"}
              </span>
              {effectiveItems.length > 1 && (
                <span className="px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-[10px] font-mono text-stone-600 dark:text-stone-300 font-medium">
                  {effectiveItems.length} Pieces
                </span>
              )}
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-snug">
              {outfitTitle
                ? outfitTitle
                : effectiveItems.length > 1
                ? "Select Sizes for Your Outfit"
                : "Select Your Size"}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {effectiveItems.length > 1
                ? "Choose your preferred fit for each garment before adding to cart"
                : "Choose your preferred size before checkout"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 pr-3 sm:pr-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-xs text-stone-500">
              <Loader2 className="h-6 w-6 animate-spin text-[#8C3A3F]" />
              <span className="font-medium tracking-wide">Fetching tailored sizing & stock...</span>
            </div>
          ) : effectiveItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-500">
              No garments selected
            </div>
          ) : (
            effectiveItems.map((item) => {
              const variants = variantsMap[item.handle] || [];
              const selectedVarId = selectedVariantsMap[item.handle];
              const availableVariants = variants.filter((v) => v.available);
              const isChartActive = activeSizeChartItem === item.handle;
              const chartRaw = sizeChartDataMap[item.handle] || productSizeChart;

              const { mainTitle, subtitle } = parseProductDisplay(item.title);
              const selectedVariant = variants.find((v) => v.id === selectedVarId);
              const selectedSizeOpt =
                selectedVariant?.options?.find(
                  (o: any) =>
                    o.name.toLowerCase() === "size" || o.name.toLowerCase() === "title"
                ) || selectedVariant?.options?.[0];
              const currentSelectedSize = selectedSizeOpt?.value || selectedVariant?.title;

              const formattedItemPrice = () => {
                if (selectedVariant?.price?.amount) {
                  return `₹${Math.round(Number(selectedVariant.price.amount)).toLocaleString("en-IN")}`;
                }
                if (item.price.startsWith("₹")) return item.price;
                const num = Number(item.price.replace(/[^0-9.]/g, ""));
                return isNaN(num) ? item.price : `₹${Math.round(num).toLocaleString("en-IN")}`;
              };

              const shopifySizes = Array.from(
                new Set(
                  variants
                    .map((v) => {
                      const opt =
                        v.options?.find(
                          (o: any) =>
                            o.name.toLowerCase() === "size" || o.name.toLowerCase() === "title"
                        ) || v.options?.[0];
                      return opt?.value || v.title;
                    })
                    .filter(Boolean)
                )
              );

              let chartData: { headers: string[]; sizes: string[][] } | null = null;
              let chartImage: string | null = null;
              let chartNotes: string | null = null;

              if (chartRaw) {
                try {
                  const parsed = JSON.parse(chartRaw);
                  const rawData =
                    typeof parsed.chart_data === "string"
                      ? JSON.parse(parsed.chart_data)
                      : parsed.chart_data;
                  chartData =
                    (filterSizeChartToShopifySizes(rawData, shopifySizes) as any) || rawData;
                  chartImage = parsed.image ?? null;
                  chartNotes = parsed.fit_notes ?? null;
                } catch {}
              }

              return (
                <div
                  key={item.handle}
                  className="rounded-xl border border-stone-200/90 dark:border-stone-800/90 bg-white dark:bg-[#1A1D20] p-3.5 sm:p-4 space-y-3.5 shadow-2xs hover:border-stone-300 dark:hover:border-stone-700 transition-all"
                >
                  <div className="flex gap-3.5 items-start">
                    {/* Portrait Product Thumbnail */}
                    <div className="w-16 h-22 sm:w-18 sm:h-24 shrink-0 rounded-lg bg-stone-50 dark:bg-stone-800/80 overflow-hidden border border-stone-200/80 dark:border-stone-700/60 relative flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={mainTitle}
                          className="h-full w-full object-cover object-top"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-serif font-semibold text-stone-400">
                          {mainTitle.charAt(0)}
                        </div>
                      )}
                      {item.category && (
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-sm bg-black/75 backdrop-blur-xs text-[9px] font-mono uppercase tracking-wider text-white font-medium">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Product Information */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 line-clamp-1 leading-snug">
                          {mainTitle}
                        </h4>
                        {subtitle && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                            {subtitle}
                          </p>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-stone-100 dark:border-stone-800/60">
                        <span className="text-xs sm:text-sm font-semibold font-mono text-stone-950 dark:text-stone-50">
                          {formattedItemPrice()}
                        </span>
                        {currentSelectedSize && (
                          <span className="text-[10px] sm:text-[11px] font-medium text-stone-500 dark:text-stone-400">
                            Size:{" "}
                            <span className="font-semibold text-stone-900 dark:text-stone-200 font-mono">
                              {currentSelectedSize}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div className="space-y-2 pt-2.5 border-t border-stone-100 dark:border-stone-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold text-stone-500 uppercase tracking-widest">
                        Select Size
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSizeChart(item.handle)}
                        className="inline-flex items-center gap-1 text-[11px] text-[#8C3A3F] dark:text-[#E8A598] hover:underline font-medium cursor-pointer"
                      >
                        <Ruler className="w-3 h-3" />
                        <span>{isChartActive ? "Hide Size Chart" : "Size Chart"}</span>
                      </button>
                    </div>

                    {/* Size Chart View */}
                    {isChartActive && (
                      <div className="rounded-lg bg-stone-50 dark:bg-stone-800/50 p-3 text-xs text-stone-900 dark:text-stone-100 space-y-2 border border-stone-200/80 dark:border-stone-700/60 animate-in fade-in duration-200">
                        {chartImage && (
                          <img
                            src={chartImage}
                            alt="Size chart"
                            className="w-full max-h-40 object-contain rounded-md"
                          />
                        )}
                        {chartData && (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[10px]">
                              <thead>
                                <tr className="bg-stone-100 dark:bg-stone-800">
                                  {chartData.headers.map((h) => (
                                    <th
                                      key={h}
                                      className="border border-stone-200 dark:border-stone-700 px-2 py-1 text-left font-semibold text-stone-700 dark:text-stone-300"
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {chartData.sizes.map((row, idx) => (
                                  <tr key={idx}>
                                    {row.map((cell, cidx) => (
                                      <td
                                        key={cidx}
                                        className="border border-stone-200 dark:border-stone-700 px-2 py-1"
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {chartNotes && (
                          <p className="text-[10px] text-stone-500">{chartNotes}</p>
                        )}
                      </div>
                    )}

                    {/* Size Options Pills */}
                    {availableVariants.length === 0 ? (
                      <p className="text-xs text-destructive">Currently out of stock</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableVariants.map((v) => {
                          const sizeOpt =
                            v.options?.find(
                              (o) =>
                                o.name.toLowerCase() === "size" ||
                                o.name.toLowerCase() === "title"
                            ) || v.options?.[0];
                          const label = sizeOpt?.value || v.title;
                          const isSelected = selectedVarId === v.id;
                          const inv = v.inventory;
                          const isLowStock =
                            inv !== null && inv !== undefined && inv > 0 && inv <= 5;

                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleSelectVariant(item.handle, v.id)}
                              className={cn(
                                "min-w-[44px] h-9 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 border cursor-pointer select-none",
                                isSelected
                                  ? "bg-[#0C1926] text-white border-[#0C1926] shadow-xs font-semibold ring-1 ring-[#0C1926]/10"
                                  : "bg-stone-50/80 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700/80 text-stone-800 dark:text-stone-200 hover:border-stone-400 dark:hover:border-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                              )}
                            >
                              <span>{label}</span>
                              {isLowStock && (
                                <span
                                  className={cn(
                                    "text-[9px] px-1 py-0.5 rounded font-medium",
                                    isSelected
                                      ? "text-amber-300 font-semibold"
                                      : "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40"
                                  )}
                                >
                                  {inv} left
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Add to Cart Button */}
        <div className="p-4 sm:p-5 pt-3.5 border-t border-stone-200/70 dark:border-stone-800/80 bg-white dark:bg-[#1A1D20] shrink-0 space-y-3">
          {/* Summary Row */}
          <div className="flex items-center justify-between px-0.5">
            <div>
              <p className="text-xs font-medium text-stone-600 dark:text-stone-300">
                {effectiveItems.length > 1
                  ? `Total for Look (${effectiveItems.length} items)`
                  : "Total Price"}
              </p>
              <p className="text-[10px] text-stone-400 dark:text-stone-500">
                All taxes included
              </p>
            </div>
            <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-stone-950 dark:text-stone-50">
              ₹{Math.round(totalPrice).toLocaleString("en-IN")}
            </span>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={handleAddAll}
            disabled={!canAdd || adding || done}
            className={cn(
              "w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm",
              done
                ? "bg-emerald-700 text-white"
                : "bg-[#8C3A3F] text-white hover:bg-[#772F34] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {done ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Added to Your Bag!</span>
              </>
            ) : adding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Adding items to cart...</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {effectiveItems.length > 1
                    ? `Add Entire Look to Cart — ₹${Math.round(totalPrice).toLocaleString("en-IN")}`
                    : `Add to Cart — ₹${Math.round(totalPrice).toLocaleString("en-IN")}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
