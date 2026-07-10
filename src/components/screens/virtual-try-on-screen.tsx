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
} from "lucide-react";
import { useVirtualTryOn } from "@/contexts/virtual-try-on";
import { findRecommendedSize } from "@/services/virtual-try-on";
import { getSizeChart } from "@/services/api";
import type { FitQuality, ProductSizeChart, TryOnSession } from "@/types/virtual-try-on";
import type { CartItem } from "@/types/product";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type VirtualTryOnScreenProps = {
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
  productSizes?: string[];
};

const QUALITY_COLORS: Record<FitQuality, { stroke: string; bg: string; text: string }> = {
  perfect: { stroke: "#22c55e", bg: "bg-green-500/10", text: "text-green-600" },
  great: { stroke: "#22c55e", bg: "bg-green-500/10", text: "text-green-600" },
  good: { stroke: "#8b5e3a", bg: "bg-amber-500/10", text: "text-amber-700" },
  consider_sizing_up: { stroke: "#8c3a3f", bg: "bg-red-500/10", text: "text-red-600" },
  consider_sizing_down: { stroke: "#8c3a3f", bg: "bg-red-500/10", text: "text-red-600" },
};

type MeasurementField = {
  key: string;
  label: string;
  unit: string;
  placeholder: string;
};

function getMeasurementFields(productCategory?: string): MeasurementField[] {
  if (!productCategory) {
    return [
      { key: "height", label: "Height", unit: "cm", placeholder: "e.g. 170" },
      { key: "chest", label: "Chest", unit: "cm", placeholder: "e.g. 96" },
      { key: "waist", label: "Waist", unit: "cm", placeholder: "e.g. 76" },
      { key: "hips", label: "Hips", unit: "cm", placeholder: "e.g. 90" },
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
      { key: "height", label: "Height", unit: "cm", placeholder: "e.g. 170" },
      { key: "waist", label: "Waist", unit: "cm", placeholder: "e.g. 76" },
      { key: "hips", label: "Hips", unit: "cm", placeholder: "e.g. 90" },
    ];
  }
  if (isTop) {
    return [
      { key: "height", label: "Height", unit: "cm", placeholder: "e.g. 170" },
      { key: "chest", label: "Chest", unit: "cm", placeholder: "e.g. 96" },
      { key: "waist", label: "Waist", unit: "cm", placeholder: "e.g. 76" },
    ];
  }
  return [
    { key: "height", label: "Height", unit: "cm", placeholder: "e.g. 170" },
    { key: "chest", label: "Chest", unit: "cm", placeholder: "e.g. 96" },
    { key: "waist", label: "Waist", unit: "cm", placeholder: "e.g. 76" },
    { key: "hips", label: "Hips", unit: "cm", placeholder: "e.g. 90" },
  ];
}

function FitScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedOffset(offset), 200);
    return () => clearTimeout(timer);
  }, [offset]);

  const color =
    score >= 85 ? "#22c55e"
    : score >= 70 ? "#8b5e3a"
    : score >= 50 ? "#eab308"
    : "#8c3a3f";

  return (
    <svg className="w-32 h-32" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" className="text-muted/40" strokeWidth="8" />
      <circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={animatedOffset} className="transition-all duration-1000 ease-out" transform="rotate(-90 64 64)" />
      <text x="64" y="64" textAnchor="middle" dominantBaseline="central" className="fill-foreground" style={{ fontSize: "28px", fontWeight: 600 }}>
        {score}
        <tspan className="fill-muted-foreground" style={{ fontSize: "14px" }}>%</tspan>
      </text>
    </svg>
  );
}

type Tab = "ai" | "fit";

export function VirtualTryOnScreen({
  onAddToCart,
  onBack,
  productSizes = ["XS", "S", "M", "L", "XL", "XXL"],
}: VirtualTryOnScreenProps) {
  const { session, result, startTryOn, updateSize, updateMeasurements, computeFitScore } = useVirtualTryOn();
  const [tab, setTab] = useState<Tab>("ai");

  const [fullBodyFile, setFullBodyFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [fullBodyPreview, setFullBodyPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [aiResultUrl, setAiResultUrl] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [editingMeasurements, setEditingMeasurements] = useState(false);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [calculating, setCalculating] = useState(false);

  const fullBodyRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const prevProductId = useRef<string | null>(null);

  const fitScore = result?.fitScore;
  const comparisonRows = result?.comparisonRows ?? [];
  const fields = getMeasurementFields(session?.productCategory);

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
      setEditingMeasurements(false);
      setMeasurementValues({});
      setCalculating(false);
    }
    prevProductId.current = session.productId;
  }, [session?.productId]);

  const toCm = (v: number, u: "cm" | "in") => (u === "in" ? Math.round(v * 2.54) : v);

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
    } catch {
      const updated: TryOnSession = { ...session, measurements: parsed };
      startTryOn(updated);
      computeFitScore(updated);
    } finally {
      setCalculating(false);
    }
  }, [session, measurementValues, startTryOn, computeFitScore]);

  const handleMeasurementSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const catFields = getMeasurementFields(session?.productCategory);
      const parsed: Record<string, number> = {};
      for (const field of catFields) {
        const v = Number(measurementValues[field.key]);
        if (v > 0 && v <= 300) parsed[field.key] = v;
      }
      if (Object.keys(parsed).length > 0) {
        updateMeasurements(parsed);
        setEditingMeasurements(false);
      }
    },
    [session?.productCategory, measurementValues, updateMeasurements]
  );

  const handleAddToCart = useCallback(() => {
    if (!session) return;
    const item: CartItem = {
      id: crypto.randomUUID(),
      product: {
        id: session.productId,
        title: session.productTitle,
        description: "",
        price: 0,
        currency: "INR",
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
  }, [session, onAddToCart, productSizes]);

  const handleFullBody = useCallback((file: File) => {
    setFullBodyFile(file);
    setFullBodyPreview(URL.createObjectURL(file));
  }, []);

  const handleSelfie = useCallback((file: File) => {
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  }, []);

  function handlePhotoDrop(e: React.DragEvent, target: "fullBody" | "selfie") {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    // Accept images by MIME type (image/jpeg, image/png, image/heic, etc.)
    // OR by file extension (.heic/.HEIC — iOS sometimes reports HEIC as
    // application/octet-stream in drag-and-drop).
    if (file && (file.type.startsWith("image/") || /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name))) {
      if (target === "fullBody") handleFullBody(file);
      else handleSelfie(file);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>, target: "fullBody" | "selfie") {
    const file = e.target.files?.[0];
    if (file) {
      if (target === "fullBody") handleFullBody(file);
      else handleSelfie(file);
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
      const garmentFile = new File([garmentBlob], "garment.jpg", { type: garmentBlob.type || "image/jpeg" });

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

  const qualityColor = fitScore ? QUALITY_COLORS[fitScore.quality] : QUALITY_COLORS.good;

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
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => {
                  const a = document.createElement("a");
                  a.href = aiResultUrl;
                  a.download = "aeternum-try-on.png";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}>
                  <Download className="mr-1 h-3 w-3" /> Download
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={generateAiTryOn}>
                  <RefreshCw className="mr-1 h-3 w-3" /> Regenerate
                </Button>
              </div>
            </div>
          )}

          {aiStatus === "error" && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-xs text-destructive mb-2">{aiError || "Failed to generate"}</p>
              <Button size="sm" variant="outline" className="text-xs h-8" onClick={generateAiTryOn}>
                <RefreshCw className="mr-1 h-3 w-3" /> Try Again
              </Button>
            </div>
          )}

          <Button
            size="sm"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Your Measurements</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (editingMeasurements) {
                  setEditingMeasurements(false);
                } else {
                  if (session.measurements) {
                    const init: Record<string, string> = {};
                    for (const [k, v] of Object.entries(session.measurements)) init[k] = String(v);
                    setMeasurementValues(init);
                  }
                  setEditingMeasurements(true);
                }
              }}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              {editingMeasurements ? "Cancel" : "Edit"}
            </button>
          </div>

          {editingMeasurements ? (
            <form onSubmit={handleMeasurementSubmit} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-[10px] text-muted-foreground">{field.label} ({field.unit})</label>
                    <Input type="number" placeholder={field.placeholder} value={measurementValues[field.key] ?? ""}
                      onChange={(e) => setMeasurementValues((prev) => ({ ...prev, [field.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <Button type="submit" size="sm" className="w-full">
                <RefreshCw className="mr-2 h-3 w-3" /> Save Measurements
              </Button>
            </form>
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {Object.entries(session.measurements).length > 0 ? (
                Object.entries(session.measurements).map(([key, val]) => {
                  const label = fields.find((f) => f.key === key)?.label ?? key;
                  const row = comparisonRows.find((r) => r.label.toLowerCase() === key);
                  return (
                    <div key={key} className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-muted-foreground capitalize">{label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground font-medium">{val} cm</span>
                        {row && (
                          <span className={`text-xs ${row.withinRange ? "text-green-600" : "text-red-500"}`}>
                            {row.withinRange ? "✓ In range" : "✗ Adjust"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">No measurements entered. Click Edit to add them.</p>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shirt className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Select Size</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {productSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateSize(size)}
                  className={`rounded-lg border px-4 py-2 text-xs transition-all ${
                    session.selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-muted-foreground"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {session.measurements && Object.keys(session.measurements).length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Recommended:{" "}
                <span className="text-accent font-medium">{findRecommendedSize(session.measurements)}</span>
              </p>
            )}
          </div>

          <Button
            size="sm"
            className="w-full"
            disabled={calculating || Object.keys(measurementValues).length === 0 || !session?.selectedSize}
            onClick={handleCalculate}
          >
            <RefreshCw className={`mr-2 h-3 w-3 ${calculating ? "animate-spin" : ""}`} />
            {calculating ? "Calculating..." : "Calculate Fit Score"}
          </Button>

          {result && fitScore && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-4">
                <FitScoreGauge score={fitScore.overall} />
                <div className="space-y-1">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${qualityColor.bg} ${qualityColor.text}`}>
                    {fitScore.label}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{fitScore.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
