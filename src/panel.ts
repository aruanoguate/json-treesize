import * as vscode from 'vscode';
import * as path from 'node:path';
import * as l10n from '@vscode/l10n';
import { randomBytes } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { ExtensionToWebviewMessage, WebviewToExtensionMessage, WorkerToExtensionMessage } from './types';
import { DEFAULT_BASE_COLOR, resolveHexColor } from './utils';

/**
 * Manages the JSON Tree Size webview panel.
 * Handles parsing JSON files in a worker thread, rendering the tree-size
 * visualization in a VS Code webview, and coordinating messages between
 * the extension host and the webview.
 */
export class JsonTreePanel {
  public static readonly viewType = 'jsonTreeSize';
  private static _instance: JsonTreePanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private readonly _fileUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _webviewReady = false;
  private _pendingMessage: ExtensionToWebviewMessage | null = null;

  /**
   * Creates a new panel or reveals the existing one.
   * If a panel already exists, it is revealed and re-loaded with the new file.
   * @param context - The VS Code extension context for resource resolution.
   * @param fileUri - URI of the JSON file to analyze.
   */
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
      l10n.t('JSON Tree Size — {0}', path.basename(fileUri.fsPath)),
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

  /**
   * Spawns a worker thread to parse the given JSON file and sends
   * the resulting tree (or error) to the webview once it is ready.
   * @param fileUri - URI of the JSON file to parse.
   */
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

  /**
   * Posts a message to the webview.
   * @param msg - The message to send to the webview.
   */
  private _post(msg: ExtensionToWebviewMessage): void {
    this._panel.webview.postMessage(msg);
  }

  /**
   * Opens the source JSON file in the editor and navigates to the
   * specified position.
   * @param line - 0-based line number in the source file.
   * @param col - 0-based column number in the source file.
   */
  private async _goToEditor(line: number, col: number): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(this._fileUri);
    const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
    const position = new vscode.Position(line, col);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
  }

  /**
   * Generates the full HTML content for the webview, including styles,
   * Content-Security-Policy meta tag, and the bundled webview script.
   * @returns The HTML string to assign to the webview.
   */
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
  <title>JSON Tree Size</title>
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
      display: flex; flex-direction: column;
    }
    .tree-toolbar {
      display: flex; gap: 4px; padding: 4px 6px;
      border-bottom: 1px solid var(--vscode-panel-border);
      flex-shrink: 0;
    }
    .tree-toolbar button {
      font-size: 0.75em; padding: 2px 8px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none; border-radius: 3px; cursor: pointer;
    }
    .tree-toolbar button:hover { background: var(--vscode-button-secondaryHoverBackground); }
    .tree-toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }
    .tree-scroll { flex: 1; overflow-y: auto; padding: 8px; }
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
<body
  data-l10n-analyzing="${this._esc(l10n.t('Analyzing…'))}"
  data-l10n-expand-all="${this._esc(l10n.t('Expand all'))}"
  data-l10n-collapse-all="${this._esc(l10n.t('Collapse all'))}"
  data-l10n-select-node="${this._esc(l10n.t('Select a node in the tree to see its breakdown.'))}"
  data-l10n-expanding="${this._esc(l10n.t('Expanding…'))}"
  data-l10n-collapsing="${this._esc(l10n.t('Collapsing…'))}"
  data-l10n-error="${this._esc(l10n.t('Error: {0}', '__MSG__'))}"
  data-l10n-total="${this._esc(l10n.t('total'))}"
  data-l10n-items="${this._esc(l10n.t('items'))}"
  data-l10n-keys="${this._esc(l10n.t('keys'))}"
  data-l10n-open-in-editor="${this._esc(l10n.t('Open in editor ↗'))}"
  data-l10n-made-in="${this._esc(l10n.t('Made with ❤️ from Guatemala'))}"
>
  <div id="app">
    <div id="loading" class="loading-state">
      <div class="spinner"></div>
      <span>${this._esc(l10n.t('Analyzing…'))}</span>
    </div>
    <div id="error" class="error-state hidden"></div>
    <div id="split" class="split hidden">
      <div class="tree-pane">
        <div class="tree-toolbar">
          <button id="expand-all-btn">${this._esc(l10n.t('Expand all'))}</button>
          <button id="collapse-all-btn">${this._esc(l10n.t('Collapse all'))}</button>
        </div>
        <div id="tree-pane" class="tree-scroll"></div>
      </div>
      <div id="detail-pane" class="pane detail-pane">
        <div id="detail-placeholder" class="detail-placeholder">
          ${this._esc(l10n.t('Select a node in the tree to see its breakdown.'))}
        </div>
        <div id="detail-content" class="hidden"></div>
      </div>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Reads the `jsonTreeSize.baseColor` setting and validates it.
   * @returns A resolved 6-digit hex color string (e.g. `"#4a9eda"`).
   */
  private _resolveBaseColor(): string {
    const setting = vscode.workspace.getConfiguration('jsonTreeSize').get<string>('baseColor', DEFAULT_BASE_COLOR);
    return resolveHexColor(setting, DEFAULT_BASE_COLOR);
  }

  /**
   * Determines whether the current VS Code color theme is dark.
   * @returns `true` for Dark or HighContrast themes, `false` otherwise.
   */
  private _resolveIsDark(): boolean {
    const { kind } = vscode.window.activeColorTheme;
    return kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
  }

  /** Escapes a string for safe use in HTML attributes and content. */
  private _esc(s: string): string {
    return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  }

  /** Disposes the panel and cleans up all associated resources. */
  private _dispose(): void {
    JsonTreePanel._instance = undefined;
    this._panel.dispose();
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
  }
}

/**
 * Generates a cryptographically secure nonce string for use
 * in Content-Security-Policy directives.
 * @returns A 32-character base64url-encoded nonce.
 */
function getNonce(): string {
  return randomBytes(24).toString('base64url');
}
