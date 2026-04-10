import { test } from '@playwright/test';
import { launchVSCode, slowType, waitForTreeSizePanel } from './helpers';

test('command palette demo', async ({}, testInfo) => {
  const videoDir = testInfo.outputDir;
  const { electronApp, window } = await launchVSCode(videoDir);

  try {
    await window.waitForTimeout(2000);
    await window.keyboard.press('Meta+Shift+P');
    await window.waitForTimeout(1000);

    await slowType(window, 'XML Tree Size: Analyze', 70);
    await window.waitForTimeout(1000);

    await window.keyboard.press('Enter');
    await window.waitForTimeout(3000);

    await waitForTreeSizePanel(window);
    await window.waitForTimeout(3000);
  } finally {
    await electronApp.close();
  }
});