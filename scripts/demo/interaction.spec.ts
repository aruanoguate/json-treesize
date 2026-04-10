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

    // Helper: click a visible tree row whose key text contains the given string.
    // This is more reliable than index-based clicking since expanding nodes
    // shifts indices. Returns true if a matching row was found and clicked.
    async function clickTreeNodeByKey(keyText: string): Promise<boolean> {
      return webviewFrame!.evaluate((text) => {
        const rows = document.querySelectorAll('.tree-row');
        for (const row of rows) {
          // Only consider visible rows (not inside a hidden .tree-children)
          const parent = row.closest('.tree-children');
          if (parent && parent.classList.contains('hidden')) continue;
          const keyEl = row.querySelector('.tree-key');
          if (keyEl && keyEl.textContent?.includes(text)) {
            (row as HTMLElement).click();
            return true;
          }
        }
        return false;
      }, keyText);
    }

    // Helper: click a bar row in the detail pane by index
    async function clickBarRow(index: number): Promise<boolean> {
      return webviewFrame!.evaluate((idx) => {
        const bars = document.querySelectorAll('.bar-row');
        if (idx < bars.length) { (bars[idx] as HTMLElement).click(); return true; }
        return false;
      }, index);
    }

    // Helper: click a button by selector
    async function clickButton(selector: string): Promise<boolean> {
      return webviewFrame!.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) { (el as HTMLElement).click(); return true; }
        return false;
      }, selector);
    }

    // Wait for the tree to fully render
    await webviewFrame.waitForSelector('.tree-row', { timeout: 10000 });
    await window.waitForTimeout(1000);

    // --- Step 1: Click "root" to show top-level breakdown in detail pane ---
    await clickTreeNodeByKey('root');
    await window.waitForTimeout(1500);

    // --- Step 2: Click "products" to expand it and show its breakdown ---
    // (products is the largest node — detail pane will show 3 product items)
    await clickTreeNodeByKey('products');
    await window.waitForTimeout(2000);

    // --- Step 3: Click the first product to drill deeper ---
    // After expanding "products", its children (array items) are visible
    await clickTreeNodeByKey('JADE-001');
    await window.waitForTimeout(2000);

    // --- Step 4: Click "reviews" inside the product to go one more level ---
    await clickTreeNodeByKey('reviews');
    await window.waitForTimeout(2000);

    // --- Step 5: Go back up — click "users" to show a different section ---
    await clickTreeNodeByKey('users');
    await window.waitForTimeout(2000);

    // --- Step 6: Use Expand all to reveal the full tree ---
    await clickButton('#expand-all-btn');
    await window.waitForTimeout(2500);

    // --- Step 7: Click a deeply nested node now visible ---
    await clickTreeNodeByKey('analytics');
    await window.waitForTimeout(1500);

    // --- Step 8: Collapse all, then expand again to show the toggle ---
    await clickButton('#collapse-all-btn');
    await window.waitForTimeout(1500);

    // --- Step 9: Detail pane interaction — click bars to show left↔right sync ---
    // First, click root to get bars for all top-level children
    await clickTreeNodeByKey('root');
    await window.waitForTimeout(1200);
    await clickBarRow(0); // largest child bar → highlights in tree
    await window.waitForTimeout(1200);
    await clickBarRow(1); // second child bar
    await window.waitForTimeout(1200);
    await clickBarRow(2); // third child bar
    await window.waitForTimeout(1200);

    // --- Step 10: Open in editor — jump to source ---
    await clickButton('.goto-btn');
    await window.waitForTimeout(2500);

    await window.waitForTimeout(2000);
  } finally {
    await electronApp.close();
  }
});
