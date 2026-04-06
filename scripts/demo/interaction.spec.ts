/**
 * Demo: Exploring the JSON Tree Size panel
 *
 * Assumes the extension is already open. Shows the user clicking
 * tree nodes, seeing the detail pane sync, using expand/collapse,
 * clicking bars in the detail chart, and jumping to the source file.
 */
import { test } from '@playwright/test';
import { launchVSCode, waitForTreeSizePanel, slowType } from './helpers';

test('interaction demo', async ({}, testInfo) => {
  const videoDir = testInfo.outputDir;
  const { electronApp, window } = await launchVSCode(videoDir);

  try {
    // Open the extension via Command Palette (quick, not the focus of this demo)
    await window.waitForTimeout(1500);
    await window.keyboard.press('Meta+Shift+P');
    await window.waitForTimeout(800);
    await slowType(window, 'JSON Tree Size: Analyze', 60);
    await window.waitForTimeout(800);
    await window.keyboard.press('Enter');
    await window.waitForTimeout(4000);

    const webviewFrame = await waitForTreeSizePanel(window, 20000);
    if (!webviewFrame) {
      throw new Error('Tree Size panel did not appear');
    }

    // Use evaluate() to interact with webview elements directly —
    // VS Code nests webviews in multiple iframes, making Playwright's
    // visibility-based clicks unreliable.
    async function clickInFrame(selector: string, index = 0): Promise<boolean> {
      return webviewFrame!.evaluate(({ sel, idx }) => {
        const els = document.querySelectorAll(sel);
        if (idx < els.length) {
          (els[idx] as HTMLElement).click();
          return true;
        }
        return false;
      }, { sel: selector, idx: index });
    }

    // --- Tree exploration: click several nodes to show detail sync ---
    await webviewFrame.waitForSelector('.tree-row', { timeout: 10000 });
    await clickInFrame('.tree-row', 0);
    await window.waitForTimeout(1500);
    await clickInFrame('.tree-row', 1);
    await window.waitForTimeout(1500);
    await clickInFrame('.tree-row', 2);
    await window.waitForTimeout(1500);

    // --- Expand all to reveal the full tree ---
    await clickInFrame('#expand-all-btn');
    await window.waitForTimeout(2000);

    // Click deeper nodes after expanding
    await clickInFrame('.tree-row', 5);
    await window.waitForTimeout(1500);
    await clickInFrame('.tree-row', 7);
    await window.waitForTimeout(1500);

    // --- Collapse all, then expand again to show the toggle ---
    await clickInFrame('#collapse-all-btn');
    await window.waitForTimeout(1500);
    await clickInFrame('#expand-all-btn');
    await window.waitForTimeout(1500);

    // --- Detail pane: click bars to show left↔right sync ---
    await clickInFrame('.bar-row', 0);
    await window.waitForTimeout(1200);
    await clickInFrame('.bar-row', 1);
    await window.waitForTimeout(1200);
    await clickInFrame('.bar-row', 2);
    await window.waitForTimeout(1200);

    // --- Open in editor: jump to source ---
    await clickInFrame('.goto-btn');
    await window.waitForTimeout(2500);

    await window.waitForTimeout(2000);
  } finally {
    await electronApp.close();
  }
});
