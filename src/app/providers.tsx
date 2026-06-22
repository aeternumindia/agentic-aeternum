"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AppStateProvider } from "@/contexts/app-state";
import { RecommendationsProvider } from "@/contexts/recommendations";
import { ShopifyCartProvider } from "@/contexts/shopify-cart";
import { VirtualTryOnProvider } from "@/contexts/virtual-try-on";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <RecommendationsProvider>
          <ShopifyCartProvider>
            <VirtualTryOnProvider>
              {children}
            </VirtualTryOnProvider>
          </ShopifyCartProvider>
        </RecommendationsProvider>
      </AppStateProvider>
    </QueryClientProvider>
  );
}
