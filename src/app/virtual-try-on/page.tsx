"use client";

import { OutfitBuilderProvider } from "@/contexts/outfit-builder";
import { TryOnFlow } from "@/components/virtual-try-on/try-on-flow";

export default function VirtualTryOnPage() {
  return (
    <OutfitBuilderProvider>
      <div className="mx-auto w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col min-h-0">
        <TryOnFlow />
      </div>
    </OutfitBuilderProvider>
  );
}
