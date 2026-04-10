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

  it('converts pure green (max === g branch)', () => {
    expect(hexToHsl('#00ff00')).toEqual({ h: 120, s: 100, l: 50 });
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

  it('converts yellow (h wraps near 60°)', () => {
    const result = hexToHsl('#ffff00');
    expect(result.h).toBe(60);
    expect(result.s).toBe(100);
    expect(result.l).toBe(50);
  });

  it('converts magenta (h near 300°)', () => {
    const result = hexToHsl('#ff00ff');
    expect(result.h).toBe(300);
    expect(result.s).toBe(100);
    expect(result.l).toBe(50);
  });
});

describe('heatColor', () => {
  // baseL=60 used throughout: ratio=1 always returns exactly baseL

  it('dark theme, ratio 1 → exactly baseL', () => {
    expect(heatColor(1, 210, 70, 60, true)).toBe('hsl(210,70%,60%)');
  });

  it('dark theme, ratio 0 → fade stop L=15%', () => {
    expect(heatColor(0, 210, 70, 60, true)).toBe('hsl(210,70%,15%)');
  });

  it('dark theme, ratio 0.5 → midpoint between 15 and baseL', () => {
    // midpoint of 15..60 = 37.5 → rounds to 38
    expect(heatColor(0.5, 210, 70, 60, true)).toBe('hsl(210,70%,38%)');
  });

  it('light theme, ratio 1 → exactly baseL', () => {
    expect(heatColor(1, 210, 70, 40, false)).toBe('hsl(210,70%,40%)');
  });

  it('light theme, ratio 0 → fade stop L=90%', () => {
    expect(heatColor(0, 210, 70, 40, false)).toBe('hsl(210,70%,90%)');
  });

  it('light theme, ratio 0.5 → midpoint between 90 and baseL', () => {
    // midpoint of 90..40 = 65
    expect(heatColor(0.5, 210, 70, 40, false)).toBe('hsl(210,70%,65%)');
  });

  it('clamps ratio below 0 to 0', () => {
    expect(heatColor(-0.1, 210, 70, 60, true)).toBe('hsl(210,70%,15%)');
  });

  it('clamps ratio above 1 to 1', () => {
    expect(heatColor(1.5, 210, 70, 60, true)).toBe('hsl(210,70%,60%)');
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

  // Cover all 6 hue branches in hslToLuminance
  it('covers hue 0-60 range (red)', () => {
    expect(wcagTextColor({ h: 30, s: 80, l: 20 })).toBe('#ffffff');
  });

  it('covers hue 60-120 range (yellow-green)', () => {
    expect(wcagTextColor({ h: 90, s: 80, l: 20 })).toBe('#ffffff');
  });

  it('covers hue 120-180 range (green-cyan)', () => {
    expect(wcagTextColor({ h: 150, s: 80, l: 20 })).toBe('#ffffff');
  });

  it('covers hue 240-300 range (blue-magenta)', () => {
    expect(wcagTextColor({ h: 270, s: 80, l: 20 })).toBe('#ffffff');
  });

  it('covers hue 300-360 range (magenta-red)', () => {
    expect(wcagTextColor({ h: 330, s: 80, l: 20 })).toBe('#ffffff');
  });

  it('picks black near the luminance crossover (light side, l=50)', () => {
    expect(wcagTextColor({ h: 0, s: 0, l: 50 })).toBe('#000000');
  });
});
