"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VirtualTryOnScreen } from "@/components/screens/virtual-try-on-screen";
import type { CartItem } from "@/types/product";

export interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  onAddToCart: (item: CartItem) => void;
  onBack?: () => void;
  productSizes?: string[];
  onOpenSizeChecker?: () => void;
}

export function VirtualTryOnModal({
  isOpen,
  onClose,
  productTitle,
  onAddToCart,
  onBack,
  productSizes = ["XS", "S", "M", "L", "XL", "XXL"],
  onOpenSizeChecker,
}: VirtualTryOnModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-5 pt-4 pb-3 border-b border-border/70 text-left pr-12">
          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            Virtual Try-On
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground truncate">
            {productTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 max-h-[calc(85vh-4rem)]">
          <VirtualTryOnScreen
            onAddToCart={onAddToCart}
            onBack={onBack || onClose}
            productSizes={productSizes}
            showFitScoresTab={false}
            onOpenSizeChecker={onOpenSizeChecker}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VirtualTryOnModal;
