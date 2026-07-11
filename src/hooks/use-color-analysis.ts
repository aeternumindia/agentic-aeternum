"use client";

import { useState, useCallback } from "react";
import { analyzeSkinColor } from "@/services/api";
import type { SkinAnalysisResult } from "@/types/color-analysis";
import { convertHeicToJpegIfNeeded } from "@/utils/heic-converter";

type Status = "idle" | "uploading" | "analyzing" | "done" | "error";

type UseColorAnalysisReturn = {
  status: Status;
  result: SkinAnalysisResult | null;
  previewUrl: string | null;
  error: string | null;
  analyze: (file: File) => Promise<void>;
  reset: () => void;
};

export function useColorAnalysis(): UseColorAnalysisReturn {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File) => {
    setError(null);
    setStatus("uploading");

    // Convert HEIC to JPEG before preview/upload
    const converted = await convertHeicToJpegIfNeeded(file);

    const url = URL.createObjectURL(converted);
    setPreviewUrl(url);

    setStatus("analyzing");

    try {
      const response = await analyzeSkinColor(converted);
      if (response.success) {
        setResult(response.data);
        setStatus("done");
      } else {
        throw new Error("Analysis failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStatus("idle");
    setResult(null);
    setPreviewUrl(null);
    setError(null);
  }, [previewUrl]);

  return { status, result, previewUrl, error, analyze, reset };
}
