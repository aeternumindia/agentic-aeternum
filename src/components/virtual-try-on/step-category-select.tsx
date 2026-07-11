"use client";

import { Sparkles, Shirt, Check, Split } from "lucide-react";

type StepCategorySelectProps = {
  onSelect: (choice: "top" | "bottom") => void;
  hasTop: boolean;
  hasBottom: boolean;
};

export function StepCategorySelect({
  onSelect,
  hasTop,
  hasBottom,
}: StepCategorySelectProps) {
  return (
    <div className="animate-fade-in space-y-6 flex-1 flex flex-col justify-center">
      <div className="text-center">
        <Sparkles className="mx-auto h-8 w-8 text-accent mb-3" />
        <h1 className="text-2xl font-semibold text-foreground">
          Build Your Outfit
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
          Pick a top and bottom to create the perfect pair. Get fit scores and
          see an AI preview before you buy.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-xl mx-auto md:max-w-2xl">
        <button
          type="button"
          onClick={() => onSelect("top")}
          className="group relative rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center hover:border-accent/50 hover:bg-accent/5 transition-all"
        >
          {hasTop && (
            <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
              <Check className="h-3 w-3" />
            </span>
          )}
          <Shirt className="mx-auto h-10 w-10 text-muted-foreground group-hover:text-accent transition-colors" />
          <p className="mt-3 text-sm font-medium text-foreground">
            {hasTop ? "Change Top" : "Pick a Top"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Oversized T-Shirts &bull; Shirts &bull; Polos
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelect("bottom")}
          className="group relative rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center hover:border-accent/50 hover:bg-accent/5 transition-all"
        >
          {hasBottom && (
            <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
              <Check className="h-3 w-3" />
            </span>
          )}
          <Split className="mx-auto h-10 w-10 text-muted-foreground group-hover:text-accent transition-colors" />
          <p className="mt-3 text-sm font-medium text-foreground">
            {hasBottom ? "Change Bottom" : "Pick a Bottom"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Trousers &bull; Tailored Pants
          </p>
        </button>
      </div>
    </div>
  );
}
