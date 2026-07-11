"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import apiClient from "@/services/api";

const CART_STORAGE_KEY = "aeternum_cart_id";

type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
      handle: string;
      featuredImage: { url: string; altText: string | null } | null;
    };
    price: { amount: string; currencyCode: string };
  };
};

export type CartDiscountCode = {
  code: string;
  applicable: boolean;
  amount: { amount: string; currencyCode: string } | null;
};

type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
  lines: CartLine[];
  discountCodes: CartDiscountCode[];
};

/** Structured error codes returned by the backend discount endpoints */
export type DiscountErrorCode =
  | "invalid_code"
  | "expired"
  | "min_not_met"
  | "not_applicable"
  | "already_used"
  | "rate_limited"
  | "network";

export type DiscountState = {
  /** "idle" | "applying" | "applied" | "removing" | "error" */
  status: "idle" | "applying" | "applied" | "removing" | "error";
  code: string;
  error: { code: DiscountErrorCode; message: string } | null;
  /** Minimum order amount required (from min_not_met backend response) */
  minimumAmount?: number;
  /** User dismissed the upsell card */
  upsellDismissed: boolean;
};

type ShopifyCartContextValue = {
  cartId: string | null;
  cart: ShopifyCart | null;
  itemCount: number;
  isOpen: boolean;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
  setCartId: (id: string) => void;
  /** Apply a discount code to the cart */
  applyDiscount: (code: string) => Promise<void>;
  /** Remove all discount codes from the cart */
  removeDiscount: () => Promise<void>;
  /** Current discount state */
  discount: DiscountState;
  /** Compute total savings from all discount allocations (subtotal - total) */
  discountSavings: number;
  /** Dismiss the upsell banner */
  dismissUpsell: () => void;
  /** Close cart and navigate to AI shopping */
  openAiShopping: () => void;
};

const ShopifyCartContext = createContext<ShopifyCartContextValue | null>(null);

function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_STORAGE_KEY);
}

/** Friendly messages for each error code, shown below the coupon input */
export const DISCOUNT_ERROR_MESSAGES: Record<DiscountErrorCode, string> = {
  invalid_code: "This discount code isn't valid. Please check and try again.",
  expired: "This discount code has expired.",
  min_not_met: "Your order doesn't meet the minimum amount for this code.",
  not_applicable: "This discount code doesn't apply to any items in your cart.",
  already_used: "This discount code has already been used.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  network: "Unable to apply discount. Check your connection and try again.",
};

const initialDiscountState: DiscountState = {
  status: "idle",
  code: "",
  error: null,
  minimumAmount: undefined,
  upsellDismissed: false,
};

export function ShopifyCartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(getStoredCartId);
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [discount, setDiscount] = useState<DiscountState>(initialDiscountState);

  useEffect(() => {
    let cancelled = false;

    async function initCart() {
      if (cancelled) return;

      // Step 1: Try to discover existing storefront cart via cookie
      let storefrontToken: string | null = null;
      try {
        storefrontToken = await discoverStorefrontCart();
      } catch {} 

      if (storefrontToken && !cancelled) {
        const cartId = `gid://shopify/Cart/${storefrontToken}`;
        try {
          const { data } = await apiClient.get(`/cart/${encodeURIComponent(cartId)}`);
          if (data.success && data.data.cart) {
            localStorage.setItem(CART_STORAGE_KEY, cartId);
            setCartId(cartId);
            setCart(data.data.cart);
            return;
          }
        } catch {}
      }

      // Step 2: Try stored cart ID
      const stored = cartId || getStoredCartId();
      if (stored) {
        try {
          const { data } = await apiClient.get(`/cart/${encodeURIComponent(stored)}`);
          if (cancelled) return;
          if (data.success && data.data.cart) {
            setCart(data.data.cart);
            return;
          }
        } catch {
          if (cancelled) return;
        }
      }

      // Step 3: Create new cart
      try {
        const { data } = await apiClient.post("/cart/create", {});
        if (cancelled) return;
        if (data.success && data.data.cart) {
          const newCartId = data.data.cart.id;
          localStorage.setItem(CART_STORAGE_KEY, newCartId);
          setCartId(newCartId);
          setCart(data.data.cart);
        }
      } catch {}
    }

    initCart();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  async function discoverStorefrontCart(): Promise<string | null> {
    // Read cart token from cookie (works on same domain, may fail cross-subdomain)
    try {
      const cartCookie = document.cookie.split("; ").find((c) => c.startsWith("cart="));
      if (cartCookie) {
        const token = cartCookie.slice(5);
        if (token && token.length > 10) return token;
      }
    } catch {}

    return null;
  }

  const refreshCart = useCallback(async () => {
    const id = cartId || getStoredCartId();
    if (!id) return;
    try {
      const { data } = await apiClient.get(`/cart/${encodeURIComponent(id)}`);
      if (data.success && data.data.cart) {
        setCart(data.data.cart);
      }
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
      setCartId(null);
      setCart(null);
    }
  }, [cartId]);

  const ensureCart = useCallback(async (): Promise<string> => {
    const existing = cartId || getStoredCartId();
    if (existing) {
      try {
        const { data } = await apiClient.get(`/cart/${encodeURIComponent(existing)}`);
        if (data.success && data.data.cart) {
          return existing;
        }
      } catch {
        // expired
      }
    }
    const { data } = await apiClient.post("/cart/create", {});
    const newCartId = data.data.cart.id;
    localStorage.setItem(CART_STORAGE_KEY, newCartId);
    setCartId(newCartId);
    setCart(data.data.cart);
    return newCartId;
  }, [cartId]);

  const addToCart = useCallback(async (variantId: string, quantity = 1) => {
    const id = await ensureCart();
    const { data } = await apiClient.post("/cart/add", {
      cartId: id,
      lines: [{ merchandiseId: variantId, quantity }],
    });
    if (data.success && data.data.cart) {
      setCart(data.data.cart);
    }
  }, [ensureCart]);

  const updateLine = useCallback(async (lineId: string, quantity: number) => {
    if (!cartId) return;
    const { data } = await apiClient.post("/cart/update", {
      cartId,
      lines: [{ id: lineId, quantity }],
    });
    if (data.success && data.data.cart) {
      setCart(data.data.cart);
    }
  }, [cartId]);

  const handleSetCartId = useCallback((id: string) => {
    localStorage.setItem(CART_STORAGE_KEY, id);
    setCartId(id);
  }, []);

  const applyDiscount = useCallback(async (code: string) => {
    const cartToken = cartId || getStoredCartId();
    if (!cartToken) {
      setDiscount({ status: "error", code, error: { code: "network", message: DISCOUNT_ERROR_MESSAGES.network }, minimumAmount: undefined, upsellDismissed: false });
      return;
    }

    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 3) {
      setDiscount({ status: "error", code: trimmed, error: { code: "invalid_code", message: "Code must be at least 3 characters." }, minimumAmount: undefined, upsellDismissed: false });
      return;
    }

    setDiscount({ status: "applying", code: trimmed, error: null, minimumAmount: undefined, upsellDismissed: false });

    try {
      const { data } = await apiClient.post("/cart/discount", {
        cartId: cartToken,
        discountCode: trimmed,
      });

      if (data.success && data.data?.cart) {
        setCart(data.data.cart);
        setDiscount({ status: "applied", code: trimmed, error: null, minimumAmount: undefined, upsellDismissed: false });
      } else {
        // Backend returned structured error
        const code: DiscountErrorCode = data.error || "invalid_code";
        const message = data.message || DISCOUNT_ERROR_MESSAGES[code];
        const minimumAmount = data.minimumAmount as number | undefined;
        setDiscount({ status: "error", code: trimmed, error: { code, message }, minimumAmount, upsellDismissed: false });

        // Cache the minimum amount for proactive upsell on next cart open
        if (code === "min_not_met" && minimumAmount && minimumAmount > 0) {
          try {
            localStorage.setItem(
              "aeternum_coupon_upsell",
              JSON.stringify({
                code: trimmed,
                minimumAmount,
                timestamp: Date.now(),
              }),
            );
          } catch { /* localStorage unavailable */ }
        }

        // If the backend still returned a cart (e.g., partial state), update it
        if (data.cart) setCart(data.cart);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg = axiosErr?.response?.data?.message || axiosErr?.message || DISCOUNT_ERROR_MESSAGES.network;
      const code: DiscountErrorCode = (axiosErr?.response?.data?.error as DiscountErrorCode) || "network";
      setDiscount({ status: "error", code: trimmed, error: { code, message: msg }, minimumAmount: undefined, upsellDismissed: false });
    }
  }, [cartId]);

  const removeDiscount = useCallback(async () => {
    const cartToken = cartId || getStoredCartId();
    if (!cartToken) return;

    setDiscount((prev) => ({ ...prev, status: "removing" }));

    try {
      const { data } = await apiClient.delete("/cart/discount", {
        data: { cartId: cartToken },
      });

      if (data.success && data.data?.cart) {
        setCart(data.data.cart);
      }

      setDiscount(initialDiscountState);
    } catch {
      // Even on error, reset the discount state so the user can retry
      setDiscount(initialDiscountState);
    }
  }, [cartId]);

  const dismissUpsell = useCallback(() => {
    setDiscount((prev) => ({ ...prev, upsellDismissed: true }));
  }, []);

  const openAiShopping = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const itemCount = cart?.totalQuantity ?? 0;

  /** Compute total savings: subtotal - total */
  const discountSavings = (() => {
    if (!cart) return 0;
    const sub = Number.parseFloat(cart.cost.subtotalAmount.amount);
    const total = Number.parseFloat(cart.cost.totalAmount.amount);
    const savings = sub - total;
    return savings > 0 ? savings : 0;
  })();

  return (
    <ShopifyCartContext.Provider
      value={{
        cartId,
        cart,
        itemCount,
        isOpen,
        addToCart,
        updateLine,
        openCart,
        closeCart,
        refreshCart,
        setCartId: handleSetCartId,
        applyDiscount,
        removeDiscount,
        discount,
        discountSavings,
        dismissUpsell,
        openAiShopping,
      }}
    >
      {children}
    </ShopifyCartContext.Provider>
  );
}

export function useShopifyCart(): ShopifyCartContextValue {
  const ctx = useContext(ShopifyCartContext);
  if (!ctx) throw new Error("useShopifyCart must be used within ShopifyCartProvider");
  return ctx;
}
