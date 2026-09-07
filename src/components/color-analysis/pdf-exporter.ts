import jsPDF from "jspdf";
import { ColorAnalysisData } from "./types";

export async function generateColorAnalysisPdf(
  result: ColorAnalysisData,
  previewUrl: string
): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  let y = 15;

  function line(h: number) {
    y += h;
  }

  function wrap(text: string, w: number, size: number): string[] {
    pdf.setFontSize(size);
    return pdf.splitTextToSize(text, w);
  }

  function swatchRow(colors: { name: string; hex: string }[], label: string) {
    const left = 15;
    const swatchSize = 18;

    if (y > ph - 30) {
      pdf.addPage();
      y = 15;
    }

    pdf.setFontSize(9);
    pdf.setTextColor("#999999");
    pdf.text(label, left, y);
    line(2);

    let cx = left;
    for (const c of colors) {
      if (cx + swatchSize > pw - 15) {
        cx = left;
        line(swatchSize + 4);
      }
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
  pdf.text("Personal Color Analysis Report", 15, y);
  line(10);

  pdf.setFontSize(9);
  pdf.setTextColor("#999999");
  pdf.text("Aeternum AI Luxury Stylist", 15, y);
  pdf.text(
    new Date().toLocaleDateString(),
    pw - 15 - pdf.getTextWidth(new Date().toLocaleDateString()),
    y
  );
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
    if (ih > 90) {
      ih = 90;
      iw = ih * imgAspect;
    }

    if (y + ih > ph - 20) {
      pdf.addPage();
      y = 15;
    }
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

    if (y + rowH > ph - 15) {
      pdf.addPage();
      y = 15;
    }

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
    {
      label: "UNDERTONE",
      value: result.undertone.charAt(0).toUpperCase() + result.undertone.slice(1),
    },
    { label: "SEASON", value: result.season },
  ]);

  swatchRow(result.bestColors, "BEST COMPLEMENTARY COLORS");
  swatchRow(result.avoidColors, "COLORS TO AVOID");

  pdf.setFontSize(9);
  pdf.setTextColor("#333333");
  const descLines = wrap(result.description, pw - 30, 9);
  for (const l of descLines) {
    if (y > ph - 20) {
      pdf.addPage();
      y = 15;
    }
    pdf.text(l, 15, y);
    line(5);
  }

  pdf.save("aeternum-color-analysis.pdf");
}
