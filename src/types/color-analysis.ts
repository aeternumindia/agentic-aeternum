export type Undertone = "cool" | "warm" | "neutral";

export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

export type ColorInfo = {
  name: string;
  hex: string;
};

export type SkinAnalysisResult = {
  skinTone: string;
  undertone: Undertone;
  season: Season;
  bestColors: ColorInfo[];
  avoidColors: ColorInfo[];
  description: string;
};

export type SkinAnalysisResponse = {
  success: boolean;
  requestId: string;
  data: SkinAnalysisResult;
};
