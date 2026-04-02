/**
 * Record demo GIFs using Playwright, then convert to optimized GIFs.
 *
 * Usage:
 *   npx tsx scripts/record-demos.ts              # Record all + convert
 *   npx tsx scripts/record-demos.ts palette       # Only command-palette demo
 *   npx tsx scripts/record-demos.ts interaction   # Only interaction demo
 *   npx tsx scripts/record-demos.ts screenshot    # Only screenshot capture
 *   npx tsx scripts/record-demos.ts --no-gif      # Record video only
 *
 * Prerequisites:
 *   npm run compile                     # Extension must be built
 *   brew install ffmpeg gifsicle        # For GIF conversion
 */
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS_DIR = __dirname;
const RECORDINGS_DIR = path.join(SCRIPTS_DIR, 'demo-recordings');

let grepFilter = '';
let skipGif = false;

for (const arg of process.argv.slice(2)) {
  switch (arg) {
    case 'palette':     grepFilter = '--grep palette'; break;
    case 'interaction': grepFilter = '--grep interaction'; break;
    case 'screenshot':  grepFilter = '--grep screenshot'; break;
    case '--no-gif':    skipGif = true; break;
    default:
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
  }
}

// Ensure compiled
if (!fs.existsSync(path.join(ROOT, 'dist', 'extension.js'))) {
  console.log('→ Extension not compiled, running compile...');
  execSync('npm run compile', { cwd: ROOT, stdio: 'inherit' });
}

// Clean previous recordings
fs.rmSync(RECORDINGS_DIR, { recursive: true, force: true });

// Run Playwright tests
console.log('→ Recording demos with Playwright...');
const playwrightCmd = [
  'npx', 'playwright', 'test',
  '--config', path.join(SCRIPTS_DIR, 'playwright.config.ts'),
  ...(grepFilter ? grepFilter.split(' ') : []),
].join(' ');
execSync(playwrightCmd, { cwd: ROOT, stdio: 'inherit' });

console.log(`\n→ Recordings saved to: ${RECORDINGS_DIR}/`);

if (skipGif) {
  console.log('→ Skipping GIF conversion (--no-gif)');
  process.exit(0);
}

// Check dependencies
for (const cmd of ['ffmpeg', 'gifsicle']) {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' });
  } catch {
    console.error(`⚠ ${cmd} not found. Install with: brew install ${cmd}`);
    console.error('  Run with --no-gif to skip conversion, or install and re-run.');
    process.exit(1);
  }
}

// Convert recordings to GIFs
console.log('\n→ Converting recordings to optimized GIFs...');

const dirs = fs.readdirSync(RECORDINGS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory());

for (const dir of dirs) {
  const testName = dir.name;
  const dirPath = path.join(RECORDINGS_DIR, testName);
  const files = fs.readdirSync(dirPath);
  const video = files.find(f => f.endsWith('.webm') || f.endsWith('.mp4'));

  if (!video) {
    console.log(`  ⚠ No video found in ${testName}/`);
    continue;
  }

  let output: string;
  if (testName.includes('palette')) output = 'docs/demo-command-palette.gif';
  else if (testName.includes('interaction')) output = 'docs/demo-interaction.gif';
  else output = `docs/demo-${testName}.gif`;

  console.log(`  Converting: ${testName} → ${output}`);
  execSync(
    `npx tsx scripts/optimize-gif.ts "${path.join(dirPath, video)}" "${path.join(ROOT, output)}" --width 960 --fps 12`,
    { cwd: ROOT, stdio: 'inherit' },
  );
}

console.log('\n✓ All done! Check the docs/ folder for the GIF files.');
