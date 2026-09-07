"use client";

import { cn } from "@/lib/utils";

type PromptCard = {
  id: string;
  label: string;
  description: string;
};

type PromptCardsProps = {
  prompts: PromptCard[];
  onSelect: (id: string) => void;
  disabled?: boolean;
  className?: string;
};

export function PromptCards({
  prompts,
  onSelect,
  disabled,
  className,
}: PromptCardsProps) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2.5", className)}>
      {prompts.map((prompt) => (
        <button
          key={prompt.id}
          type="button"
          onClick={() => onSelect(prompt.id)}
          disabled={disabled}
          className={cn(
            "rounded-xl border p-2.5 sm:p-3 text-left transition-all",
            disabled
              ? "cursor-not-allowed border-border/50 bg-muted/50 opacity-60"
              : "cursor-pointer border-border bg-card hover:border-accent/50 hover:bg-accent/5 active:scale-95 shadow-2xs"
          )}
        >
          <p className="text-xs font-semibold text-card-foreground line-clamp-1">
            {prompt.label}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
            {prompt.description}
          </p>
        </button>
      ))}
    </div>
  );
}
