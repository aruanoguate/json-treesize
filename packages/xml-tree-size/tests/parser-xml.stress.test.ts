import { buildSizeTree } from '../src/worker/parser';

const describeStress = process.env.TREE_SIZE_STRESS === '1' ? describe : describe.skip;
const stressSizesMb = (process.env.TREE_SIZE_STRESS_SIZES_MB ?? '10,25,50,100')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0)
  .sort((left, right) => left - right);

function createLargeXml(targetMb: number): { xml: string; expectedCount: number } {
  const item = [
    '<item sku="SKU-0001" category="bulk">',
    '<name>Bulk Product</name>',
    '<description>',
    'Synthetic XML stress payload used to validate parser stability across increasing input sizes. ',
    'It intentionally contains attributes, text nodes, nested elements, and CDATA.',
    '</description>',
    '<notes><![CDATA[Generated in-memory; not stored in the repository.]]></notes>',
    '<price currency="USD">149.99</price>',
    '</item>',
  ].join('');

  const targetBytes = targetMb * 1024 * 1024;
  const expectedCount = Math.ceil(targetBytes / Buffer.byteLength(item, 'utf8'));
  const xml = `<root>${item.repeat(expectedCount)}</root>`;

  return { xml, expectedCount };
}

describeStress('buildSizeTree stress (XML)', () => {
  for (const sizeMb of stressSizesMb) {
    it(`parses a generated ${sizeMb} MB XML payload without crashing`, () => {
      const { xml, expectedCount } = createLargeXml(sizeMb);
      const tree = buildSizeTree(xml);
      const rootNode = tree.children.find((child) => child.key === 'root');

      expect(Buffer.byteLength(xml, 'utf8')).toBeGreaterThanOrEqual(sizeMb * 1024 * 1024);
      expect(tree.size).toBeGreaterThanOrEqual(sizeMb * 1024 * 1024);
      expect(rootNode?.children).toHaveLength(expectedCount);
    }, 120000);
  }
});