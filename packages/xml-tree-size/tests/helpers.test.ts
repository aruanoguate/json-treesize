import { formatSize, pct, escHtml } from '../src/webview/helpers';

describe('formatSize', () => {
  it('formats bytes < 1024 as B', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(1023)).toMatch(/1,?023 B/);
  });

  it('formats bytes >= 1024 as KB', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(1536)).toBe('1.5 KB');
    expect(formatSize(10240)).toBe('10.0 KB');
  });

  it('formats large sizes with grouping', () => {
    const result = formatSize(1048576); // 1 MB = 1024 KB
    expect(result).toContain('KB');
    expect(result).toContain('1,024.0') // or locale-specific
  });
});

describe('pct', () => {
  it('returns 0 when total is 0', () => {
    expect(pct(50, 0)).toBe(0);
  });

  it('calculates correct percentage', () => {
    expect(pct(50, 100)).toBe(50);
    expect(pct(25, 200)).toBe(12.5);
  });

  it('clamps to 100 when part > total', () => {
    expect(pct(200, 100)).toBe(100);
  });

  it('handles part = total', () => {
    expect(pct(100, 100)).toBe(100);
  });

  it('handles fractional values', () => {
    expect(pct(1, 3)).toBeCloseTo(33.333, 2);
  });
});

describe('escHtml', () => {
  it('escapes ampersands', () => {
    expect(escHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes all special characters together', () => {
    expect(escHtml('<a href="x">&</a>')).toBe('&lt;a href="x"&gt;&amp;&lt;/a&gt;');
  });

  it('returns empty string unchanged', () => {
    expect(escHtml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(escHtml('hello world')).toBe('hello world');
  });
});
