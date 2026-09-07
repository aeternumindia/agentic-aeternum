"use client";

import React, { useRef } from "react";
import { Camera, Upload, Sparkles, Image as ImageIcon } from "lucide-react";

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
  previewUrl: string | null;
}

export function UploadDropzone({
  onFileSelect,
  isAnalyzing,
  previewUrl,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onClick={() => !isAnalyzing && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`group relative flex-1 w-full h-full flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border/80 bg-card p-8 sm:p-10 text-center transition-all cursor-pointer shadow-xs hover:border-foreground/40 hover:bg-muted/10 ${
          isAnalyzing ? "pointer-events-none opacity-80" : ""
        }`}
      >
        {previewUrl && isAnalyzing ? (
          <div className="relative w-40 h-40 rounded-2xl overflow-hidden shadow-md border border-border">
            <img
              src={previewUrl}
              alt="Analyzing Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
              <Sparkles className="w-6 h-6 animate-spin text-amber-300" />
              <span className="text-xs font-semibold">AI Analyzing Complexion...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center text-accent transition-all group-hover:scale-105 shadow-2xs">
              <Camera className="w-7 h-7" />
            </div>

            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-semibold text-foreground">
                Upload Facial Portrait
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tap to select or drag & drop a clear photo under natural lighting for AI undertone detection.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-[11px] font-semibold text-foreground shadow-2xs group-hover:border-foreground/30">
                <Upload className="w-3.5 h-3.5 text-accent" />
                Select Photo File
              </span>
              <span className="text-[10px] text-muted-foreground">JPG, PNG, HEIC (iPhone)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
