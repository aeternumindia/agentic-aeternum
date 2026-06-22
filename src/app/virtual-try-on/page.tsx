"use client";

import { OutfitBuilderProvider } from "@/contexts/outfit-builder";
import { TryOnFlow } from "@/components/virtual-try-on/try-on-flow";

export default function VirtualTryOnPage() {
  return (
    <OutfitBuilderProvider>
      <TryOnFlow />
    </OutfitBuilderProvider>
  );
}
