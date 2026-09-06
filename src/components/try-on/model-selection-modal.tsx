"use client";

import React from "react";
import { User, Camera, Check, Upload, Trash2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface ModelOption {
  name: string;
  image: string;
}

export interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "model" | "photos";
  onTabChange: (tab: "model" | "photos") => void;
  selectedModel: string;
  onSelectModel: (modelName: string) => void;
  faceImage: string | null;
  bodyImage: string | null;
  onFileChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "face" | "body"
  ) => void;
  onRemovePhoto?: (type: "face" | "body") => void;
  models?: ModelOption[];
}

export const DEFAULT_MODELS: ModelOption[] = [
  {
    name: "Model 1",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Model 2",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Model 3",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=85",
  },
  {
    name: "Model 4",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=85",
  },
];

export function ModelSelectionModal({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  selectedModel,
  onSelectModel,
  faceImage,
  bodyImage,
  onFileChange,
  onRemovePhoto,
  models = DEFAULT_MODELS,
}: ModelSelectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl">
        {/* Header (Fixed) */}
        <DialogHeader className="shrink-0 px-5 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4 border-b border-border/70 text-left">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              Choose Model & Photos
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Select a standard model or upload your own photos
          </DialogDescription>
        </DialogHeader>

        {/* Segmented Tab Navigation (Fixed) */}
        <div className="shrink-0 px-6 py-3.5 border-b border-border/60 bg-muted/10">
          <div className="inline-flex p-1 rounded-xl bg-muted/70 border border-border/50 w-full gap-1.5">
            <button
              type="button"
              onClick={() => onTabChange("model")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === "model"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Select Model</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("photos")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                activeTab === "photos"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Upload Photos</span>
              {(faceImage || bodyImage) && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Modal Body: Spacious portrait height with perfect fit and no scrolling */}
        <div className="max-h-[60vh] sm:min-h-[360px] sm:max-h-[440px] overflow-y-auto p-4 sm:p-6 overscroll-contain shrink-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
          {activeTab === "model" ? (
            <div>
              {/* 4-Column Portrait Grid on Desktop (1 Row), 2-Column on Mobile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                {models.map((model) => {
                  const isSelected = selectedModel === model.name;
                  return (
                    <button
                      key={model.name}
                      type="button"
                      onClick={() => onSelectModel(model.name)}
                      className={`group relative border rounded-lg overflow-hidden text-left cursor-pointer transition-all duration-300 bg-card flex flex-col ${
                        isSelected
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background border-foreground shadow-md -translate-y-0.5"
                          : "border-border/70 hover:border-foreground/40 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="w-full aspect-[3/4] relative bg-muted/30 overflow-hidden flex items-center justify-center">
                        <img
                          src={model.image}
                          alt={model.name}
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-foreground text-background p-1 rounded-full shadow-xs animate-in fade-in zoom-in-75">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2 flex items-center justify-between bg-card border-t border-border/40">
                        <span className="text-xs font-semibold text-foreground tracking-tight truncate">
                          {model.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] uppercase font-bold text-accent tracking-wider shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              {/* 2-Column Upload Cards for Portrait Photos with Perfect Fit */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-lg mx-auto">
                {/* Face Photo Uploader */}
                <label className="group relative border border-dashed border-border/80 hover:border-foreground/50 rounded-lg cursor-pointer transition-all duration-300 flex flex-col items-center justify-center aspect-[3/4] bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5">
                  {faceImage ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-muted/20">
                      <img
                        src={faceImage}
                        alt="Face Preview"
                        className="w-full h-full object-cover"
                      />
                      {onRemovePhoto && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemovePhoto("face");
                          }}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-background/90 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors shadow-xs z-10 cursor-pointer"
                          title="Remove face photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-1 text-muted-foreground group-hover:text-foreground group-hover:bg-accent/10 group-hover:text-accent transition-all">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        Upload Face
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Front portrait photo
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "face")}
                  />
                </label>

                {/* Full Body Photo Uploader */}
                <label className="group relative border border-dashed border-border/80 hover:border-foreground/50 rounded-lg cursor-pointer transition-all duration-300 flex flex-col items-center justify-center aspect-[3/4] bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5">
                  {bodyImage ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-muted/20">
                      <img
                        src={bodyImage}
                        alt="Body Preview"
                        className="w-full h-full object-cover"
                      />
                      {onRemovePhoto && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemovePhoto("body");
                          }}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-background/90 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors shadow-xs z-10 cursor-pointer"
                          title="Remove body photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4 gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-1 text-muted-foreground group-hover:text-foreground group-hover:bg-accent/10 group-hover:text-accent transition-all">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        Upload Body
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Full standing photo
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onFileChange(e, "body")}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer (Fixed) */}
        <DialogFooter className="shrink-0 px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground truncate mr-2">
            {activeTab === "model" ? (
              <span>
                Selected: <strong className="text-foreground">{selectedModel}</strong>
              </span>
            ) : (
              <span>
                {faceImage && bodyImage
                  ? "✓ Face & Body uploaded"
                  : faceImage || bodyImage
                  ? "1 photo uploaded"
                  : "No photos uploaded"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-foreground text-background rounded-xl px-6 py-2.5 text-xs font-medium cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs"
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ModelSelectionModal;
