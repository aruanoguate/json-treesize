import { DEFAULT_BASE_COLOR, resolveHexColor } from '../src/utils';

describe('DEFAULT_BASE_COLOR', () => {
  it('matches the shared default base color', () => {
    expect(DEFAULT_BASE_COLOR).toBe('#4a9eda');
  });
});

describe('resolveHexColor', () => {
  it('accepts a valid 6-digit hex', () => {
    expect(resolveHexColor('#e06c8a', DEFAULT_BASE_COLOR)).toBe('#e06c8a');
  });

  it('returns the fallback for an empty string', () => {
    expect(resolveHexColor('', DEFAULT_BASE_COLOR)).toBe(DEFAULT_BASE_COLOR);
  });

  it('returns the fallback for an invalid string', () => {
    expect(resolveHexColor('notacolor', DEFAULT_BASE_COLOR)).toBe(DEFAULT_BASE_COLOR);
  });

  it('returns the fallback for 3-digit hex values', () => {
    expect(resolveHexColor('#fff', DEFAULT_BASE_COLOR)).toBe(DEFAULT_BASE_COLOR);
  });

  it('returns the fallback for 8-digit hex values', () => {
    expect(resolveHexColor('#ff000000', DEFAULT_BASE_COLOR)).toBe(DEFAULT_BASE_COLOR);
  });
});