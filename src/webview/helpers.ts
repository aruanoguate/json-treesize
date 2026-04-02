/**
 * Pure helper functions for the webview — no DOM or VS Code dependencies.
 * Extracted for testability.
 */

/**
 * Formats a byte count as a human-readable size string.
 * Values >= 1024 are shown in KB with one decimal; smaller values in B.
 * @param bytes - The byte count to format.
 * @returns A formatted string such as `"1.5 KB"` or `"512 B"`.
 */
export function formatSize(bytes: number): string {
  if (bytes >= 1024) return (bytes / 1024).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' KB';
  return bytes.toLocaleString() + ' B';
}

/**
 * Computes the percentage that `part` represents of `total`, clamped to [0, 100].
 * @param part - The portion value.
 * @param total - The total value (returns 0 when total is 0).
 * @returns The percentage as a number between 0 and 100.
 */
export function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.min((part / total) * 100, 100);
}

/**
 * Escapes HTML special characters to prevent XSS when inserting text into innerHTML.
 * @param s - The raw string to escape.
 * @returns The escaped string safe for HTML insertion.
 */
export function escHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
