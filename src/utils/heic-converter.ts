/**
 * HEIC/HEIF → JPEG client-side converter.
 *
 * Dynamically imports `heic2any` only when a HEIC file is detected.
 * Returns the original file unchanged for non-HEIC images.
 */
export async function convertHeicToJpegIfNeeded(file: File): Promise<File> {
  const isHeic =
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name) ||
    file.type === "image/heic" ||
    file.type === "image/heif";

  if (!isHeic) return file;

  // Dynamic import — only fetched when a HEIC file is encountered
  const heic2any = (await import("heic2any")).default;

  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.85,
  });

  // heic2any returns Blob | Blob[] — normalise to a single blob
  const jpegBlob = Array.isArray(result) ? result[0] : result;
  const jpegName = file.name.replace(/\.(heic|heif)$/i, ".jpg");

  return new File([jpegBlob], jpegName, { type: "image/jpeg" });
}
