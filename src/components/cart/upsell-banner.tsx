"use client";

import { useState } from "react";
import { X, Sparkles, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useShopifyCart } from "@/contexts/shopify-cart";

const UPSELL_STORAGE_KEY = "aeternum_coupon_upsell";
const PROACTIVE_DISMISS_KEY = "aeternum_upsell_dismissed";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type CachedUpsell = {
  code: string;
  minimumAmount: number;
  timestamp: number;
};

function readCachedUpsell(): CachedUpsell | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(UPSELL_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedUpsell;
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(UPSELL_STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function readProactiveDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PROACTIVE_DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

function writeProactiveDismissed() {
  try {
    localStorage.setItem(PROACTIVE_DISMISS_KEY, "true");
  } catch { /* noop */ }
}

export function UpsellBanner() {
  const router = useRouter();
  const { discount, cart, dismissUpsell, closeCart } = useShopifyCart();
  const [cached] = useState<CachedUpsell | null>(() => readCachedUpsell());
  const [proactiveDismissed, setProactiveDismissed] = useState(() => readProactiveDismissed());

  const subtotal = cart
    ? Number.parseFloat(cart.cost.subtotalAmount.amount)
    : 0;

  // ── Reactive: min_not_met error ─────────────────────────────────────────
  if (
    discount.status === "error" &&
    discount.error?.code === "min_not_met" &&
    !discount.upsellDismissed
  ) {
    const minAmt = discount.minimumAmount ?? 0;
    const shortfall = Math.max(0, minAmt - subtotal);
    const progress = minAmt > 0 ? Math.min(100, (subtotal / minAmt) * 100) : 0;

    return (
      <UpsellCard
        progress={progress}
        code={discount.code}
        message={`Add ${formatPrice(shortfall)} more to unlock`}
        accent="amber"
        currentSubtotal={subtotal}
        onBrowse={() => {
          closeCart();
          router.push("/ai-shopping");
        }}
        onDismiss={dismissUpsell}
      />
    );
  }

  // ── Proactive: cached threshold, approaching savings ────────────────────
  const hasAppliedDiscount =
    cart?.discountCodes?.some((dc) => dc.applicable) ?? false;

  if (
    !proactiveDismissed &&
    !hasAppliedDiscount &&
    subtotal > 0 &&
    cached &&
    subtotal < cached.minimumAmount
  ) {
    const threshold = cached.minimumAmount;
    const progress = Math.min(100, (subtotal / threshold) * 100);

    // Only show when past 50% of threshold
    if (progress >= 50) {
      const shortfall = Math.max(0, threshold - subtotal);
      const isUrgent = progress >= 80;
      const codeHint = cached.code;

      return (
        <UpsellCard
          progress={progress}
          code={codeHint}
          message={
            isUrgent
              ? `Only ${formatPrice(shortfall)} away from saving!`
              : `Add ${formatPrice(shortfall)} more to save with ${codeHint}`
          }
          accent={isUrgent ? "emerald" : "amber"}
          currentSubtotal={subtotal}
          onBrowse={() => {
            closeCart();
            router.push("/ai-shopping");
          }}
          onDismiss={() => {
            setProactiveDismissed(true);
            writeProactiveDismissed();
          }}
        />
      );
    }
  }

  return null;
}

// ── Shared card sub-component ──────────────────────────────────────────────

function UpsellCard({
  progress,
  code,
  message,
  accent,
  currentSubtotal,
  onBrowse,
  onDismiss,
}: {
  progress: number;
  code: string;
  message: string;
  accent: "amber" | "emerald";
  currentSubtotal: number;
  onBrowse: () => void;
  onDismiss: () => void;
}) {
  const barColor = accent === "emerald" ? "bg-emerald-500" : "bg-amber-500";
  const textColor = accent === "emerald" ? "text-emerald-600" : "text-amber-600";
  const borderColor = accent === "emerald" ? "border-emerald-500/30" : "border-amber-500/30";
  const bgColor = accent === "emerald" ? "bg-emerald-500/5" : "bg-amber-500/5";
  const bgLight = accent === "emerald" ? "bg-emerald-500/10" : "bg-amber-500/10";

  return (
    <div
      className={`rounded-lg border ${borderColor} ${bgColor} p-3 space-y-2`}
      role="status"
      aria-live="polite"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className={`h-4 w-4 shrink-0 ${textColor}`} />
          <p className={`text-xs font-medium ${textColor} truncate`}>
            {message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, progress)}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground/60">
          <span>{formatPrice(currentSubtotal)}</span>
          <span className="font-medium">
            {Math.round(progress)}%
          </span>
          <span>{code}</span>
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={onBrowse}
        className={`flex w-full items-center justify-center gap-1.5 rounded-lg ${bgLight} ${textColor} py-2 text-xs font-medium hover:opacity-80 transition-opacity`}
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        Browse AI Shopping
      </button>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
