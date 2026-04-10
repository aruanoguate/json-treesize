/**
 * Demo: Command Palette → JSON Tree Size: Analyze
 *
 * Shows how to launch the extension: open a JSON file, invoke
 * Cmd+Shift+P → "JSON Tree Size: Analyze", and see the panel appear.
 * Kept short (~10 s) so the GIF loads fast.
 */
import { test } from '@playwright/test';
import { launchVSCode, waitForTreeSizePanel, slowType } from './helpers';

test('command palette demo', async ({}, testInfo) => {
  const videoDir = testInfo.outputDir;
  const { electronApp, window } = await launchVSCode(videoDir);

  try {
    // demo.json is already open (passed as the target file)
    await window.waitForTimeout(2000);

    // Open Command Palette
    await window.keyboard.press('Meta+Shift+P');
    await window.waitForTimeout(1000);

    // Type the command slowly
    await slowType(window, 'JSON Tree Size: Analyze', 70);
    await window.waitForTimeout(1000);

    // Execute
    await window.keyboard.press('Enter');
    await window.waitForTimeout(3000);

    // Wait for the panel to appear, then hold for a moment
    await waitForTreeSizePanel(window);
    await window.waitForTimeout(3000);
  } finally {
    await electronApp.close();
  }
});
