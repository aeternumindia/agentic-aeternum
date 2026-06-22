"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { ProductResult } from "@/types/chat";

type RecommendationsContextValue = {
  products: ProductResult[];
  setProducts: (products: ProductResult[]) => void;
};

const RecommendationsContext = createContext<RecommendationsContextValue | null>(null);

export function RecommendationsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductResult[]>([]);

  return (
    <RecommendationsContext.Provider value={{ products, setProducts }}>
      {children}
    </RecommendationsContext.Provider>
  );
}

export function useRecommendations(): RecommendationsContextValue {
  const context = useContext(RecommendationsContext);
  if (!context) {
    throw new Error("useRecommendations must be used within a RecommendationsProvider");
  }
  return context;
}
