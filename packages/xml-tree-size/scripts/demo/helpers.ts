/**
 * Shared helpers for the Playwright demo recorder.
 *
 * Launches VS Code as an Electron app with a clean profile,
 * the XML Tree Size extension loaded in dev mode, and video recording enabled.
 */
import { _electron as electron, type ElectronApplication, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const ROOT = path.resolve(__dirname, '..', '..');
export const DEMO_XML = path.join(ROOT, 'docs', 'demo.xml');
const VSCODE_PATH = '/Applications/Visual Studio Code.app/Contents/MacOS/Electron';

interface VSCodeInstance {
  electronApp: ElectronApplication;
  window: Page;
}

export async function launchVSCode(videoDir: string): Promise<VSCodeInstance> {
  const distExt = path.join(ROOT, 'dist', 'extension.js');
  if (!fs.existsSync(distExt)) {
    throw new Error('Extension not compiled. Run "npm run compile" first.');
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-demo-'));
  const settingsDir = path.join(userDataDir, 'User');
  fs.mkdirSync(settingsDir, { recursive: true });
  fs.writeFileSync(path.join(settingsDir, 'settings.json'), JSON.stringify({
    'workbench.startupEditor': 'none',
    'workbench.tips.enabled': false,
    'workbench.colorTheme': 'Default Dark Modern',
    'workbench.layoutControl.enabled': false,
    'window.commandCenter': false,
    'window.newWindowDimensions': 'offset',
    'workbench.accounts.experimental.showEntitlements': false,
    'window.titleBarStyle': 'custom',
    'workbench.activityBar.location': 'default',
    'github.copilot.enable': { '*': false },
    'github.copilot.editor.enableAutoCompletions': false,
    'chat.commandCenter.enabled': false,
    'chat.agent.enabled': false,
  }, null, 2));

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
      DEMO_XML,
    ],
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 800 },
    },
  });

  const window = await electronApp.firstWindow();
  const browserWindow = await electronApp.browserWindow(window);
  await browserWindow.evaluate((win) => {
    win.setSize(1280, 800);
    win.center();
  });

  await window.waitForTimeout(4000);
  await dismissUI(window);

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

export async function dismissUI(window: Page): Promise<void> {
  const auxBar = window.locator('.part.auxiliarybar');
  const isAuxVisible = await auxBar.isVisible().catch(() => false);
  if (isAuxVisible) {
    await window.keyboard.press('Meta+Alt+KeyB');
    await window.waitForTimeout(500);
  }

  await window.keyboard.press('Escape');
  await window.waitForTimeout(300);
}

export async function waitForTreeSizePanel(window: Page, timeout = 15000): Promise<Frame | null> {
  await window.waitForTimeout(2000);
  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const frame of window.frames()) {
      try {
        const el = await frame.$('#split:not(.hidden)');
        if (el) return frame;
      } catch {
      }
    }
    await window.waitForTimeout(500);
  }
  return null;
}

export async function slowType(window: Page, text: string, delay = 80): Promise<void> {
  for (const char of text) {
    await window.keyboard.press(char);
    await window.waitForTimeout(delay);
  }
}