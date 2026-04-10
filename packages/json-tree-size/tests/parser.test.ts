import { buildSizeTree } from '../src/worker/parser';

describe('buildSizeTree', () => {
  it('returns a root node with correct size for a flat object', () => {
    const json = '{"a":1,"b":"hello"}';
    const root = buildSizeTree(json);
    expect(root.key).toBe('root');
    expect(root.type).toBe('object');
    expect(root.size).toBe(json.length);
    expect(root.children).toHaveLength(2);
  });

  it('sorts object children by size descending', () => {
    const json = '{"small":1,"large":"a very long string value here"}';
    const root = buildSizeTree(json);
    expect(root.children[0].key).toBe('large');
    expect(root.children[1].key).toBe('small');
  });

  it('sorts array children by size descending', () => {
    const json = '[1,22,333]';
    const root = buildSizeTree(json);
    // 333 is the largest element; its original index is 2
    expect(root.children[0].key).toBe('2');
    expect(root.children[2].key).toBe('0');
  });

  it('computes child sizes correctly', () => {
    const json = '{"a":{"x":1},"b":2}';
    const root = buildSizeTree(json);
    const a = root.children.find(c => c.key === 'a')!;
    expect(a.size).toBe(JSON.stringify({ x: 1 }).length);
    expect(a.type).toBe('object');
    expect(a.children).toHaveLength(1);
  });

  it('handles arrays — uses index as key, sorted by size', () => {
    const json = '[1,"hello",true]';
    const root = buildSizeTree(json);
    expect(root.type).toBe('array');
    expect(root.children).toHaveLength(3);
    // "hello" is the largest element; all keys are string indices
    expect(root.children[0].key).toBe('1');
  });

  it('handles null values', () => {
    const json = '{"x":null}';
    const root = buildSizeTree(json);
    expect(root.children[0].type).toBe('null');
    expect(root.children[0].children).toHaveLength(0);
  });

  it('captures line numbers for top-level keys', () => {
    const json = '{\n  "a": 1,\n  "b": 2\n}';
    const root = buildSizeTree(json);
    const a = root.children.find(c => c.key === 'a')!;
    expect(a.line).toBeGreaterThan(0); // line 1 (0-based)
    expect(typeof a.col).toBe('number');
  });

  it('returns line 0 col 0 for root', () => {
    const json = '{"a":1}';
    const root = buildSizeTree(json);
    expect(root.line).toBe(0);
    expect(root.col).toBe(0);
  });

  it('handles boolean values (true)', () => {
    const json = '{"flag":true}';
    const root = buildSizeTree(json);
    expect(root.children[0].type).toBe('boolean');
    expect(root.children[0].size).toBe(4); // "true"
    expect(root.children[0].children).toHaveLength(0);
  });

  it('handles boolean values (false)', () => {
    const json = '{"flag":false}';
    const root = buildSizeTree(json);
    expect(root.children[0].type).toBe('boolean');
    expect(root.children[0].size).toBe(5); // "false"
  });

  it('handles number values', () => {
    const json = '{"n":42}';
    const root = buildSizeTree(json);
    expect(root.children[0].type).toBe('number');
  });

  it('handles string values', () => {
    const json = '{"s":"hello"}';
    const root = buildSizeTree(json);
    expect(root.children[0].type).toBe('string');
  });

  it('handles deeply nested objects', () => {
    const json = '{"a":{"b":{"c":1}}}';
    const root = buildSizeTree(json);
    const a = root.children[0];
    expect(a.type).toBe('object');
    const b = a.children[0];
    expect(b.type).toBe('object');
    expect(b.children[0].key).toBe('c');
    expect(b.children[0].type).toBe('number');
  });

  it('handles empty objects', () => {
    const json = '{}';
    const root = buildSizeTree(json);
    expect(root.type).toBe('object');
    expect(root.children).toHaveLength(0);
    expect(root.size).toBe(2);
  });

  it('handles empty arrays', () => {
    const json = '[]';
    const root = buildSizeTree(json);
    expect(root.type).toBe('array');
    expect(root.children).toHaveLength(0);
    expect(root.size).toBe(2);
  });
});
