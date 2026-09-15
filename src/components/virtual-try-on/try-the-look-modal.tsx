"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Camera,
  User,
  Upload,
  Check,
  Loader2,
  Download,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  Lock,
} from "lucide-react";
import { useVirtualTryOn } from "@/contexts/virtual-try-on";
import { convertHeicToJpegIfNeeded } from "@/utils/heic-converter";
import { AddToCartModal, type AddToCartItem } from "@/components/cart/add-to-cart-modal";
import type { CartItem } from "@/types/product";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface TryTheLookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: CartItem) => void;
  onBack?: () => void;
  onShopTheLook?: (items: AddToCartItem[], outfitTitle?: string) => void;
}

function parsePrice(val?: string | number): number {
  if (!val) return 0;
  if (typeof val === "number") return val;
  return Number(String(val).replace(/[^0-9.]/g, "")) || 0;
}

function fmtPrice(val: number): string {
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

function cleanTitle(title?: string): string {
  if (!title) return "";
  return title.split("|")[0].trim();
}

export function TryTheLookModal({
  isOpen,
  onClose,
  onAddToCart,
  onBack,
  onShopTheLook,
}: TryTheLookModalProps) {
  const { session } = useVirtualTryOn();

  const [fullBodyFile, setFullBodyFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [fullBodyPreview, setFullBodyPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [aiResultUrl, setAiResultUrl] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [cartModalItems, setCartModalItems] = useState<AddToCartItem[] | null>(null);

  const fullBodyRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  // Garment info from session
  const topName = cleanTitle(session?.productTitle) || "Top Garment";
  const bottomName = cleanTitle(session?.bottomGarment?.productTitle) || "Bottom Garment";
  const outfitName = session?.outfitTitle || `${topName} & ${bottomName}`;

  const topPrice = parsePrice(session?.price);
  const bottomPrice = parsePrice(session?.bottomGarment?.price);
  const totalPrice = topPrice + bottomPrice;

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

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "fullBody" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "fullBody") {
      await handleFullBody(file);
    } else {
      await handleSelfie(file);
    }
  };

  const handleGenerateTryOn = useCallback(async () => {
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

      if (session.bottomGarment?.productImage) {
        try {
          const bottomRes = await fetch(session.bottomGarment.productImage);
          const bottomBlob = await bottomRes.blob();
          const bottomFile = await convertHeicToJpegIfNeeded(
            new File([bottomBlob], "bottom-garment.jpg", { type: bottomBlob.type || "image/jpeg" })
          );
          formData.append("bottomGarmentImage", bottomFile);
        } catch (e) {
          console.warn("Failed to load bottom garment for dual try-on:", e);
        }
      }

      const res = await fetch(`${API_BASE}/api/try-on/image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        let error = "Generation failed";
        try {
          const json = JSON.parse(text);
          error = json.error || error;
        } catch {}
        throw new Error(error);
      }

      const blob = await res.blob();
      setAiResultUrl(URL.createObjectURL(blob));
      setAiStatus("done");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate try-on");
      setAiStatus("error");
    }
  }, [fullBodyFile, selfieFile, session?.productImage, session?.bottomGarment?.productImage]);

  const handleOpenShopTheLook = () => {
    if (!session) return;
    const items: AddToCartItem[] = [
      {
        handle: session.productHandle,
        title: session.productTitle,
        image: session.productImage || "",
        price: fmtPrice(topPrice),
        category: "Top",
      },
    ];
    if (session.bottomGarment) {
      items.push({
        handle: session.bottomGarment.productHandle,
        title: session.bottomGarment.productTitle,
        image: session.bottomGarment.productImage || "",
        price: fmtPrice(bottomPrice),
        category: "Bottom",
      });
    }

    if (onShopTheLook) {
      onShopTheLook(items, outfitName);
    } else {
      setCartModalItems(items);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl">
        {/* ── Sticky Luxury Header ── */}
        <DialogHeader className="shrink-0 px-5 pt-4 pb-3 sm:px-6 sm:pt-5 border-b border-border/50 text-left pr-10">
          {/* Top row: Brand badge + 3-step indicator */}
          <div className="flex items-center justify-between gap-2 pr-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8C3A3F]/10 text-[#8C3A3F] border border-[#8C3A3F]/20">
              <Sparkles className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Virtual Try-On
              </span>
            </div>

            {/* 3-Step Journey Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
              <div
                className={`flex items-center gap-1.5 ${
                  fullBodyFile && selfieFile ? "text-foreground font-semibold" : "text-[#8C3A3F] font-bold"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-[#8C3A3F]/15 text-[#8C3A3F] flex items-center justify-center text-[9px] font-bold">
                  1
                </span>
                <span>Upload</span>
              </div>
              <span className="text-muted-foreground/40">&rsaquo;</span>
              <div
                className={`flex items-center gap-1.5 ${
                  aiStatus === "generating" ? "text-[#8C3A3F] font-bold" : ""
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] font-bold">
                  2
                </span>
                <span>Try On</span>
              </div>
              <span className="text-muted-foreground/40">&rsaquo;</span>
              <div
                className={`flex items-center gap-1.5 ${
                  aiStatus === "done" ? "text-emerald-600 font-bold" : ""
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] font-bold">
                  3
                </span>
                <span>Explore</span>
              </div>
            </div>
          </div>

          {/* Large Title & Subtitle */}
          <div className="mt-2 sm:mt-2.5">
            <DialogTitle className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
              See it on you
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Upload your photos and instantly visualize how this outfit looks on you.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4">
          {/* Upload Columns — 2 columns on mobile and desktop */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {/* Column 1: Full Body Photo */}
            <div className="flex flex-col rounded-xl border border-border/70 bg-[#FAF8F5] dark:bg-stone-900/60 p-2.5 sm:p-4 transition-all hover:border-[#8C3A3F]/30 shadow-2xs">
              <div className="flex items-start justify-between gap-1.5 mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#EAE3D6] dark:bg-stone-800 text-[#8B5E3A] flex items-center justify-center shrink-0">
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] sm:text-sm font-semibold text-foreground leading-tight truncate">
                      Full Body
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 hidden xs:block truncate">
                      Full body in frame
                    </p>
                  </div>
                </div>
                {fullBodyFile && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] sm:text-[10px] font-bold shrink-0">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Ready
                  </span>
                )}
              </div>

              {/* Photo Tips list */}
              <div className="my-1.5 sm:my-2 py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-lg bg-background/80 border border-border/40 text-[9px] sm:text-[11px] text-muted-foreground space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8C3A3F] shrink-0" />
                  <span className="truncate">Head to toe visible</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8C3A3F] shrink-0" />
                  <span className="truncate">Good lighting</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8C3A3F] shrink-0" />
                  <span className="truncate">Neutral background</span>
                </div>
              </div>

              {/* Button / Preview */}
              <div className="mt-auto pt-1.5 sm:pt-2 flex items-center gap-1.5 sm:gap-2.5">
                {fullBodyPreview ? (
                  <div className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-emerald-500/40 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fullBodyPreview} alt="Full Body Preview" className="w-full h-full object-cover" />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => fullBodyRef.current?.click()}
                  className="flex-1 h-8 sm:h-9 rounded-lg bg-[#0C1926] dark:bg-stone-800 hover:bg-[#15273b] text-white text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-2xs px-1.5"
                >
                  <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">{fullBodyFile ? "Change" : "Choose"}</span>
                </button>
              </div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground text-center mt-1 font-mono">
                JPG, PNG &le; 10MB
              </p>
            </div>

            {/* Column 2: Selfie Photo */}
            <div className="flex flex-col rounded-xl border border-border/70 bg-[#FAF8F5] dark:bg-stone-900/60 p-2.5 sm:p-4 transition-all hover:border-[#8C3A3F]/30 shadow-2xs">
              <div className="flex items-start justify-between gap-1.5 mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#EAE3D6] dark:bg-stone-800 text-[#8B5E3A] flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] sm:text-sm font-semibold text-foreground leading-tight truncate">
                      Selfie
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 hidden xs:block truncate">
                      Clear face view
                    </p>
                  </div>
                </div>
                {selfieFile && (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] sm:text-[10px] font-bold shrink-0">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Ready
                  </span>
                )}
              </div>

              {/* Photo Tips list */}
              <div className="my-1.5 sm:my-2 py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-lg bg-background/80 border border-border/40 text-[9px] sm:text-[11px] text-muted-foreground space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8C3A3F] shrink-0" />
                  <span className="truncate">Front-facing face</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8C3A3F] shrink-0" />
                  <span className="truncate">No dark sunglasses</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#8C3A3F] shrink-0" />
                  <span className="truncate">Natural lighting</span>
                </div>
              </div>

              {/* Button / Preview */}
              <div className="mt-auto pt-1.5 sm:pt-2 flex items-center gap-1.5 sm:gap-2.5">
                {selfiePreview ? (
                  <div className="relative w-8 h-8 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-emerald-500/40 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-cover" />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => selfieRef.current?.click()}
                  className="flex-1 h-8 sm:h-9 rounded-lg bg-[#0C1926] dark:bg-stone-800 hover:bg-[#15273b] text-white text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-2xs px-1.5"
                >
                  <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">{selfieFile ? "Change" : "Choose"}</span>
                </button>
              </div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground text-center mt-1 font-mono">
                JPG, PNG &le; 10MB
              </p>
            </div>
          </div>

          {/* Hidden file inputs with explicit HEIC/HEIF and camera capture */}
          <input
            ref={fullBodyRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.HEIC,.HEIF,image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileChange(e, "fullBody")}
          />
          <input
            ref={selfieRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.HEIC,.HEIF,image/*"
            capture="user"
            className="hidden"
            onChange={(e) => handleFileChange(e, "selfie")}
          />

          {/* Only show AI Canvas when generating or result is ready — avoids empty placeholder scrolling */}
          {aiStatus === "done" && aiResultUrl && (
            <div className="relative w-full rounded-2xl border border-border/60 bg-[#FAF8F5] dark:bg-stone-950 overflow-hidden aspect-[3/4] max-h-[420px] shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={aiResultUrl}
                alt="AI Try-On Result"
                className="w-full h-full object-contain"
              />
              <span className="absolute top-3 left-3 bg-background/85 backdrop-blur-md border border-border/40 text-foreground text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow-2xs">
                AI Try-On Result
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = aiResultUrl;
                    a.download = "aeternum-outfit-try-on.png";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-stone-900 text-xs font-semibold shadow-sm hover:bg-stone-100 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  type="button"
                  onClick={handleGenerateTryOn}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/90 backdrop-blur-md text-stone-900 text-xs font-semibold shadow-sm hover:bg-white transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
              </div>
            </div>
          )}

          {aiStatus === "generating" && (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-3 rounded-2xl border border-border/60 bg-[#FAF8F5] dark:bg-stone-950">
              <div className="h-14 w-14 rounded-2xl bg-[#8C3A3F]/10 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#8C3A3F]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Generating your outfit try-on...
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Our AI is draping both garments onto your body profile (15–30 sec)
                </p>
              </div>
            </div>
          )}

          {/* Generation Error Banner */}
          {aiStatus === "error" && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center">
              <p className="text-xs text-destructive mb-2">{aiError || "Failed to generate try-on"}</p>
              <button
                type="button"
                onClick={handleGenerateTryOn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry Generation
              </button>
            </div>
          )}

          {/* Primary Action Button: Generate Outfit Try-On */}
          <button
            type="button"
            disabled={!fullBodyFile || !selfieFile || aiStatus === "generating"}
            onClick={handleGenerateTryOn}
            className="w-full h-11 rounded-xl bg-[#8C3A3F] hover:bg-[#772F34] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {aiStatus === "generating"
                ? "Generating Outfit Try-On..."
                : "Generate Outfit Try-On (Top & Bottom)"}
            </span>
            {aiStatus !== "generating" && <ArrowRight className="w-4 h-4" />}
          </button>

          {/* Privacy & Security guarantee */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pb-1">
            <Lock className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
            <span>Your photos are processed securely and never shared.</span>
          </div>
        </div>

        {/* ── Sticky Bottom Footer: Garment Summary + Total + Shop CTA ── */}
        <div className="shrink-0 border-t border-border/60 bg-background/98 backdrop-blur-md">
          {/* Garments row */}
          <div className="px-4 sm:px-6 pt-3 pb-2.5">
            <div className="flex items-center gap-3">
              {/* Top Garment Card */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {session?.productImage && (
                  <div className="h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.productImage}
                      alt={topName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      Top
                    </span>
                    <p className="text-xs font-semibold text-foreground truncate leading-tight">
                      {topName}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {fmtPrice(topPrice)}
                  </p>
                </div>
              </div>

              {/* Vertical divider */}
              <div className="w-px h-10 bg-border/60 shrink-0" />

              {/* Bottom Garment Card */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {session?.bottomGarment?.productImage && (
                  <div className="h-11 w-11 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.bottomGarment.productImage}
                      alt={bottomName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      Bottom
                    </span>
                    <p className="text-xs font-semibold text-foreground truncate leading-tight">
                      {bottomName}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {fmtPrice(bottomPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Total & Action Button row */}
          <div className="px-4 sm:px-6 pb-4 pt-1 flex items-center justify-between gap-4 border-t border-border/40">
            <div className="shrink-0">
              <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest block leading-none mb-1">
                Total for Look
              </span>
              <span className="text-base sm:text-lg font-bold text-foreground font-mono leading-tight">
                {fmtPrice(totalPrice)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleOpenShopTheLook}
              className="flex-1 max-w-[240px] h-10 rounded-xl bg-[#8C3A3F] hover:bg-[#772F34] active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shop This Look</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Sizing & Add to Cart Overlay */}
    {cartModalItems && (
      <AddToCartModal
        items={cartModalItems}
        outfitTitle={outfitName}
        onClose={() => setCartModalItems(null)}
      />
    )}
  </>
);
}

export default TryTheLookModal;
