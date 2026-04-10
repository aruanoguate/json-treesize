/**
 * Shared helpers for the Playwright demo recorder.
 *
 * Launches VS Code as an Electron app with a clean profile,
 * the JSON Tree Size extension loaded in dev mode, and video recording enabled.
 *
 * Key functions:
 *  - launchVSCode()           — start VS Code + record video
 *  - waitForTreeSizePanel()   — poll for the webview frame
 *  - dismissUI()              — close Copilot sidebar & other distractions
 *  - slowType()               — type text character-by-character
 */
import { _electron as electron, type ElectronApplication, type Page, type Frame } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

export const ROOT = path.resolve(__dirname, '..', '..');
export const DEMO_JSON = path.join(ROOT, 'docs', 'demo.json');
const VSCODE_PATH = '/Applications/Visual Studio Code.app/Contents/MacOS/Electron';

interface VSCodeInstance {
  electronApp: ElectronApplication;
  window: Page;
}

/** Launch a VS Code instance with the extension loaded in dev mode. */
export async function launchVSCode(videoDir: string): Promise<VSCodeInstance> {
  const distExt = path.join(ROOT, 'dist', 'extension.js');
  if (!fs.existsSync(distExt)) {
    throw new Error('Extension not compiled. Run "npm run compile" first.');
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-demo-'));

  // Pre-configure VS Code to minimise visual distractions
  const settingsDir = path.join(userDataDir, 'User');
  fs.mkdirSync(settingsDir, { recursive: true });
  fs.writeFileSync(path.join(settingsDir, 'settings.json'), JSON.stringify({
    'workbench.startupEditor': 'none',
    'workbench.tips.enabled': false,
    'workbench.colorTheme': 'Default Dark Modern',
    'workbench.layoutControl.enabled': false,
    'window.commandCenter': false,
    // Match window size to the recording viewport to avoid gray bars
    'window.newWindowDimensions': 'offset',
    // Hide the Sign In / Accounts button in the title bar & activity bar
    'workbench.accounts.experimental.showEntitlements': false,
    'window.titleBarStyle': 'custom',
    'workbench.activityBar.location': 'default',
    // Disable Copilot features to prevent its sidebar from auto-opening
    'github.copilot.enable': { '*': false },
    'github.copilot.editor.enableAutoCompletions': false,
    'chat.commandCenter.enabled': false,
    'chat.agent.enabled': false,
  }, null, 2));

  const target = DEMO_JSON;

  const electronApp = await electron.launch({
    executablePath: VSCODE_PATH,
    args: [
      '--user-data-dir', userDataDir,
      '--extensions-dir', path.join(userDataDir, 'extensions'),
      '--extensionDevelopmentPath', ROOT,
      '--disable-extensions',
      '--disable-gpu',
      '--disable-workspace-trust',
      '--skip-release-notes',
      '--skip-welcome',
      target,
    ],
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 800 },
    },
  });

  const window = await electronApp.firstWindow();

  // Resize the VS Code window to exactly match the recording viewport
  // to prevent gray bars on the edges of the GIF
  const browserWindow = await electronApp.browserWindow(window);
  await browserWindow.evaluate((win) => {
    win.setSize(1280, 800);
    win.center();
  });

  await window.waitForTimeout(4000);

  // Close any secondary sidebar (Copilot Chat) and notification toasts
  await dismissUI(window);

  // Hide the Sign In button from the title bar.
  // Run repeatedly because VS Code may render it lazily after startup.
  for (let attempt = 0; attempt < 3; attempt++) {
    await window.evaluate(() => {
      document.querySelectorAll('[class*="action-item"]').forEach(el => {
        const text = el.textContent?.trim();
        if (text && /sign\s*in/i.test(text)) {
          (el as HTMLElement).style.display = 'none';
        }
      });
    });
    await window.waitForTimeout(500);
  }

  return { electronApp, window };
}

/**
 * Close the secondary sidebar (Copilot Chat panel) and dismiss
 * notification toasts so the recording is clean.
 */
export async function dismissUI(window: Page): Promise<void> {
  // Only close the secondary sidebar if it is actually visible
  const auxBar = window.locator('.part.auxiliarybar');
  const isAuxVisible = await auxBar.isVisible().catch(() => false);
  if (isAuxVisible) {
    // Toggle Secondary Side Bar (Cmd+Option+B on macOS)
    await window.keyboard.press('Meta+Alt+KeyB');
    await window.waitForTimeout(500);
  }

  // Dismiss any notification toasts
  await window.keyboard.press('Escape');
  await window.waitForTimeout(300);
}

/** Wait for the JSON Tree Size webview panel to render. */
export async function waitForTreeSizePanel(window: Page, timeout = 15000): Promise<Frame | null> {
  await window.waitForTimeout(2000);
  const start = Date.now();
  while (Date.now() - start < timeout) {
    // Check all frames — VS Code webview URLs vary across versions
    for (const frame of window.frames()) {
      try {
        const el = await frame.$('#split:not(.hidden)');
        if (el) return frame;
      } catch {
        // Frame may be detached or inaccessible, skip it
      }
    }
    await window.waitForTimeout(500);
  }
  return null;
}

/** Slowly type text to look natural in recordings. */
export async function slowType(window: Page, text: string, delay = 80): Promise<void> {
  for (const char of text) {
    await window.keyboard.press(char);
    await window.waitForTimeout(delay);
  }
}
