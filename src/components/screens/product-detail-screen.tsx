"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, Check } from "lucide-react";
import type { Product, CartItem } from "@/types/product";

type ProductDetailScreenProps = {
  product: Product;
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
};

export function ProductDetailScreen({ product, onAddToCart, onBack }: ProductDetailScreenProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    if (!selectedSize) return;
    const item: CartItem = {
      id: crypto.randomUUID(),
      product,
      quantity: 1,
      selectedSize,
      selectedColor: selectedColor || product.colors[0] || "Default",
      customizations: [],
    };
    onAddToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="px-4 sm:px-6 pb-6 animate-fade-in">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="aspect-[4/5] w-full sm:w-80 shrink-0 rounded-xl bg-muted overflow-hidden">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              {product.title.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {product.category}
          </p>
          <h2 className="text-xl font-medium text-foreground">
            {product.title}
          </h2>
          <p className="text-lg text-accent font-medium">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
          {product.material && (
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">Material:</span> {product.material}
            </p>
          )}

          {product.colors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`
                      rounded-lg border px-3 py-1.5 text-sm transition-all
                      ${selectedColor === color
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-muted-foreground"
                      }
                    `}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Size <span className="text-muted-foreground font-normal">(required)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`
                    rounded-lg border px-4 py-2 text-sm transition-all
                    ${selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-muted-foreground"
                    }
                  `}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            disabled={!selectedSize}
            onClick={handleAddToCart}
            className="mt-2 w-full sm:w-auto"
          >
            {added ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Added to Cart
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
