import type {
  FitScore,
  ComparisonRow,
  FitStatus,
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
  return ["chest", "shoulder", "length", "sleeve"];
}

export function detectUnit(sizes: string[][], headers?: string[]): "in" | "cm" {
  if (headers) {
    const hStr = headers.join(" ").toLowerCase();
    if (hStr.includes("(in)") || hStr.includes("inch") || hStr.includes("inches")) {
      return "in";
    }
    if (hStr.includes("(cm)")) {
      return "cm";
    }
  }
  const allValues: number[] = [];
  for (const row of sizes) {
    for (let i = 1; i < row.length; i++) {
      const n = parseFloat(row[i]);
      if (!isNaN(n)) allValues.push(n);
    }
  }
  if (allValues.length === 0) return "cm";
  const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  return avg < 50 ? "in" : "cm";
}

function findColumnIndex(headers: string[], canonical: string): number {
  const lower = headers.map((h) =>
    h
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .trim()
  );
  for (const [alias, target] of Object.entries(CHART_HEADER_ALIASES)) {
    if (target !== canonical) continue;
    const idx = lower.findIndex((h) => h === alias || h.includes(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

function getSizeIndex(sizes: string[][], sizeLabel: string): number {
  const idx = sizes.findIndex(
    (row) => row[0] && isSizeMatch(row[0], sizeLabel)
  );
  if (idx !== -1) return idx;
  return sizes.findIndex(
    (row) => row[0] && isSizeMatch(sizeLabel, row[0])
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

export function isSizeMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const cleanA = a.trim().toLowerCase();
  const cleanB = b.trim().toLowerCase();
  if (cleanA === cleanB) return true;

  const map: Record<string, string[]> = {
    xs: ["36", "xs", "extra small"],
    s: ["38", "s", "small"],
    m: ["40", "m", "medium"],
    l: ["42", "l", "large"],
    xl: ["44", "xl", "extra large"],
    xxl: ["46", "xxl", "2xl"],
    "36": ["xs", "36"],
    "38": ["s", "38"],
    "40": ["m", "40"],
    "42": ["l", "42"],
    "44": ["xl", "44"],
    "46": ["xxl", "46"],
  };

  const NOISE_WORDS = new Set(["size", "sizes", "us", "uk", "eu", "in", "cm"]);
  const tokensA = (cleanA.match(/[a-z0-9]+/g) || []).filter((t) => !NOISE_WORDS.has(t));
  const tokensB = (cleanB.match(/[a-z0-9]+/g) || []).filter((t) => !NOISE_WORDS.has(t));

  for (const tA of tokensA) {
    for (const tB of tokensB) {
      if (tA === tB) return true;
      if (map[tA] && map[tA].includes(tB)) return true;
      if (map[tB] && map[tB].includes(tA)) return true;
    }
  }

  return false;
}

export function findClosestSizeFromList(
  targetSize: string,
  availableSizes: string[]
): string | null {
  if (!targetSize || !availableSizes || availableSizes.length === 0) return null;

  const cleanTarget = targetSize.trim().toUpperCase();

  // Try exact or alias match first
  const exact = availableSizes.find((s) => isSizeMatch(cleanTarget, s));
  if (exact) return exact;

  // Numeric fallback (e.g. 28, 30, 32, 34, 38)
  const targetNum = getNumericSizeValue(cleanTarget);
  if (targetNum !== null && !isNaN(targetNum)) {
    let closestNumSize: string | null = null;
    let minDiff = Infinity;
    for (const s of availableSizes) {
      const n = getNumericSizeValue(s);
      if (n !== null && !isNaN(n)) {
        const diff = Math.abs(n - targetNum);
        if (diff < minDiff) {
          minDiff = diff;
          closestNumSize = s;
        }
      }
    }
    if (closestNumSize) return closestNumSize;
  }

  // Letter size fallback (e.g. XS, S, M, L, XL, XXL)
  const targetIdx = LETTER_SIZE_ORDER.indexOf(cleanTarget);
  if (targetIdx !== -1) {
    let closestLetterSize: string | null = null;
    let minIdxDiff = Infinity;
    for (const s of availableSizes) {
      const idx = LETTER_SIZE_ORDER.indexOf(s.trim().toUpperCase());
      if (idx !== -1) {
        const diff = Math.abs(idx - targetIdx);
        if (diff < minIdxDiff) {
          minIdxDiff = diff;
          closestLetterSize = s;
        }
      }
    }
    if (closestLetterSize) return closestLetterSize;
  }

  return availableSizes[0];
}

export function findRecommendedSize(
  measurements: Record<string, number>,
  productCategory?: string,
  availableSizes?: string[],
  sizeChartData?: SizeChartData | null
): string {
  if (sizeChartData && sizeChartData.headers?.length && sizeChartData.sizes?.length) {
    const dummySession: TryOnSession = {
      productId: "",
      productHandle: "",
      productTitle: "",
      productImage: "",
      productCategory: productCategory || "Apparel",
      price: "",
      currency: "",
      selectedSize: sizeChartData.sizes[0]?.[0] || "M",
      selectedColor: "",
      measurements,
      sizeChart: { chartData: sizeChartData, image: null, fitNotes: null },
    };
    const chartRes = chartBasedFitScore(dummySession, sizeChartData);
    if (chartRes.recommendedSize) {
      // If availableSizes is provided, verify if recommended size is in availableSizes
      if (availableSizes && availableSizes.length > 0) {
        const found = availableSizes.find((s) => isSizeMatch(chartRes.recommendedSize!, s));
        if (found) return found;

        const closest = findClosestSizeFromList(chartRes.recommendedSize!, availableSizes);
        if (closest) return closest;
      }
      return chartRes.recommendedSize;
    }
  }

  const chest = measurements.chest ?? 0;
  const waist = measurements.waist ?? 0;
  const hips = measurements.hips ?? 0;

  const isBottom = productCategory
    ? ["jeans", "pant", "pants", "trouser", "shorts", "skirt", "legging", "short", "bottom"].some((k) =>
        productCategory.toLowerCase().includes(k)
      )
    : false;

  if (!chest && !waist && !hips) {
    if (availableSizes && availableSizes.length > 0) return availableSizes[0];
    return isBottom ? "32" : "M";
  }

  let targetCharts: Record<string, SizeRange> = STANDARD_SIZE_CHARTS;

  if (availableSizes && availableSizes.length > 0) {
    const matchedCharts: Record<string, SizeRange> = {};
    for (const sz of availableSizes) {
      const target = sz.trim().toUpperCase();
      // Look up direct key or letter/number match
      for (const [key, range] of Object.entries(STANDARD_SIZE_CHARTS)) {
        if (key.toUpperCase() === target || target.includes(key.toUpperCase())) {
          matchedCharts[sz] = range;
        }
      }
    }
    if (Object.keys(matchedCharts).length > 0) {
      targetCharts = matchedCharts;
    }
  } else {
    // Filter by product category: Tops -> XS-XXL, Bottoms -> 28-40
    const filtered: Record<string, SizeRange> = {};
    for (const [sizeKey, range] of Object.entries(STANDARD_SIZE_CHARTS)) {
      const isNumeric = /^\d+$/.test(sizeKey);
      if (isBottom && isNumeric) {
        filtered[sizeKey] = range;
      } else if (!isBottom && !isNumeric) {
        filtered[sizeKey] = range;
      }
    }
    if (Object.keys(filtered).length > 0) {
      targetCharts = filtered;
    }
  }

  let bestSize = Object.keys(targetCharts)[0] || (isBottom ? "32" : "M");
  let bestDiff = Infinity;

  for (const [size, range] of Object.entries(targetCharts)) {
    let diff = 0;
    let count = 0;

    if (chest && !isBottom) {
      const mid = (range.chest[0] + range.chest[1]) / 2;
      diff += Math.abs(chest - mid);
      count++;
    }
    if (waist && isBottom) {
      const mid = (range.waist[0] + range.waist[1]) / 2;
      diff += Math.abs(waist - mid);
      count++;
    }
    if (hips && isBottom) {
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

  if (availableSizes && availableSizes.length > 0) {
    const found = availableSizes.find((s) => isSizeMatch(bestSize, s));
    if (found) return found;

    const closest = findClosestSizeFromList(bestSize, availableSizes);
    if (closest) return closest;
  }

  return bestSize;
}

function getSizeRangeForSize(size: string): SizeRange | null {
  return STANDARD_SIZE_CHARTS[size] ?? null;
}

const LETTER_SIZE_ORDER = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
];

function getNumericSizeValue(sz: string): number | null {
  if (!sz) return null;
  const matches = sz.match(/\d+/);
  if (!matches) return null;
  const num = parseInt(matches[0], 10);
  return !isNaN(num) ? num : null;
}

export function hasSmallerSizeAvailable(
  selectedSize: string,
  availableSizes?: string[]
): boolean {
  if (!availableSizes || availableSizes.length <= 1) return false;

  const cleanSelected = selectedSize.trim().toUpperCase();

  // Check numeric sizes (e.g. 28, 30, 32)
  const selNum = getNumericSizeValue(cleanSelected);
  if (selNum !== null && !isNaN(selNum) && /^\d+$/.test(cleanSelected)) {
    return availableSizes.some((s) => {
      const n = getNumericSizeValue(s);
      return n !== null && !isNaN(n) && n < selNum;
    });
  }

  // Check letter sizes (e.g. XS, S, M, L, XL)
  const selIdx = LETTER_SIZE_ORDER.indexOf(cleanSelected);
  if (selIdx > 0) {
    return availableSizes.some((s) => {
      const idx = LETTER_SIZE_ORDER.indexOf(s.trim().toUpperCase());
      return idx !== -1 && idx < selIdx;
    });
  }

  return false;
}

export function hasLargerSizeAvailable(
  selectedSize: string,
  availableSizes?: string[]
): boolean {
  if (!availableSizes || availableSizes.length <= 1) return false;

  const cleanSelected = selectedSize.trim().toUpperCase();

  // Check numeric sizes
  const selNum = getNumericSizeValue(cleanSelected);
  if (selNum !== null && !isNaN(selNum) && /^\d+$/.test(cleanSelected)) {
    return availableSizes.some((s) => {
      const n = getNumericSizeValue(s);
      return n !== null && !isNaN(n) && n > selNum;
    });
  }

  // Check letter sizes
  const selIdx = LETTER_SIZE_ORDER.indexOf(cleanSelected);
  if (selIdx !== -1 && selIdx < LETTER_SIZE_ORDER.length - 1) {
    return availableSizes.some((s) => {
      const idx = LETTER_SIZE_ORDER.indexOf(s.trim().toUpperCase());
      return idx !== -1 && idx > selIdx;
    });
  }

  return false;
}

interface EaseBounds {
  optimalMin: number;
  optimalMax: number;
  minAllowed: number;
  maxAllowed: number;
}

function getEaseBounds(canonical: string, productCategory?: string): EaseBounds {
  const cat = (productCategory || "").toLowerCase();

  if (canonical === "waist" || canonical === "hips") {
    const isJeans = cat.includes("jean");
    return {
      optimalMin: isJeans ? 0.5 : 1.0,
      optimalMax: isJeans ? 3.0 : 4.0,
      minAllowed: -0.5,
      maxAllowed: 5.5,
    };
  }

  if (cat.includes("t-shirt") || cat.includes("round neck") || cat.includes("polo")) {
    return {
      optimalMin: 5.0,
      optimalMax: 10.0,
      minAllowed: 2.0,
      maxAllowed: 13.0,
    };
  }

  if (cat.includes("jacket") || cat.includes("blazer") || cat.includes("coat")) {
    return {
      optimalMin: 10.0,
      optimalMax: 16.0,
      minAllowed: 5.0,
      maxAllowed: 20.0,
    };
  }

  if (cat.includes("hoodie") || cat.includes("sweater")) {
    return {
      optimalMin: 8.0,
      optimalMax: 15.0,
      minAllowed: 4.0,
      maxAllowed: 18.0,
    };
  }

  // Shirts (default top)
  return {
    optimalMin: 6.0,
    optimalMax: 11.0,
    minAllowed: 3.0,
    maxAllowed: 13.0,
  };
}

export function genericFitScore(
  selectedSize: string,
  measurements: Record<string, number>,
  productCategory?: string,
  availableSizes?: string[]
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
    let fitStatus: FitStatus = "optimal";
    let score = 0;

    if (userValue >= min && userValue <= max) {
      withinRange = true;
      fitStatus = "optimal";
      score = 100;
    } else if (userValue < min) {
      const diff = min - userValue;
      if (diff <= (max - min) * 0.4) {
        withinRange = false;
        fitStatus = "acceptable";
        score = 70 - (diff / ((max - min) * 0.4)) * 30;
      } else {
        withinRange = false;
        fitStatus = "too_loose";
        score = Math.max(0, 40 - diff * 3);
      }
    } else {
      const diff = userValue - max;
      if (diff <= (max - min) * 0.4) {
        withinRange = false;
        fitStatus = "acceptable";
        score = 70 - (diff / ((max - min) * 0.4)) * 30;
      } else {
        withinRange = false;
        fitStatus = "too_tight";
        score = Math.max(0, 40 - diff * 3);
      }
    }

    comparisonRows.push({
      label: MEASUREMENT_LABELS[key] || key,
      userValue,
      sizeRange: { min, max },
      withinRange,
      fitStatus,
    });

    totalScore += score;
    maxScore += 100;
  }

  const overall = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 70;
  const fitScore = computeFitQuality(overall, comparisonRows, selectedSize, availableSizes);
  return { fitScore, comparisonRows };
}

function chartBasedFitScore(
  session: TryOnSession,
  chartData: SizeChartData,
  availableSizes?: string[]
): {
  fitScore: FitScore;
  comparisonRows: ComparisonRow[];
  recommendedSize: string | null;
  chartUnit: "cm" | "in";
} {
  const { selectedSize, measurements, productCategory } = session;
  const { headers, sizes } = chartData;

  const unit = detectUnit(sizes, headers);
  const toCm = unit === "in" ? (v: number) => v * 2.54 : (v: number) => v;

  const availableSizesToUse =
    availableSizes && availableSizes.length > 0
      ? availableSizes
      : sizes.map((r) => r[0]);

  const sizeIdx = getSizeIndex(sizes, selectedSize);
  if (sizeIdx === -1) {
    const fallback = genericFitScore(selectedSize, measurements, productCategory, availableSizesToUse);
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
    const ease = garmentCm - userValue;
    const bounds = getEaseBounds(canonical, productCategory);

    let withinRange = false;
    let fitStatus: FitStatus = "optimal";
    let score = 0;

    if (ease >= bounds.optimalMin && ease <= bounds.optimalMax) {
      withinRange = true;
      fitStatus = "optimal";
      score = 100;
    } else if (ease >= bounds.minAllowed && ease <= bounds.maxAllowed) {
      withinRange = false;
      fitStatus = "acceptable";
      if (ease < bounds.optimalMin) {
        score = 70 - ((bounds.optimalMin - ease) / Math.max(1, bounds.optimalMin - bounds.minAllowed)) * 30;
      } else {
        score = 70 - ((ease - bounds.optimalMax) / Math.max(1, bounds.maxAllowed - bounds.optimalMax)) * 30;
      }
    } else if (ease > bounds.maxAllowed) {
      withinRange = false;
      fitStatus = "too_loose";
      score = Math.max(0, 40 - (ease - bounds.maxAllowed) * 4);
    } else {
      withinRange = false;
      fitStatus = "too_tight";
      score = Math.max(0, 40 - (bounds.minAllowed - ease) * 4);
    }

    const label = MEASUREMENT_LABELS[canonical] || canonical.charAt(0).toUpperCase() + canonical.slice(1);
    comparisonRows.push({
      label,
      userValue,
      sizeRange: { min: Math.round(userValue + bounds.optimalMin), max: Math.round(userValue + bounds.optimalMax) },
      withinRange,
      fitStatus,
      garmentValue: garmentCm,
    });

    totalScore += score;
    maxScore += 100;
  }

  if (maxScore === 0) {
    const fallback = genericFitScore(selectedSize, measurements, productCategory, availableSizesToUse);
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
      const ease = garmentCm - userValue;
      const bounds = getEaseBounds(canonical, productCategory);

      if (ease >= bounds.optimalMin && ease <= bounds.optimalMax) {
        sTotal += 100;
      } else if (ease >= bounds.minAllowed && ease <= bounds.maxAllowed) {
        sTotal += 70;
      } else {
        sTotal += 30;
      }
      sMax += 100;
    }

    const avg = sMax > 0 ? sTotal / sMax : 0;
    if (avg > bestScore) {
      bestScore = avg;
      bestSize = sizeLabel;
    }
  }

  const fitScore = computeFitQuality(overall, comparisonRows, selectedSize, availableSizesToUse);
  return { fitScore, comparisonRows, recommendedSize: bestSize ?? null, chartUnit: unit };
}

export function calculateFitScore(
  session: TryOnSession,
  availableSizes?: string[]
): TryOnResult {
  const { selectedSize, measurements, sizeChart, productCategory } = session;

  if (sizeChart?.chartData) {
    const result = chartBasedFitScore(session, sizeChart.chartData, availableSizes);
    return {
      ...result,
      sizeChart,
    };
  }

  const result = genericFitScore(selectedSize, measurements, productCategory, availableSizes);
  return {
    ...result,
    sizeChart: sizeChart ?? null,
  };
}

function computeFitQuality(
  overall: number,
  rows: ComparisonRow[],
  selectedSize: string,
  availableSizes?: string[]
): FitScore {
  const tooLooseRows = rows.filter((r) => r.fitStatus === "too_loose");
  const tooTightRows = rows.filter((r) => r.fitStatus === "too_tight");
  const outOfRange = rows.filter((r) => !r.withinRange);

  // If key dimensions are too loose (garment is too big for user body)
  if (tooLooseRows.length > 0 && tooTightRows.length === 0) {
    const canSizeDown = hasSmallerSizeAvailable(selectedSize, availableSizes);
    if (canSizeDown) {
      return {
        overall: Math.min(overall, 65),
        quality: "consider_sizing_down",
        label: "Too Loose (Try Sizing Down)",
        description: `Size ${selectedSize} is too loose for your measurements. We recommend sizing down for a better fit.`,
      };
    } else {
      return {
        overall: Math.min(overall, 60),
        quality: "too_loose",
        label: "Too Big for Your Body",
        description: `Size ${selectedSize} is too big for your measurements (${tooLooseRows.map((r) => `${r.label} is loose`).join(", ")}). This is the smallest size available.`,
      };
    }
  }

  // If key dimensions are too tight (garment is too small for user body)
  if (tooTightRows.length > 0 && tooLooseRows.length === 0) {
    const canSizeUp = hasLargerSizeAvailable(selectedSize, availableSizes);
    if (canSizeUp) {
      return {
        overall: Math.min(overall, 65),
        quality: "consider_sizing_up",
        label: "Too Tight (Try Sizing Up)",
        description: `Size ${selectedSize} is too tight for your measurements. We recommend sizing up for a more comfortable fit.`,
      };
    } else {
      return {
        overall: Math.min(overall, 60),
        quality: "too_tight",
        label: "Too Small for Your Body",
        description: `Size ${selectedSize} is too small for your measurements (${tooTightRows.map((r) => `${r.label} is tight`).join(", ")}). This is the largest size available.`,
      };
    }
  }

  // Mixed tight & loose
  if (tooTightRows.length > 0 && tooLooseRows.length > 0) {
    return {
      overall: Math.min(overall, 60),
      quality: "mixed",
      label: "Mixed Fit (Check Breakdown)",
      description: `Size ${selectedSize} fits some areas loose and some tight. Review the breakdown details below.`,
    };
  }

  // All optimal / acceptable
  if (overall >= 90 && outOfRange.length === 0) {
    return {
      overall,
      quality: "perfect",
      label: "Optimal Fit",
      description: `Size ${selectedSize} is an excellent match for your measurements.`,
    };
  }

  if (overall >= 78) {
    return {
      overall,
      quality: "great",
      label: "Great Fit",
      description: `Size ${selectedSize} should fit your measurements very well.`,
    };
  }

  return {
    overall,
    quality: "good",
    label: "Acceptable Fit",
    description: `Size ${selectedSize} will fit comfortably based on your measurements.`,
  };
}
