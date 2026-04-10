import { test } from '@playwright/test';
import path from 'node:path';
import { launchVSCode, ROOT, slowType, waitForTreeSizePanel } from './helpers';

test('screenshot', async ({}, testInfo) => {
  const videoDir = testInfo.outputDir;
  const { electronApp, window } = await launchVSCode(videoDir);

  try {
    await window.waitForTimeout(1500);
    await window.keyboard.press('Meta+Shift+P');
    await window.waitForTimeout(600);
    await slowType(window, 'XML Tree Size: Analyze', 40);
    await window.waitForTimeout(400);
    await window.keyboard.press('Enter');
    await window.waitForTimeout(4000);

    const webviewFrame = await waitForTreeSizePanel(window, 20000);
    if (!webviewFrame) {
      throw new Error('Tree Size panel did not appear');
    }

    await webviewFrame.evaluate(() => {
      const btn = document.querySelector('#expand-all-btn') as HTMLElement | null;
      btn?.click();
    });
    await window.waitForTimeout(2000);

    await webviewFrame.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.tree-row'));
      const target = rows.find((row) => row.querySelector('.tree-key')?.textContent === 'product');
      (target as HTMLElement | undefined)?.click();
    });
    await window.waitForTimeout(1500);

    const screenshotPath = path.join(ROOT, 'docs', 'screenshot.png');
    await window.screenshot({ path: screenshotPath });
    console.log(`→ Screenshot saved: ${screenshotPath}`);
  } finally {
    await electronApp.close();
  }
});