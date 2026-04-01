const esbuild = require('esbuild');
const watch = process.argv.includes('--watch');

const shared = {
  bundle: true,
  minify: false,
  sourcemap: true,
  watch: watch ? { onRebuild(err) { console.log(err ? 'watch error' : 'rebuilt') } } : false,
};

// Extension host bundle (CJS, Node target, vscode externalized)
esbuild.build({
  ...shared,
  entryPoints: ['src/extension.ts'],
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/extension.js',
  external: ['vscode'],
}).catch(() => process.exit(1));

// Worker thread bundle (CJS, Node target)
esbuild.build({
  ...shared,
  entryPoints: ['src/worker/parser.ts'],
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/worker/parser.js',
  external: ['vscode'],
}).catch(() => process.exit(1));

// Webview bundle (ESM, browser target)
esbuild.build({
  ...shared,
  entryPoints: ['src/webview/main.ts'],
  platform: 'browser',
  format: 'iife',
  outfile: 'dist/webview/main.js',
}).catch(() => process.exit(1));
