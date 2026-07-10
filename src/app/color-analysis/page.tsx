"use client";

import { useRef } from "react";
import jsPDF from "jspdf";
import { useColorAnalysis } from "@/hooks/use-color-analysis";

export default function ColorAnalysisPage() {
  const { status, result, previewUrl, error, analyze, reset } =
    useColorAnalysis();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) analyze(file);
  }

  async function handleDownload() {
    if (!result || !previewUrl) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    let y = 15;

    function line(h: number) { y += h; }
    function wrap(text: string, w: number, size: number): string[] {
      pdf.setFontSize(size);
      return pdf.splitTextToSize(text, w);
    }

    function swatchRow(
      colors: { name: string; hex: string }[],
      label: string
    ) {
      const left = 15;
      const swatchSize = 18;

      if (y > ph - 30) { pdf.addPage(); y = 15; }

      pdf.setFontSize(9);
      pdf.setTextColor("#999999");
      pdf.text(label, left, y);
      line(2);

      let cx = left;
      for (const c of colors) {
        if (cx + swatchSize > pw - 15) { cx = left; line(swatchSize + 4); }
        pdf.setFillColor(c.hex);
        pdf.rect(cx, y, swatchSize, swatchSize, "F");
        pdf.setDrawColor("#dddddd");
        pdf.rect(cx, y, swatchSize, swatchSize, "S");
        pdf.setFontSize(7);
        pdf.setTextColor("#000000");
        pdf.text(c.name, cx + swatchSize + 2, y + swatchSize / 2 + 1.5);
        cx += swatchSize + pdf.getTextWidth(c.name) + 6;
      }
      line(swatchSize + 4);
    }

    pdf.setFontSize(18);
    pdf.setTextColor("#000000");
    pdf.text("Personal Color Analysis", 15, y);
    line(10);

    pdf.setFontSize(9);
    pdf.setTextColor("#999999");
    pdf.text("Aeternum AI", 15, y);
    pdf.text(new Date().toLocaleDateString(), pw - 15 - pdf.getTextWidth(new Date().toLocaleDateString()), y);
    line(12);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const loadPromise = new Promise<string>((resolve, reject) => {
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
      });
      img.src = previewUrl;

      const imgData = await loadPromise;
      const pw2 = pw - 30;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      let iw = pw2;
      let ih = iw / imgAspect;
      if (ih > 90) { ih = 90; iw = ih * imgAspect; }

      if (y + ih > ph - 20) { pdf.addPage(); y = 15; }
      pdf.addImage(imgData, "JPEG", (pw - iw) / 2, y, iw, ih);
      line(ih + 8);
    } catch {
      line(4);
    }

    function statRow(items: { label: string; value: string }[]) {
      const leftX = 15;
      const rowPad = 6;
      const cellW = (pw - 30) / items.length;
      const maxW = cellW - rowPad * 2;

      let maxLines = 1;
      const allLines: string[][] = [];
      for (const item of items) {
        pdf.setFontSize(9);
        const lines = pdf.splitTextToSize(item.value, maxW);
        allLines.push(lines);
        if (lines.length > maxLines) maxLines = lines.length;
      }

      const labelH = 4;
      const lineH = 4;
      const rowH = labelH + 3 + maxLines * lineH + 4;

      if (y + rowH > ph - 15) { pdf.addPage(); y = 15; }

      pdf.setDrawColor("#eeeeee");
      pdf.setFillColor("#fafafa");
      pdf.roundedRect(leftX - 2, y - 2, pw - 26, rowH, 2, 2, "FD");

      items.forEach((item, i) => {
        const cx = leftX + cellW * i + cellW / 2;
        pdf.setFontSize(7);
        pdf.setTextColor("#999999");
        pdf.text(item.label, cx, y + 3, { align: "center" });
        pdf.setFontSize(9);
        pdf.setTextColor("#000000");
        const lines = allLines[i];
        pdf.text(lines, cx, y + labelH + 3, { align: "center" });
      });

      line(rowH + 4);
    }

    statRow([
      { label: "SKIN TONE", value: result.skinTone },
      { label: "UNDERTONE", value: result.undertone.charAt(0).toUpperCase() + result.undertone.slice(1) },
      { label: "SEASON", value: result.season },
    ]);

    swatchRow(result.bestColors, "BEST COLORS");

    swatchRow(result.avoidColors, "COLORS TO AVOID");

    pdf.setFontSize(9);
    pdf.setTextColor("#333333");
    const descLines = wrap(result.description, pw - 30, 9);
    for (const l of descLines) {
      if (y > ph - 20) { pdf.addPage(); y = 15; }
      pdf.text(l, 15, y);
      line(5);
    }

    pdf.save("aeternum-color-analysis.pdf");
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-lg font-medium text-foreground">
          Personal Color Analysis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a photo to discover your skin tone, undertone, and seasonal
          color palette.
        </p>
      </div>

      {status === "idle" && (
        <>
          <div
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card p-16 transition-colors hover:border-muted-foreground"
          >
          <div className="rounded-full bg-accent/10 p-4">
            <svg
              className="h-6 w-6 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <span className="text-sm text-muted-foreground">
            Tap to upload a photo
          </span>
          <span className="text-xs text-muted-foreground/60">
            JPG, PNG, or WEBP
          </span>
        </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
              How it works
            </h3>
            <ol className="space-y-3">
              {[
                "Upload a clear photo of your face",
                "AI analyzes your skin tone & undertone",
                "Discover your seasonal color palette",
                "Get personalized color recommendations",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-medium text-accent">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="text-xs leading-relaxed text-muted-foreground/60">
              Aeternum AI uses Gemini to analyze your skin tone and recommend
              colors that complement your natural complexion.
            </p>
          </div>
      </>
      )}

      {(status === "uploading" || status === "analyzing") && previewUrl && (
        <div className="space-y-4">
          <div className="relative mx-auto aspect-square max-h-80 w-full max-w-sm overflow-hidden rounded-xl bg-muted">
            <img
              src={previewUrl}
              alt="Uploaded"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-3">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="text-sm text-white">
                  {status === "uploading" ? "Uploading..." : "Analyzing..."}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === "done" && result && (
        <div className="space-y-6">
          <div className="space-y-6">
            <div className="mx-auto max-w-sm overflow-hidden rounded-xl bg-muted">
              <img
                src={previewUrl!}
                alt="Uploaded"
                className="w-full object-cover"
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Skin Tone
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {result.skinTone}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Undertone
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground capitalize">
                    {result.undertone}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Season
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {result.season}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Best Colors
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.bestColors.map((c) => (
                    <span
                      key={c.hex}
                      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs"
                    >
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Colors to Avoid
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.avoidColors.map((c) => (
                    <span
                      key={c.hex}
                      className="flex items-center gap-1.5 rounded-full border border-destructive/20 px-3 py-1 text-xs"
                    >
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.description}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground transition-colors hover:bg-accent/90 flex-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={reset}
              className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Analyze Another
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-3 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "error" && previewUrl && (
        <div className="mx-auto max-w-sm overflow-hidden rounded-xl bg-muted">
          <img
            src={previewUrl}
            alt="Uploaded"
            className="w-full object-cover"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
