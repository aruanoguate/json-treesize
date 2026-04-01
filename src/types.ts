/** A node in the JSON size tree. Produced by the parser worker. */
export interface SizeNode {
  /** Key name or array index as string (e.g. "commodity", "0") */
  key: string;
  /** Byte length of this subtree when minified (JSON.stringify) */
  size: number;
  /** JSON value type */
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  /** Children sorted by size descending. Empty for leaf nodes. */
  children: SizeNode[];
  /** 0-based line number in original file (for Go to in editor) */
  line: number;
  /** 0-based column number in original file */
  col: number;
}

// ---- Messages: Extension Host → Webview ----

export interface LoadingMessage {
  type: 'loading';
}

export interface TreeMessage {
  type: 'tree';
  data: SizeNode;
  baseColor: string;   // hex, always resolved — never empty (e.g. "#4a9eda")
  isDark: boolean;     // true for Dark/HighContrast VS Code themes
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type ExtensionToWebviewMessage = LoadingMessage | TreeMessage | ErrorMessage;

// ---- Messages: Webview → Extension Host ----

export interface GoToEditorMessage {
  type: 'goToEditor';
  line: number;
  col: number;
}

export interface ReadyMessage {
  type: 'ready';
}

export type WebviewToExtensionMessage = GoToEditorMessage | ReadyMessage;
