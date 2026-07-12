"use client";

import { X } from "lucide-react";
import type { SizeChartData } from "@/types/virtual-try-on";

type SizeChartModalProps = {
  title: string;
  chartData: SizeChartData | null;
  image: string | null;
  fitNotes: string | null;
  onClose: () => void;
};

export function SizeChartModal({
  title,
  chartData,
  image,
  fitNotes,
  onClose,
}: SizeChartModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-card border border-border p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">Size Chart — {title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {image && (
            <img
              src={image}
              alt="Size chart"
              className="w-full max-h-64 object-contain rounded bg-muted/30"
            />
          )}

          {chartData && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {chartData.headers.map((h) => (
                      <th
                        key={h}
                        className="border border-border px-2 py-1.5 text-left font-medium text-muted-foreground bg-muted/30"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.sizes.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`border border-border px-2 py-1.5 ${
                            j === 0
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {fitNotes && (
            <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/30 rounded-md px-3 py-2">
              {fitNotes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
