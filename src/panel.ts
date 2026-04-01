import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Worker } from 'worker_threads';
import { ExtensionToWebviewMessage, WebviewToExtensionMessage } from './types';

export class JsonTreePanel {
  public static readonly viewType = 'jsonTreeSize';
  private static _instance: JsonTreePanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private readonly _fileUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(context: vscode.ExtensionContext, fileUri: vscode.Uri): void {
    const column = vscode.ViewColumn.Beside;

    if (JsonTreePanel._instance) {
      JsonTreePanel._instance._panel.reveal(column);
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
        if (msg.type === 'goToEditor') {
          this._goToEditor(msg.line, msg.col);
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this._dispose(), null, this._disposables);

    // Start parsing
    this._loadFile(fileUri);
  }

  private _loadFile(fileUri: vscode.Uri): void {
    this._post({ type: 'loading' });

    const workerPath = path.join(this._context.extensionPath, 'dist', 'worker', 'parser.js');
    const worker = new Worker(workerPath, { workerData: { filePath: fileUri.fsPath } });

    worker.on('message', (msg: ExtensionToWebviewMessage) => {
      this._post(msg);
    });

    worker.on('error', (err: Error) => {
      this._post({ type: 'error', message: err.message });
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
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distWebview, 'styles.css'));
    const nonce = getNonce();

    // Read index.html from src/webview and inject CSP + asset URIs
    const htmlPath = path.join(this._context.extensionPath, 'src', 'webview', 'index.html');
    return fs.readFileSync(htmlPath, 'utf8')
      .replaceAll('__NONCE__', nonce)
      .replace('__CSP_SOURCE__', webview.cspSource)
      .replace('__SCRIPT_URI__', scriptUri.toString())
      .replace('__STYLE_URI__', styleUri.toString());
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
