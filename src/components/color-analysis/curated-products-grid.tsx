"use client";

import React, { useEffect, useState } from "react";
import { ShoppingBag, Eye, Sparkles, ArrowRight, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { fetchAllCatalogProducts } from "@/services/outfit-api";
import { OutfitProduct } from "@/types/outfit";
import { useShopifyCart } from "@/contexts/shopify-cart";
import apiClient from "@/services/api";

interface CuratedProductsGridProps {
  seasonTitle?: string;
}

export function CuratedProductsGrid({
  seasonTitle = "Seasonal Essentials",
}: CuratedProductsGridProps) {
  const { addToCart, openCart } = useShopifyCart();
  const [products, setProducts] = useState<OutfitProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const items = await fetchAllCatalogProducts();
        if (isMounted && items.length > 0) {
          const validItems = items.filter((p) => Boolean(p.image) && p.image.trim() !== "");
          setProducts(validItems.slice(0, 6)); // Display top 6 curated pieces with valid images
        }
      } catch (err) {
        console.error("Failed to load curated products:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = async (product: OutfitProduct) => {
    setAddingId(product.id);
    try {
      let variantId: string | null = null;
      try {
        const { data } = await apiClient.get(`/cart/variants/admin/${product.handle}`);
        if (data.success && data.data?.variants?.length > 0) {
          const avail = data.data.variants.find((v: any) => v.available) || data.data.variants[0];
          variantId = avail.id;
        }
      } catch {
        try {
          const { data } = await apiClient.get(`/cart/variants/${product.handle}`);
          if (data.success && data.data?.variants?.length > 0) {
            const avail = data.data.variants.find((v: any) => v.available) || data.data.variants[0];
            variantId = avail.id;
          }
        } catch {}
      }

      if (variantId) {
        await addToCart(variantId, 1);
        setAddedIds((prev) => [...prev, product.id]);
        openCart();
      }
    } catch (err) {
      console.error("Failed to add product to cart:", err);
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-border/80 bg-card p-6 flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <p className="text-xs text-muted-foreground">Loading curated luxury collection...</p>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-5 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">
              Shop Curated Palette Collection ({seasonTitle})
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Luxury garments curated to complement warm & cool skin tones
          </p>
        </div>

        <Link
          href="/virtual-try-on"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 text-foreground text-xs font-semibold transition-all cursor-pointer shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5 text-accent" />
          <span>Try On All in Studio</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="group rounded-2xl border border-border/70 bg-card overflow-hidden flex flex-col justify-between transition-all hover:border-foreground/30 hover:shadow-xs"
          >
            {/* Image Thumbnail */}
            <div className="aspect-[3/4] w-full bg-muted/20 overflow-hidden relative">
              {product.image && product.image.trim() !== "" ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-semibold">
                  {product.title.charAt(0)}
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span className="text-[9px] uppercase font-bold tracking-wider bg-background/90 backdrop-blur-xs text-foreground px-2 py-0.5 rounded-full border border-border/60">
                  {product.productType || "Apparel"}
                </span>
              </div>
            </div>

            {/* Title & Price */}
            <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground line-clamp-1">
                  {product.title}
                </p>
                <p className="text-xs font-bold text-foreground">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  disabled={addingId === product.id}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    addedIds.includes(product.id)
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                  }`}
                  title="Add to Cart"
                >
                  {addingId === product.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : addedIds.includes(product.id) ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <>
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add</span>
                    </>
                  )}
                </button>

                <Link
                  href="/virtual-try-on"
                  className="p-1.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/60 text-foreground transition-all cursor-pointer"
                  title="Virtual Try-On"
                >
                  <Eye className="w-3.5 h-3.5 text-accent" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
