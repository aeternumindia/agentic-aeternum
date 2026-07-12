"use client";

import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
import { Sparkles, Loader2, RefreshCw, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertHeicToJpegIfNeeded } from "@/utils/heic-converter";

type AiPreviewPanelProps = {
  fullBodyFile: File;
  selfieFile: File;
  garmentImageUrl: string;
  garmentName: string;
  bottomGarmentImageUrl?: string;
  bottomGarmentName?: string;
};

export function AiPreviewPanel({
  fullBodyFile,
  selfieFile,
  garmentImageUrl,
  garmentName,
  bottomGarmentImageUrl,
  bottomGarmentName,
}: AiPreviewPanelProps) {
  const [status, setStatus] = useState<
    "idle" | "generating" | "done" | "error"
  >("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setStatus("generating");
    setErrorMessage(null);
    setResultUrl(null);

    try {
      // Convert any HEIC files to JPEG before upload
      const [personImage, faceImage] = await Promise.all([
        convertHeicToJpegIfNeeded(fullBodyFile),
        convertHeicToJpegIfNeeded(selfieFile),
      ]);

      // Fetch and convert top garment image to JPEG
      const garmentRes = await fetch(garmentImageUrl);
      const garmentBlob = await garmentRes.blob();
      const garmentFile = await convertHeicToJpegIfNeeded(
        new File([garmentBlob], "garment.jpg", {
          type: garmentBlob.type || "image/jpeg",
        })
      );

      const formData = new FormData();
      formData.append("personImage", personImage);
      formData.append("faceImage", faceImage);
      formData.append("garmentImage", garmentFile);

      // Fetch and convert bottom garment image if provided
      if (bottomGarmentImageUrl) {
        const bottomRes = await fetch(bottomGarmentImageUrl);
        const bottomBlob = await bottomRes.blob();
        const bottomFile = await convertHeicToJpegIfNeeded(
          new File([bottomBlob], "bottom-garment.jpg", {
            type: bottomBlob.type || "image/jpeg",
          })
        );
        formData.append("bottomGarmentImage", bottomFile);
      }

      const res = await fetch(
        `${API_BASE}/api/try-on/image`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const text = await res.text();
        let error = "Generation failed";
        try {
          const json = JSON.parse(text);
          error = json.error || error;
        } catch {}
        throw new Error(error);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStatus("done");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setStatus("error");
    }
  }, [fullBodyFile, selfieFile, garmentImageUrl, bottomGarmentImageUrl]);

  if (status === "generating") {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="aspect-[4/5] max-h-[480px] bg-muted flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <div className="text-center">
            <p className="text-sm text-foreground font-medium">
              AI is generating your try-on...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take 15-30 seconds
            </p>
          </div>
          <div className="w-48 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "done" && resultUrl) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="aspect-[4/5] max-h-[480px] bg-muted relative">
          <img
            src={resultUrl}
            alt={`AI try-on: ${garmentName}`}
            className="h-full w-full object-cover"
          />
          <span className="absolute top-2 left-2 bg-accent/80 text-accent-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
            AI Generated
          </span>
        </div>
        <div className="p-3 flex gap-2 justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const a = document.createElement("a");
              a.href = resultUrl!;
              a.download = "aeternum-try-on.png";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="text-xs"
          >
            <Download className="mr-1.5 h-3 w-3" />
            Download
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={generate}
            className="text-xs"
          >
            <RefreshCw className="mr-1.5 h-3 w-3" />
            Regenerate
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 overflow-hidden">
        <div className="aspect-[4/5] max-h-[480px] flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-xs text-destructive font-medium">
            {errorMessage || "Failed to generate preview"}
          </p>
          <Button size="sm" variant="outline" onClick={generate}>
            <RefreshCw className="mr-1.5 h-3 w-3" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="aspect-[4/5] max-h-[480px] bg-muted flex flex-col items-center justify-center gap-3 p-6 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
          See yourself wearing <strong>{bottomGarmentName ? `${garmentName} + ${bottomGarmentName}` : garmentName}</strong> with AI
        </p>
        <Button size="sm" onClick={generate}>
          <Sparkles className="mr-2 h-3 w-3" />
          Generate AI Try-On
        </Button>
      </div>
    </div>
  );
}
