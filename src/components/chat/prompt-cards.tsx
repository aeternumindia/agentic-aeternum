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
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {prompts.map((prompt) => (
        <button
          key={prompt.id}
          type="button"
          onClick={() => onSelect(prompt.id)}
          disabled={disabled}
          className={cn(
            "rounded-xl border p-4 text-left transition-colors",
            disabled
              ? "cursor-not-allowed border-border/50 bg-muted/50 opacity-60"
              : "cursor-pointer border-border bg-card hover:border-accent/50 hover:bg-accent/5"
          )}
        >
          <p className="text-xs font-medium text-card-foreground">
            {prompt.label}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {prompt.description}
          </p>
        </button>
      ))}
    </div>
  );
}
