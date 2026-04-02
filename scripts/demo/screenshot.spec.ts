/**
 * Capture: docs/screenshot.png
 *
 * Opens the extension, clicks a tree node so both the tree and the
 * detail pane are populated, then takes a high-resolution PNG screenshot.
 * This replaces the manually-captured screenshot used at the top of README.
 */
import { test } from '@playwright/test';
import path from 'node:path';
import { launchVSCode, waitForTreeSizePanel, slowType, ROOT } from './helpers';

test('screenshot', async ({}, testInfo) => {
  const videoDir = testInfo.outputDir;
  const { electronApp, window } = await launchVSCode(videoDir);

  try {
    // Open the extension quickly
    await window.waitForTimeout(1500);
    await window.keyboard.press('Meta+Shift+P');
    await window.waitForTimeout(600);
    await slowType(window, 'JSON TreeSize: Analyze', 40);
    await window.waitForTimeout(400);
    await window.keyboard.press('Enter');
    await window.waitForTimeout(4000);

    const webviewFrame = await waitForTreeSizePanel(window, 20000);
    if (!webviewFrame) {
      throw new Error('TreeSize panel did not appear');
    }

    // Expand all so the tree is rich
    await webviewFrame.evaluate(() => {
      const btn = document.querySelector('#expand-all-btn') as HTMLElement;
      btn?.click();
    });
    await window.waitForTimeout(2000);

    // Click a mid-level node so the detail pane shows a breakdown
    await webviewFrame.evaluate(() => {
      const rows = document.querySelectorAll('.tree-row');
      if (rows.length > 2) (rows[2] as HTMLElement).click();
    });
    await window.waitForTimeout(1500);

    // Take the screenshot
    const screenshotPath = path.join(ROOT, 'docs', 'screenshot.png');
    await window.screenshot({ path: screenshotPath });
    console.log(`→ Screenshot saved: ${screenshotPath}`);
  } finally {
    await electronApp.close();
  }
});
