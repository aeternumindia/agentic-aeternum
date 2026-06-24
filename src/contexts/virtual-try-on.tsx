"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { TryOnSession, TryOnResult } from "@/types/virtual-try-on";
import { calculateFitScore } from "@/services/virtual-try-on";

type VirtualTryOnContextValue = {
  session: TryOnSession | null;
  result: TryOnResult | null;
  startTryOn: (session: TryOnSession) => void;
  clearTryOn: () => void;
  updateSize: (size: string) => void;
  updateMeasurements: (measurements: Record<string, number>) => void;
  computeFitScore: (sessionOverride?: TryOnSession) => void;
};

const VirtualTryOnContext = createContext<VirtualTryOnContextValue | null>(null);

export function VirtualTryOnProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TryOnSession | null>(null);
  const [result, setResult] = useState<TryOnResult | null>(null);

  const computeFitScore = useCallback((sessionOverride?: TryOnSession) => {
    const s = sessionOverride ?? session;
    if (!s) return;
    setResult(calculateFitScore(s));
  }, [session]);

  const startTryOn = useCallback(
    (newSession: TryOnSession) => {
      setSession(newSession);
    },
    []
  );

  const clearTryOn = useCallback(() => {
    setSession(null);
    setResult(null);
  }, []);

  const updateSize = useCallback(
    (size: string) => {
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, selectedSize: size };
      });
    },
    []
  );

  const updateMeasurements = useCallback(
    (measurements: Record<string, number>) => {
      setSession((prev) => {
        if (!prev) return prev;
        return { ...prev, measurements };
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
        computeFitScore,
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
