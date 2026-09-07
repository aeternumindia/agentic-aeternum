/**
 * Convert iPhone images (.heic, .heif, HEIC/HEIF) and non-JPEG photos to clean JPEG client-side before upload.
 *
 * - HEIC/HEIF (iOS Camera / AirDrop) → uses `heic2any` library with fallback
 * - PNG, WebP, AVIF, TIFF, etc. → uses HTML5 Canvas conversion to JPEG
 * - Already JPEG → returned as-is
 */
export async function convertHeicToJpegIfNeeded(file: File): Promise<File> {
  const fileName = file.name || "";
  const fileType = file.type || "";

  const isHeic =
    /\.(heic|heif)$/i.test(fileName) ||
    fileType.includes("heic") ||
    fileType.includes("heif");

  // ── HEIC/HEIF iPhone Photo Path ──
  if (isHeic) {
    try {
      const heic2any = (await import("heic2any")).default;
      const result = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.85,
      });

      const jpegBlob = Array.isArray(result) ? result[0] : result;
      const jpegName = fileName.replace(/\.(heic|heif)$/i, ".jpg");
      return new File([jpegBlob], jpegName || "iphone-photo.jpg", {
        type: "image/jpeg",
      });
    } catch (err) {
      console.warn("heic2any conversion error, trying canvas fallback:", err);
    }
  }

  const isJpeg =
    /\.jpe?g$/i.test(fileName) || fileType === "image/jpeg";
  if (isJpeg) return file;

  // ── Canvas Conversion Path for All Other Images ──
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const jpegName = fileName.replace(/\.[^.]+$/, "") + ".jpg";
            resolve(new File([blob], jpegName || "converted.jpg", { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
