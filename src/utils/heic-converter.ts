/**
 * Convert any non-JPEG image to JPEG client-side.
 *
 * - HEIC/HEIF → uses `heic2any` (dynamic import)
 * - PNG, WebP, AVIF, etc. → uses canvas conversion
 * - Already JPEG → returned as-is
 */
export async function convertHeicToJpegIfNeeded(file: File): Promise<File> {
  const isJpeg =
    /\.jpe?g$/i.test(file.name) || file.type === "image/jpeg";
  if (isJpeg) return file;

  const isHeic =
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name) ||
    file.type === "image/heic" ||
    file.type === "image/heif";

  // ── HEIC/HEIF path (needs heic2any library) ──
  if (isHeic) {
    const heic2any = (await import("heic2any")).default;

    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });

    const jpegBlob = Array.isArray(result) ? result[0] : result;
    const jpegName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    return new File([jpegBlob], jpegName, { type: "image/jpeg" });
  }

  // ── All other formats (PNG, WebP, AVIF, etc.) — canvas conversion ──
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // Fallback: return original if canvas fails
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const jpegName = file.name.replace(/\.[^.]+$/, ".jpg");
            resolve(new File([blob], jpegName, { type: "image/jpeg" }));
          } else {
            // Fallback
            resolve(file);
          }
        },
        "image/jpeg",
        0.85,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback: return original if image fails to load
      resolve(file);
    };

    img.src = url;
  });
}
