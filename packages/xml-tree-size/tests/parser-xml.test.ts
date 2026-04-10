import { buildSizeTree } from '../src/worker/parser';

describe('buildSizeTree (XML)', () => {
  it('builds a root node with nested element children', () => {
    const xml = '<Envelope><Body><Item id="7">hello</Item></Body></Envelope>';
    const tree = buildSizeTree(xml);

    expect(tree.key).toBe('root');
    expect(tree.size).toBeGreaterThan(0);
    expect(tree.children.length).toBeGreaterThan(0);

    const envelope = tree.children.find((n) => n.key === 'Envelope');
    expect(envelope).toBeDefined();
    expect(envelope?.children.some((n) => n.key === 'Body')).toBe(true);
  });

  it('creates attribute and text nodes', () => {
    const xml = '<root><node a="b">x</node></root>';
    const tree = buildSizeTree(xml);
    const node = tree.children[0].children.find((n) => n.key === 'node');

    expect(node).toBeDefined();
    expect(node?.children.some((n) => n.key === '@a')).toBe(true);
    expect(node?.children.some((n) => n.key === '#text')).toBe(true);
  });

  it('creates CDATA nodes', () => {
    const xml = '<root><notes><![CDATA[some <xml> payload]]></notes></root>';
    const tree = buildSizeTree(xml);
    const notes = tree.children[0].children.find((n) => n.key === 'notes');

    expect(notes).toBeDefined();
    expect(notes?.children.some((n) => n.key === '#cdata')).toBe(true);
  });

  it('throws on malformed XML', () => {
    expect(() => buildSizeTree('<root><node></root>')).toThrow();
  });
});
