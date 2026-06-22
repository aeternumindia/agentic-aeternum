"use client";

import { PromptCards } from "@/components/chat/prompt-cards";
import { SHOPPING_GOALS } from "@/constants";

type LandingScreenProps = {
  onSelectGoal: (goalId: string) => void;
  disabled?: boolean;
};

export function LandingScreen({ onSelectGoal, disabled }: LandingScreenProps) {
  return (
    <div className="flex flex-col items-center gap-10 text-center max-w-2xl mx-auto w-full">
      {/* Greeting */}
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight landing-gradient-text">
          Hello, there
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground font-light">
          How can I help you today?
        </p>
      </div>

      {/* Suggestion Cards */}
      <div className="w-full">
        <PromptCards
          prompts={SHOPPING_GOALS.map((g) => ({
            id: g.id,
            label: g.label,
            description: g.description,
          }))}
          onSelect={onSelectGoal}
          disabled={disabled}
          className="text-left"
        />
      </div>
    </div>
  );
}
