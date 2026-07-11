"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import type { OutfitProduct } from "@/types/outfit";
import { useOutfitBuilder } from "@/contexts/outfit-builder";
import {
  fetchProductsByType,
  TOP_TYPES,
  BOTTOM_TYPES,
} from "@/services/outfit-api";

type StepProductBrowserProps = {
  category: "top" | "bottom";
  onSelect: (pickedCategory: "top" | "bottom") => void;
  onBack: () => void;
};

export function StepProductBrowser({
  category,
  onSelect,
  onBack,
}: StepProductBrowserProps) {
  const [productType, setProductType] = useState<string>(
    category === "top" ? TOP_TYPES[0] : BOTTOM_TYPES[0]
  );
  const [products, setProducts] = useState<OutfitProduct[] | null>(null);
  const { setTop, setBottom, pair } = useOutfitBuilder();

  const types = category === "top" ? TOP_TYPES : BOTTOM_TYPES;
  const selectedId =
    category === "top" ? pair.top?.id : pair.bottom?.id;

  useEffect(() => {
    fetchProductsByType(productType)
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [productType]);

  function handlePick(product: OutfitProduct) {
    if (category === "top") setTop(product);
    else setBottom(product);
    onSelect(category);
  }

  return (
    <div className="animate-fade-in space-y-6 flex-1">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div>
        <h2 className="text-xl font-semibold text-foreground capitalize">
          Choose a {category === "top" ? "Top" : "Bottom"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Select a product type to browse
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setProductType(type)}
            className={`rounded-lg border px-4 py-2 text-xs transition-all ${
              productType === type
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-muted-foreground"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {products === null ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          No products found in this category
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          {products.map((product) => {
            const isSelected = product.id === selectedId;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => handlePick(product)}
                className={`group relative rounded-xl border overflow-hidden text-left transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-muted-foreground"
                }`}
              >
                {isSelected && (
                  <>
                    <span className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="absolute bottom-0 left-0 right-0 z-10 bg-primary/90 py-1.5 text-center text-[10px] font-medium text-primary-foreground">
                      Change
                    </span>
                  </>
                )}
                <div className="aspect-[4/5] bg-muted">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                      {product.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-foreground truncate">
                    {product.title}
                  </p>
                  <p className="mt-0.5 text-xs text-accent">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
