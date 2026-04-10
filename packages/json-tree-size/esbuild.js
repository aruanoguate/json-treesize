const esbuild = require('esbuild');
const watch = process.argv.includes('--watch');

const extensionOpts = {
  bundle: true,
  minify: false,
  sourcemap: true,
  entryPoints: ['src/extension.ts'],
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/extension.js',
  external: ['vscode'],
};

const workerOpts = {
  bundle: true,
  minify: false,
  sourcemap: true,
  entryPoints: ['src/worker/parser.ts'],
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/worker/parser.js',
  external: ['vscode'],
};

const webviewOpts = {
  bundle: true,
  minify: false,
  sourcemap: true,
  entryPoints: ['src/webview/main.ts'],
  platform: 'browser',
  format: 'iife',
  outfile: 'dist/webview/main.js',
};

async function run() {
  if (watch) {
    const [extCtx, workerCtx, webviewCtx] = await Promise.all([
      esbuild.context(extensionOpts),
      esbuild.context(workerOpts),
      esbuild.context(webviewOpts),
    ]);
    await Promise.all([extCtx.watch(), workerCtx.watch(), webviewCtx.watch()]);
    console.log('watching...');
  } else {
    await Promise.all([
      esbuild.build(extensionOpts),
      esbuild.build(workerOpts),
      esbuild.build(webviewOpts),
    ]);
  }
}

run().catch(() => process.exit(1));
