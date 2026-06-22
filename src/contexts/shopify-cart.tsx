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

type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
  lines: CartLine[];
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
};

const ShopifyCartContext = createContext<ShopifyCartContextValue | null>(null);

function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_STORAGE_KEY);
}

export function ShopifyCartProvider({ children }: { children: ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(getStoredCartId);
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const itemCount = cart?.totalQuantity ?? 0;

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
