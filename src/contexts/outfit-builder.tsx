"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { OutfitProduct, OutfitPair } from "@/types/outfit";

type OutfitBuilderContextValue = {
  pair: OutfitPair;
  setTop: (product: OutfitProduct) => void;
  setBottom: (product: OutfitProduct) => void;
  removeTop: () => void;
  removeBottom: () => void;
  setTopSize: (size: string) => void;
  setBottomSize: (size: string) => void;
  setTopColor: (color: string) => void;
  setBottomColor: (color: string) => void;
  hasTop: boolean;
  hasBottom: boolean;
  isComplete: boolean;
  reset: () => void;
};

const OutfitBuilderContext = createContext<OutfitBuilderContextValue | null>(null);

const EMPTY_PAIR: OutfitPair = {
  top: null,
  bottom: null,
  topSize: "",
  bottomSize: "",
  topColor: "",
  bottomColor: "",
};

export function OutfitBuilderProvider({ children }: { children: ReactNode }) {
  const [pair, setPair] = useState<OutfitPair>(EMPTY_PAIR);

  const setTop = useCallback((product: OutfitProduct) => {
    const firstVariant = product.variants[0];
    setPair((prev) => ({
      ...prev,
      top: product,
      topSize: firstVariant?.size ?? "",
      topColor: firstVariant?.color ?? "",
    }));
  }, []);

  const setBottom = useCallback((product: OutfitProduct) => {
    const firstVariant = product.variants[0];
    setPair((prev) => ({
      ...prev,
      bottom: product,
      bottomSize: firstVariant?.size ?? "",
      bottomColor: firstVariant?.color ?? "",
    }));
  }, []);

  const removeTop = useCallback(() => {
    setPair((prev) => ({ ...prev, top: null, topSize: "", topColor: "" }));
  }, []);

  const removeBottom = useCallback(() => {
    setPair((prev) => ({ ...prev, bottom: null, bottomSize: "", bottomColor: "" }));
  }, []);

  const setTopSize = useCallback((size: string) => {
    setPair((prev) => ({ ...prev, topSize: size }));
  }, []);

  const setBottomSize = useCallback((size: string) => {
    setPair((prev) => ({ ...prev, bottomSize: size }));
  }, []);

  const setTopColor = useCallback((color: string) => {
    setPair((prev) => ({ ...prev, topColor: color }));
  }, []);

  const setBottomColor = useCallback((color: string) => {
    setPair((prev) => ({ ...prev, bottomColor: color }));
  }, []);

  const reset = useCallback(() => {
    setPair(EMPTY_PAIR);
  }, []);

  const hasTop = pair.top !== null;
  const hasBottom = pair.bottom !== null;
  const isComplete = hasTop && hasBottom;

  return (
    <OutfitBuilderContext.Provider
      value={{
        pair,
        setTop,
        setBottom,
        removeTop,
        removeBottom,
        setTopSize,
        setBottomSize,
        setTopColor,
        setBottomColor,
        hasTop,
        hasBottom,
        isComplete,
        reset,
      }}
    >
      {children}
    </OutfitBuilderContext.Provider>
  );
}

export function useOutfitBuilder(): OutfitBuilderContextValue {
  const ctx = useContext(OutfitBuilderContext);
  if (!ctx) {
    throw new Error("useOutfitBuilder must be used within OutfitBuilderProvider");
  }
  return ctx;
}
