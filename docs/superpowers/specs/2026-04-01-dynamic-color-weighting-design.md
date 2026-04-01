# Dynamic File Weighting Color System — Design Spec

## Goal

Replace the hard-coded three-bucket heat palette (`heat-high/mid/low`) with a continuous HSL color scale driven by a user-configured base color. Bar fill color encodes file size visually. All text is always white or black — never colored — chosen by WCAG relative luminance against its background.

## Architecture

The color system lives entirely in `src/webview/main.ts`. The extension host (`src/panel.ts`) contributes two new fields in the existing `TreeMessage` payload:

- `baseColor: string` — hex string (e.g. `"#4a9eda"`) read from VS Code settings, defaulting to the resolved value of `workbench.colorCustomizations.focusBorder` or `#4a9eda` if unset
- `isDark: boolean` — `true` when the active VS Code color theme is `ColorThemeKind.Dark` or `ColorThemeKind.HighContrast`

The webview converts `baseColor` to HSL once on `tree` message receipt and stores `{ h, s }`. All color computation from that point is purely in the webview — no further messages needed for color changes within a session.

## Settings

A single new VS Code setting:

```json
"jsonTreeSize.baseColor": {
  "type": "string",
  "default": "",
  "description": "Base color for the size heat map (hex, e.g. #e06c8a). Leave empty to use the theme accent color."
}
```

When the setting value is empty, fall back to `#4a9eda` (the blue used by the extension today).

## Types

Add two fields to the existing `TreeMessage` in `src/types.ts`:

```ts
export interface TreeMessage {
  type: 'tree';
  data: SizeNode;
  baseColor: string;   // hex, always resolved — never empty
  isDark: boolean;
}
```

## Color Computation (`src/webview/main.ts`)

### `hexToHsl(hex: string): { h: number; s: number; l: number }`

Converts a 6-digit hex string to HSL. Standard RGB→HSL formula. Returns `h` in [0, 360), `s` and `l` in [0, 100].

### `heatColor(ratio: number, h: number, s: number, isDark: boolean): string`

Returns an `hsl(...)` CSS string for a given size ratio (0–1, where 1 = largest node in the comparison context).

Lightness mapping:

| Theme | ratio = 0 (smallest) | ratio = 1 (largest) |
|-------|----------------------|----------------------|
| Dark  | L = 15%              | L = 85%              |
| Light | L = 90%              | L = 20%              |

Linear interpolation between the two stops: `L = isDark ? 15 + ratio * 70 : 90 - ratio * 70`.

Hue and saturation are always the base color's `h` and `s`.

### `wcagTextColor(bgHsl: { h: number; s: number; l: number }): '#ffffff' | '#000000'`

Converts HSL to sRGB, applies the WCAG 2.1 relative luminance formula, and returns whichever of `#ffffff` (L = 1) or `#000000` (L = 0) achieves the higher contrast ratio against the background.

Relative luminance formula per WCAG 2.1 §1.4.3:
- Convert each sRGB channel: if `c <= 0.04045` then `c/12.92` else `((c+0.055)/1.055)^2.4`
- `L = 0.2126 * R + 0.7152 * G + 0.0722 * B`
- Contrast ratio = `(L1 + 0.05) / (L2 + 0.05)` where L1 > L2

This function is reserved for text rendered **on top of a generated bar fill**. Today no text sits on bars; the function is built and tested but not actively called in the render path.

## What Changes in the Render Path

### Text color — both panes

All text nodes (`tree-size`, `tree-pct`, `tree-key`, `bar-key`, `bar-meta`, `detail-meta`, `detail-header`) use VS Code theme foreground variables (`--vscode-foreground`, `--vscode-descriptionForeground`) as they do today. **No text ever uses a heat color.** The `.heat-high`, `.heat-mid`, `.heat-low` CSS classes that currently set `color` on `.tree-size` are removed.

### Bar fill color — both panes

Every bar fill (`.tree-mini-bar-fill` in the tree pane, `.bar-fill` in the detail pane) gets its background color set via `fill.style.background = heatColor(ratio, h, s, isDark)` as an inline style. The heat CSS classes on fill elements are removed.

**Ratio context:**
- Tree mini-bars: `ratio = node.size / effectiveParent` (parent size, so siblings are comparable) — same denominator as today
- Detail bar chart: `ratio = child.size / maxChildSize` (largest sibling = 1.0) — same denominator as today

### State stored in webview

```ts
let colorState: { h: number; s: number; isDark: boolean } | null = null;
```

Set once when the `tree` message is received. Used by all subsequent `heatColor(...)` calls. Reset on each new `tree` message.

## What Is Removed

- CSS classes `.heat-high`, `.heat-mid`, `.heat-low` (both the color definitions and all usages)
- CSS classes `.tree-mini-bar-fill.heat-high/mid/low` (fill color overrides)
- `.bar-fill.heat-mid`, `.bar-fill.heat-low` CSS rules
- `heatClass()` function in `main.ts`
- All `hClass` / `miniHeatClass` variables in the render functions

## Files Changed

| File | Change |
|------|--------|
| `src/types.ts` | Add `baseColor: string` and `isDark: boolean` to `TreeMessage` |
| `src/panel.ts` | Read setting + resolve default color + read theme kind; include both in `tree` message |
| `src/webview/main.ts` | Add `hexToHsl`, `heatColor`, `wcagTextColor`; store `colorState`; replace all `heatClass` calls; remove heat CSS classes |

## Testing

- `hexToHsl` — unit test: known hex values map to correct HSL (e.g. `#ff0000` → `{ h:0, s:100, l:50 }`)
- `heatColor` — unit test: ratio 0 on dark → `hsl(h, s%, 15%)`; ratio 1 on dark → `hsl(h, s%, 85%)`; ratio 0.5 → midpoint
- `wcagTextColor` — unit test: very dark bg returns `#ffffff`; very light bg returns `#000000`; mid-gray boundary case

All three are pure functions with no DOM or VS Code dependencies — testable with Jest as-is.
