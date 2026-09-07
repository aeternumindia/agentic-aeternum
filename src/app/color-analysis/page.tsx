"use client";

import { useColorAnalysis } from "@/hooks/use-color-analysis";
import {
  UploadDropzone,
  HowItWorks,
  SeasonalPalettesPreview,
  CuratedProductsGrid,
  AnalysisResultCard,
  generateColorAnalysisPdf,
} from "@/components/color-analysis";

export default function ColorAnalysisPage() {
  const { status, result, previewUrl, error, analyze, reset } =
    useColorAnalysis();

  const handleFileSelect = (file: File) => {
    analyze(file);
  };

  const handleDownloadPdf = async () => {
    if (result && previewUrl) {
      await generateColorAnalysisPdf(result, previewUrl);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Header Title */}
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Personal Color & Complexion Analysis
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Discover your natural skin tone, undertone harmonics, and 12-season color archetype.
        </p>
      </div>

      {/* State 1: Idle & Uploading Initial View */}
      {status === "idle" && (
        <div className="space-y-8">
          {/* Main Top Hero Section: Upload Card & Walkthrough */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            <div className="md:col-span-6 lg:col-span-7 h-full flex flex-col">
              <UploadDropzone
                onFileSelect={handleFileSelect}
                isAnalyzing={false}
                previewUrl={null}
              />
            </div>
            <div className="md:col-span-6 lg:col-span-5 h-full flex flex-col">
              <HowItWorks />
            </div>
          </div>

          {/* Interactive Seasonal Color Archetypes Preview */}
          <SeasonalPalettesPreview />

          {/* Sales Conversion Section: Curated Palette Products */}
          <CuratedProductsGrid seasonTitle="Seasonal Trends" />
        </div>
      )}

      {/* State 2: Analyzing Progress */}
      {(status === "uploading" || status === "analyzing") && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <UploadDropzone
            onFileSelect={handleFileSelect}
            isAnalyzing={true}
            previewUrl={previewUrl}
          />
          <HowItWorks />
        </div>
      )}

      {/* State 3: Analysis Done & Results View */}
      {status === "done" && result && previewUrl && (
        <AnalysisResultCard
          result={result}
          previewUrl={previewUrl}
          onDownloadPdf={handleDownloadPdf}
          onReset={reset}
        />
      )}

      {/* State 4: Error State */}
      {status === "error" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-destructive">
              {error || "Complexion analysis failed. Please try another clear photo."}
            </p>
            <button
              type="button"
              onClick={reset}
              className="px-5 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs"
            >
              Try Uploading Again
            </button>
          </div>
          <UploadDropzone
            onFileSelect={handleFileSelect}
            isAnalyzing={false}
            previewUrl={null}
          />
        </div>
      )}
    </div>
  );
}
