/**
 * Default base color for the JSON size heat map.
 * Keep in sync with the "default" value in json-tree-size/package.json → contributes.configuration.
 */
export const DEFAULT_BASE_COLOR = '#4a9eda';

/**
 * Default base color for the XML size heat map.
 * Keep in sync with the "default" value in xml-tree-size/package.json → contributes.configuration.
 */
export const DEFAULT_XML_BASE_COLOR = '#e8832a';

/** Validate a hex color string and return it, or return the fallback. */
export function resolveHexColor(value: string, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}
