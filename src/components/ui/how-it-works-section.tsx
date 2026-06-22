"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TracingBeam } from "@/components/ui/tracing-beam";

const steps = [
  {
    title: "Tell us your style",
    description: "Describe your occasion, preferences, and fit requirements in plain language.",
    link: "/ai-shopping",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=600&h=600&auto=format&fit=crop&crop=face",
  },
  {
    title: "Get recommendations",
    description: "Our AI curates products tailored to your body type, style, and occasion.",
    link: "/ai-shopping",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&h=600&auto=format&fit=crop&crop=face",
  },
  {
    title: "Try before you buy",
    description: "Virtual try-on shows you exactly how each garment will look and fit.",
    link: "/virtual-try-on",
    image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=600&h=600&auto=format&fit=crop&crop=face",
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = stepRefs.current.map((ref, i) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveStep(i);
          }
        },
        { threshold: 0.4 },
      );
      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((o) => o?.disconnect());
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      {/* Steps */}
      <div className="flex-1 w-full">
        <TracingBeam className="w-full">
          <div className="flex flex-col gap-16 pb-8">
            {steps.map((step, i) => (
              <div
                key={i}
                ref={(el) => { stepRefs.current[i] = el; }}
              >
                <Link
                  href={step.link}
                  className="group flex gap-4 md:gap-6"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-bold ring-4 ring-background">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </TracingBeam>
      </div>

      {/* Sticky image */}
      <div className="w-full md:w-72 lg:w-80 shrink-0">
        <div className="sticky top-24 aspect-square rounded-2xl overflow-hidden shadow-lg border border-border">
          {steps.map((step, i) => (
            <img
              key={i}
              src={step.image}
              alt={step.title}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              style={{ opacity: activeStep === i ? 1 : 0 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
