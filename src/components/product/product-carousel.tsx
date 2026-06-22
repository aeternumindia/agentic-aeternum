"use client";

import type { Product } from "@/types/product";
import { ProductCard } from "./product-card";
import { ScrollArea } from "@/components/ui/scroll-area";

type ProductCarouselProps = {
  products: Product[];
  onCustomize?: (product: Product) => void;
};

export function ProductCarousel({
  products,
  onCustomize,
}: ProductCarouselProps) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-2">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onCustomize={onCustomize}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
