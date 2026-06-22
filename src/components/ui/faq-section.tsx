"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MovingBorder } from "@/components/ui/moving-border";

const faqs = [
  {
    question: "How does the AI shopping assistant work?",
    answer: "Describe your style preferences, occasion, and fit requirements in natural language. Our AI analyzes your inputs and curates personalized product recommendations from the Aeternum collection.",
  },
  {
    question: "How accurate is the virtual try-on?",
    answer: "Our AI-powered virtual try-on uses your uploaded photo to show how garments will look on you. It accounts for fit, drape, and proportions to give you a realistic preview before purchase.",
  },
  {
    question: "How do I get size recommendations?",
    answer: "Provide your body measurements (chest, waist, hips, etc.) and our AI will recommend the best size for each garment. You can also adjust based on your preferred fit — slim, regular, or relaxed.",
  },
  {
    question: "Can I customize garments?",
    answer: "Yes! Select customization options for eligible products including fit adjustments, fabric choices, and design details. Our team will craft your garment to your specifications.",
  },
  {
    question: "What is the return policy?",
    answer: "We offer a 14-day return policy for unworn items in original condition. Customized garments are made to order and are not eligible for return unless there is a manufacturing defect.",
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping takes 5-7 business days within India. Express shipping is available at checkout for 2-3 business day delivery.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Frequently asked questions
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Everything you need to know before you start
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
        {/* Image */}
        <div className="w-full md:w-72 lg:w-80 shrink-0">
          <div className="relative w-full h-auto aspect-square rounded-2xl p-2 overflow-hidden">
            {/* Outer border */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <MovingBorder duration={8000} rx="30%" ry="30%">
                <div className="h-40 w-40 bg-[radial-gradient(#8C3A3F_25%,transparent_65%)] opacity-[0.8]" />
              </MovingBorder>
            </div>
            {/* Inner border */}
            <div className="absolute inset-[4px] rounded-2xl overflow-hidden pointer-events-none rotate-180">
              <MovingBorder duration={8000} rx="30%" ry="30%">
                <div className="h-40 w-40 bg-[radial-gradient(#8C3A3F_25%,transparent_65%)] opacity-[0.8]" />
              </MovingBorder>
            </div>
            {/* Content */}
            <div className="relative rounded-2xl overflow-hidden h-full w-full">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&h=600&auto=format&fit=crop&crop=center"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
        {/* Accordion */}
        <div className="flex-1 w-full divide-y divide-border">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm md:text-base font-medium text-foreground hover:text-primary transition-colors"
              >
                {faq.question}
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    openIndex === i && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-200",
                  openIndex === i
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
