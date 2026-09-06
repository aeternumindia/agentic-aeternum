"use client";

import React from "react";
import { Sparkles, Shirt, Camera, UserPlus, Image as ImageIcon, Loader2, Download, RotateCcw, AlertCircle } from "lucide-react";
import { ModelOption } from "../model-selection-modal";

export interface UserSelectorProps {
  activeTab: "model" | "photos";
  selectedModel: string;
  faceImage: string | null;
  bodyImage: string | null;
  models: ModelOption[];
  onOpenModal: () => void;
  onOpenGarmentModal?: () => void;
  selectedGarmentsCount?: number;
  onTryOn?: () => void;
  isGenerating?: boolean;
  tryOnResultImage?: string | null;
  tryOnError?: string | null;
  onClearResult?: () => void;
}

export function UserSelector({
  activeTab,
  selectedModel,
  faceImage,
  bodyImage,
  models,
  onOpenModal,
  onOpenGarmentModal,
  selectedGarmentsCount = 0,
  onTryOn,
  isGenerating = false,
  tryOnResultImage = null,
  tryOnError = null,
  onClearResult,
}: UserSelectorProps) {
  const selectedModelObj = models.find((m) => m.name === selectedModel);

  const handleDownload = async () => {
    if (!tryOnResultImage) return;
    try {
      const res = await fetch(tryOnResultImage);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `aeternum-try-on-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement("a");
      a.href = tryOnResultImage;
      a.download = `aeternum-try-on-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div
      style={{ flex: "1 1 360px", maxWidth: "420px", minWidth: "300px" }}
      className="w-full border border-border bg-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs gap-5 self-start"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                Try-On Canvas
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {tryOnResultImage
                ? "AI Try-On Result"
                : activeTab === "model"
                ? `Active Model: ${selectedModel}`
                : bodyImage || faceImage
                ? "Custom Photos Applied"
                : "Select model or upload photos"}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenModal}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-muted/40 hover:bg-muted/80 text-foreground transition-all cursor-pointer shadow-xs hover:border-foreground/30 active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Upload Photo / Model</span>
          </button>
        </div>

        {/* Canvas Preview Viewport (Strict 3:4 Aspect Ratio) */}
        <div className="border border-border/80 rounded-2xl overflow-hidden bg-muted/20 relative shadow-inner aspect-[3/4] w-full flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center relative">
            {isGenerating ? (
              <div className="absolute inset-0 bg-card/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center gap-4 z-20">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Generating Virtual Try-On...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fitting garments with AI precision (15-30s)
                  </p>
                </div>
                <div className="w-40 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            ) : tryOnResultImage ? (
              <div className="relative w-full h-full group flex items-center justify-center bg-black/5">
                <img
                  src={tryOnResultImage}
                  alt="AI Try-On Result"
                  className="w-full h-full object-cover"
                />

                {/* Floating action buttons over the bottom corner of generated image */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-background/90 hover:bg-background text-foreground text-xs font-semibold border border-border shadow-lg backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Download Generated Image"
                  >
                    <Download className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Download</span>
                  </button>
                  {onClearResult && (
                    <button
                      type="button"
                      onClick={onClearResult}
                      className="p-2 rounded-xl bg-background/90 hover:bg-background text-foreground border border-border shadow-lg backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                      title="Reset / Try Another"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            ) : activeTab === "photos" && bodyImage ? (
              <img
                src={bodyImage}
                alt="Try on preview"
                className="w-full h-full object-contain"
              />
            ) : activeTab === "model" && selectedModelObj?.image ? (
              <img
                src={selectedModelObj.image}
                alt={selectedModel}
                className="w-full h-full object-cover"
              />
            ) : (
              <button
                type="button"
                onClick={onOpenModal}
                disabled={isGenerating}
                className="text-center px-6 py-12 flex flex-col items-center justify-center gap-2.5 w-full h-full cursor-pointer group hover:bg-muted/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-muted/60 group-hover:bg-muted/90 flex items-center justify-center mb-1 text-muted-foreground group-hover:text-foreground transition-colors shadow-2xs">
                  <Camera className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground">{selectedModel}</p>
                <p className="text-xs text-muted-foreground">
                  Tap to upload your photo or select model
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Error Alert if any */}
        {tryOnError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2.5 text-xs text-destructive shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{tryOnError}</span>
          </div>
        )}
      </div>

      {/* Action Buttons (Mobile: 2 equal buttons, Desktop: 1 full-width Try On button) */}
      <div className="flex flex-col gap-2.5 pt-2">
        <div className="flex items-center gap-3 w-full">
          {/* Choose Garments Button (Mobile & Tablet only) */}
          <button
            type="button"
            onClick={onOpenGarmentModal}
            disabled={isGenerating}
            className="flex md:hidden flex-1 items-center justify-center gap-2 py-3 px-3.5 sm:px-4 rounded-xl border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <Shirt className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">
              {selectedGarmentsCount > 0 ? "Garments" : "Choose Garments"}
            </span>
            {selectedGarmentsCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold shrink-0">
                {selectedGarmentsCount}
              </span>
            )}
          </button>

          {/* Try On Action Button (100% width on desktop) */}
          <button
            type="button"
            onClick={onTryOn}
            disabled={selectedGarmentsCount === 0 || isGenerating}
            className="flex-1 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold transition-all cursor-pointer shadow-xs hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="truncate">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {selectedGarmentsCount === 0
                    ? "Try On"
                    : `Try On (${selectedGarmentsCount})`}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Selection Status Micro-text */}
        <p className="text-[11px] text-center text-muted-foreground">
          {isGenerating
            ? "AI processing model and garment fitting..."
            : selectedGarmentsCount === 0
            ? "Choose garments above to start virtual try-on"
            : `${selectedGarmentsCount} garment${
                selectedGarmentsCount > 1 ? "s" : ""
              } selected for fitting`}
        </p>
      </div>
    </div>
  );
}

export default UserSelector;
