"use client";

import { useRef, useState, useCallback } from "react";
import { ArrowLeft, Camera, Upload, Check, ImageIcon } from "lucide-react";
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

  // Camera-triggered file inputs
  const fullBodyCameraRef = useRef<HTMLInputElement>(null);
  const selfieCameraRef = useRef<HTMLInputElement>(null);
  // Gallery / choose-files inputs (no capture — shows file picker on all devices)
  const fullBodyFileRef = useRef<HTMLInputElement>(null);
  const selfieFileRef = useRef<HTMLInputElement>(null);

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
    // Accept images by MIME type OR by .heic extension (iOS drag-and-drop quirk)
    if (file && (file.type.startsWith("image/") || /\.heic$/i.test(file.name))) {
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
        {/* ----- Full Body ----- */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Full Body Photo</span>
            {fullBody && <Check className="h-3 w-3 text-green-500" />}
          </div>

          {/* Drop zone */}
          <div
            onDrop={(e) => handleDrop(e, "fullBody")}
            onDragOver={(e) => e.preventDefault()}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center overflow-hidden mb-3"
          >
            {fullBodyPreview ? (
              <img
                src={fullBodyPreview}
                alt="Full body"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center px-4 text-center">
                <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Drag & drop or use the buttons below
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => fullBodyCameraRef.current?.click()}
            >
              <Camera className="mr-1.5 h-3.5 w-3.5" />
              Camera
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => fullBodyFileRef.current?.click()}
            >
              <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
              Choose File
            </Button>
          </div>

          {/* Hidden camera input */}
          <input
            ref={fullBodyCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "fullBody")}
          />
          {/* Hidden gallery/file input */}
          <input
            ref={fullBodyFileRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "fullBody")}
          />
        </div>

        {/* ----- Selfie ----- */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Selfie</span>
            {selfie && <Check className="h-3 w-3 text-green-500" />}
          </div>

          {/* Drop zone */}
          <div
            onDrop={(e) => handleDrop(e, "selfie")}
            onDragOver={(e) => e.preventDefault()}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center overflow-hidden mb-3"
          >
            {selfiePreview ? (
              <img
                src={selfiePreview}
                alt="Selfie"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center px-4 text-center">
                <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Drag & drop or use the buttons below
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => selfieCameraRef.current?.click()}
            >
              <Camera className="mr-1.5 h-3.5 w-3.5" />
              Camera
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => selfieFileRef.current?.click()}
            >
              <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
              Choose File
            </Button>
          </div>

          {/* Hidden camera input */}
          <input
            ref={selfieCameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "selfie")}
          />
          {/* Hidden gallery/file input */}
          <input
            ref={selfieFileRef}
            type="file"
            accept="image/*,.heic,.heif"
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
