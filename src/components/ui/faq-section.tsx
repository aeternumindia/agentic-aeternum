"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MovingBorder } from "@/components/ui/moving-border";

const faqs = [
  {
    question: "How does the AI shopping assistant work?",
    answer: "Describe your style preferences, occasion, and fit requirements in natural language. Aura analyzes your inputs and curates personalized product recommendations from the Aeternum collection.",
  },
  {
    question: "How do I choose the right size?",
    answer: "Every product page includes a detailed Size Guide with garment measurements. We recommend comparing these measurements with a similar garment you already own for the most accurate fit. If you're unsure, our Customer Care team will gladly help you choose the right size before placing your order.",
  },
  {
    question: "What materials do you use?",
    answer: "We select fabrics based on the purpose of each garment rather than following a one-size-fits-all approach. Our collections feature premium materials including Supima Cotton, Giza Cotton, Linen, Bamboo, Rayon, Cotton Piqué, Cotton blends, Terry Rayon, and performance fabrics chosen for their comfort, durability, breathability, wrinkle resistance, and long-lasting wear. The exact fabric composition for every product is listed on its individual product page.",
  },
  {
    question: "Where are your products made?",
    answer: "Every AETERNUM product is proudly designed in India and manufactured in partnership with carefully selected production facilities that meet our standards for craftsmanship, consistency, and quality.",
  },
  {
    question: "Do you offer customisation?",
    answer: "Yes, in select cases. Our tailored trousers are personalised according to the height you provide during checkout for a better fit. We also undertake custom apparel projects for corporate, hospitality, institutional, and bulk orders, subject to minimum order quantities. If you have a custom requirement, please contact our team before placing your order.",
  },
  {
    question: "Are your products true to size?",
    answer: "Yes. Our garments are developed according to our own size specifications, which are outlined in the Size Guide. Since everyone prefers a different fit, we recommend referring to the garment measurements rather than relying solely on your usual size.",
  },
  {
    question: "What are your shipping options?",
    answer: "We offer complimentary standard shipping (5\u20137 business days) on all domestic orders. If your delivery location is eligible for express shipping, an additional fee may apply. Please refer to our Shipping Policy for more details.",
  },
  {
    question: "How long will it take to receive my order?",
    answer: "Most orders are processed within 1\u20133 business days. Delivery timelines vary depending on your location and the nature of your order. Orders containing personalised products, such as customised trousers, may require additional processing time.",
  },
  {
    question: "What is the return policy?",
    answer: "We do not offer refunds once an order has been dispatched. However, we do accept returns and exchanges within 7 days of delivery, subject to certain conditions and quality checks. All items must be unused, in original packaging, and with all tags intact. Please refer to our Return & Exchange Policy for detailed terms.",
  },
  {
    question: "How do I initiate a return or exchange?",
    answer: "To initiate a return or exchange, simply log into your AETERNUM account and navigate to Orders \u2192 Return/Exchange. Follow the prompts to select the product and preferred resolution. Once your request is placed, you\u2019ll receive an email/SMS confirmation and pickup details.",
  },
  {
    question: "What if my product arrives damaged or defective?",
    answer: "If your product arrives damaged or has a manufacturing defect, notify us within 48 hours of delivery with supporting photographs. Once verified, we'll arrange a replacement, exchange, or another appropriate resolution in accordance with our policy.",
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
          <div className="relative w-full h-auto aspect-[3/4] rounded-2xl p-2 overflow-hidden">
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
                src="https://cdn.shopify.com/s/files/1/0968/0270/1680/collections/banner_shirt.jpg?v=1769685724"
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
