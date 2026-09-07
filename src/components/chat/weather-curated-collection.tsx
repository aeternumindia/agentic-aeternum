"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Thermometer,
  Sparkles,
  ShoppingBag,
  Eye,
  MessageSquare,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useLocationWeather } from "@/hooks/use-location-weather";
import { fetchAllCatalogProducts } from "@/services/outfit-api";
import { OutfitProduct } from "@/types/outfit";
import { useShopifyCart } from "@/contexts/shopify-cart";
import apiClient from "@/services/api";
import { AddToCartModal } from "@/components/cart/add-to-cart-modal";

interface WeatherCuratedCollectionProps {
  onAskAura: (prompt: string) => void;
  disabled?: boolean;
}

export function WeatherCuratedCollection({
  onAskAura,
  disabled = false,
}: WeatherCuratedCollectionProps) {
  const weather = useLocationWeather();
  const { addToCart, openCart } = useShopifyCart();
  const [products, setProducts] = useState<OutfitProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [cartModalProduct, setCartModalProduct] = useState<OutfitProduct | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadCatalogue() {
      try {
        const allProducts = await fetchAllCatalogProducts();
        if (isMounted && allProducts.length > 0) {
          const valid = allProducts.filter(
            (p) => Boolean(p.image) && p.image.trim() !== ""
          );

          let filtered = valid;
          if (weather.tempC >= 24) {
            const warmItems = valid.filter((p) => {
              const type = (p.productType || "").toLowerCase();
              return (
                type.includes("shirt") ||
                type.includes("polo") ||
                type.includes("trouser") ||
                type.includes("linen")
              );
            });
            if (warmItems.length >= 4) filtered = warmItems;
          } else {
            const coolItems = valid.filter((p) => {
              const type = (p.productType || "").toLowerCase();
              return (
                type.includes("jacket") ||
                type.includes("suit") ||
                type.includes("blazer") ||
                type.includes("overcoat")
              );
            });
            if (coolItems.length >= 4) filtered = coolItems;
          }

          setProducts(filtered.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch weather collection:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalogue();
    return () => {
      isMounted = false;
    };
  }, [weather.tempC]);

  const handleAddToCart = (product: OutfitProduct) => {
    setCartModalProduct(product);
  };

  return (
    <div className="w-full space-y-2.5 text-left animate-in fade-in duration-300" suppressHydrationWarning>
      {/* Location & Weather Banner Card (Compact) */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-card via-muted/20 to-accent/10 border border-border/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* Location Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0 shadow-2xs">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  {weather.city}, {weather.country}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {weather.icon} {weather.tempC}°C • {weather.condition}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight max-w-lg line-clamp-1">
                {weather.stylistNote}
              </p>
            </div>
          </div>

          {/* Quick AI Stylist Prompt Button */}
          <button
            type="button"
            onClick={() => onAskAura(weather.promptText)}
            disabled={disabled}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-foreground text-background text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Ask Aura for {weather.tempC}°C Outfits</span>
          </button>
        </div>
      </div>

      {/* Curated Catalogue Collection Grid */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-accent" />
            Curated Climate Edit for {weather.city} ({weather.tempC}°C)
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            Aeternum Catalogue
          </span>
        </div>

        {loading ? (
          <div className="p-4 rounded-xl border border-border/70 bg-card flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>Curating climate-matched luxury garments...</span>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {products.map((product) => (
              <div
                key={product.id}
                className="group rounded-xl border border-border/70 bg-card overflow-hidden flex flex-col justify-between transition-all hover:border-foreground/30 hover:shadow-2xs"
              >
                {/* Portrait Image Thumbnail */}
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
                  <div className="absolute top-1.5 right-1.5">
                    <span className="text-[8px] uppercase font-bold tracking-wider bg-background/90 backdrop-blur-xs text-foreground px-1.5 py-0.5 rounded-full border border-border/60">
                      {product.productType || "Apparel"}
                    </span>
                  </div>
                </div>

                {/* Title & Price */}
                <div className="p-2 space-y-1 flex-1 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-foreground line-clamp-1 leading-tight">
                      {product.title}
                    </p>
                    <p className="text-[11px] font-bold text-foreground">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-0.5">
                    {/* Add to Cart */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={addingId === product.id}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        addedIds.includes(product.id)
                          ? "bg-emerald-600 text-white"
                          : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                      }`}
                      title="Add to Cart"
                    >
                      {addingId === product.id ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : addedIds.includes(product.id) ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : (
                        <>
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>

                    {/* Ask Aura about product */}
                    <button
                      type="button"
                      onClick={() =>
                        onAskAura(
                          `Tell me how ${product.title} suits ${weather.city}'s ${weather.tempC}°C climate and suggest styling options.`
                        )
                      }
                      disabled={disabled}
                      className="p-1 rounded-lg border border-border bg-muted/20 hover:bg-muted/60 text-foreground transition-all cursor-pointer"
                      title="Ask Aura about styling"
                    >
                      <MessageSquare className="w-3 h-3 text-accent" />
                    </button>

                    {/* Virtual Try On */}
                    <Link
                      href="/virtual-try-on"
                      className="p-1 rounded-lg border border-border bg-muted/20 hover:bg-muted/60 text-foreground transition-all cursor-pointer"
                      title="Virtual Try-On"
                    >
                      <Eye className="w-3 h-3 text-accent" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Add To Cart Size Selector Modal */}
      {cartModalProduct && (
        <AddToCartModal
          productHandle={cartModalProduct.handle}
          productTitle={cartModalProduct.title}
          productImage={cartModalProduct.image}
          productPrice={`₹${Number(cartModalProduct.price).toLocaleString("en-IN")}`}
          onClose={() => setCartModalProduct(null)}
        />
      )}
    </div>
  );
}
