"use client";

import { Button } from "@/components/ui/button";
import type { CartItem } from "@/types/product";

type CartScreenProps = {
  items: CartItem[];
  onCheckout: () => void;
  onBack: () => void;
};

export function CartScreen({ items, onCheckout, onBack }: CartScreenProps) {
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <div className="px-6 pb-4 text-center text-sm text-muted-foreground">
        Your cart is empty
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6 pb-4">
      <p className="text-xs text-muted-foreground">Your Shopping Cart</p>

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
            {item.product.title.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">
              {item.product.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.selectedSize} / {item.selectedColor}
            </p>
            <p className="text-xs text-accent">
              ₹{item.product.price.toLocaleString("en-IN")} × {item.quantity}
            </p>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-lg font-medium text-foreground">
          ₹{total.toLocaleString("en-IN")}
        </span>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" size="sm" onClick={onBack}>
          Continue Shopping
        </Button>
        <Button className="flex-1" size="sm" onClick={onCheckout}>
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
