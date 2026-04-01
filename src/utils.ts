/** Validate a hex color string and return it, or return the fallback. */
export function resolveHexColor(value: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}
