"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function SimpleAccordion({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="w-full border-t border-border mt-12 mb-12">
      {items.map((item, i) => (
        <AccordionItem key={i} question={item.question} answer={item.answer} />
      ))}
    </div>
  );
}

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border py-6">
      <button 
        className="flex w-full justify-between items-center text-left font-bold text-lg hover:opacity-80 transition-opacity"
        onClick={() => setOpen(!open)}
      >
        {question}
        <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden text-base text-foreground/80 pr-12">
          {answer}
        </div>
      </div>
    </div>
  );
}
