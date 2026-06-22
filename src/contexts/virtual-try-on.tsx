"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { TryOnSession, TryOnResult } from "@/types/virtual-try-on";
import { calculateFitScore, findRecommendedSize } from "@/services/virtual-try-on";

type VirtualTryOnContextValue = {
  session: TryOnSession | null;
  result: TryOnResult | null;
  startTryOn: (session: TryOnSession) => void;
  clearTryOn: () => void;
  updateSize: (size: string) => void;
  updateMeasurements: (measurements: Record<string, number>) => void;
};

const VirtualTryOnContext = createContext<VirtualTryOnContextValue | null>(null);

export function VirtualTryOnProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TryOnSession | null>(null);
  const [result, setResult] = useState<TryOnResult | null>(null);

  const computeResult = useCallback((s: TryOnSession) => {
    setResult(calculateFitScore(s));
  }, []);

  const startTryOn = useCallback(
    (newSession: TryOnSession) => {
      setSession(newSession);
      computeResult(newSession);
    },
    [computeResult]
  );

  const clearTryOn = useCallback(() => {
    setSession(null);
    setResult(null);
  }, []);

  const updateSize = useCallback(
    (size: string) => {
      setSession((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, selectedSize: size };
        setResult(calculateFitScore(updated));
        return updated;
      });
    },
    []
  );

  const updateMeasurements = useCallback(
    (measurements: Record<string, number>) => {
      setSession((prev) => {
        if (!prev) return prev;
        const recommendedSize = findRecommendedSize(measurements);
        const updated = {
          ...prev,
          measurements,
          selectedSize: recommendedSize,
        };
        setResult(calculateFitScore(updated));
        return updated;
      });
    },
    []
  );

  return (
    <VirtualTryOnContext.Provider
      value={{
        session,
        result,
        startTryOn,
        clearTryOn,
        updateSize,
        updateMeasurements,
      }}
    >
      {children}
    </VirtualTryOnContext.Provider>
  );
}

export function useVirtualTryOn(): VirtualTryOnContextValue {
  const context = useContext(VirtualTryOnContext);
  if (!context) {
    throw new Error(
      "useVirtualTryOn must be used within a VirtualTryOnProvider"
    );
  }
  return context;
}
