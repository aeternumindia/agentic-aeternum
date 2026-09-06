"use client";

import { OutfitBuilderProvider } from "@/contexts/outfit-builder";
import { TryOnFlow } from "@/components/virtual-try-on/try-on-flow";
import TryOnPage from "@/components/try-on/try-on-page";

export default function VirtualTryOnPage() {
  return (
    <OutfitBuilderProvider>
      <TryOnPage />
    </OutfitBuilderProvider>
  );
}
