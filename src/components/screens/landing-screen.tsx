"use client";

import { PromptCards } from "@/components/chat/prompt-cards";
import { WeatherCuratedCollection } from "@/components/chat/weather-curated-collection";
import { SHOPPING_GOALS } from "@/constants";

type LandingScreenProps = {
  onSelectGoal: (goalId: string) => void;
  disabled?: boolean;
};

export function LandingScreen({ onSelectGoal, disabled }: LandingScreenProps) {
  return (
    <div className="flex flex-col items-center gap-3.5 sm:gap-4 text-center max-w-4xl mx-auto w-full" suppressHydrationWarning>
      {/* Compact Greeting Header */}
      <div className="flex flex-col items-center gap-0.5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight landing-gradient-text">
          Hello, there
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-light">
          How can I help you today?
        </p>
      </div>

      {/* Suggestion Prompt Cards (Single Row 4-Columns) */}
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

      {/* Weather & Location Curated Collection from Aeternum Catalogue */}
      <WeatherCuratedCollection onAskAura={onSelectGoal} disabled={disabled} />
    </div>
  );
}
