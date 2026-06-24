"use client";

import { X } from "lucide-react";
import { VirtualTryOnScreen } from "@/components/screens/virtual-try-on-screen";
import type { CartItem } from "@/types/product";

type TryOnDrawerProps = {
  productTitle: string;
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
  onClose: () => void;
};

export function TryOnDrawer({
  productTitle,
  onAddToCart,
  onBack,
  onClose,
}: TryOnDrawerProps) {
  return (
    <div className="w-full border-l border-border bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Virtual Try-On</p>
          <p className="text-sm font-medium text-foreground truncate">
            {productTitle}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex shrink-0 items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <VirtualTryOnScreen
        onAddToCart={onAddToCart}
        onBack={onBack}
        productSizes={["XS", "S", "M", "L", "XL", "XXL"]}
      />
    </div>
  );
}
