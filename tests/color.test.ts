import { resolveHexColor } from '../src/utils';

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
