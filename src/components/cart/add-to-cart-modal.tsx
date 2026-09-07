"use client";

import { useState, useEffect } from "react";
import { X, ShoppingBag, Loader2 } from "lucide-react";
import { useShopifyCart } from "@/contexts/shopify-cart";
import { cn } from "@/lib/utils";
import apiClient, { getSizeChart } from "@/services/api";

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
  productHandle?: string;
  productTitle?: string;
  productImage?: string;
  productPrice?: string;
  productSizeChart?: string | null;
  onClose: () => void;
};

export function AddToCartModal({
  items,
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-background p-5 sm:p-6 shadow-2xl animate-message-in max-h-[85dvh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {effectiveItems.length > 1
                ? `Select Sizes for Your Outfit (${effectiveItems.length} Items)`
                : "Select Size"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Choose your preferred size before adding to cart
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-xs text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <span>Fetching available sizes & stock...</span>
            </div>
          ) : effectiveItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No products selected
            </div>
          ) : (
            effectiveItems.map((item) => {
              const variants = variantsMap[item.handle] || [];
              const selectedVarId = selectedVariantsMap[item.handle];
              const availableVariants = variants.filter((v) => v.available);
              const isChartActive = activeSizeChartItem === item.handle;
              const chartRaw = sizeChartDataMap[item.handle] || productSizeChart;

              let chartData: { headers: string[]; sizes: string[][] } | null = null;
              let chartImage: string | null = null;
              let chartNotes: string | null = null;

              if (chartRaw) {
                try {
                  const parsed = JSON.parse(chartRaw);
                  chartData = typeof parsed.chart_data === "string" ? JSON.parse(parsed.chart_data) : parsed.chart_data;
                  chartImage = parsed.image ?? null;
                  chartNotes = parsed.fit_notes ?? null;
                } catch {}
              }

              return (
                <div
                  key={item.handle}
                  className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex gap-3 items-center">
                    <div className="h-16 w-16 shrink-0 rounded-xl bg-muted overflow-hidden border border-border/50">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs font-semibold text-muted-foreground">
                          {item.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground line-clamp-1">
                        {item.title}
                      </p>
                      <p className="text-xs font-bold text-foreground mt-0.5">
                        {item.price.startsWith("₹")
                          ? item.price
                          : `₹${Number(item.price).toLocaleString("en-IN")}`}
                      </p>
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div className="space-y-2 pt-1 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                        Select Size
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSizeChart(item.handle)}
                        className="text-[11px] text-accent hover:underline font-medium cursor-pointer"
                      >
                        {isChartActive ? "Hide Size Chart" : "Size Chart"}
                      </button>
                    </div>

                    {/* Size Chart View */}
                    {isChartActive && (
                      <div className="rounded-xl bg-muted/40 p-3 text-xs text-foreground space-y-2 border border-border/60 animate-in fade-in duration-200">
                        {chartImage && (
                          <img
                            src={chartImage}
                            alt="Size chart"
                            className="w-full max-h-40 object-contain rounded-lg"
                          />
                        )}
                        {chartData && (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[10px]">
                              <thead>
                                <tr className="bg-muted">
                                  {chartData.headers.map((h) => (
                                    <th key={h} className="border border-border/60 px-2 py-1 text-left font-semibold">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {chartData.sizes.map((row, idx) => (
                                  <tr key={idx}>
                                    {row.map((cell, cidx) => (
                                      <td key={cidx} className="border border-border/60 px-2 py-1">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {chartNotes && (
                          <p className="text-[10px] text-muted-foreground">{chartNotes}</p>
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

                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleSelectVariant(item.handle, v.id)}
                              className={cn(
                                "relative px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
                                isSelected
                                  ? "bg-foreground text-background border-foreground shadow-2xs scale-[1.02]"
                                  : "bg-muted/30 border-border/80 text-foreground hover:border-foreground/40 hover:bg-muted/60"
                              )}
                            >
                              <span>{label}</span>
                              {inv !== null && inv !== undefined && inv <= 5 && (
                                <span className="ml-1 text-[9px] font-bold text-amber-500">
                                  ({inv} left)
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
        <div className="pt-3 border-t border-border/60 shrink-0">
          <button
            type="button"
            onClick={handleAddAll}
            disabled={!canAdd || adding || done}
            className={cn(
              "w-full py-3.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs",
              done
                ? "bg-emerald-600 text-white"
                : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {done ? (
              <span>Added to Cart!</span>
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
                    ? `Add ${effectiveItems.length} Items to Cart — ₹${totalPrice.toLocaleString("en-IN")}`
                    : `Add to Cart — ₹${totalPrice.toLocaleString("en-IN")}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
