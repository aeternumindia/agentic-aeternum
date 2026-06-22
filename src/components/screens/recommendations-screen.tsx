"use client";

import type { Product } from "@/types/product";
import { useRecommendations } from "@/contexts/recommendations";
import { ProductCarousel } from "@/components/product/product-carousel";
import { Skeleton } from "@/components/ui/skeleton";

type RecommendationsScreenProps = {
  onCustomize: (product: Product) => void;
};

export function RecommendationsScreen({
  onCustomize,
}: RecommendationsScreenProps) {
  const { products: apiProducts } = useRecommendations();

  if (apiProducts.length === 0) {
    return (
      <div className="flex gap-4 px-6 pb-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-72 w-[260px] shrink-0 rounded-xl" />
        ))}
      </div>
    );
  }

  const products: Product[] = apiProducts.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || "",
    price: Number(p.price),
    currency: p.currency || "INR",
    images: p.image ? [p.image] : [],
    category: p.productType || "General",
    sizes: [],
    colors: [],
    material: "",
  }));

  return (
    <div className="px-6 pb-4 animate-fade-in">
      <p className="mb-3 text-xs text-muted-foreground">
        Here are some pieces I recommend for you
      </p>
      <ProductCarousel products={products} onCustomize={onCustomize} />
    </div>
  );
}
