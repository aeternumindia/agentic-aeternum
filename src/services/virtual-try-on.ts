import type {
  FitScore,
  ComparisonRow,
  TryOnSession,
  TryOnResult,
  SizeChartData,
  ProductSizeChart,
} from "@/types/virtual-try-on";

type SizeRange = {
  chest: [number, number];
  waist: [number, number];
  hips: [number, number];
};

const STANDARD_SIZE_CHARTS: Record<string, SizeRange> = {
  XS: { chest: [81, 86], waist: [61, 66], hips: [86, 91] },
  S: { chest: [86, 91], waist: [66, 71], hips: [91, 96] },
  M: { chest: [91, 96], waist: [71, 76], hips: [96, 101] },
  L: { chest: [96, 101], waist: [76, 81], hips: [101, 106] },
  XL: { chest: [101, 106], waist: [81, 86], hips: [106, 111] },
  XXL: { chest: [106, 111], waist: [86, 91], hips: [111, 116] },
  "28": { chest: [84, 89], waist: [66, 71], hips: [89, 94] },
  "30": { chest: [89, 94], waist: [71, 76], hips: [94, 99] },
  "32": { chest: [94, 99], waist: [76, 81], hips: [99, 104] },
  "34": { chest: [99, 104], waist: [81, 86], hips: [104, 109] },
  "36": { chest: [104, 109], waist: [86, 91], hips: [109, 114] },
  "38": { chest: [109, 114], waist: [91, 96], hips: [114, 119] },
  "40": { chest: [114, 119], waist: [96, 101], hips: [119, 124] },
};

const MEASUREMENT_LABELS: Record<string, string> = {
  chest: "Chest",
  waist: "Waist",
  hips: "Hips",
  height: "Height",
};

const CHART_HEADER_ALIASES: Record<string, string> = {
  shoulder: "shoulder",
  "shoulder width": "shoulder",
  chest: "chest",
  "chest width": "chest",
  "chest (1/2)": "chest",
  "half chest": "chest",
  "1/2 chest": "chest",
  "body width": "chest",
  waist: "waist",
  "waist width": "waist",
  length: "length",
  "body length": "length",
  "garment length": "length",
  "centre back length": "length",
  "cbl": "length",
  sleeve: "sleeve",
  "sleeve length": "sleeve",
  hip: "hips",
  hips: "hips",
  "hip width": "hips",
  "bottom width": "hips",
};

const EASE_BY_TYPE: Record<string, number> = {
  shirt: 12,
  "t-shirt": 14,
  "round neck": 14,
  polo: 12,
  "polo neck": 12,
  jacket: 14,
  blazer: 14,
  hoodie: 16,
  sweater: 12,
  trouser: 8,
  pant: 8,
  pants: 8,
  jeans: 6,
  shorts: 8,
  skirt: 6,
};

const CANONICAL_ORDER = ["chest", "shoulder", "length", "sleeve", "waist", "hips"];

function getRelevantKeys(productType: string): string[] {
  const t = productType.toLowerCase();
  const isBottom =
    ["jeans", "pant", "pants", "trouser", "shorts", "skirt", "legging", "short", "bottom"].some((k) =>
      t.includes(k)
    );
  if (isBottom) return ["waist", "hips"];
  return ["chest", "waist"];
}

function detectUnit(sizes: string[][]): "in" | "cm" {
  const allValues: number[] = [];
  for (const row of sizes) {
    for (let i = 1; i < row.length; i++) {
      const n = parseFloat(row[i]);
      if (!isNaN(n)) allValues.push(n);
    }
  }
  if (allValues.length === 0) return "cm";
  const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  // Adult body measurements in cm are typically 60-130;
  // in inches they are typically 24-48. Threshold at 50
  // cleanly separates the two ranges.
  return avg < 50 ? "in" : "cm";
}

function findColumnIndex(headers: string[], canonical: string): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const [alias, target] of Object.entries(CHART_HEADER_ALIASES)) {
    if (target !== canonical) continue;
    const idx = lower.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

function getSizeIndex(sizes: string[][], sizeLabel: string): number {
  return sizes.findIndex(
    (row) => row[0]?.toLowerCase().trim() === sizeLabel.toLowerCase().trim()
  );
}

function getEaseForType(productType: string): number {
  const t = productType.toLowerCase();
  for (const [key, ease] of Object.entries(EASE_BY_TYPE)) {
    if (t.includes(key)) return ease;
  }
  return 12;
}

export function getSizeRanges(): Record<string, SizeRange> {
  return STANDARD_SIZE_CHARTS;
}

export function findRecommendedSize(
  measurements: Record<string, number>
): string {
  const chest = measurements.chest ?? 0;
  const waist = measurements.waist ?? 0;
  const hips = measurements.hips ?? 0;

  if (!chest && !waist && !hips) return "M";

  let bestSize = "M";
  let bestDiff = Infinity;

  for (const [size, range] of Object.entries(STANDARD_SIZE_CHARTS)) {
    let diff = 0;
    let count = 0;

    if (chest) {
      const mid = (range.chest[0] + range.chest[1]) / 2;
      diff += Math.abs(chest - mid);
      count++;
    }
    if (waist) {
      const mid = (range.waist[0] + range.waist[1]) / 2;
      diff += Math.abs(waist - mid);
      count++;
    }
    if (hips) {
      const mid = (range.hips[0] + range.hips[1]) / 2;
      diff += Math.abs(hips - mid);
      count++;
    }

    const avgDiff = count > 0 ? diff / count : diff;
    if (avgDiff < bestDiff) {
      bestDiff = avgDiff;
      bestSize = size;
    }
  }

  return bestSize;
}

function getSizeRangeForSize(size: string): SizeRange | null {
  return STANDARD_SIZE_CHARTS[size] ?? null;
}

function genericFitScore(
  selectedSize: string,
  measurements: Record<string, number>,
  productCategory?: string
): { fitScore: FitScore; comparisonRows: ComparisonRow[] } {
  const sizeRange = getSizeRangeForSize(selectedSize);

  if (!sizeRange) {
    return {
      fitScore: {
        overall: 70,
        quality: "good",
        label: "Good Fit",
        description:
          "We don't have exact size data for this size, but it should work well based on the product dimensions.",
      },
      comparisonRows: [],
    };
  }

  const comparisonRows: ComparisonRow[] = [];
  let totalScore = 0;
  let maxScore = 0;

  const relevantKeys = productCategory ? getRelevantKeys(productCategory) : ["chest", "waist", "hips"];
  const checks: [string, keyof SizeRange][] = [];
  if (relevantKeys.includes("chest")) checks.push(["chest", "chest"]);
  if (relevantKeys.includes("waist")) checks.push(["waist", "waist"]);
  if (relevantKeys.includes("hips")) checks.push(["hips", "hips"]);

  for (const [key, rangeKey] of checks) {
    const userValue = measurements[key];
    if (!userValue) continue;

    const [min, max] = sizeRange[rangeKey];
    const tolerance = (max - min) * 0.3;
    const effectiveMin = min - tolerance;
    const effectiveMax = max + tolerance;

    let withinRange = false;
    let score = 0;

    if (userValue >= min && userValue <= max) {
      withinRange = true;
      score = 100;
    } else if (userValue >= effectiveMin && userValue <= effectiveMax) {
      withinRange = true;
      if (userValue < min) {
        score = 70 - ((min - userValue) / tolerance) * 30;
      } else {
        score = 70 - ((userValue - max) / tolerance) * 30;
      }
    } else {
      score = Math.max(0, 30 - Math.abs(userValue - (min + max) / 2) * 0.5);
    }

    comparisonRows.push({
      label: MEASUREMENT_LABELS[key] || key,
      userValue,
      sizeRange: { min, max },
      withinRange,
    });

    totalScore += score;
    maxScore += 100;
  }

  const overall = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 70;
  const fitScore = computeFitQuality(overall, comparisonRows, selectedSize);
  return { fitScore, comparisonRows };
}

function chartBasedFitScore(
  session: TryOnSession,
  chartData: SizeChartData
): {
  fitScore: FitScore;
  comparisonRows: ComparisonRow[];
  recommendedSize: string | null;
  chartUnit: "cm" | "in";
} {
  const { selectedSize, measurements, productCategory } = session;
  const { headers, sizes } = chartData;

  const unit = detectUnit(sizes);
  const ease = getEaseForType(productCategory);
  const toCm = unit === "in" ? (v: number) => Math.round(v * 2.54) : (v: number) => v;

  const sizeIdx = getSizeIndex(sizes, selectedSize);
  if (sizeIdx === -1) {
    const fallback = genericFitScore(selectedSize, measurements, productCategory);
    return { ...fallback, recommendedSize: null, chartUnit: unit };
  }

  const relevantKeys = getRelevantKeys(productCategory);
  const cols = ["chest", "shoulder", "length", "sleeve", "waist", "hips"]
    .filter((c) => relevantKeys.includes(c))
    .map((c) => ({ canonical: c, colIdx: findColumnIndex(headers, c) }))
    .filter((c) => c.colIdx !== -1);

  const comparisonRows: ComparisonRow[] = [];
  let totalScore = 0;
  let maxScore = 0;

  for (const { canonical, colIdx } of cols) {
    const userValue = measurements[canonical];
    if (!userValue) continue;

    const garmentRaw = parseFloat(sizes[sizeIdx][colIdx]);
    if (isNaN(garmentRaw)) continue;

    const garmentCm = toCm(garmentRaw);
    const estimatedBodyFit = garmentCm - ease;
    const tolerance = ease * 0.4;
    const min = estimatedBodyFit - tolerance;
    const max = estimatedBodyFit + tolerance;

    let withinRange = false;
    let score = 0;

    if (userValue >= min && userValue <= max) {
      withinRange = true;
      score = 100;
    } else if (userValue >= min - tolerance && userValue <= max + tolerance) {
      withinRange = true;
      if (userValue < min) {
        score = 70 - ((min - userValue) / tolerance) * 30;
      } else {
        score = 70 - ((userValue - max) / tolerance) * 30;
      }
    } else {
      score = Math.max(0, 30 - Math.abs(userValue - (min + max) / 2) * 0.5);
    }

    const label = MEASUREMENT_LABELS[canonical] || canonical.charAt(0).toUpperCase() + canonical.slice(1);
    comparisonRows.push({
      label,
      userValue,
      sizeRange: { min: Math.round(min), max: Math.round(max) },
      withinRange,
    });

    totalScore += score;
    maxScore += 100;
  }

  if (maxScore === 0) {
    const fallback = genericFitScore(selectedSize, measurements, productCategory);
    return { ...fallback, recommendedSize: null, chartUnit: unit };
  }

  const overall = Math.round((totalScore / maxScore) * 100);

  // Score all sizes to find the best recommendation
  let bestSize: string | null = null;
  let bestScore = -1;
  for (const row of sizes) {
    const sizeLabel = row[0];
    let sTotal = 0;
    let sMax = 0;

    for (const { canonical, colIdx } of cols) {
      const userValue = measurements[canonical];
      if (!userValue) continue;

      const garmentRaw = parseFloat(row[colIdx]);
      if (isNaN(garmentRaw)) continue;

      const garmentCm = toCm(garmentRaw);
      const estimated = garmentCm - ease;
      const tolerance = ease * 0.4;
      const diff = Math.abs(userValue - estimated);

      if (diff <= tolerance) {
        sTotal += 100 - (diff / tolerance) * 30;
      } else {
        sTotal += Math.max(0, 70 - (diff - tolerance) * 5);
      }
      sMax += 100;
    }

    const avg = sMax > 0 ? sTotal / sMax : 0;
    if (avg > bestScore) {
      bestScore = avg;
      bestSize = sizeLabel;
    }
  }

  const fitScore = computeFitQuality(overall, comparisonRows, selectedSize);
  return { fitScore, comparisonRows, recommendedSize: bestSize ?? null, chartUnit: unit };
}

export function calculateFitScore(session: TryOnSession): TryOnResult {
  const { selectedSize, measurements, sizeChart, productCategory } = session;

  if (sizeChart?.chartData) {
    const result = chartBasedFitScore(session, sizeChart.chartData);
    return {
      ...result,
      sizeChart,
    };
  }

  const result = genericFitScore(selectedSize, measurements, productCategory);
  return {
    ...result,
    sizeChart: sizeChart ?? null,
  };
}

function computeFitQuality(
  overall: number,
  rows: ComparisonRow[],
  selectedSize: string
): FitScore {
  const outOfRange = rows.filter((r) => !r.withinRange);

  if (overall >= 90 && outOfRange.length === 0) {
    return {
      overall,
      quality: "perfect",
      label: "Perfect Fit",
      description: `The ${selectedSize} is an excellent match for your measurements. You'll love how this fits.`,
    };
  }

  if (overall >= 75) {
    return {
      overall,
      quality: "great",
      label: "Great Fit",
      description: `The ${selectedSize} should fit you very well, with just minor differences from your measurements.`,
    };
  }

  if (overall >= 60) {
    return {
      overall,
      quality: "good",
      label: "Good Fit",
      description: `The ${selectedSize} will fit, but you may want to check the fit details below for specific adjustments.`,
    };
  }

  const allTooSmall = rows.every(
    (r) => !r.withinRange && r.userValue > r.sizeRange.max
  );
  const allTooLarge = rows.every(
    (r) => !r.withinRange && r.userValue < r.sizeRange.min
  );

  if (allTooSmall) {
    return {
      overall,
      quality: "consider_sizing_up",
      label: "Consider Sizing Up",
      description: `Your measurements indicate you may need a size larger than ${selectedSize}. Try a size up for a more comfortable fit.`,
    };
  }

  if (allTooLarge) {
    return {
      overall,
      quality: "consider_sizing_down",
      label: "Consider Sizing Down",
      description: `Your measurements suggest a size smaller than ${selectedSize} might fit better. Try sizing down.`,
    };
  }

  return {
    overall,
    quality: "good",
    label: "Mixed Fit",
    description: `The ${selectedSize} fits some areas well but may need adjustments. Consider reviewing the fit details below.`,
  };
}
