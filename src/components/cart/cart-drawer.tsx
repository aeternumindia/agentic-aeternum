"use client";

import { X, ShoppingBag, ExternalLink, Trash2, Percent, Minus, Plus } from "lucide-react";
import { useShopifyCart } from "@/contexts/shopify-cart";
import { CouponSection } from "./coupon-section";
import { UpsellBanner } from "./upsell-banner";

export function CartDrawer() {
  const { isOpen, closeCart, cart, itemCount, updateLine, discountSavings } = useShopifyCart();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100000]">
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
                className="flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
                aria-label="Close cart"
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
                        className="flex gap-3 rounded-xl border border-border bg-card p-3 items-center"
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
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Quantity Stepper with min 1 limit */}
                          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (line.quantity > 1) {
                                  updateLine(line.id, line.quantity - 1);
                                }
                              }}
                              disabled={line.quantity <= 1}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                              aria-label="Decrease quantity"
                              title={
                                line.quantity <= 1
                                  ? "Minimum quantity is 1 (use trash button to remove)"
                                  : "Decrease quantity"
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-mono font-medium text-foreground select-none">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateLine(line.id, line.quantity + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-all cursor-pointer"
                              aria-label="Increase quantity"
                              title="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => updateLine(line.id, 0)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            aria-label="Remove item"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border px-5 pt-4 pb-5 space-y-3 shrink-0">
                  {/* Coupon section */}
                  <CouponSection />

                  {/* Upsell banner — reactive when error, proactive when approaching threshold */}
                  <UpsellBanner />

                  {/* Discount savings line */}
                  {discountSavings > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-accent">
                        <Percent className="h-3 w-3" />
                        Discount
                      </span>
                      <span className="text-xs font-medium text-accent">
                        −₹{discountSavings.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm font-medium">
                      ₹{Number(cart.cost.subtotalAmount.amount).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Checkout button */}
                  <a
                    href={cart.checkoutUrl || "https://www.aeternumindia.com/cart"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      const targetUrl = cart.checkoutUrl || "https://www.aeternumindia.com/cart";
                      if (targetUrl) {
                        window.open(targetUrl, "_blank", "noopener,noreferrer");
                        e.preventDefault();
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer select-none"
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
