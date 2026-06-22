"use client";

import { OCCASIONS } from "@/constants";
import { cn } from "@/lib/utils";

type DiscoveryScreenProps = {
  onSelectOccasion: (occasion: string) => void;
  disabled?: boolean;
};

export function DiscoveryScreen({ onSelectOccasion, disabled }: DiscoveryScreenProps) {
  return (
    <div className="px-4 sm:px-6 pb-4 animate-fade-in">
      <p className="mb-3 text-xs text-muted-foreground">
        Pick an occasion:
      </p>
      <div className="flex flex-wrap gap-2">
        {OCCASIONS.map((occasion) => (
          <button
            key={occasion}
            type="button"
            onClick={() => onSelectOccasion(occasion)}
            disabled={disabled}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-all duration-200",
              disabled
                ? "cursor-not-allowed border-border/50 bg-muted/50 text-muted-foreground opacity-60"
                : "cursor-pointer border-border bg-card text-card-foreground hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:scale-95"
            )}
          >
            {occasion}
          </button>
        ))}
      </div>
    </div>
  );
}
