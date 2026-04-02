/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonTreePanel } from '../src/panel';

// ── Mock: vscode ──
const mockPostMessage = jest.fn();
const mockAsWebviewUri = jest.fn((uri: any) => `https://webview/${uri.fsPath ?? uri}`);
const mockOnDidReceiveMessage = jest.fn();
const mockOnDidDispose = jest.fn();
const mockReveal = jest.fn();
let mockWebviewHtml = '';

const mockPanel = {
  webview: {
    html: '',
    postMessage: mockPostMessage,
    asWebviewUri: mockAsWebviewUri,
    onDidReceiveMessage: mockOnDidReceiveMessage,
  },
  reveal: mockReveal,
  onDidDispose: mockOnDidDispose,
  dispose: jest.fn(),
};

// Intercept html setter
Object.defineProperty(mockPanel.webview, 'html', {
  get: () => mockWebviewHtml,
  set: (v: string) => { mockWebviewHtml = v; },
});

const mockCreateWebviewPanel = jest.fn((_a?: unknown, _b?: unknown, _c?: unknown, _d?: unknown) => mockPanel);

jest.mock('vscode', () => ({
  window: {
    createWebviewPanel: (...args: unknown[]) => mockCreateWebviewPanel(args[0], args[1], args[2], args[3]),
    activeColorTheme: { kind: 2 }, // Dark
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((_key: string, fallback: string) => fallback),
    })),
    openTextDocument: jest.fn(() => Promise.resolve({})),
  },
  ViewColumn: { Beside: 2, One: 1 },
  Uri: {
    joinPath: jest.fn((...parts: any[]) => ({
      fsPath: parts.map((p: any) => p.fsPath ?? p).join('/'),
    })),
    file: (path: string) => ({ fsPath: path, scheme: 'file' }),
  },
  ColorThemeKind: { Dark: 2, Light: 1, HighContrast: 3, HighContrastLight: 4 },
  Position: jest.fn((l: number, c: number) => ({ line: l, character: c })),
  Selection: jest.fn((a: any, b: any) => ({ anchor: a, active: b })),
  Range: jest.fn((a: any, b: any) => ({ start: a, end: b })),
  TextEditorRevealType: { InCenter: 2 },
}), { virtual: true });

// ── Mock: node:worker_threads ──
const mockWorkerOn = jest.fn();
jest.mock('node:worker_threads', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: mockWorkerOn,
  })),
}));

// ── Mock: node:crypto ──
jest.mock('node:crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-nonce-value-32chars-long-xx'),
  })),
}));

describe('JsonTreePanel', () => {
  const mockContext = {
    subscriptions: [],
    extensionUri: { fsPath: '/mock/ext' },
    extensionPath: '/mock/ext',
  } as any;

  const mockFileUri = { fsPath: '/test/file.json', scheme: 'file' } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWebviewHtml = '';
    // Reset singleton via the private static field
    (JsonTreePanel as any)._instance = undefined;
  });

  describe('createOrShow', () => {
    it('creates a new webview panel on first call', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);

      expect(mockCreateWebviewPanel).toHaveBeenCalledWith(
        'jsonTreeSize',
        expect.stringContaining('file.json'),
        2, // ViewColumn.Beside
        expect.objectContaining({ enableScripts: true }),
      );
    });

    it('sets HTML on the webview', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);
      expect(mockWebviewHtml).toContain('<!DOCTYPE html>');
      expect(mockWebviewHtml).toContain('JSON TreeSize');
    });

    it('HTML includes Content-Security-Policy with nonce', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);
      expect(mockWebviewHtml).toContain('Content-Security-Policy');
      expect(mockWebviewHtml).toContain('nonce-');
    });

    it('registers message and dispose handlers', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);
      expect(mockOnDidReceiveMessage).toHaveBeenCalled();
      expect(mockOnDidDispose).toHaveBeenCalled();
    });

    it('spawns a worker thread', () => {
      const { Worker } = require('node:worker_threads');
      JsonTreePanel.createOrShow(mockContext, mockFileUri);
      expect(Worker).toHaveBeenCalledWith(
        expect.stringContaining('parser.js'),
        expect.objectContaining({ workerData: { filePath: '/test/file.json' } }),
      );
    });

    it('reveals existing panel on second call', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);
      jest.clearAllMocks();

      const secondUri = { fsPath: '/test/other.json', scheme: 'file' } as any;
      JsonTreePanel.createOrShow(mockContext, secondUri);

      expect(mockReveal).toHaveBeenCalled();
      expect(mockCreateWebviewPanel).not.toHaveBeenCalled();
    });
  });

  describe('worker message handling', () => {
    it('buffers tree message when webview is not ready', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);

      // Get the worker 'message' callback
      const messageHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'message')![1];

      // Simulate worker sending a tree message
      messageHandler({ type: 'tree', data: { key: 'root', size: 10, type: 'object', children: [], line: 0, col: 0 } });

      // Should NOT have posted to webview (webview not ready)
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('posts tree message immediately when webview is ready', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);

      // Capture the worker message handler before clearing mocks
      const messageHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'message')![1];

      // Simulate webview sending 'ready'
      const msgCallback = mockOnDidReceiveMessage.mock.calls[0][0];
      msgCallback({ type: 'ready' });

      jest.clearAllMocks();

      // Now the webview is ready, so the next worker message should be posted immediately
      (JsonTreePanel as any)._instance._webviewReady = true;

      messageHandler({ type: 'tree', data: { key: 'root', size: 10, type: 'object', children: [], line: 0, col: 0 } });

      expect(mockPostMessage).toHaveBeenCalled();
    });

    it('buffers error message when webview is not ready', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);

      const errorHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'error')![1];
      errorHandler(new Error('parse failed'));

      expect(mockPostMessage).not.toHaveBeenCalled();
    });
  });

  describe('webview message handling', () => {
    it('flushes pending message on ready', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);

      // Buffer a message via worker
      const messageHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'message')![1];
      messageHandler({ type: 'error', message: 'test error' });

      // Now signal ready
      const msgCallback = mockOnDidReceiveMessage.mock.calls[0][0];
      msgCallback({ type: 'ready' });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'test error' }),
      );
    });

    it('flushes pending tree message with fresh color on ready', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);

      const messageHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'message')![1];
      messageHandler({ type: 'tree', data: { key: 'root', size: 10, type: 'object', children: [], line: 0, col: 0 } });

      const msgCallback = mockOnDidReceiveMessage.mock.calls[0][0];
      msgCallback({ type: 'ready' });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tree',
          baseColor: expect.any(String),
          isDark: expect.any(Boolean),
        }),
      );
    });
  });

  describe('dispose', () => {
    it('clears the singleton on dispose', () => {
      JsonTreePanel.createOrShow(mockContext, mockFileUri);
      expect((JsonTreePanel as any)._instance).toBeDefined();

      // Trigger dispose callback
      const disposeCallback = mockOnDidDispose.mock.calls[0][0];
      disposeCallback();

      expect((JsonTreePanel as any)._instance).toBeUndefined();
    });
  });
});
