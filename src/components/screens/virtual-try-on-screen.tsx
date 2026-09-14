"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { StepMeasurements } from "@/components/try-on/size-checker/step-measurements";
import { StepCalculating } from "@/components/try-on/size-checker/step-calculating";
import { StepResult } from "@/components/try-on/size-checker/step-result";
import type { BodyMeasurements, PresetProfile } from "@/components/try-on/size-checker/types";
import type { GarmentItem } from "@/components/try-on/garment-selector/garment-selector";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type VirtualTryOnScreenProps = {
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
  productSizes?: string[];
  showFitScoresTab?: boolean;
  onOpenSizeChecker?: () => void;
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
  showFitScoresTab = true,
  onOpenSizeChecker,
}: VirtualTryOnScreenProps) {
  const { session, result, startTryOn, updateSize, computeFitScore } = useVirtualTryOn();
  const [tab, setTab] = useState<Tab>("ai");

  // New Step-Based Size Checker State for Fit Scores Tab
  const [fitStep, setFitStep] = useState<1 | 2 | 3>(1);
  const [fitMeasurements, setFitMeasurements] = useState<BodyMeasurements>({
    height: 176,
    chest: 96,
    waist: 80,
    hips: 98,
  });

  const handleFitChangeMeasurement = (
    field: keyof BodyMeasurements,
    value: number
  ) => {
    setFitMeasurements((prev) => ({ ...prev, [field]: value }));
  };

  const handleFitApplyPreset = (preset: PresetProfile) => {
    setFitMeasurements({
      height: preset.height,
      chest: preset.chest,
      waist: preset.waist,
      hips: preset.hips,
    });
  };

  const selectedGarmentsForFit: GarmentItem[] = useMemo(() => {
    if (session?.productId || session?.productTitle) {
      return [
        {
          id: session.productId || "1",
          name: session.productTitle || "Selected Product",
          category: session.productCategory || "Apparel",
          image: session.productImage || "",
          price: session.price || "",
          handle: session.productHandle || "",
          sizes: productSizes,
        },
      ];
    }
    return [];
  }, [session, productSizes]);

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
      {showFitScoresTab && (
        <div className="flex justify-center pb-1">
          <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/40 gap-1 w-full max-w-sm">
            <button
              type="button"
              onClick={() => setTab("ai")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                tab === "ai"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Virtual Try-On</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("fit")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                tab === "fit"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Ruler className="h-3.5 w-3.5" />
              <span>Size Recommendation</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Preview Tab */}
      <div className={tab === "ai" ? "block" : "hidden"}>
        <div className="space-y-3">
          {/* Top 2-Column Upload Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Full Body Photo Button */}
            <button
              type="button"
              onClick={() => fullBodyRef.current?.click()}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-xs font-medium text-foreground hover:border-primary/40 hover:bg-accent/5 transition-all shadow-2xs cursor-pointer"
            >
              {fullBodyPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fullBodyPreview} alt="Full Body" className="h-5 w-5 rounded-md object-cover" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="truncate">{fullBodyFile ? "Full Body" : "Upload Full Body"}</span>
              {fullBodyFile && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
            </button>
            <input ref={fullBodyRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoSelect(e, "fullBody")} />

            {/* Selfie Photo Button */}
            <button
              type="button"
              onClick={() => selfieRef.current?.click()}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-xs font-medium text-foreground hover:border-primary/40 hover:bg-accent/5 transition-all shadow-2xs cursor-pointer"
            >
              {selfiePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selfiePreview} alt="Selfie" className="h-5 w-5 rounded-md object-cover" />
              ) : (
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="truncate">{selfieFile ? "Selfie" : "Upload Selfie"}</span>
              {selfieFile && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
            </button>
            <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handlePhotoSelect(e, "selfie")} />
          </div>

          {/* Full-width Generate Button */}
          <Button
            size="sm"
            disabled={!fullBodyFile || !selfieFile || aiStatus === "generating"}
            onClick={generateAiTryOn}
            className="w-full rounded-xl text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {aiStatus === "generating" ? "Generating Try-On..." : "Generate Virtual Try-On"}
          </Button>

          {/* Main Studio Try-On Canvas */}
          <div className="relative mx-auto w-full max-w-sm aspect-[3/4] max-h-[380px] rounded-2xl border border-border/60 bg-[#FAF8F5] dark:bg-stone-950 overflow-hidden flex flex-col items-center justify-center shadow-md">
            {aiStatus === "generating" ? (
              <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                <Loader2 className="h-9 w-9 animate-spin text-accent" />
                <p className="text-sm font-medium text-foreground">Generating your AI Try-On...</p>
                <p className="text-xs text-muted-foreground">This takes about 15-30 seconds</p>
              </div>
            ) : aiStatus === "done" && aiResultUrl ? (
              <div className="relative w-full h-full group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={aiResultUrl} alt="AI Try-On Canvas" className="w-full h-full object-contain" />
                <span className="absolute top-3 left-3 bg-background/80 backdrop-blur-md border border-border/40 text-foreground text-[10px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                  AI Try-On Canvas
                </span>

                {/* Floating Glass Actions Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = aiResultUrl;
                      a.download = "aeternum-try-on.png";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md text-foreground text-xs font-medium shadow-sm hover:bg-white transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button
                    type="button"
                    onClick={generateAiTryOn}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md text-foreground text-xs font-medium shadow-sm hover:bg-white transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                  </button>
                </div>
              </div>
            ) : fullBodyPreview ? (
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fullBodyPreview} alt="Full Body Preview Canvas" className="w-full h-full object-contain" />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent text-white text-center">
                  <p className="text-xs font-medium">
                    {selfieFile ? "Ready! Tap 'Generate Virtual Try-On' above" : "Please upload a selfie photo to continue"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                {session?.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.productImage} alt={session.productTitle} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
                    <Shirt className="h-8 w-8 mb-2 opacity-50" />
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-background/80 backdrop-blur-md border border-border/40 text-foreground text-[10px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                  Original Item
                </span>
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-white text-center">
                  <p className="text-xs font-medium">
                    Upload Full Body & Selfie photos above to try on this garment
                  </p>
                </div>
              </div>
            )}
          </div>

          {aiStatus === "error" && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center">
              <p className="text-xs text-destructive mb-2">{aiError || "Failed to generate try-on"}</p>
              <Button size="sm" variant="outline" className="text-xs h-8 rounded-full" onClick={generateAiTryOn}>
                <RefreshCw className="mr-1 h-3 w-3" /> Retry
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Fit Scores Tab (New AI Size & Fit Recommender) */}
      <div className={tab === "fit" ? "block space-y-4" : "hidden"}>
        {/* Wizard Step Indicator */}
        <div className="flex items-center gap-2 pt-1 pb-3 border-b border-border/60">
          <div className="flex-1 flex items-center gap-1.5">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${fitStep >= 1 ? "bg-accent" : "bg-muted/50"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${fitStep >= 2 ? "bg-accent" : "bg-muted/50"}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${fitStep >= 3 ? "bg-accent" : "bg-muted/50"}`} />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
            {fitStep === 1
              ? "Step 1/2: Body Profile"
              : fitStep === 2
              ? "Calculating..."
              : "Step 2/2: Sizing Result"}
          </span>
        </div>

        {/* Step Views */}
        {fitStep === 1 && (
          <div className="space-y-4">
            <StepMeasurements
              selectedGarments={selectedGarmentsForFit}
              measurements={fitMeasurements}
              onChangeMeasurement={handleFitChangeMeasurement}
              onApplyPreset={handleFitApplyPreset}
              onCalculate={() => setFitStep(2)}
            />
            <button
              type="submit"
              form="size-checker-form"
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Calculate AI Recommended Size</span>
            </button>
          </div>
        )}

        {fitStep === 2 && (
          <StepCalculating onComplete={() => setFitStep(3)} />
        )}

        {fitStep === 3 && (
          <StepResult
            selectedGarments={selectedGarmentsForFit}
            measurements={fitMeasurements}
            onRecalculate={() => setFitStep(1)}
            onClose={() => {}}
          />
        )}
      </div>

      {/* Integrated Compact Product Footer + Add to Cart */}
      {session?.productTitle && (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {session.productImage && (
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={session.productImage}
                  alt={session.productTitle}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {session.productTitle}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                {session.selectedSize && <span>Size: {session.selectedSize}</span>}
                {(onOpenSizeChecker || showFitScoresTab) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenSizeChecker) onOpenSizeChecker();
                      else setTab("fit");
                    }}
                    className="text-[10px] text-primary hover:underline font-semibold cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <Ruler className="h-3 w-3" />
                    <span>Check Fit</span>
                  </button>
                )}
                {session.price && <span className="font-semibold text-foreground">{session.currency === "INR" ? "₹" : ""}{session.price}</span>}
              </div>
            </div>
          </div>

          {session?.selectedSize && (
            <Button
              size="sm"
              className="h-9 px-4 rounded-xl text-xs shrink-0 font-medium"
              disabled={adding || addDone || !session?.selectedSize}
              onClick={handleAddToCart}
            >
              {addDone ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" /> Added
                </>
              ) : adding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Add to Cart
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
