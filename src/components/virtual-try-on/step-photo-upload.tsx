"use client";

import { useRef, useState, useCallback } from "react";
import { ArrowLeft, Camera, Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type StepPhotoUploadProps = {
  onComplete: (photos: { fullBody: File; selfie: File }) => void;
  onBack: () => void;
};

export function StepPhotoUpload({ onComplete, onBack }: StepPhotoUploadProps) {
  const [fullBody, setFullBody] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [fullBodyPreview, setFullBodyPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const fullBodyRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const handleFullBody = useCallback((file: File) => {
    setFullBody(file);
    setFullBodyPreview(URL.createObjectURL(file));
  }, []);

  const handleSelfie = useCallback((file: File) => {
    setSelfie(file);
    setSelfiePreview(URL.createObjectURL(file));
  }, []);

  function handleDrop(
    e: React.DragEvent,
    target: "fullBody" | "selfie"
  ) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      if (target === "fullBody") handleFullBody(file);
      else handleSelfie(file);
    }
  }

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    target: "fullBody" | "selfie"
  ) {
    const file = e.target.files?.[0];
    if (file) {
      if (target === "fullBody") handleFullBody(file);
      else handleSelfie(file);
    }
  }

  const canContinue = fullBody && selfie;

  return (
    <div className="animate-fade-in space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div>
        <h2 className="text-lg font-medium text-foreground">Upload Your Photos</h2>
        <p className="text-xs text-muted-foreground mt-1">
          We need two photos to generate a realistic try-on
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Full Body Photo</span>
            {fullBody && <Check className="h-3 w-3 text-green-500" />}
          </div>
          <div
            onDrop={(e) => handleDrop(e, "fullBody")}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fullBodyRef.current?.click()}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all overflow-hidden"
          >
            {fullBodyPreview ? (
              <img
                src={fullBodyPreview}
                alt="Full body"
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground text-center px-4">
                  Drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  Standing full-length
                </p>
              </>
            )}
          </div>
          <input
            ref={fullBodyRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "fullBody")}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Selfie</span>
            {selfie && <Check className="h-3 w-3 text-green-500" />}
          </div>
          <div
            onDrop={(e) => handleDrop(e, "selfie")}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => selfieRef.current?.click()}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all overflow-hidden"
          >
            {selfiePreview ? (
              <img
                src={selfiePreview}
                alt="Selfie"
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground text-center px-4">
                  Drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                  Front-facing, good lighting
                </p>
              </>
            )}
          </div>
          <input
            ref={selfieRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "selfie")}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Tips for best results:</strong>
          <br />
          &bull; Stand against a plain background with good lighting
          <br />
          &bull; Wear fitted clothing so your body shape is visible
          <br />
          &bull; Keep your arms slightly away from your body
          <br />
          &bull; Face forward in both photos
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={onBack}>
          <ArrowLeft className="mr-2 h-3 w-3" />
          Back
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={!canContinue}
          onClick={() => onComplete({ fullBody: fullBody!, selfie: selfie! })}
        >
          Generate AI Try-On
        </Button>
      </div>
    </div>
  );
}
