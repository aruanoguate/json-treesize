import sax from 'sax';
import { SizeNode, WorkerToExtensionMessage } from '../types';

interface MutableSizeNode extends SizeNode {
  startOffset: number;
}

function createNode(key: string, type: SizeNode['type'], line: number, col: number, startOffset: number): MutableSizeNode {
  return {
    key,
    type,
    size: 0,
    line,
    col,
    children: [],
    startOffset,
  };
}

/** Parse XML text and build a size tree using streaming SAX events. */
export function buildSizeTree(xmlText: string): SizeNode {
  const parser = sax.parser(true, {
    trim: false,
    normalize: false,
    xmlns: false,
    position: true,
  });

  const root = createNode('root', 'object', 0, 0, 0);
  const stack: MutableSizeNode[] = [root];

  parser.onopentag = (tag) => {
    const line = parser.line;
    const col = parser.column;
    const startOffset = Math.max(parser.startTagPosition - 1, 0);

    const elementNode = createNode(tag.name, 'object', line, col, startOffset);

    for (const [name, value] of Object.entries(tag.attributes)) {
      const attrValue = typeof value === 'string' ? value : String(value);
      const attrNode = createNode(`@${name}`, 'string', line, col, startOffset);
      attrNode.size = name.length + attrValue.length + 4;
      elementNode.children.push(attrNode);
    }

    stack[stack.length - 1].children.push(elementNode);
    stack.push(elementNode);
  };

  parser.ontext = (text) => {
    if (text.length === 0) {
      return;
    }
    const line = parser.line;
    const col = parser.column;
    const textNode = createNode('#text', 'string', line, col, parser.position);
    textNode.size = text.length;
    stack[stack.length - 1].children.push(textNode);
  };

  parser.oncdata = (text) => {
    const line = parser.line;
    const col = parser.column;
    const cdataNode = createNode('#cdata', 'string', line, col, parser.position);
    cdataNode.size = text.length + 12;
    stack[stack.length - 1].children.push(cdataNode);
  };

  parser.onclosetag = () => {
    const node = stack.pop();
    if (!node) {
      return;
    }

    const nodeSpan = Math.max(parser.position - node.startOffset, 0);
    const childrenTotal = node.children.reduce((sum, child) => sum + child.size, 0);
    node.size = Math.max(nodeSpan, childrenTotal, node.key.length + 2);
    node.children.sort((a, b) => b.size - a.size);
  };

  parser.onerror = (err) => {
    throw err;
  };

  parser.write(xmlText).close();

  root.size = Math.max(xmlText.length, root.children.reduce((sum, child) => sum + child.size, 0));
  root.children.sort((a, b) => b.size - a.size);

  return root;
}

import { workerData, parentPort, isMainThread } from 'node:worker_threads';
import * as fs from 'node:fs';

/* istanbul ignore next -- worker-only bootstrap, not reachable in unit tests */
if (!isMainThread) {
  try {
    const text = fs.readFileSync(workerData.filePath as string, 'utf8');
    const tree = buildSizeTree(text);
    (parentPort!.postMessage as (msg: WorkerToExtensionMessage) => void)({ type: 'tree', data: tree });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    parentPort!.postMessage({ type: 'error', message });
  }
}
