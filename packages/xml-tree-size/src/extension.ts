import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';
import { XmlTreePanel } from './panel';

/**
 * Activates the XML Tree Size extension.
 * Registers the `xmlTreeSize.analyze` command which opens the tree-size panel
 * for the selected (or currently active) XML file.
 * @param context - The VS Code extension context used for subscriptions and extension-scoped resources.
 */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('xmlTreeSize.analyze', (uri?: vscode.Uri) => {
      // If triggered from command palette (no URI), use the active editor's file
      const fileUri = uri ?? vscode.window.activeTextEditor?.document.uri;
      if (!fileUri) {
        vscode.window.showErrorMessage(l10n.t('No XML file selected.'));
        return;
      }
      XmlTreePanel.createOrShow(context, fileUri);
    })
  );
}

/**
 * Deactivates the XML Tree Size extension.
 * VS Code requires this export; no cleanup is needed for this extension.
 */
export function deactivate(): void {
  // Intentional: VS Code requires this export but no cleanup is needed
}
