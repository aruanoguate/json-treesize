/* eslint-disable @typescript-eslint/no-explicit-any */
import { XmlTreePanel } from '../src/panel';

const mockPostMessage = jest.fn();
const mockAsWebviewUri = jest.fn((uri: any) => `https://webview/${uri.fsPath ?? uri}`);
const mockOnDidReceiveMessage = jest.fn((_cb: any, _thisArg: any, disposables?: any[]) => {
  if (disposables) disposables.push({ dispose: jest.fn() });
});
const mockOnDidDispose = jest.fn((_cb: any, _thisArg: any, disposables?: any[]) => {
  if (disposables) disposables.push({ dispose: jest.fn() });
});
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

Object.defineProperty(mockPanel.webview, 'html', {
  get: () => mockWebviewHtml,
  set: (value: string) => { mockWebviewHtml = value; },
});

const mockCreateWebviewPanel = jest.fn((_a?: unknown, _b?: unknown, _c?: unknown, _d?: unknown) => mockPanel);
const mockShowTextDocument = jest.fn<any, any>(() => Promise.resolve({
  selection: null as any,
  revealRange: jest.fn(),
}));

jest.mock('vscode', () => ({
  window: {
    createWebviewPanel: (...args: unknown[]) => mockCreateWebviewPanel(args[0], args[1], args[2], args[3]),
    activeColorTheme: { kind: 2 },
    showTextDocument: (...args: any[]) => mockShowTextDocument(...args),
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
      fsPath: parts.map((part: any) => part.fsPath ?? part).join('/'),
    })),
    file: (filePath: string) => ({ fsPath: filePath, scheme: 'file' }),
  },
  ColorThemeKind: { Dark: 2, Light: 1, HighContrast: 3, HighContrastLight: 4 },
  Position: jest.fn((l: number, c: number) => ({ line: l, character: c })),
  Selection: jest.fn((a: any, b: any) => ({ anchor: a, active: b })),
  Range: jest.fn((a: any, b: any) => ({ start: a, end: b })),
  TextEditorRevealType: { InCenter: 2 },
}), { virtual: true });

jest.mock('@vscode/l10n', () => ({
  t: jest.fn((...args: unknown[]) => {
    let msg = String(args[0]);
    for (let i = 1; i < args.length; i++) {
      msg = msg.replace(`{${i - 1}}`, String(args[i]));
    }
    return msg;
  }),
}));

const mockWorkerOn = jest.fn();
jest.mock('node:worker_threads', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: mockWorkerOn,
  })),
}));

jest.mock('node:crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-nonce-value-32chars-long-xx'),
  })),
}));

describe('XmlTreePanel', () => {
  const mockContext = {
    subscriptions: [],
    extensionUri: { fsPath: '/mock/ext' },
    extensionPath: '/mock/ext',
  } as any;

  const mockFileUri = { fsPath: '/test/file.xml', scheme: 'file' } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWebviewHtml = '';
    (XmlTreePanel as any)._instance = undefined;
  });

  describe('createOrShow', () => {
    it('creates a new webview panel on first call', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);

      expect(mockCreateWebviewPanel).toHaveBeenCalledWith(
        'xmlTreeSize',
        expect.stringContaining('file.xml'),
        2,
        expect.objectContaining({ enableScripts: true }),
      );
    });

    it('sets HTML on the webview', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);
      expect(mockWebviewHtml).toContain('<!DOCTYPE html>');
      expect(mockWebviewHtml).toContain('XML Tree Size');
    });

    it('HTML includes Content-Security-Policy with nonce', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);
      expect(mockWebviewHtml).toContain('Content-Security-Policy');
      expect(mockWebviewHtml).toContain('nonce-');
    });

    it('registers message and dispose handlers', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);
      expect(mockOnDidReceiveMessage).toHaveBeenCalled();
      expect(mockOnDidDispose).toHaveBeenCalled();
    });

    it('spawns a worker thread', () => {
      const { Worker } = require('node:worker_threads');
      XmlTreePanel.createOrShow(mockContext, mockFileUri);
      expect(Worker).toHaveBeenCalledWith(
        expect.stringContaining('parser.js'),
        expect.objectContaining({ workerData: { filePath: '/test/file.xml' } }),
      );
    });

    it('reveals existing panel on second call', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);
      jest.clearAllMocks();

      const secondUri = { fsPath: '/test/other.xml', scheme: 'file' } as any;
      XmlTreePanel.createOrShow(mockContext, secondUri);

      expect(mockReveal).toHaveBeenCalled();
      expect(mockCreateWebviewPanel).not.toHaveBeenCalled();
    });
  });

  describe('worker message handling', () => {
    it('buffers tree message when webview is not ready', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);

      const messageHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'message')![1];
      messageHandler({ type: 'tree', data: { key: 'root', size: 10, type: 'object', children: [], line: 0, col: 0 } });

      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('posts tree message immediately when webview is ready', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);

      const messageHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'message')![1];
      const msgCallback = mockOnDidReceiveMessage.mock.calls[0][0];
      msgCallback({ type: 'ready' });

      jest.clearAllMocks();
      (XmlTreePanel as any)._instance._webviewReady = true;

      messageHandler({ type: 'tree', data: { key: 'root', size: 10, type: 'object', children: [], line: 0, col: 0 } });

      expect(mockPostMessage).toHaveBeenCalled();
    });

    it('buffers error message when webview is not ready', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);

      const errorHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'error')![1];
      errorHandler(new Error('parse failed'));

      expect(mockPostMessage).not.toHaveBeenCalled();
    });
  });

  describe('webview message handling', () => {
    it('flushes pending message on ready', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);

      const messageHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'message')![1];
      messageHandler({ type: 'error', message: 'test error' });

      const msgCallback = mockOnDidReceiveMessage.mock.calls[0][0];
      msgCallback({ type: 'ready' });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'test error' }),
      );
    });

    it('flushes pending tree message with fresh color on ready', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);

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

  describe('goToEditor message', () => {
    it('opens the file at the given line and column', async () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);

      const msgCallback = mockOnDidReceiveMessage.mock.calls[0][0];
      await msgCallback({ type: 'goToEditor', line: 5, col: 3 });

      const vscode = require('vscode');
      expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(mockFileUri);
      expect(mockShowTextDocument).toHaveBeenCalled();
    });

    it('ignores unknown message types', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);

      const msgCallback = mockOnDidReceiveMessage.mock.calls[0][0];
      expect(() => msgCallback({ type: 'unknownMsg' })).not.toThrow();
    });
  });

  describe('worker error when webview is ready', () => {
    it('posts error immediately when webview is ready', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);

      const errorHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'error')![1];
      const msgCallback = mockOnDidReceiveMessage.mock.calls[0][0];
      msgCallback({ type: 'ready' });

      jest.clearAllMocks();
      (XmlTreePanel as any)._instance._webviewReady = true;

      errorHandler(new Error('worker crash'));

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'worker crash' }),
      );
    });
  });

  describe('dispose', () => {
    it('clears the singleton on dispose', () => {
      XmlTreePanel.createOrShow(mockContext, mockFileUri);
      expect((XmlTreePanel as any)._instance).toBeDefined();

      const disposeCallback = mockOnDidDispose.mock.calls[0][0];
      disposeCallback();

      expect((XmlTreePanel as any)._instance).toBeUndefined();
    });
  });

  describe('theme detection', () => {
    it('resolves isDark=true for HighContrast theme', () => {
      const vscode = require('vscode');
      vscode.window.activeColorTheme = { kind: vscode.ColorThemeKind.HighContrast };

      XmlTreePanel.createOrShow(mockContext, mockFileUri);
      const messageHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'message')![1];

      const msgCallback = mockOnDidReceiveMessage.mock.calls[0][0];
      msgCallback({ type: 'ready' });
      jest.clearAllMocks();
      (XmlTreePanel as any)._instance._webviewReady = true;

      messageHandler({ type: 'tree', data: { key: 'root', size: 5, type: 'object', children: [], line: 0, col: 0 } });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ isDark: true }),
      );

      vscode.window.activeColorTheme = { kind: 2 };
    });

    it('resolves isDark=false for Light theme', () => {
      const vscode = require('vscode');
      vscode.window.activeColorTheme = { kind: vscode.ColorThemeKind.Light };

      XmlTreePanel.createOrShow(mockContext, mockFileUri);
      const messageHandler = mockWorkerOn.mock.calls.find((c: any[]) => c[0] === 'message')![1];

      const msgCallback = mockOnDidReceiveMessage.mock.calls[0][0];
      msgCallback({ type: 'ready' });
      jest.clearAllMocks();
      (XmlTreePanel as any)._instance._webviewReady = true;

      messageHandler({ type: 'tree', data: { key: 'root', size: 5, type: 'object', children: [], line: 0, col: 0 } });

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ isDark: false }),
      );

      vscode.window.activeColorTheme = { kind: 2 };
    });
  });
});