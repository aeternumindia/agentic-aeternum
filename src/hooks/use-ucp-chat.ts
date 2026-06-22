"use client";

import { useCallback, useRef, useState } from "react";
import type { Message } from "@/types/chat";
import { generateUcpResponse } from "@/services/ucp-chat";
import { useShopifyCart } from "@/contexts/shopify-cart";

type UseUcpChatReturn = {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
};

export function useUcpChat(): UseUcpChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const { cartId, setCartId } = useShopifyCart();

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoadingRef.current) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      isLoadingRef.current = true;
      setError(null);

      try {
        const { message, cartId: newCartId } = await generateUcpResponse(
          content,
          messages,
          cartId ?? undefined
        );
        setMessages((prev) => [...prev, message]);
        if (newCartId && !cartId) {
          setCartId(newCartId);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [messages, cartId, setCartId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { messages, isLoading, error, sendMessage, clearMessages, clearError };
}
