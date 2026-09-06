"use client";

import React from "react";
import { Shirt, AlertCircle, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { NoGarmentSelectedModalProps } from "./types";

export function NoGarmentSelectedModal({
  isOpen,
  onClose,
  onSelectGarmentsNow,
}: NoGarmentSelectedModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="shrink-0 px-6 pt-5 pb-4 border-b border-border/70 text-left">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Shirt className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Garment Selection Required
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Please select a garment to calculate accurate AI size recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-sm mx-auto">
            <h4 className="text-sm font-semibold text-foreground">
              No Garment Currently Selected
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our AI Size Checker evaluates your body dimensions against specific garment cut, fit tolerances, and fabric ease. Select a garment from the catalog to run size calculations.
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0 px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectGarmentsNow();
            }}
            className="bg-foreground text-background rounded-xl px-5 py-2.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Select Garment Now</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
