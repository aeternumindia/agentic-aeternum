export const APP_STATES = {
  LANDING: "landing",
  DISCOVERY: "discovery",
  RECOMMENDATIONS: "recommendations",
  PRODUCT_DETAIL: "product_detail",
  MEASUREMENTS: "measurements",
  CUSTOMIZATION: "customization",
  VIRTUAL_TRY_ON: "virtual_try_on",
  COLOR_ANALYSIS: "color_analysis",
  CART: "cart",
  CHECKOUT: "checkout",
} as const;

export type AppState = (typeof APP_STATES)[keyof typeof APP_STATES];

export const SHOPPING_GOALS = [
  {
    id: "wedding",
    label: "Wedding Season",
    description: "Find the perfect outfit for a wedding celebration",
    prompt: "Recommend a complete outfit for a wedding celebration",
  },
  {
    id: "date-night",
    label: "Date Night",
    description: "Smart casual fits for a night out",
    prompt: "Recommend a complete outfit for a date night",
  },
  {
    id: "casual",
    label: "Casual Luxe",
    description: "Elevate your everyday style",
    prompt: "Style an elevated casual outfit for me",
  },
  {
    id: "formal",
    label: "Formal Wear",
    description: "Power dressing for professionals",
    prompt: "Recommend a sharp formal outfit for business",
  },
] as const;

export const OCCASIONS = [
  "Wedding",
  "Engagement",
  "Festival",
  "Party",
  "Office",
  "Date Night",
  "Family Gathering",
  "Religious Ceremony",
] as const;


