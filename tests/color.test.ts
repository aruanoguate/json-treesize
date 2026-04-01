import { resolveHexColor } from '../src/utils';
import { hexToHsl, heatColor, wcagTextColor } from '../src/webview/color';

describe('resolveHexColor', () => {
  it('accepts a valid 6-digit hex', () => {
    expect(resolveHexColor('#e06c8a', '#4a9eda')).toBe('#e06c8a');
  });
  it('rejects empty string and returns fallback', () => {
    expect(resolveHexColor('', '#4a9eda')).toBe('#4a9eda');
  });
  it('rejects an invalid string and returns fallback', () => {
    expect(resolveHexColor('notacolor', '#4a9eda')).toBe('#4a9eda');
  });
  it('rejects 3-digit hex and returns fallback', () => {
    expect(resolveHexColor('#fff', '#4a9eda')).toBe('#4a9eda');
  });
  it('rejects 8-digit hex and returns fallback', () => {
    expect(resolveHexColor('#ff000000', '#4a9eda')).toBe('#4a9eda');
  });
});

describe('hexToHsl', () => {
  it('converts pure red', () => {
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts pure blue', () => {
    const result = hexToHsl('#0000ff');
    expect(result.h).toBe(240);
    expect(result.s).toBe(100);
    expect(result.l).toBe(50);
  });

  it('converts white', () => {
    expect(hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converts black', () => {
    expect(hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('converts a mid-tone blue (#4a9eda)', () => {
    const result = hexToHsl('#4a9eda');
    expect(result.h).toBeGreaterThan(200);
    expect(result.h).toBeLessThan(220);
    expect(result.s).toBeGreaterThan(55);
    expect(result.l).toBeGreaterThan(55);
    expect(result.l).toBeLessThan(65);
  });
});

describe('heatColor', () => {
  it('dark theme, ratio 0 → lightness 15%', () => {
    expect(heatColor(0, 210, 70, true)).toBe('hsl(210,70%,15%)');
  });

  it('dark theme, ratio 1 → lightness 85%', () => {
    expect(heatColor(1, 210, 70, true)).toBe('hsl(210,70%,85%)');
  });

  it('dark theme, ratio 0.5 → lightness 50%', () => {
    expect(heatColor(0.5, 210, 70, true)).toBe('hsl(210,70%,50%)');
  });

  it('light theme, ratio 0 → lightness 90%', () => {
    expect(heatColor(0, 210, 70, false)).toBe('hsl(210,70%,90%)');
  });

  it('light theme, ratio 1 → lightness 20%', () => {
    expect(heatColor(1, 210, 70, false)).toBe('hsl(210,70%,20%)');
  });

  it('light theme, ratio 0.5 → lightness 55%', () => {
    expect(heatColor(0.5, 210, 70, false)).toBe('hsl(210,70%,55%)');
  });

  it('clamps ratio below 0 to 0', () => {
    expect(heatColor(-0.1, 210, 70, true)).toBe('hsl(210,70%,15%)');
  });

  it('clamps ratio above 1 to 1', () => {
    expect(heatColor(1.5, 210, 70, true)).toBe('hsl(210,70%,85%)');
  });
});

describe('wcagTextColor', () => {
  it('returns white on very dark background', () => {
    expect(wcagTextColor({ h: 0, s: 0, l: 5 })).toBe('#ffffff');
  });

  it('returns black on very light background', () => {
    expect(wcagTextColor({ h: 0, s: 0, l: 95 })).toBe('#000000');
  });

  it('returns white on mid-dark blue (l=30)', () => {
    expect(wcagTextColor({ h: 210, s: 70, l: 30 })).toBe('#ffffff');
  });

  it('returns black on mid-light blue (l=70)', () => {
    expect(wcagTextColor({ h: 210, s: 70, l: 70 })).toBe('#000000');
  });

  it('picks white near the luminance crossover (dark side, l=45)', () => {
    expect(wcagTextColor({ h: 0, s: 0, l: 45 })).toBe('#ffffff');
  });

  it('picks black near the luminance crossover (light side, l=50)', () => {
    expect(wcagTextColor({ h: 0, s: 0, l: 50 })).toBe('#000000');
  });
});
