/**
 * Ensures a URL used as an <img> src is a safe scheme.
 * Allows: https://, http://, and data:image/... only.
 * Rejects javascript:, data:text/html, blob:, etc. to prevent XSS
 * (CodeQL js/xss-through-dom / CWE-79).
 */
export function sanitizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    /^data:image\/(png|jpe?g|gif|webp|svg\+xml|bmp);base64,/i.test(trimmed)
  ) {
    return trimmed;
  }
  // Reject anything else (javascript:, data:text/html, blob: from unknown origins, etc.)
  return '';
}
