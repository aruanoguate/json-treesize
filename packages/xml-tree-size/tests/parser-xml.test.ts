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

  it('parses a generated XML payload of about 10 MB', () => {
    const item = [
      '<item sku="SKU-0001" category="bulk">',
      '<name>Bulk Product</name>',
      '<description>',
      'Large payload validation entry with enough repeated text to simulate a realistic exported XML document. ',
      'This should cover element nodes, attributes, text nodes, and CDATA under sustained parser load.',
      '</description>',
      '<notes><![CDATA[Some embedded content that should be preserved as CDATA for the size tree.]]></notes>',
      '<price currency="USD">149.99</price>',
      '</item>',
    ].join('');

    const targetBytes = 10 * 1024 * 1024;
    const repetitions = Math.ceil(targetBytes / Buffer.byteLength(item, 'utf8'));
    const xml = `<root>${item.repeat(repetitions)}</root>`;

    const tree = buildSizeTree(xml);
    const documentRoot = tree.children.find((node) => node.key === 'root');

    expect(Buffer.byteLength(xml, 'utf8')).toBeGreaterThanOrEqual(targetBytes);
    expect(tree.size).toBeGreaterThanOrEqual(targetBytes);
    expect(documentRoot).toBeDefined();
    expect(documentRoot?.children.length).toBe(repetitions);

    const firstItem = documentRoot?.children[0];
    expect(firstItem?.key).toBe('item');
    expect(firstItem?.children.some((node) => node.key === '@sku')).toBe(true);
    expect(firstItem?.children.some((node) => node.key === '#cdata')).toBe(false);

    const notesNode = firstItem?.children.find((node) => node.key === 'notes');
    expect(notesNode?.children.some((node) => node.key === '#cdata')).toBe(true);
  }, 30000);
});
