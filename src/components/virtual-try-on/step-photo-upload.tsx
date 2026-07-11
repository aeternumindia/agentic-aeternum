"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ArrowLeft, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoPicker } from "./photo-picker";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

type StepPhotoUploadProps = {
  onComplete: (photos: { fullBody: File; selfie: File }) => void;
  onBack: () => void;
};

export function StepPhotoUpload({ onComplete, onBack }: StepPhotoUploadProps) {
  const [fullBody, setFullBody] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [fullBodyPreview, setFullBodyPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<"fullBody" | "selfie" | null>(
    null,
  );
  const [dragOver, setDragOver] = useState<"fullBody" | "selfie" | null>(null);
  const [errorSlot, setErrorSlot] = useState<{
    slot: "fullBody" | "selfie";
    message: string;
  } | null>(null);
  const [cameraCancelled, setCameraCancelled] = useState<
    "fullBody" | "selfie" | null
  >(null);

  // Refs for focus management and memory-safe object URLs
  const fullBodyZoneRef = useRef<HTMLDivElement>(null);
  const selfieZoneRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLDivElement | null>(null);
  const fullBodyPreviewRef = useRef<string | null>(null);
  const selfiePreviewRef = useRef<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cameraTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cameraPendingRef = useRef<"fullBody" | "selfie" | null>(null);
  const fullBodyRef = useRef<File | null>(null);
  const selfieRef = useRef<File | null>(null);

  // Keep refs in sync with state for use in visibility / timeout callbacks
  useEffect(() => {
    fullBodyRef.current = fullBody;
  }, [fullBody]);
  useEffect(() => {
    selfieRef.current = selfie;
  }, [selfie]);
  useEffect(() => {
    fullBodyPreviewRef.current = fullBodyPreview;
  }, [fullBodyPreview]);
  useEffect(() => {
    selfiePreviewRef.current = selfiePreview;
  }, [selfiePreview]);

  // Detect camera cancellation: when user returns from camera UI without a photo
  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === "visible" &&
        cameraPendingRef.current
      ) {
        const slot = cameraPendingRef.current;
        cameraPendingRef.current = null;
        // Small delay so onChange can fire if a photo was taken
        setTimeout(() => {
          const empty =
            slot === "fullBody"
              ? !fullBodyRef.current
              : !selfieRef.current;
          if (empty) {
            setCameraCancelled(slot);
            setTimeout(() => setCameraCancelled(null), 4000);
          }
        }, 200);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Camera-triggered file inputs
  const fullBodyCameraRef = useRef<HTMLInputElement>(null);
  const selfieCameraRef = useRef<HTMLInputElement>(null);
  // Gallery / choose-files inputs (no capture — shows file picker on all devices)
  const fullBodyFileRef = useRef<HTMLInputElement>(null);
  const selfieFileRef = useRef<HTMLInputElement>(null);

  const handleFullBody = useCallback((file: File) => {
    // Revoke previous blob URL to avoid memory leak
    if (fullBodyPreviewRef.current) {
      URL.revokeObjectURL(fullBodyPreviewRef.current);
    }
    const url = URL.createObjectURL(file);
    fullBodyPreviewRef.current = url;
    setFullBody(file);
    setFullBodyPreview(url);
  }, []);

  const handleSelfie = useCallback((file: File) => {
    if (selfiePreviewRef.current) {
      URL.revokeObjectURL(selfiePreviewRef.current);
    }
    const url = URL.createObjectURL(file);
    selfiePreviewRef.current = url;
    setSelfie(file);
    setSelfiePreview(url);
  }, []);

  function isValidImageFile(file: File): boolean {
    // Accept by MIME type OR by extension (.heic/.heIF from iOS quirk)
    return (
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)
    );
  }

  function showError(
    slot: "fullBody" | "selfie",
    message: string = "This file type isn't supported. Try JPEG, PNG, WebP, or HEIC.",
  ) {
    setErrorSlot({ slot, message });
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorSlot(null), 6000);
  }

  function clearError() {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setErrorSlot(null);
  }

  // ── Drag-and-drop ──
  // Counter pattern to avoid flicker from child-element onDragLeave bubbling
  const dragCounterRef = useRef<Record<"fullBody" | "selfie", number>>({
    fullBody: 0,
    selfie: 0,
  });

  function handleDragEnter(target: "fullBody" | "selfie") {
    dragCounterRef.current[target]++;
    if (dragCounterRef.current[target] === 1) {
      setDragOver(target);
    }
  }

  function handleDragLeave(target: "fullBody" | "selfie") {
    dragCounterRef.current[target]--;
    if (dragCounterRef.current[target] <= 0) {
      dragCounterRef.current[target] = 0;
      setDragOver(null);
    }
  }

  function handleDrop(e: React.DragEvent, target: "fullBody" | "selfie") {
    e.preventDefault();
    dragCounterRef.current[target] = 0;
    setDragOver(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Reject multi-file drops
    if (files.length > 1) {
      showError(target, "Drop only one photo at a time");
      return;
    }

    const file = files[0];

    if (!isValidImageFile(file)) {
      showError(
        target,
        "This file type isn't supported. Try JPEG, PNG, WebP, or HEIC.",
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showError(
        target,
        "Photo is too large. Maximum size is 20 MB.",
      );
      return;
    }

    clearError();
    setCameraCancelled(null);
    if (target === "fullBody") handleFullBody(file);
    else handleSelfie(file);
  }

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    target: "fullBody" | "selfie",
  ) {
    const file = e.target.files?.[0];
    if (file) {
      if (!isValidImageFile(file)) {
        showError(
          target,
          "This file type isn't supported. Try JPEG, PNG, WebP, or HEIC.",
        );
        e.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showError(target, "Photo is too large. Maximum size is 20 MB.");
        e.target.value = "";
        return;
      }
      clearError();
      cameraPendingRef.current = null;
      setCameraCancelled(null);
      if (target === "fullBody") handleFullBody(file);
      else handleSelfie(file);
    }
    // Reset value so the same file can be re-selected
    e.target.value = "";
  }

  function openPicker(slot: "fullBody" | "selfie") {
    clearError();
    setCameraCancelled(null);
    lastFocusedRef.current =
      slot === "fullBody" ? fullBodyZoneRef.current : selfieZoneRef.current;
    setPickerSlot(slot);
  }

  function handleTakePhoto() {
    const slot = pickerSlot;
    if (!slot) return;
    cameraPendingRef.current = slot;
    clearError();
    setCameraCancelled(null);
    if (slot === "fullBody") fullBodyCameraRef.current?.click();
    else selfieCameraRef.current?.click();
  }

  function handleChooseFromGallery() {
    if (pickerSlot === "fullBody") fullBodyFileRef.current?.click();
    else selfieFileRef.current?.click();
  }

  function handlePickerClose() {
    setPickerSlot(null);
    // Restore focus to the originating drop zone
    requestAnimationFrame(() => {
      lastFocusedRef.current?.focus();
    });
  }

  function dropZoneClasses(
    target: "fullBody" | "selfie",
    hasPreview: boolean,
  ): string {
    const base = [
      "relative aspect-[3/4] max-h-[320px] rounded-xl border-2 overflow-hidden transition-all duration-200",
      "cursor-pointer outline-none",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    ];

    if (errorSlot?.slot === target) {
      base.push(
        "border-dashed border-destructive/35 bg-destructive/5 animate-shake",
      );
    } else if (dragOver === target) {
      base.push(
        "border-solid border-primary bg-primary/5 ring-2 ring-primary/30",
      );
    } else if (hasPreview) {
      // Filled: solid border with green tint if photo present
      base.push("border-solid border-border group");
      if (target === "fullBody" ? fullBody : selfie) {
        base.push("border-green-500/30");
      }
    } else {
      // Empty idle state
      base.push(
        "border-dashed border-border bg-card",
        "hover:bg-muted/30 hover:border-muted-foreground/30",
      );
    }

    return base.join(" ");
  }

  const canContinue = fullBody && selfie;

  return (
    <div className="animate-fade-in flex-1 flex flex-col min-h-0">
      <div className="flex-1 relative min-h-0">
        {/* Scrollable content */}
        <div className="absolute inset-0 overflow-y-auto">
          <div className="space-y-6 pb-24">
            {/* Back button (top only — bottom one removed intentionally) */}
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Upload Your Photos
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                We need two photos to generate a realistic try-on
              </p>
            </div>

            {/* Tips card moved above grid — guidance before upload */}
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

            {/* ── Two columns always (mobile + desktop) ── */}
            <div className="grid grid-cols-[repeat(2,minmax(0,280px))] justify-center gap-3 md:gap-6">
              {/* ── Full Body ── */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2.5">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Full Body Photo
                  </span>
                  {fullBody && <Check className="h-3 w-3 text-green-500" />}
                </div>

                <div
                  ref={fullBodyZoneRef}
                  role="button"
                  tabIndex={0}
                  className={dropZoneClasses("fullBody", !!fullBodyPreview)}
                  onClick={() => openPicker("fullBody")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openPicker("fullBody");
                  }}
                  onDrop={(e) => handleDrop(e, "fullBody")}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => handleDragEnter("fullBody")}
                  onDragLeave={() => handleDragLeave("fullBody")}
                  aria-label={
                    fullBody
                      ? "Full body photo selected. Tap to replace."
                      : "Add full body photo"
                  }
                  aria-haspopup="dialog"
                >
                  {fullBodyPreview ? (
                    <>
                      <img
                        src={fullBodyPreview}
                        alt="Full body"
                        className="h-full w-full object-cover"
                      />

                      {/* Persistent edit badge — visible on all devices */}
                      <div className="absolute top-2 right-2 pointer-events-none">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
                          <Camera className="h-3.5 w-3.5 text-foreground" />
                        </span>
                      </div>

                      {/* Hover overlay — desktop only, replace affordance */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-xs font-medium">
                          Tap to replace
                        </span>
                      </div>
                    </>
                  ) : (
                    <div
                      className={`flex flex-col items-center justify-center h-full px-4 text-center transition-transform duration-150 ${dragOver === "fullBody" ? "scale-110" : ""}`}
                    >
                      <Camera className="h-9 w-9 text-muted-foreground/30 mb-2 animate-soft-breathe" />
                      <p className="text-xs text-muted-foreground">
                        Tap to add photo
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">
                        or drag &amp; drop
                      </p>
                    </div>
                  )}
                </div>

                {/* Camera cancelled hint */}
                {cameraCancelled === "fullBody" && (
                  <p className="text-xs text-amber-600 mt-1.5 animate-fade-in">
                    No photo received. Tap the box to try again.
                  </p>
                )}

                {/* Error message */}
                {errorSlot?.slot === "fullBody" && (
                  <p className="text-xs text-destructive mt-1.5 animate-fade-in">
                    {errorSlot.message}
                  </p>
                )}

                {/* Hidden camera input */}
                <input
                  ref={fullBodyCameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "fullBody")}
                />
                {/* Hidden gallery/file input — explicit extensions only, no image/*
                    because iOS Safari with image/* filters out HEIC even if .heic is appended */}
                <input
                  ref={fullBodyFileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.HEIC,.HEIF"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "fullBody")}
                />
              </div>

              {/* ── Selfie ── */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2.5">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Selfie</span>
                  {selfie && <Check className="h-3 w-3 text-green-500" />}
                </div>

                <div
                  ref={selfieZoneRef}
                  role="button"
                  tabIndex={0}
                  className={dropZoneClasses("selfie", !!selfiePreview)}
                  onClick={() => openPicker("selfie")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openPicker("selfie");
                  }}
                  onDrop={(e) => handleDrop(e, "selfie")}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => handleDragEnter("selfie")}
                  onDragLeave={() => handleDragLeave("selfie")}
                  aria-label={
                    selfie
                      ? "Selfie selected. Tap to replace."
                      : "Add selfie photo"
                  }
                  aria-haspopup="dialog"
                >
                  {selfiePreview ? (
                    <>
                      <img
                        src={selfiePreview}
                        alt="Selfie"
                        className="h-full w-full object-cover"
                      />

                      {/* Persistent edit badge */}
                      <div className="absolute top-2 right-2 pointer-events-none">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm ring-1 ring-black/5">
                          <Camera className="h-3.5 w-3.5 text-foreground" />
                        </span>
                      </div>

                      {/* Hover overlay — desktop only */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-xs font-medium">
                          Tap to replace
                        </span>
                      </div>
                    </>
                  ) : (
                    <div
                      className={`flex flex-col items-center justify-center h-full px-4 text-center transition-transform duration-150 ${dragOver === "selfie" ? "scale-110" : ""}`}
                    >
                      <Camera className="h-9 w-9 text-muted-foreground/30 mb-2 animate-soft-breathe" />
                      <p className="text-xs text-muted-foreground">
                        Tap to add photo
                      </p>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">
                        or drag &amp; drop
                      </p>
                    </div>
                  )}
                </div>

                {/* Camera cancelled hint */}
                {cameraCancelled === "selfie" && (
                  <p className="text-xs text-amber-600 mt-1.5 animate-fade-in">
                    No photo received. Tap the box to try again.
                  </p>
                )}

                {/* Error message */}
                {errorSlot?.slot === "selfie" && (
                  <p className="text-xs text-destructive mt-1.5 animate-fade-in">
                    {errorSlot.message}
                  </p>
                )}

                {/* Hidden camera input */}
                <input
                  ref={selfieCameraRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "selfie")}
                />
                {/* Hidden gallery/file input — explicit extensions only, no image/*
                    because iOS Safari with image/* filters out HEIC even if .heic is appended */}
                <input
                  ref={selfieFileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.HEIC,.HEIF"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "selfie")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CTA bar absolutely positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background pt-4 pb-4 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button
            size="lg"
            className="w-full h-12"
            disabled={!canContinue}
            onClick={() =>
              onComplete({ fullBody: fullBody!, selfie: selfie! })
            }
          >
            Generate AI Try-On
          </Button>
        </div>
      </div>

      {/* Photo picker — opens when tapping a drop zone */}
      <PhotoPicker
        open={pickerSlot !== null}
        onClose={handlePickerClose}
        slotName={pickerSlot || "fullBody"}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
      />
    </div>
  );
}
