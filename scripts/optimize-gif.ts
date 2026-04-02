/**
 * Convert a screen recording (.mov, .mp4, .webm, .gif) to an optimized GIF.
 *
 * Usage:
 *   npx tsx scripts/optimize-gif.ts <input> [output] [--width 800] [--fps 12]
 *
 * Requires: ffmpeg, gifsicle (brew install ffmpeg gifsicle)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

interface Options {
  input: string;
  output: string;
  width: number;
  fps: number;
}

function usage(): never {
  console.log('Usage: npx tsx scripts/optimize-gif.ts <input> [output] [--width N] [--fps N]');
  console.log('');
  console.log('  input   Screen recording (.mov, .mp4, .webm, .gif)');
  console.log('  output  Output path (default: docs/<input-basename>.gif)');
  console.log('  --width Scale to this width in pixels (default: 800)');
  console.log('  --fps   Frame rate (default: 12)');
  process.exit(1);
}

function parseArgs(argv: string[]): Options {
  let input = '';
  let output = '';
  let width = 800;
  let fps = 12;

  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--width': width = Number(args[++i]); break;
      case '--fps':   fps = Number(args[++i]); break;
      case '--help':  usage();
      default:
        if (!input) input = args[i];
        else if (!output) output = args[i];
        else { console.error(`Error: unexpected argument '${args[i]}'`); usage(); }
    }
  }

  if (!input) usage();
  if (!fs.existsSync(input)) { console.error(`Error: file not found: ${input}`); process.exit(1); }
  if (!output) {
    const basename = path.basename(input, path.extname(input));
    output = path.join('docs', `${basename}.gif`);
  }

  return { input, output, width, fps };
}

function requireCmd(cmd: string): void {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' });
  } catch {
    console.error(`Error: ${cmd} is required. Install with: brew install ${cmd}`);
    process.exit(1);
  }
}

function optimizeGif({ input, output, width, fps }: Options): void {
  requireCmd('ffmpeg');
  requireCmd('gifsicle');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gif-opt-'));
  const palettePath = path.join(tmpDir, 'palette.png');
  const rawGifPath = path.join(tmpDir, 'raw.gif');

  try {
    console.log(`→ Converting to GIF (${width}px wide, ${fps} fps)...`);

    // Generate palette for better color quality
    execFileSync('ffmpeg', [
      '-y', '-i', input,
      '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`,
      '-loglevel', 'error',
      palettePath,
    ], { stdio: 'inherit' });

    // Render GIF using the palette
    execFileSync('ffmpeg', [
      '-y', '-i', input, '-i', palettePath,
      '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[v];[v][1:v]paletteuse=dither=sierra2_4a`,
      '-loglevel', 'error',
      rawGifPath,
    ], { stdio: 'inherit' });

    const rawSize = fs.statSync(rawGifPath).size;

    console.log('→ Optimizing with gifsicle...');
    execFileSync('gifsicle', ['-O3', '--lossy=80', rawGifPath, '-o', output], { stdio: 'inherit' });

    const finalSize = fs.statSync(output).size;
    const saved = Math.round(((rawSize - finalSize) / rawSize) * 100);

    console.log(`✓ Saved to ${output}`);
    console.log(`  Raw: ${Math.round(rawSize / 1024)} KB → Optimized: ${Math.round(finalSize / 1024)} KB (${saved}% smaller)`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

optimizeGif(parseArgs(process.argv));
