describe('buildSizeTree edge branches', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('sax');
  });

  it('ignores empty text nodes and tolerates extra close events', () => {
    jest.isolateModules(() => {
      const parserInstance: Record<string, unknown> = {
        line: 4,
        column: 8,
        position: 12,
        startTagPosition: 1,
        onopentag: undefined,
        ontext: undefined,
        oncdata: undefined,
        onclosetag: undefined,
        onerror: undefined,
      };

      parserInstance.write = jest.fn(() => parserInstance);
      parserInstance.close = jest.fn(() => {
        (parserInstance.ontext as ((text: string) => void) | undefined)?.('');
        (parserInstance.oncdata as ((text: string) => void) | undefined)?.('payload');
        (parserInstance.onclosetag as (() => void) | undefined)?.();
        (parserInstance.onclosetag as (() => void) | undefined)?.();
        return parserInstance;
      });

      jest.doMock('sax', () => ({
        __esModule: true,
        default: {
          parser: jest.fn(() => parserInstance),
        },
      }));

      const { buildSizeTree } = require('../src/worker/parser');
      const tree = buildSizeTree('<ignored />');

      expect(tree.children).toHaveLength(1);
      expect(tree.children[0].key).toBe('#cdata');
      expect(tree.children[0].size).toBe('payload'.length + 12);
    });
  });

  it('coerces non-string attribute values via String()', () => {
    jest.isolateModules(() => {
      const parserInstance: Record<string, unknown> = {
        line: 2,
        column: 6,
        position: 20,
        startTagPosition: 3,
        onopentag: undefined,
        ontext: undefined,
        oncdata: undefined,
        onclosetag: undefined,
        onerror: undefined,
      };

      parserInstance.write = jest.fn(() => parserInstance);
      parserInstance.close = jest.fn(() => {
        (parserInstance.onopentag as ((tag: { name: string; attributes: Record<string, unknown> }) => void) | undefined)?.({
          name: 'node',
          attributes: { count: 7 },
        });
        (parserInstance.onclosetag as (() => void) | undefined)?.();
        return parserInstance;
      });

      jest.doMock('sax', () => ({
        __esModule: true,
        default: {
          parser: jest.fn(() => parserInstance),
        },
      }));

      const { buildSizeTree } = require('../src/worker/parser');
      const tree = buildSizeTree('<ignored />');
      const node = tree.children[0];

      expect(node.key).toBe('node');
      expect(node.children[0].key).toBe('@count');
      expect(node.children[0].size).toBe('count'.length + String(7).length + 4);
    });
  });

  it('sorts root-level children by size', () => {
    jest.isolateModules(() => {
      const parserInstance: Record<string, unknown> = {
        line: 1,
        column: 1,
        position: 0,
        startTagPosition: 1,
        onopentag: undefined,
        ontext: undefined,
        oncdata: undefined,
        onclosetag: undefined,
        onerror: undefined,
      };

      parserInstance.write = jest.fn(() => parserInstance);
      parserInstance.close = jest.fn(() => {
        parserInstance.startTagPosition = 1;
        parserInstance.position = 4;
        (parserInstance.onopentag as ((tag: { name: string; attributes: Record<string, unknown> }) => void) | undefined)?.({
          name: 'a',
          attributes: {},
        });
        (parserInstance.onclosetag as (() => void) | undefined)?.();

        parserInstance.startTagPosition = 5;
        parserInstance.position = 15;
        (parserInstance.onopentag as ((tag: { name: string; attributes: Record<string, unknown> }) => void) | undefined)?.({
          name: 'longer-node',
          attributes: {},
        });
        (parserInstance.onclosetag as (() => void) | undefined)?.();

        return parserInstance;
      });

      jest.doMock('sax', () => ({
        __esModule: true,
        default: {
          parser: jest.fn(() => parserInstance),
        },
      }));

      const { buildSizeTree } = require('../src/worker/parser');
      const tree = buildSizeTree('<ignored />');

      expect(tree.children.map((child: { key: string }) => child.key)).toEqual(['longer-node', 'a']);
    });
  });
});