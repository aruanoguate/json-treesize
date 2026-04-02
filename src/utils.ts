/**
 * Default base color for the size heat map.
 * Keep in sync with the "default" value in package.json → contributes.configuration.
 */
export const DEFAULT_BASE_COLOR = '#4a9eda';

/** Validate a hex color string and return it, or return the fallback. */
export function resolveHexColor(value: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}
