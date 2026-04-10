import { hexToHsl, heatColor, wcagTextColor } from '../src/webview/color';

describe('hexToHsl', () => {
  it('converts pure red', () => {
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts pure green', () => {
    expect(hexToHsl('#00ff00')).toEqual({ h: 120, s: 100, l: 50 });
  });

  it('converts pure blue', () => {
    expect(hexToHsl('#0000ff')).toEqual({ h: 240, s: 100, l: 50 });
  });

  it('converts white', () => {
    expect(hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converts black', () => {
    expect(hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('converts a mid-tone blue', () => {
    const result = hexToHsl('#4a9eda');
    expect(result.h).toBeGreaterThan(200);
    expect(result.h).toBeLessThan(220);
    expect(result.s).toBeGreaterThan(55);
    expect(result.l).toBeGreaterThan(55);
    expect(result.l).toBeLessThan(65);
  });

  it('converts yellow', () => {
    expect(hexToHsl('#ffff00')).toEqual({ h: 60, s: 100, l: 50 });
  });

  it('converts magenta', () => {
    expect(hexToHsl('#ff00ff')).toEqual({ h: 300, s: 100, l: 50 });
  });
});

describe('heatColor', () => {
  it('returns the base lightness at ratio 1 for dark themes', () => {
    expect(heatColor(1, 210, 70, 60, true)).toBe('hsl(210,70%,60%)');
  });

  it('returns the fade stop at ratio 0 for dark themes', () => {
    expect(heatColor(0, 210, 70, 60, true)).toBe('hsl(210,70%,15%)');
  });

  it('interpolates in dark themes', () => {
    expect(heatColor(0.5, 210, 70, 60, true)).toBe('hsl(210,70%,38%)');
  });

  it('returns the base lightness at ratio 1 for light themes', () => {
    expect(heatColor(1, 210, 70, 40, false)).toBe('hsl(210,70%,40%)');
  });

  it('returns the fade stop at ratio 0 for light themes', () => {
    expect(heatColor(0, 210, 70, 40, false)).toBe('hsl(210,70%,90%)');
  });

  it('interpolates in light themes', () => {
    expect(heatColor(0.5, 210, 70, 40, false)).toBe('hsl(210,70%,65%)');
  });

  it('clamps ratio below 0', () => {
    expect(heatColor(-0.1, 210, 70, 60, true)).toBe('hsl(210,70%,15%)');
  });

  it('clamps ratio above 1', () => {
    expect(heatColor(1.5, 210, 70, 60, true)).toBe('hsl(210,70%,60%)');
  });
});

describe('wcagTextColor', () => {
  it('returns white on very dark backgrounds', () => {
    expect(wcagTextColor({ h: 0, s: 0, l: 5 })).toBe('#ffffff');
  });

  it('returns black on very light backgrounds', () => {
    expect(wcagTextColor({ h: 0, s: 0, l: 95 })).toBe('#000000');
  });

  it('returns white on mid-dark blue', () => {
    expect(wcagTextColor({ h: 210, s: 70, l: 30 })).toBe('#ffffff');
  });

  it('returns black on mid-light blue', () => {
    expect(wcagTextColor({ h: 210, s: 70, l: 70 })).toBe('#000000');
  });

  it('covers hue branches across the full wheel', () => {
    expect(wcagTextColor({ h: 30, s: 80, l: 20 })).toBe('#ffffff');
    expect(wcagTextColor({ h: 90, s: 80, l: 20 })).toBe('#ffffff');
    expect(wcagTextColor({ h: 150, s: 80, l: 20 })).toBe('#ffffff');
    expect(wcagTextColor({ h: 270, s: 80, l: 20 })).toBe('#ffffff');
    expect(wcagTextColor({ h: 330, s: 80, l: 20 })).toBe('#ffffff');
  });

  it('picks black at the light-side crossover', () => {
    expect(wcagTextColor({ h: 0, s: 0, l: 50 })).toBe('#000000');
  });
});