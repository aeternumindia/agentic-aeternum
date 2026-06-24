"use client";

import { useState, useEffect } from "react";
import { X, ShoppingBag, Loader2 } from "lucide-react";
import { useShopifyCart } from "@/contexts/shopify-cart";
import { cn } from "@/lib/utils";
import apiClient, { getSizeChart } from "@/services/api";

type Variant = {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  available: boolean;
  inventory?: number | null;
  options: { name: string; value: string }[];
};

type AddToCartModalProps = {
  productHandle: string;
  productTitle: string;
  productImage: string;
  productPrice: string;
  productSizeChart?: string | null;
  onClose: () => void;
};

export function AddToCartModal({
  productHandle,
  productTitle,
  productImage,
  productPrice,
  productSizeChart,
  onClose,
}: AddToCartModalProps) {
  const { addToCart } = useShopifyCart();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [fetchedSizeChart, setFetchedSizeChart] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get(`/cart/variants/admin/${productHandle}`);
        if (data.success) {
          const v = data.data.variants as Variant[];
          setVariants(v);
          const firstAvailable = v.find((x) => x.available);
          if (firstAvailable) setSelectedVariantId(firstAvailable.id);
        }
      } catch {
        try {
          const { data } = await apiClient.get(`/cart/variants/${productHandle}`);
          if (data.success) {
            const v = data.data.variants as Variant[];
            setVariants(v);
            const firstAvailable = v.find((x) => x.available);
            if (firstAvailable) setSelectedVariantId(firstAvailable.id);
          }
        } catch (err) {
          console.error("Failed to load variants", err);
        }
      } finally {
        setLoading(false);
      }
    })();
    (async () => {
      try {
        const res = await getSizeChart(productHandle);
        if (res?.success && res.data) {
          setFetchedSizeChart(JSON.stringify(res.data));
        }
      } catch {}
    })();
  }, [productHandle]);

  async function handleAdd() {
    if (!selectedVariantId) return;
    setAdding(true);
    try {
      await addToCart(selectedVariantId, 1);
      setDone(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      // error
    } finally {
      setAdding(false);
    }
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const effectiveSizeChart = productSizeChart || fetchedSizeChart;

  let sizeChartData: { headers: string[]; sizes: string[][] } | null = null;
  let sizeChartImage: string | null = null;
  let sizeChartNotes: string | null = null;
  if (effectiveSizeChart) {
    try {
      const parsed = JSON.parse(effectiveSizeChart);
      if (typeof parsed.chart_data === "string") {
        try { sizeChartData = JSON.parse(parsed.chart_data); } catch {}
      } else {
        sizeChartData = parsed.chart_data ?? null;
      }
      sizeChartImage = parsed.image ?? null;
      sizeChartNotes = parsed.fit_notes ?? null;
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-background p-6 shadow-lg animate-message-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex gap-4 mb-5">
          <div className="h-20 w-20 shrink-0 rounded-lg bg-muted overflow-hidden">
            {productImage ? (
              <img src={productImage} alt={productTitle} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {productTitle.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{productTitle}</p>
            <p className="text-sm text-accent mt-0.5">{productPrice}</p>
          </div>
        </div>

        {showSizeChart && effectiveSizeChart && (
          <div className="mb-4 rounded-lg bg-muted p-3 text-xs text-foreground space-y-3">
            {sizeChartImage && (
              <img
                src={sizeChartImage}
                alt="Size chart"
                className="w-full max-h-48 object-contain rounded"
              />
            )}
            {sizeChartData && (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {sizeChartData.headers.map((h) => (
                      <th key={h} className="border border-border px-2 py-1 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeChartData.sizes.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="border border-border px-2 py-1">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {sizeChartNotes && (
              <p className="text-muted-foreground leading-relaxed">{sizeChartNotes}</p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : variants.filter((v) => v.available).length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            This product is currently out of stock
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-foreground">Size</p>
                {effectiveSizeChart && (
                  <button
                    onClick={() => setShowSizeChart(!showSizeChart)}
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    {showSizeChart ? "Hide" : "Size Chart"}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                  {variants.filter((v) => v.available).map((v) => {
                  const sizeOption = v.options.find((o) => o.name === "Size" || o.name === "Title");
                  const label = sizeOption?.value || v.title;
                  const inv = v.inventory;
                  return (
                    <div key={v.id} className="relative">
                      <button
                        onClick={() => setSelectedVariantId(v.id)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm transition-all",
                          selectedVariantId === v.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:border-muted-foreground"
                        )}
                      >
                        {label}
                      </button>
                      {inv !== null && inv !== undefined && inv <= 5 && (
                        <span className="absolute -top-1.5 -right-1.5 text-[10px] font-medium text-muted-foreground bg-background px-1 rounded border">
                          {inv === 0 ? "Sold out" : `${inv} left`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={!selectedVariantId || adding || done}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all",
                done
                  ? "bg-green-600 text-white"
                  : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              )}
            >
              {done ? (
                "Added to Cart!"
              ) : adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Add to Cart — ₹{selectedVariant ? Number(selectedVariant.price.amount).toLocaleString("en-IN") : productPrice.replace(/[^0-9]/g, "")}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
