"use client";

import { X, ShoppingBag, ExternalLink, Trash2 } from "lucide-react";
import { useShopifyCart } from "@/contexts/shopify-cart";

export function CartDrawer() {
  const { isOpen, closeCart, cart, itemCount, updateLine } = useShopifyCart();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeCart} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-background border-l border-border shadow-xl flex flex-col animate-message-in">
            <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Cart {itemCount > 0 && `(${itemCount})`}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!cart || cart.lines.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {cart.lines.map((line) => {
                    const img = line.merchandise.product.featuredImage;
                    return (
                      <div
                        key={line.id}
                        className="flex gap-3 rounded-xl border border-border bg-card p-3"
                      >
                        <div className="h-16 w-16 shrink-0 rounded-lg bg-muted overflow-hidden">
                          {img?.url ? (
                            <img
                              src={img.url}
                              alt={img.altText || line.merchandise.product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              {line.merchandise.product.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">
                            {line.merchandise.product.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {line.merchandise.title}
                          </p>
                          <p className="text-xs text-accent mt-1">
                            ₹{Number(line.merchandise.price.amount).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">×{line.quantity}</span>
                          <button
                            onClick={() => updateLine(line.id, 0)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border p-5 space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm font-medium">
                      ₹{Number(cart.cost.subtotalAmount.amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <a
                    href={cart.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Checkout
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
