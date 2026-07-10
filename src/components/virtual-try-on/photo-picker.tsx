"use client";

import { useEffect } from "react";
import { Camera, ImageIcon, X } from "lucide-react";

type PhotoPickerProps = {
  open: boolean;
  onClose: () => void;
  slotName: "fullBody" | "selfie";
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
};

export function PhotoPicker({
  open,
  onClose,
  slotName,
  onTakePhoto,
  onChooseFromGallery,
}: PhotoPickerProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const label = slotName === "fullBody" ? "Full Body Photo" : "Selfie";

  return (
    <>
      {/* Backdrop (shared mobile + desktop) */}
      <div
        className="fixed inset-0 z-50 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Mobile bottom sheet (< md) ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div
          className="bg-background rounded-t-2xl shadow-2xl pb-safe-bottom animate-slide-up"
          role="dialog"
          aria-modal="true"
          aria-label={`Add ${label}`}
        >
          {/* Drag handle pill */}
          <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto mt-2" />

          {/* Title */}
          <div className="text-sm font-medium text-foreground text-center pt-3 pb-3 border-b border-border">
            Add {label}
          </div>

          {/* Take Photo */}
          <button
            type="button"
            onClick={() => {
              onTakePhoto();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors duration-150"
          >
            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
              <Camera className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-sm font-medium text-foreground">
                Take Photo
              </div>
              <div className="text-xs text-muted-foreground">
                Use your camera
              </div>
            </div>
          </button>

          {/* Divider between options */}
          <div className="h-px bg-border mx-4" />

          {/* Choose from Gallery */}
          <button
            type="button"
            onClick={() => {
              onChooseFromGallery();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-muted/50 active:bg-muted transition-colors duration-150"
          >
            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
              <ImageIcon className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-sm font-medium text-foreground">
                Choose from Gallery
              </div>
              <div className="text-xs text-muted-foreground">
                Browse your photos
              </div>
            </div>
          </button>

          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm font-medium text-muted-foreground text-center py-3.5 hover:text-foreground transition-colors duration-150 border-t border-border mt-1"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* ── Desktop centered dialog (md+) ── */}
      <div
        className="fixed inset-0 z-50 hidden md:flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="bg-background rounded-xl shadow-xl ring-1 ring-black/5 w-80 p-2 animate-message-in"
          role="dialog"
          aria-modal="true"
          aria-label={`Add ${label}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-border mb-1">
            <span className="text-sm font-medium text-foreground">
              {label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Take Photo */}
          <button
            type="button"
            onClick={() => {
              onTakePhoto();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors duration-150"
          >
            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
              <Camera className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-sm font-medium text-foreground">
                Take Photo
              </div>
              <div className="text-xs text-muted-foreground">
                Use your camera
              </div>
            </div>
          </button>

          {/* Choose from Gallery */}
          <button
            type="button"
            onClick={() => {
              onChooseFromGallery();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors duration-150"
          >
            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
              <ImageIcon className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-sm font-medium text-foreground">
                Choose from Gallery
              </div>
              <div className="text-xs text-muted-foreground">
                Browse your photos
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
