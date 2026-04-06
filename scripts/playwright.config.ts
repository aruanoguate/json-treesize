import { defineConfig } from '@playwright/test';
import path from 'node:path';

/**
 * Playwright config for the JSON Tree Size demo recorder.
 *
 * Usage:
 *   npm run demo                        # Record all demos
 *   npm run demo -- --grep context      # Record only the context-menu demo
 *   npm run demo -- --grep palette      # Record only the command-palette demo
 *
 * After recording, videos are auto-converted to optimized GIFs in docs/.
 */
export default defineConfig({
  testDir: path.join(__dirname, 'demo'),
  outputDir: path.join(__dirname, 'demo-recordings'),
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'off',
  },
});
