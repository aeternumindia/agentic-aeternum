import { Sparkles, Shirt, Camera, Eye, Check } from "lucide-react";
import type { ReactNode } from "react";

const STEPS = [
  { icon: Sparkles, label: "Pick Category" },
  { icon: Shirt, label: "Choose Tops" },
  { icon: Shirt, label: "Choose Bottom" },
  { icon: Check, label: "Review Outfit" },
  { icon: Camera, label: "Upload Photos" },
  { icon: Eye, label: "AI Try-On" },
];

export default function VirtualTryOnLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex flex-col p-6">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-sm font-medium text-foreground">
            Virtual Try-On
          </span>
        </div>
        <nav className="space-y-1">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                {i + 1}
              </span>
              <step.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{step.label}</span>
            </div>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Build your perfect outfit by pairing a top and bottom. Get fit scores
            and see an AI preview before you buy.
          </p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
