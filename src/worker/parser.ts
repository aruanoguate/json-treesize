import jsonSourceMap from 'json-source-map';
import { SizeNode } from '../types';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

/** Parse a JSON string and return a SizeNode tree with sizes and source positions. */
export function buildSizeTree(jsonText: string): SizeNode {
  const { data, pointers } = jsonSourceMap.parse(jsonText);
  return buildNode('root', data as JsonValue, '', pointers, 0, 0);
}

function buildNode(
  key: string,
  value: JsonValue,
  path: string,
  pointers: Record<string, { value: { line: number; column: number } }>,
  defaultLine: number,
  defaultCol: number
): SizeNode {
  const size = JSON.stringify(value).length;
  const type = getType(value);

  // json-source-map pointer for this node's value start position
  const pointer = pointers[path];
  const line = pointer?.value?.line ?? defaultLine;
  const col = pointer?.value?.column ?? defaultCol;

  const children: SizeNode[] = [];

  if (type === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value as JsonObject)) {
      const childPath = `${path}/${k}`;
      children.push(buildNode(k, v, childPath, pointers, line, col));
    }
  } else if (type === 'array') {
    (value as JsonArray).forEach((v, i) => {
      const childPath = `${path}/${i}`;
      children.push(buildNode(String(i), v, childPath, pointers, line, col));
    });
  }

  // Sort object children by size descending (array order is preserved)
  if (type === 'object') {
    children.sort((a, b) => b.size - a.size);
  }

  return { key, size, type, children, line, col };
}

function getType(value: JsonValue): SizeNode['type'] {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  return 'boolean';
}

// ---- Worker thread entry point ----
// When this file is run as a worker, parse the file at workerData.filePath
// and post the resulting SizeNode back to the parent.
import { workerData, parentPort, isMainThread } from 'worker_threads';
import * as fs from 'fs';

if (!isMainThread) {
  try {
    const text = fs.readFileSync(workerData.filePath as string, 'utf8');
    const tree = buildSizeTree(text);
    // NOTE: baseColor and isDark are added by panel.ts before the message reaches the webview — see _loadFile enrichment.
    parentPort!.postMessage({ type: 'tree', data: tree });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    parentPort!.postMessage({ type: 'error', message });
  }
}
