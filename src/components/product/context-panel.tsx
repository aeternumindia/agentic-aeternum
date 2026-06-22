"use client";

import { useRecommendations } from "@/contexts/recommendations";
import { useAppState } from "@/contexts/app-state";
import { APP_STATES } from "@/constants";

export function ContextPanel() {
  const { state } = useAppState();
  const { products } = useRecommendations();

  return (
    <div className="flex h-full flex-col p-6">
      <h2 className="text-sm font-medium text-foreground uppercase tracking-wide">
        {getTitle(state)}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {getSubtitle(state)}
      </p>

      <div className="mt-6 flex-1 space-y-3">
        {products.length > 0 ? (
          products.map((product) => (
            <div
              key={product.id}
              className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in"
            >
              <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.imageAlt || product.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {product.title.charAt(0)}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-card-foreground line-clamp-2">
                  {product.title}
                </h3>
                <p className="mt-1 text-xs text-accent">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center py-12 text-center">
            <p className="text-xs text-muted-foreground">
              {getEmptyMessage(state)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getTitle(state: string): string {
  switch (state) {
    case APP_STATES.MEASUREMENTS:
      return "Size Guide";
    case APP_STATES.CUSTOMIZATION:
      return "Customization";
    case APP_STATES.VIRTUAL_TRY_ON:
      return "Virtual Try-On";
    case APP_STATES.CART:
      return "Your Cart";
    case APP_STATES.CHECKOUT:
      return "Order Summary";
    default:
      return "Recommendations";
  }
}

function getSubtitle(state: string): string {
  switch (state) {
    case APP_STATES.MEASUREMENTS:
      return "Find your perfect fit";
    case APP_STATES.CUSTOMIZATION:
      return "Personalize your garment";
    case APP_STATES.VIRTUAL_TRY_ON:
      return "See how it fits you";
    case APP_STATES.CART:
      return "Review your selections";
    case APP_STATES.CHECKOUT:
      return "Almost there!";
    default:
      return "Curated just for you";
  }
}

function getEmptyMessage(state: string): string {
  switch (state) {
    case APP_STATES.LANDING:
      return "Select a shopping goal to see recommendations";
    case APP_STATES.DISCOVERY:
      return "Pick an occasion to discover products";
    case APP_STATES.RECOMMENDATIONS:
      return "Tell me what you're looking for";
    default:
      return "Products will appear here";
  }
}
