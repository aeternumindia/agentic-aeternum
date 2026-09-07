"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shirt,
  RotateCcw,
  Check,
  Ruler,
  RefreshCw,
  Camera,
  Upload,
  Loader2,
  Sparkles,
  AlertCircle,
  Download,
  Eye,
  ShoppingBag,
  ChevronDown,
  X,
} from "lucide-react";
import { useVirtualTryOn } from "@/contexts/virtual-try-on";
import { convertHeicToJpegIfNeeded } from "@/utils/heic-converter";
import { getSizeChart } from "@/services/api";
import { FitScoreGauge } from "@/components/virtual-try-on/fit-score-gauge";
import { SizeChartModal } from "@/components/virtual-try-on/size-chart-modal";
import type { TryOnSession, ProductSizeChart } from "@/types/virtual-try-on";
import type { CartItem } from "@/types/product";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type VirtualTryOnScreenProps = {
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
  productSizes?: string[];
};

type MeasurementField = {
  key: string;
  label: string;
  unit: string;
  placeholder: string;
};

function getMeasurementFields(productCategory?: string, unit?: "cm" | "in"): MeasurementField[] {
  const cmHeight = 170, cmChest = 96, cmWaist = 76, cmHips = 90;
  const toInch = (v: number) => Math.round(v / 2.54);
  const p = (v: number) => unit === "in" ? `e.g. ${toInch(v)}` : `e.g. ${v}`;
  if (!productCategory) {
    return [
      { key: "height", label: "Height", unit: unit || "cm", placeholder: p(cmHeight) },
      { key: "chest", label: "Chest", unit: unit || "cm", placeholder: p(cmChest) },
      { key: "waist", label: "Waist", unit: unit || "cm", placeholder: p(cmWaist) },
      { key: "hips", label: "Hips", unit: unit || "cm", placeholder: p(cmHips) },
    ];
  }
  const t = productCategory.toLowerCase();
  const isTop = ["shirt", "t-shirt", "tshirt", "top", "blouse", "jacket", "blazer", "hoodie", "sweater", "polo", "sweatshirt"].some(
    (k) => t.includes(k)
  );
  const isBottom = ["jeans", "pant", "pants", "trouser", "shorts", "skirt", "legging", "bottom", "short", "chino", "jogger"].some(
    (k) => t.includes(k)
  );
  if (isBottom) {
    return [
      { key: "height", label: "Height", unit: unit || "cm", placeholder: p(cmHeight) },
      { key: "waist", label: "Waist", unit: unit || "cm", placeholder: p(cmWaist) },
      { key: "hips", label: "Hips", unit: unit || "cm", placeholder: p(cmHips) },
    ];
  }
  if (isTop) {
    return [
      { key: "height", label: "Height", unit: unit || "cm", placeholder: p(cmHeight) },
      { key: "chest", label: "Chest", unit: unit || "cm", placeholder: p(cmChest) },
      { key: "waist", label: "Waist", unit: unit || "cm", placeholder: p(cmWaist) },
    ];
  }
  return [
    { key: "height", label: "Height", unit: unit || "cm", placeholder: p(cmHeight) },
    { key: "chest", label: "Chest", unit: unit || "cm", placeholder: p(cmChest) },
    { key: "waist", label: "Waist", unit: unit || "cm", placeholder: p(cmWaist) },
    { key: "hips", label: "Hips", unit: unit || "cm", placeholder: p(cmHips) },
  ];
}

type Tab = "ai" | "fit";

export function VirtualTryOnScreen({
  onAddToCart,
  onBack,
  productSizes = ["XS", "S", "M", "L", "XL", "XXL"],
}: VirtualTryOnScreenProps) {
  const { session, result, startTryOn, updateSize, computeFitScore } = useVirtualTryOn();
  const [tab, setTab] = useState<Tab>("ai");

  const [fullBodyFile, setFullBodyFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [fullBodyPreview, setFullBodyPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [aiResultUrl, setAiResultUrl] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [addDone, setAddDone] = useState(false);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  const fullBodyRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const prevProductId = useRef<string | null>(null);
  const hasCalculatedOnce = useRef(false);
  const lastCalculatedMeasurements = useRef<string>("");

  const fitScore = result?.fitScore;
  const fields = getMeasurementFields(session?.productCategory, unit);
  // Snapshot for stale detection: sorted key=value pairs joined by "|"
  const currentSnapshot =
    Object.keys(measurementValues).length > 0
      ? Object.entries(measurementValues)
          .filter(([, v]) => v !== "")
          .map(([k, v]) => `${k}=${v}`)
          .sort()
          .join("|")
      : "";
  const isStale = hasCalculatedOnce.current && currentSnapshot !== lastCalculatedMeasurements.current && currentSnapshot !== "";

  useEffect(() => {
    if (!session?.productId) return;
    if (prevProductId.current !== null && prevProductId.current !== session.productId) {
      setFullBodyFile(null);
      setSelfieFile(null);
      setFullBodyPreview(null);
      setSelfiePreview(null);
      setAiStatus("idle");
      setAiResultUrl(null);
      setAiError(null);
      setTab("ai");
      setMeasurementValues({});
      setCalculating(false);
    }
    prevProductId.current = session.productId;
  }, [session?.productId]);

  // Sync measurementValues from session.measurements when they're available
  // but measurementValues is empty (e.g. after saving via Edit form)
  useEffect(() => {
    if (session?.measurements && Object.keys(session.measurements).length > 0) {
      setMeasurementValues((prev) => {
        if (Object.keys(prev).length === 0) {
          const init: Record<string, string> = {};
          for (const [k, v] of Object.entries(session.measurements)) init[k] = String(v);
          return init;
        }
        return prev;
      });
    }
  }, [session?.measurements]);

  const hasAnyMeasurements = Object.keys(measurementValues).length > 0;

  const toCm = (v: number, u: "cm" | "in") => (u === "in" ? Math.round(v * 2.54) : v);
  const fromCm = (v: number, u: "cm" | "in") => (u === "in" ? Math.round(v / 2.54) : v);

  const handleCalculate = useCallback(async () => {
    if (!session?.productHandle) return;
    if (!session.selectedSize) return;
    const catFields = getMeasurementFields(session.productCategory);
    const parsed: Record<string, number> = {};
    for (const field of catFields) {
      const v = Number(measurementValues[field.key]);
      if (v > 0 && v <= 300) parsed[field.key] = v;
    }
    if (Object.keys(parsed).length === 0) return;

    setCalculating(true);
    setError(null);

    try {
      const res = await getSizeChart(session.productHandle);
      if (res?.success && res.data) {
        const d = res.data;
        let chartData = null;
        if (d.chart_data) {
          try {
            chartData = JSON.parse(typeof d.chart_data === "string" ? d.chart_data : d.chart_data);
          } catch {}
        }
        const sizeChart: ProductSizeChart = {
          chartData,
          image: d.image || null,
          fitNotes: d.fit_notes || null,
        };
        const updated: TryOnSession = { ...session, sizeChart, measurements: parsed };
        startTryOn(updated);
        computeFitScore(updated);
      } else {
        const updated: TryOnSession = { ...session, measurements: parsed };
        startTryOn(updated);
        computeFitScore(updated);
      }
      hasCalculatedOnce.current = true;
      lastCalculatedMeasurements.current = Object.entries(parsed)
        .map(([k, v]) => `${k}=${v}`)
        .sort()
        .join("|");
    } catch {
      setError("Failed to calculate fit score. Please try again.");
      const updated: TryOnSession = { ...session, measurements: parsed };
      startTryOn(updated);
      computeFitScore(updated);
    } finally {
      setCalculating(false);
    }
  }, [session, measurementValues, startTryOn, computeFitScore]);

  // Auto-recalculate when size changes after first calculation
  useEffect(() => {
    if (hasCalculatedOnce.current && session?.selectedSize && result && !calculating) {
      // Populate measurementValues from session measurements if empty
      setMeasurementValues((prev) => {
        if (Object.keys(prev).length === 0 && session.measurements) {
          const init: Record<string, string> = {};
          for (const [k, v] of Object.entries(session.measurements)) init[k] = String(v);
          return init;
        }
        return prev;
      });
      handleCalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.selectedSize]);

  const handleAddToCart = useCallback(() => {
    if (!session || adding) return;
    setAdding(true);
    const item: CartItem = {
      id: crypto.randomUUID(),
      product: {
        id: session.productId,
        title: session.productTitle,
        description: "",
        price: Number(session.price) || 0,
        currency: session.currency || "INR",
        images: session.productImage ? [session.productImage] : [],
        category: session.productCategory,
        sizes: productSizes,
        colors: session.selectedColor ? [session.selectedColor] : [],
        material: "",
      },
      quantity: 1,
      selectedSize: session.selectedSize,
      selectedColor: session.selectedColor,
      customizations: [],
    };
    onAddToCart(item);
    setAddDone(true);
    setAdding(false);
  }, [session, adding, onAddToCart, productSizes]);

  const handleFullBody = useCallback(async (file: File) => {
    const converted = await convertHeicToJpegIfNeeded(file);
    setFullBodyFile(converted);
    setFullBodyPreview(URL.createObjectURL(converted));
  }, []);

  const handleSelfie = useCallback(async (file: File) => {
    const converted = await convertHeicToJpegIfNeeded(file);
    setSelfieFile(converted);
    setSelfiePreview(URL.createObjectURL(converted));
  }, []);

  async function handlePhotoDrop(e: React.DragEvent, target: "fullBody" | "selfie") {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    // Accept images by MIME type (image/jpeg, image/png, image/heic, etc.)
    // OR by file extension (.heic/.HEIC — iOS sometimes reports HEIC as
    // application/octet-stream in drag-and-drop).
    if (file && (file.type.startsWith("image/") || /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name))) {
      if (target === "fullBody") await handleFullBody(file);
      else await handleSelfie(file);
    }
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>, target: "fullBody" | "selfie") {
    const file = e.target.files?.[0];
    if (file) {
      if (target === "fullBody") await handleFullBody(file);
      else await handleSelfie(file);
    }
  }

  const generateAiTryOn = useCallback(async () => {
    if (!fullBodyFile || !selfieFile || !session?.productImage) return;
    setAiStatus("generating");
    setAiError(null);
    setAiResultUrl(null);

    try {
      const garmentRes = await fetch(session.productImage);
      const garmentBlob = await garmentRes.blob();
      const garmentFile = await convertHeicToJpegIfNeeded(
        new File([garmentBlob], "garment.jpg", { type: garmentBlob.type || "image/jpeg" })
      );

      const formData = new FormData();
      formData.append("personImage", fullBodyFile);
      formData.append("faceImage", selfieFile);
      formData.append("garmentImage", garmentFile);

      const res = await fetch(`${API_BASE}/api/try-on/image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        let error = "Generation failed";
        try { const json = JSON.parse(text); error = json.error || error; } catch {}
        throw new Error(error);
      }

      const blob = await res.blob();
      setAiResultUrl(URL.createObjectURL(blob));
      setAiStatus("done");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
      setAiStatus("error");
    }
  }, [fullBodyFile, selfieFile, session?.productImage]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in px-6">
        <Shirt className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-sm text-muted-foreground">Select a product to start virtual try-on</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-5 animate-fade-in">
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab("ai")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            tab === "ai" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Preview
        </button>
        <button
          type="button"
          onClick={() => setTab("fit")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            tab === "fit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          Fit Scores
        </button>
      </div>

      {/* AI Preview Tab */}
      <div className={tab === "ai" ? "block" : "hidden"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Full Body</span>
                {fullBodyFile && <Check className="h-3 w-3 text-green-500" />}
              </div>
              <div
                onDrop={(e) => handlePhotoDrop(e, "fullBody")}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fullBodyRef.current?.click()}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all overflow-hidden"
              >
                {fullBodyPreview ? (
                  <img src={fullBodyPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground/40 mb-1" />
                    <p className="text-[10px] text-muted-foreground text-center px-2">Tap to capture</p>
                  </>
                )}
              </div>
              <input ref={fullBodyRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoSelect(e, "fullBody")} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Selfie</span>
                {selfieFile && <Check className="h-3 w-3 text-green-500" />}
              </div>
              <div
                onDrop={(e) => handlePhotoDrop(e, "selfie")}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => selfieRef.current?.click()}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all overflow-hidden"
              >
                {selfiePreview ? (
                  <img src={selfiePreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground/40 mb-1" />
                    <p className="text-[10px] text-muted-foreground text-center px-2">Tap to capture</p>
                  </>
                )}
              </div>
              <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handlePhotoSelect(e, "selfie")} />
            </div>
          </div>

          {aiStatus === "generating" && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="aspect-[4/5] bg-muted flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p className="text-xs text-foreground font-medium">Generating your try-on...</p>
                <p className="text-[10px] text-muted-foreground">15-30 seconds</p>
              </div>
            </div>
          )}

          {aiStatus === "done" && aiResultUrl && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="aspect-[4/5] bg-muted relative">
                <img src={aiResultUrl} alt="AI try-on" className="h-full w-full object-cover" />
                <span className="absolute top-2 left-2 bg-accent/80 text-accent-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">AI Generated</span>
              </div>
              <div className="p-2 flex gap-2 justify-center">
                <Button size="lg" variant="outline" className="text-xs h-9" onClick={() => {
                  const a = document.createElement("a");
                  a.href = aiResultUrl;
                  a.download = "aeternum-try-on.png";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}>
                  <Download className="mr-1 h-3 w-3" /> Download
                </Button>
                <Button size="lg" variant="outline" className="text-xs h-9" onClick={generateAiTryOn}>
                  <RefreshCw className="mr-1 h-3 w-3" /> Regenerate
                </Button>
              </div>
            </div>
          )}

          {aiStatus === "error" && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-xs text-destructive mb-2">{aiError || "Failed to generate"}</p>
              <Button size="lg" variant="outline" className="text-xs h-9" onClick={generateAiTryOn}>
                <RefreshCw className="mr-1 h-3 w-3" /> Try Again
              </Button>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!fullBodyFile || !selfieFile || aiStatus === "generating"}
            onClick={generateAiTryOn}
          >
            <Sparkles className="mr-2 h-3 w-3" />
            {aiStatus === "generating" ? "Generating..." : "Generate AI Try-On"}
          </Button>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Stand against a plain background with good lighting
          </div>
        </div>
      </div>

      {/* Fit Scores Tab */}
      <div className={tab === "fit" ? "block" : "hidden"}>
        <div className="space-y-4">
          {/* ════════════ Measurements Card ════════════ */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Your Measurements</span>
              </div>
              <div className="flex rounded-lg bg-muted p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (unit === "in") {
                      setMeasurementValues((prev) => {
                        const next: Record<string, string> = {};
                        for (const [k, v] of Object.entries(prev)) {
                          const n = parseFloat(v);
                          next[k] = isNaN(n) ? "" : Math.round(n * 2.54).toString();
                        }
                        return next;
                      });
                    }
                    setUnit("cm");
                  }}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                    unit === "cm" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (unit === "cm") {
                      setMeasurementValues((prev) => {
                        const next: Record<string, string> = {};
                        for (const [k, v] of Object.entries(prev)) {
                          const n = parseFloat(v);
                          next[k] = isNaN(n) ? "" : Math.round(n / 2.54).toString();
                        }
                        return next;
                      });
                    }
                    setUnit("in");
                  }}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-all ${
                    unit === "in" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  in
                </button>
              </div>
            </div>

            {/* Stale banner */}
            {isStale && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-900/20 px-4 py-3">
                <span className="mt-0.5 text-amber-600 dark:text-amber-400 text-xs font-medium">△</span>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Measurements changed — tap <strong>Recalculate</strong> for updated scores.
                </p>
              </div>
            )}

            {/* Always-editable measurement inputs */}
            <div className="grid grid-cols-2 gap-2">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-[10px] text-muted-foreground">
                    {field.label} ({unit})
                  </label>
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    value={measurementValues[field.key] ?? ""}
                    onChange={(e) => setMeasurementValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            {/* Size selector — always visible before/beside calculation */}
            <div>
              <label className="mb-1 block text-[10px] text-muted-foreground">Size</label>
              <div className="relative inline-flex w-full">
                <select
                  value={session?.selectedSize || ""}
                  onChange={(e) => updateSize(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 pr-6 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px] cursor-pointer appearance-none"
                >
                  <option value="" disabled>Select a size</option>
                  {productSizes.map((s) => (
                    <option key={s} value={s}>
                      Size {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Calculate button */}
            <Button
              size="lg"
              className="w-full"
              variant={hasCalculatedOnce.current ? "outline" : "default"}
              disabled={
                calculating ||
                !hasAnyMeasurements ||
                !session?.selectedSize
              }
              onClick={handleCalculate}
            >
              {calculating ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Calculating...
                </>
              ) : hasCalculatedOnce.current ? (
                <>
                  <RefreshCw className="mr-1.5 h-3 w-3" />
                  Recalculate Fit Scores
                </>
              ) : (
                <>
                  <Ruler className="mr-1.5 h-3 w-3" />
                  Calculate Fit Score
                </>
              )}
            </Button>
          </div>

          {/* ════════════ Fit Score Card ════════════ */}
          {result && fitScore && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              {/* Gauge + Label row */}
              <div className="flex flex-row items-center gap-3">
                <FitScoreGauge score={fitScore.overall} size="sm" />
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{fitScore.label}</p>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide ${
                        fitScore.overall >= 90
                          ? "text-emerald-600 dark:text-emerald-400"
                          : fitScore.overall >= 70
                            ? "text-teal-600 dark:text-teal-400"
                            : fitScore.overall >= 50
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {fitScore.overall >= 90
                        ? "Great"
                        : fitScore.overall >= 70
                          ? "Good"
                          : fitScore.overall >= 50
                            ? "Fair"
                            : "Poor"}
                    </span>
                    {result.chartUnit && (
                      <span className="text-[9px] text-muted-foreground/60 border border-border rounded px-1 py-0.5 uppercase tracking-wider">
                        {result.chartUnit === "in" ? "in" : "cm"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{session?.productTitle}</p>
                  {result.chartUnit && result.chartUnit !== unit && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                      Chart in inches — toggle input to <span className="font-medium">in</span> for matching values
                    </p>
                  )}
                </div>
              </div>

              {/* Size selector row */}
              <div className="flex flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 relative inline-flex">
                  <select
                    value={session?.selectedSize || ""}
                    onChange={(e) => updateSize(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 pr-6 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px] cursor-pointer appearance-none"
                  >
                    {productSizes.map((s) => (
                      <option key={s} value={s}>
                        Size {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                </div>
                {result.recommendedSize && result.recommendedSize !== session?.selectedSize && (
                  <button
                    type="button"
                    onClick={() => updateSize(result.recommendedSize!)}
                    className="rounded-md bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/40 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 whitespace-nowrap hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors min-h-[44px] flex items-center justify-center gap-1"
                  >
                    Try {result.recommendedSize}
                    <Check className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">{fitScore.description}</p>

              {/* Fit Details */}
              {result.comparisonRows.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Fit Details
                  </p>
                  {result.comparisonRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5"
                    >
                      <span className="text-xs text-foreground capitalize">{row.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          {fromCm(Math.round(row.userValue * 10) / 10, unit)} {unit}
                          {row.sizeRange.min !== row.sizeRange.max
                            ? ` (${fromCm(row.sizeRange.min, unit)}-${fromCm(row.sizeRange.max, unit)} ${unit})`
                            : ` (${fromCm(row.sizeRange.min, unit)} ${unit})`}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            row.fitStatus === "optimal" || (row.withinRange && !row.fitStatus)
                              ? "text-green-600"
                              : row.fitStatus === "acceptable"
                              ? "text-amber-600"
                              : "text-red-500"
                          }`}
                        >
                          {row.fitStatus === "optimal" || (row.withinRange && !row.fitStatus)
                            ? "✓"
                            : row.fitStatus === "acceptable"
                            ? "△"
                            : "✗"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Size chart section */}
              {result.sizeChart ? (
                <>
                  {!result.sizeChart.chartData && !result.sizeChart.image && !result.sizeChart.fitNotes ? (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 italic leading-relaxed">
                      Scores estimated without size chart data — may be less accurate.
                    </p>
                  ) : (
                    <div className="pt-1 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setExpandedChart(expandedChart === "size" ? null : "size")}
                        className="flex items-center gap-1.5 w-full rounded-md border border-border bg-background px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
                      >
                        <Ruler className="h-3.5 w-3.5" />
                        Size Chart
                        <ChevronDown
                          className={`h-3 w-3 ml-auto transition-transform ${
                            expandedChart === "size" ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {expandedChart === "size" && (
                        <SizeChartModal
                          title={session?.productTitle || ""}
                          chartData={result.sizeChart.chartData}
                          image={result.sizeChart.image}
                          fitNotes={result.sizeChart.fitNotes}
                          onClose={() => setExpandedChart(null)}
                        />
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 italic leading-relaxed">
                  Scores estimated without size chart data — may be less accurate.
                </p>
              )}
            </div>
          )}

          {/* ════════════ Loading State ════════════ */}
          {calculating && !result && (
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Fetching size chart data...</p>
            </div>
          )}

          {/* ════════════ Error State ════════════ */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Product card — shown in both tabs ── */}
      {session?.productTitle && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          {session.productImage && (
            <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.productImage}
                alt={session.productTitle}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {session.productTitle}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {session.selectedSize && (
                <p className="text-xs text-muted-foreground">Size: {session.selectedSize}</p>
              )}
              {session.price && (
                <p className="text-xs font-medium text-foreground">
                  {session.currency === "INR" ? "₹" : ""}{session.price}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add to Cart — visible from both tabs once a size is selected ── */}
      {session?.selectedSize && (
        <div className="sticky bottom-0 pt-2 pb-1 bg-background">
          <Button
            size="lg"
            className="w-full"
            disabled={adding || addDone || !session?.selectedSize}
            onClick={handleAddToCart}
          >
            {addDone ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Added to Cart!
              </>
            ) : adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShoppingBag className="mr-1.5 h-4 w-4" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
