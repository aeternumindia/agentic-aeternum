"use client";

import { useState, useRef, useEffect } from "react";
import { Tag, X, Check, Loader2, Percent } from "lucide-react";
import { useShopifyCart } from "@/contexts/shopify-cart";
import { UpsellBanner } from "./upsell-banner";

export function CouponSection() {
  const { discount, applyDiscount, removeDiscount, cart } = useShopifyCart();
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const hasAppliedCode =
    cart?.discountCodes?.some((dc) => dc.applicable) ?? false;

  // Focus input whenever the input becomes visible
  useEffect(() => {
    if (showInput && inputRef.current) inputRef.current.focus();
  }, [showInput]);

  const handleApply = () => {
    if (!inputValue.trim()) return;
    applyDiscount(inputValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleApply();
    if (e.key === "Escape") {
      setShowInput(false);
      setInputValue("");
    }
  };

  const handleRemove = () => {
    setShowInput(false);
    setInputValue("");
    removeDiscount();
  };

  // ── Applied state: show badge ──────────────────────────────────────────
  if (discount.status === "applied" || hasAppliedCode) {
    const activeCode = cart?.discountCodes?.find((dc) => dc.applicable);
    const codeText = activeCode?.code || discount.code || "";

    return (
      <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Check className="h-4 w-4 shrink-0 text-accent" />
          <span className="text-xs font-medium text-accent truncate">
            {codeText}
          </span>
          {activeCode?.amount && (
            <span className="text-xs text-accent/70 shrink-0">
              (−₹{Number(activeCode.amount.amount).toLocaleString("en-IN")})
            </span>
          )}
        </div>
        <button
          onClick={handleRemove}
          disabled={discount.status === "removing"}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0 disabled:opacity-50"
        >
          {discount.status === "removing" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
          Remove
        </button>
      </div>
    );
  }

  // ── Removing state transitional ────────────────────────────────────────
  if (discount.status === "removing") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 opacity-60">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Removing coupon…</span>
      </div>
    );
  }

  // ── Collapsed idle state ───────────────────────────────────────────────
  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground hover:border-accent/50 hover:text-accent transition-colors"
      >
        <Tag className="h-3.5 w-3.5" />
        Add coupon code
      </button>
    );
  }

  // ── Expanded state: input + apply ──────────────────────────────────────
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter coupon code"
            disabled={discount.status === "applying"}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-accent disabled:opacity-50 transition-colors"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={
            discount.status === "applying" || inputValue.trim().length < 3
          }
          className="rounded-lg bg-accent px-4 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {discount.status === "applying" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Apply"
          )}
        </button>
      </div>

      {/* Error message */}
      {discount.status === "error" && discount.error && (
        <p className="text-xs text-destructive flex items-start gap-1.5">
          <X className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{discount.error.message}</span>
        </p>
      )}

      {/* Reactive upsell: min_not_met progress-to-unlock */}
      <UpsellBanner />
    </div>
  );
}
