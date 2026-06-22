"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Product } from "@/types/product";

type CustomizationScreenProps = {
  product: Product;
  onConfirm: (options: Record<string, string>) => void;
};

export function CustomizationScreen({
  product,
  onConfirm,
}: CustomizationScreenProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[2] ?? "");
  const [selectedColor, setSelectedColor] = useState(product.colors[0] ?? "");

  return (
    <div className="space-y-5 px-6 pb-4">
      <p className="text-xs text-muted-foreground">
        Personalize your <strong>{product.title}</strong>
      </p>

      <div>
        <p className="mb-2 text-xs font-medium text-foreground">Size</p>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-xs transition-colors ${
                selectedSize === size
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-card-foreground hover:border-muted-foreground"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-foreground">Color</p>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-xs transition-colors ${
                selectedColor === color
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-card-foreground hover:border-muted-foreground"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        size="sm"
        onClick={() =>
          onConfirm({ size: selectedSize, color: selectedColor })
        }
      >
        Add to Cart
      </Button>
    </div>
  );
}
