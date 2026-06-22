"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUcpChat } from "@/hooks/use-ucp-chat";
import { useAppState } from "@/contexts/app-state";
import { APP_STATES } from "@/constants";
import { useRecommendations } from "@/contexts/recommendations";
import { useVirtualTryOn } from "@/contexts/virtual-try-on";
import { useShopifyCart } from "@/contexts/shopify-cart";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { LandingScreen } from "@/components/screens/landing-screen";
import { CheckoutScreen } from "@/components/screens/checkout-screen";
import { VirtualTryOnScreen } from "@/components/screens/virtual-try-on-screen";
import apiClient from "@/services/api";
import type { CartItem } from "@/types/product";

type Variant = {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  available: boolean;
  options: { name: string; value: string }[];
};

export function UcpChatPanel() {
  const { messages, isLoading, error, sendMessage, clearMessages } = useUcpChat();
  const { state, setState, reset } = useAppState();
  const { setProducts } = useRecommendations();
  const { session, clearTryOn } = useVirtualTryOn();
  const { addToCart } = useShopifyCart();
  const [tryOnAdding, setTryOnAdding] = useState(false);
  const prevMessageCount = useRef(messages.length);

  const handleAddToCartFromTryOn = useCallback(
    async (item: CartItem) => {
      const productHandle = session?.productHandle;
      if (!productHandle || tryOnAdding) return;
      setTryOnAdding(true);
      try {
        const { data } = await apiClient.get(`/cart/variants/${productHandle}`);
        if (data.success) {
          const variants = data.data.variants as Variant[];
          const match = variants.find(
            (v) =>
              v.available &&
              v.options.some(
                (o) => o.value.toLowerCase() === item.selectedSize.toLowerCase()
              ) &&
              (item.selectedColor === "" ||
                v.options.some(
                  (o) =>
                    o.value.toLowerCase() === item.selectedColor.toLowerCase()
                ))
          );
          if (match) {
            await addToCart(match.id, item.quantity);
          } else {
            const fallback = variants.find((v) => v.available);
            if (fallback) await addToCart(fallback.id, item.quantity);
          }
        }
        clearTryOn();
        setState(APP_STATES.CART);
      } catch {
        setState(APP_STATES.CART);
      } finally {
        setTryOnAdding(false);
      }
    },
    [session, tryOnAdding, addToCart, clearTryOn, setState]
  );

  const handleBackFromTryOn = useCallback(() => {
    clearTryOn();
    setState(APP_STATES.CUSTOMIZATION);
  }, [clearTryOn, setState]);

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const last = messages[messages.length - 1];
      if (last.products) {
        setProducts(last.products);
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages, setProducts]);

  function handleSelectGoal(goalId: string) {
    sendMessage(goalId);
    setState(APP_STATES.RECOMMENDATIONS);
  }

  function handleStartOver() {
    reset();
    clearMessages();
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="absolute inset-0 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_4%,black_100%)]">
      <div className="min-h-full flex flex-col">
        <div className="flex-1">
          {isEmpty ? (
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-8 px-4 pt-[20vh]">
              <LandingScreen
                onSelectGoal={handleSelectGoal}
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <MessageList messages={messages} isLoading={isLoading} />

              {error && (
                <div className="pb-4 animate-fade-in">
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                </div>
              )}

              {state === APP_STATES.VIRTUAL_TRY_ON && session && (
                <VirtualTryOnScreen
                  onAddToCart={handleAddToCartFromTryOn}
                  onBack={handleBackFromTryOn}
                  productSizes={["XS", "S", "M", "L", "XL", "XXL"]}
                />
              )}

              {state === APP_STATES.CHECKOUT && (
                <CheckoutScreen onComplete={handleStartOver} />
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-background">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
