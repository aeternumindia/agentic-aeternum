"use client";

import { OutfitBuilderProvider } from "@/contexts/outfit-builder";
import { TryOnFlow } from "@/components/virtual-try-on/try-on-flow";

export default function VirtualTryOnPage() {
  return (
    <OutfitBuilderProvider>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <TryOnFlow />
      </div>
    </OutfitBuilderProvider>
  );
}
