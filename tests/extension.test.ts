import * as vscode from 'vscode';
import { activate, deactivate } from '../src/extension';
import { JsonTreePanel } from '../src/panel';

jest.mock('vscode', () => {
  const subscriptions: { dispose: () => void }[] = [];
  let lastCallback: ((...args: unknown[]) => unknown) | undefined;
  return {
    commands: {
      registerCommand: jest.fn((command: string, callback: (...args: unknown[]) => unknown) => {
        lastCallback = callback;
        return { dispose: jest.fn() };
      }),
      get __lastCallback() { return lastCallback; },
    },
    window: {
      showErrorMessage: jest.fn(),
      activeTextEditor: undefined as { document: { uri: { fsPath: string } } } | undefined,
    },
    Uri: {
      file: (path: string) => ({ fsPath: path, scheme: 'file' }),
    },
    __mockContext: {
      subscriptions,
      extensionUri: { fsPath: '/mock/extension' },
      extensionPath: '/mock/extension',
    },
  };
}, { virtual: true });

jest.mock('../src/panel', () => ({
  JsonTreePanel: {
    createOrShow: jest.fn(),
  },
}));

describe('activate', () => {
  let context: vscode.ExtensionContext;
  let registeredCallback: (uri?: vscode.Uri) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    context = (vscode as unknown as { __mockContext: vscode.ExtensionContext }).__mockContext;
    context.subscriptions.length = 0;

    activate(context);

    // Extract the callback registered with registerCommand
    registeredCallback = (vscode.commands as unknown as { __lastCallback: (uri?: vscode.Uri) => void }).__lastCallback;
  });

  it('registers the jsonTreeSize.analyze command', () => {
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'jsonTreeSize.analyze',
      expect.any(Function),
    );
  });

  it('pushes a disposable into context.subscriptions', () => {
    expect(context.subscriptions).toHaveLength(1);
  });

  it('calls JsonTreePanel.createOrShow when a URI is provided', () => {
    const uri = { fsPath: '/test/file.json', scheme: 'file' } as vscode.Uri;
    registeredCallback(uri);
    expect(JsonTreePanel.createOrShow).toHaveBeenCalledWith(context, uri);
  });

  it('uses activeTextEditor URI when no URI is provided', () => {
    const editorUri = { fsPath: '/editor/file.json', scheme: 'file' } as vscode.Uri;
    (vscode.window as { activeTextEditor?: { document: { uri: vscode.Uri } } }).activeTextEditor = {
      document: { uri: editorUri },
    };

    registeredCallback(undefined);
    expect(JsonTreePanel.createOrShow).toHaveBeenCalledWith(context, editorUri);

    // Clean up
    (vscode.window as { activeTextEditor?: unknown }).activeTextEditor = undefined;
  });

  it('shows error message when no URI and no active editor', () => {
    (vscode.window as { activeTextEditor?: unknown }).activeTextEditor = undefined;
    registeredCallback(undefined);
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
      'JSON TreeSize: No JSON file selected.',
    );
    expect(JsonTreePanel.createOrShow).not.toHaveBeenCalled();
  });
});

describe('deactivate', () => {
  it('does not throw', () => {
    expect(() => deactivate()).not.toThrow();
  });
});
