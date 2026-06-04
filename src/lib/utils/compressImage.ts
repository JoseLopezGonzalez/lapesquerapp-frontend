/**
 * Compresses an image File using canvas, keeping aspect ratio.
 * Returns the original file unchanged if it's already small enough,
 * or if the environment doesn't support canvas (SSR).
 */
export async function compressImage(
  file: File,
  options: {
    maxWidthOrHeight?: number;
    quality?: number;
    /** Skip compression if file is below this threshold in bytes. Default: 1.5 MB */
    skipIfBelowBytes?: number;
  } = {}
): Promise<File> {
  const {
    maxWidthOrHeight = 1920,
    quality = 0.82,
    skipIfBelowBytes = 1.5 * 1024 * 1024,
  } = options;

  if (typeof window === 'undefined' || typeof document === 'undefined') return file;
  if (file.size <= skipIfBelowBytes) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width >= height) {
          height = Math.round((height * maxWidthOrHeight) / width);
          width = maxWidthOrHeight;
        } else {
          width = Math.round((width * maxWidthOrHeight) / height);
          height = maxWidthOrHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: file.lastModified }));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
