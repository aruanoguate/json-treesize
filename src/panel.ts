import * as vscode from 'vscode';
import * as path from 'node:path';
import { Worker } from 'node:worker_threads';
import { ExtensionToWebviewMessage, WebviewToExtensionMessage, WorkerToExtensionMessage } from './types';
import { resolveHexColor } from './utils';

export class JsonTreePanel {
  public static readonly viewType = 'jsonTreeSize';
  private static _instance: JsonTreePanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private readonly _fileUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _webviewReady = false;
  private _pendingMessage: ExtensionToWebviewMessage | null = null;

  public static createOrShow(context: vscode.ExtensionContext, fileUri: vscode.Uri): void {
    const column = vscode.ViewColumn.Beside;

    if (JsonTreePanel._instance) {
      JsonTreePanel._instance._panel.reveal(column);
      JsonTreePanel._instance._panel.webview.html = JsonTreePanel._instance._getHtml();
      JsonTreePanel._instance._loadFile(fileUri);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      JsonTreePanel.viewType,
      `JSON TreeSize — ${path.basename(fileUri.fsPath)}`,
      column,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview')],
      }
    );

    JsonTreePanel._instance = new JsonTreePanel(panel, context, fileUri);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    fileUri: vscode.Uri
  ) {
    this._panel = panel;
    this._context = context;
    this._fileUri = fileUri;

    this._panel.webview.html = this._getHtml();

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (msg: WebviewToExtensionMessage) => {
        if (msg.type === 'ready') {
          this._webviewReady = true;
          if (this._pendingMessage) {
            // Re-enrich at flush time so theme/color are current
            const toSend: ExtensionToWebviewMessage = this._pendingMessage.type === 'tree'
              ? { ...this._pendingMessage, baseColor: this._resolveBaseColor(), isDark: this._resolveIsDark() }
              : this._pendingMessage;
            this._post(toSend);
            this._pendingMessage = null;
          }
        } else if (msg.type === 'goToEditor') {
          this._goToEditor(msg.line, msg.col);
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this._dispose(), null, this._disposables);

    // Start parsing — result will be buffered until webview sends 'ready'
    this._loadFile(fileUri);
  }

  private _loadFile(fileUri: vscode.Uri): void {
    this._webviewReady = false;
    this._pendingMessage = null;

    const workerPath = path.join(this._context.extensionPath, 'dist', 'worker', 'parser.js');
    const worker = new Worker(workerPath, { workerData: { filePath: fileUri.fsPath } });

    worker.on('message', (msg: WorkerToExtensionMessage) => {
      const enriched: ExtensionToWebviewMessage = msg.type === 'tree'
        ? { ...msg, baseColor: this._resolveBaseColor(), isDark: this._resolveIsDark() }
        : msg;

      if (this._webviewReady) {
        this._post(enriched);
      } else {
        this._pendingMessage = enriched;
      }
    });

    worker.on('error', (err: Error) => {
      const errMsg: ExtensionToWebviewMessage = { type: 'error', message: err.message };
      if (this._webviewReady) {
        this._post(errMsg);
      } else {
        this._pendingMessage = errMsg;
      }
    });
  }

  private _post(msg: ExtensionToWebviewMessage): void {
    this._panel.webview.postMessage(msg);
  }

  private async _goToEditor(line: number, col: number): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(this._fileUri);
    const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
    const position = new vscode.Position(line, col);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  }

  private _getHtml(): string {
    const webview = this._panel.webview;
    const distWebview = vscode.Uri.joinPath(this._context.extensionUri, 'dist', 'webview');
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distWebview, 'main.js'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JSON TreeSize</title>
  <style nonce="${nonce}">
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      height: 100vh;
      overflow: hidden;
    }

    .hidden { display: none !important; }

    /* Loading */
    .loading-state {
      display: flex; align-items: center; justify-content: center;
      gap: 12px; height: 100vh;
      color: var(--vscode-descriptionForeground);
    }
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid var(--vscode-descriptionForeground);
      border-top-color: var(--vscode-focusBorder);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Error */
    .error-state {
      display: flex; align-items: center; justify-content: center;
      height: 100vh; padding: 24px;
      color: var(--vscode-errorForeground);
    }

    /* Split layout */
    .split { display: flex; height: 100vh; overflow: hidden; }
    .pane { overflow-y: auto; }

    .tree-pane {
      width: 45%; min-width: 200px; flex-shrink: 0;
      border-right: 1px solid var(--vscode-panel-border);
      padding: 8px;
    }
    .detail-pane { flex: 1; padding: 12px 16px; overflow-y: auto; }

    /* Tree rows */
    .tree-row {
      display: flex; flex-direction: column;
      padding: 3px 4px; border-radius: 3px;
      cursor: pointer; user-select: none;
    }
    .tree-row:hover { background: var(--vscode-list-hoverBackground); }
    .tree-row.selected {
      background: var(--vscode-list-activeSelectionBackground);
      color: var(--vscode-list-activeSelectionForeground);
    }
    .tree-row-top { display: flex; align-items: center; gap: 6px; }
    .tree-toggle { width: 14px; flex-shrink: 0; font-size: 10px; color: var(--vscode-descriptionForeground); }
    .tree-key { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tree-size { font-size: 0.82em; white-space: nowrap; margin-left: 4px; }

    /* Mini bar under tree row */
    .tree-bar-row {
      display: flex; align-items: center; gap: 6px; margin-top: 3px;
    }
    .tree-mini-bar-track {
      flex: 1; height: 6px;
      background: var(--vscode-input-background, #e8e8e8);
      border: 1px solid var(--vscode-input-border, #ccc);
      border-radius: 2px;
    }
    .tree-mini-bar-fill {
      height: 100%; border-radius: 2px;
    }
    .tree-pct {
      font-size: 0.75em; color: var(--vscode-foreground);
      white-space: nowrap; min-width: 36px; text-align: right;
    }
    .tree-children { padding-left: 16px; }

    /* Detail pane */
    .detail-placeholder {
      color: var(--vscode-descriptionForeground);
      padding: 32px 0; text-align: center;
    }
    .detail-header {
      margin-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 10px;
    }
    .detail-header h2 { font-size: 1em; font-weight: 600; margin-bottom: 4px; }
    .detail-meta { font-size: 0.82em; color: var(--vscode-descriptionForeground); }

    /* Bar chart */
    .bar-row { display: flex; flex-direction: column; margin-bottom: 10px; cursor: pointer; }
    .bar-row:hover .bar-key { text-decoration: underline; }
    .bar-row-top {
      display: flex; justify-content: space-between;
      font-size: 0.82em; margin-bottom: 4px;
    }
    .bar-key { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
    .bar-meta { color: var(--vscode-descriptionForeground); white-space: nowrap; padding-left: 8px; }
    .bar-track {
      height: 12px;
      background: var(--vscode-input-background, #e8e8e8);
      border: 1px solid var(--vscode-input-border, #ccc);
      border-radius: 3px; overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      transition: width 0.15s ease;
    }

    /* Go to editor button */
    .goto-btn {
      margin-top: 20px;
      padding: 5px 14px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none; border-radius: 3px;
      cursor: pointer; font-size: 0.9em;
    }
    .goto-btn:hover { background: var(--vscode-button-hoverBackground); }
  </style>
</head>
<body>
  <div id="app">
    <div id="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Analyzing…</span>
    </div>
    <div id="error" class="error-state hidden"></div>
    <div id="split" class="split hidden">
      <div id="tree-pane" class="pane tree-pane"></div>
      <div id="detail-pane" class="pane detail-pane">
        <div id="detail-placeholder" class="detail-placeholder">
          Select a node in the tree to see its breakdown.
        </div>
        <div id="detail-content" class="hidden"></div>
      </div>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _resolveBaseColor(): string {
    const setting = vscode.workspace.getConfiguration('jsonTreeSize').get<string>('baseColor', '');
    return resolveHexColor(setting, '#4a9eda');
  }

  private _resolveIsDark(): boolean {
    const { kind } = vscode.window.activeColorTheme;
    return kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
  }

  private _dispose(): void {
    JsonTreePanel._instance = undefined;
    this._panel.dispose();
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
