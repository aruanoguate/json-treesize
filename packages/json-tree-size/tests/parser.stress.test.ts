import { buildSizeTree } from '../src/worker/parser';

const describeStress = process.env.TREE_SIZE_STRESS === '1' ? describe : describe.skip;
const stressSizesMb = (process.env.TREE_SIZE_STRESS_SIZES_MB ?? '10,25,50,100')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0)
  .sort((left, right) => left - right);

function createLargeJson(targetMb: number): { json: string; expectedCount: number } {
  const item = {
    sku: 'SKU-0001',
    category: 'bulk',
    name: 'Bulk Product',
    description: [
      'Synthetic JSON stress payload used to validate parser stability across increasing input sizes.',
      'It intentionally contains nested objects, arrays, strings, booleans, numbers, and null values.',
    ].join(' '),
    notes: 'This payload is generated in-memory and is not stored in the repository.',
    price: 149.99,
    active: true,
    tags: ['bulk', 'stress', 'json', 'parser'],
    metadata: { region: 'GT', priority: 7, archived: null },
  };

  const targetBytes = targetMb * 1024 * 1024;
  const itemBytes = Buffer.byteLength(JSON.stringify(item), 'utf8') + 1;
  const expectedCount = Math.ceil(targetBytes / itemBytes);
  const json = JSON.stringify({ items: Array.from({ length: expectedCount }, () => item) });

  return { json, expectedCount };
}

describeStress('buildSizeTree stress (JSON)', () => {
  for (const sizeMb of stressSizesMb) {
    it(`parses a generated ${sizeMb} MB JSON payload without crashing`, () => {
      const { json, expectedCount } = createLargeJson(sizeMb);
      const tree = buildSizeTree(json);
      const itemsNode = tree.children.find((child) => child.key === 'items');

      expect(Buffer.byteLength(json, 'utf8')).toBeGreaterThanOrEqual(sizeMb * 1024 * 1024);
      expect(tree.size).toBeGreaterThanOrEqual(sizeMb * 1024 * 1024);
      expect(itemsNode?.children).toHaveLength(expectedCount);
    }, 120000);
  }
});