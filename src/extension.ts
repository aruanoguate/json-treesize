import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';
import { JsonTreePanel } from './panel';

/**
 * Activates the JSON TreeSize extension.
 * Registers the `jsonTreeSize.analyze` command which opens the tree-size panel
 * for the selected (or currently active) JSON file.
 * @param context - The VS Code extension context used for subscriptions and extension-scoped resources.
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('jsonTreeSize.analyze', (uri?: vscode.Uri) => {
      // If triggered from command palette (no URI), use the active editor's file
      const fileUri = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!fileUri) {
        vscode.window.showErrorMessage(l10n.t('No JSON file selected.'));
        return;
      }
      JsonTreePanel.createOrShow(context, fileUri);
    })
  );
}

/**
 * Deactivates the JSON TreeSize extension.
 * VS Code requires this export; no cleanup is needed for this extension.
 */
export function deactivate(): void {
  // Intentional: VS Code requires this export but no cleanup is needed
}
