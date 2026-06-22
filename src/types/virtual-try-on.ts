export type FitQuality =
  | "perfect"
  | "great"
  | "good"
  | "consider_sizing_up"
  | "consider_sizing_down";

export type FitScore = {
  overall: number;
  quality: FitQuality;
  label: string;
  description: string;
};

export type ComparisonRow = {
  label: string;
  userValue: number;
  sizeRange: { min: number; max: number };
  withinRange: boolean;
};

export type SizeChartRow = string[];

export type SizeChartData = {
  headers: string[];
  sizes: SizeChartRow[];
};

export type ProductSizeChart = {
  chartData: SizeChartData | null;
  image: string | null;
  fitNotes: string | null;
};

export type TryOnSession = {
  productId: string;
  productHandle: string;
  productTitle: string;
  productImage: string;
  productCategory: string;
  selectedSize: string;
  selectedColor: string;
  measurements: Record<string, number>;
  sizeChart?: ProductSizeChart | null;
};

export type TryOnResult = {
  fitScore: FitScore;
  comparisonRows: ComparisonRow[];
  sizeChart?: ProductSizeChart | null;
  recommendedSize?: string | null;
};
