import { test } from '@playwright/test';
import { launchVSCode, slowType, waitForTreeSizePanel } from './helpers';

test('interaction demo', async ({}, testInfo) => {
  const videoDir = testInfo.outputDir;
  const { electronApp, window } = await launchVSCode(videoDir);

  try {
    await window.waitForTimeout(1500);
    await window.keyboard.press('Meta+Shift+P');
    await window.waitForTimeout(800);
    await slowType(window, 'XML Tree Size: Analyze', 60);
    await window.waitForTimeout(800);
    await window.keyboard.press('Enter');
    await window.waitForTimeout(4000);

    const webviewFrame = await waitForTreeSizePanel(window, 20000);
    if (!webviewFrame) {
      throw new Error('Tree Size panel did not appear');
    }

    async function clickTreeNodeByKey(keyText: string, occurrence = 0): Promise<boolean> {
      return webviewFrame.evaluate(({ text, matchIndex }) => {
        const rows = document.querySelectorAll('.tree-row');
        let currentIndex = 0;
        for (const row of rows) {
          const parent = row.closest('.tree-children');
          if (parent && parent.classList.contains('hidden')) continue;
          const keyEl = row.querySelector('.tree-key');
          if (keyEl && keyEl.textContent?.includes(text)) {
            if (currentIndex !== matchIndex) {
              currentIndex += 1;
              continue;
            }
            (row as HTMLElement).click();
            return true;
          }
        }
        return false;
      }, { text: keyText, matchIndex: occurrence });
    }

    async function clickBarRow(index: number): Promise<boolean> {
      return webviewFrame.evaluate((idx) => {
        const bars = document.querySelectorAll('.bar-row');
        if (idx < bars.length) {
          (bars[idx] as HTMLElement).click();
          return true;
        }
        return false;
      }, index);
    }

    async function clickButton(selector: string): Promise<boolean> {
      return webviewFrame.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) {
          (el as HTMLElement).click();
          return true;
        }
        return false;
      }, selector);
    }

    await webviewFrame.waitForSelector('.tree-row', { timeout: 10000 });
    await window.waitForTimeout(1000);

    await clickTreeNodeByKey('root');
    await window.waitForTimeout(1500);

    await clickTreeNodeByKey('store');
    await window.waitForTimeout(1800);

    await clickTreeNodeByKey('products');
    await window.waitForTimeout(1800);

    await clickTreeNodeByKey('product');
    await window.waitForTimeout(1800);

    await clickTreeNodeByKey('@sku');
    await window.waitForTimeout(1400);

    await clickTreeNodeByKey('@category');
    await window.waitForTimeout(1400);

    await clickTreeNodeByKey('reviews');
    await window.waitForTimeout(1800);

    await clickTreeNodeByKey('product', 2);
    await window.waitForTimeout(1800);

    await clickTreeNodeByKey('notes');
    await window.waitForTimeout(1600);

    await clickTreeNodeByKey('#cdata');
    await window.waitForTimeout(1600);

    await clickTreeNodeByKey('customers');
    await window.waitForTimeout(1800);

    await clickButton('#expand-all-btn');
    await window.waitForTimeout(2500);

    await clickTreeNodeByKey('analytics');
    await window.waitForTimeout(1500);

    await clickButton('#collapse-all-btn');
    await window.waitForTimeout(1500);

    await clickTreeNodeByKey('root');
    await window.waitForTimeout(1200);
    await clickBarRow(0);
    await window.waitForTimeout(1200);
    await clickBarRow(1);
    await window.waitForTimeout(1200);
    await clickBarRow(2);
    await window.waitForTimeout(1200);

    await clickButton('.goto-btn');
    await window.waitForTimeout(2500);
    await window.waitForTimeout(2000);
  } finally {
    await electronApp.close();
  }
});