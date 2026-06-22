import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export default function ColorAnalysisLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-6 md:flex md:flex-col">
        <div className="flex items-center gap-2 pb-6">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-foreground uppercase tracking-wide">
            Color Analysis
          </span>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
            How it works
          </h3>
          <ol className="space-y-3">
            {[
              "Upload a clear photo of your face",
              "AI analyzes your skin tone & undertone",
              "Discover your seasonal color palette",
              "Get personalized color recommendations",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-medium text-accent">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-auto pt-8">
          <p className="text-[10px] leading-relaxed text-muted-foreground/60">
            Aeternum AI uses Gemini to analyze your skin tone and recommend
            colors that complement your natural complexion.
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
