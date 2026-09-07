export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface ColorAnalysisData {
  skinTone: string;
  undertone: string;
  season: string;
  bestColors: ColorSwatch[];
  avoidColors: ColorSwatch[];
  description: string;
}

export interface SeasonalPalette {
  id: string;
  name: string;
  undertone: "Warm" | "Cool" | "Neutral";
  description: string;
  swatches: ColorSwatch[];
  bestGarmentTypes: string[];
}

export const SEASONAL_PALETTES: SeasonalPalette[] = [
  {
    id: "deep-autumn",
    name: "Deep Autumn",
    undertone: "Warm",
    description: "Rich, warm, and dark complexions with golden undertones. Complemented by deep earth tones and jewel hues.",
    swatches: [
      { name: "Terracotta", hex: "#C85A32" },
      { name: "Olive Green", hex: "#556B2F" },
      { name: "Mustard Gold", hex: "#DAA520" },
      { name: "Deep Teal", hex: "#005F73" },
      { name: "Espresso", hex: "#3D2314" },
    ],
    bestGarmentTypes: ["Polos", "Overcoats", "Tailored Blazers"],
  },
  {
    id: "light-spring",
    name: "Light Spring",
    undertone: "Warm",
    description: "Fresh, clear, and warm tones with peach undertones. Radiant in light pastels and warm coral hues.",
    swatches: [
      { name: "Peach Coral", hex: "#F08080" },
      { name: "Warm Amber", hex: "#FFBF00" },
      { name: "Soft Sage", hex: "#9CAF88" },
      { name: "Cream Beige", hex: "#EAE3D6" },
      { name: "Aqua Blue", hex: "#4682B4" },
    ],
    bestGarmentTypes: ["Shirts", "Light Linen", "Casual Polos"],
  },
  {
    id: "cool-summer",
    name: "Cool Summer",
    undertone: "Cool",
    description: "Soft, muted, and cool complexions with rosy undertones. Looks refined in slate blue, rose, and lavender.",
    swatches: [
      { name: "Slate Blue", hex: "#4A6B82" },
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Soft Lavender", hex: "#967BB6" },
      { name: "Cool Grey", hex: "#8A9EA7" },
      { name: "Navy Blue", hex: "#0C1926" },
    ],
    bestGarmentTypes: ["Silk Shirts", "Trousers", "Formal Blazers"],
  },
  {
    id: "warm-winter",
    name: "Clear Winter",
    undertone: "Cool",
    description: "High contrast, vivid, and cool complexions. Striking in rich emerald, royal cobalt, and deep black.",
    swatches: [
      { name: "Royal Cobalt", hex: "#1A472A" },
      { name: "Emerald", hex: "#046307" },
      { name: "Burgundy Red", hex: "#8C3A3F" },
      { name: "Midnight Black", hex: "#000000" },
      { name: "Pure White", hex: "#FFFFFF" },
    ],
    bestGarmentTypes: ["Suits", "Oversized Tees", "Evening Wear"],
  },
];
