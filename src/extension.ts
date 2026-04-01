import * as vscode from 'vscode';
import { JsonTreePanel } from './panel';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('jsonTreeSize.analyze', (uri?: vscode.Uri) => {
      // If triggered from command palette (no URI), use the active editor's file
      const fileUri = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!fileUri) {
        vscode.window.showErrorMessage('JSON TreeSize: No JSON file selected.');
        return;
      }
      JsonTreePanel.createOrShow(context, fileUri);
    })
  );
}

export function deactivate(): void {}
