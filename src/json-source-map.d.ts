declare module 'json-source-map' {
  export interface Position {
    line: number;
    column: number;
    pos: number;
  }

  export interface Pointer {
    key?: Position;
    keyEnd?: Position;
    value: Position;
    valueEnd: Position;
  }

  export interface ParseResult {
    data: unknown;
    pointers: Record<string, Pointer>;
  }

  export function parse(json: string): ParseResult;
  export function stringify(data: unknown, replacer?: unknown, space?: string | number): { json: string; pointers: Record<string, Pointer> };
}
