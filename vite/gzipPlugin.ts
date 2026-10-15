import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { constants, gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

// Text formats only. Fonts, WebP and PNG are already compressed, so gzip would just cost CPU.
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt', '.xml']);
// Below this size the gzip header costs about as much as it saves.
const MIN_BYTES = 1024;

/**
 * Writes `<file>.gz` next to every text file in the build output, for hosts that serve static files themselves (server/app.py).
 * Vercel compresses at its edge already, so it is skipped there.
 */
export function gzipPlugin(): Plugin {
  let outDir = '';

  return {
    name: 'mizu:gzip',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    // After mizu:seo has written the per-language pages, so those get compressed too.
    closeBundle: {
      order: 'post',
      sequential: true,
      handler() {
        if (process.env.VERCEL) return;

        const files = (readdirSync(outDir, { recursive: true, encoding: 'utf8' })).filter((file) => COMPRESSIBLE.has(extname(file)));
        for (const file of files) {
          const path = join(outDir, file);
          if (statSync(path).size < MIN_BYTES) continue;
          const source = readFileSync(path);
          const compressed = gzipSync(source, { level: constants.Z_BEST_COMPRESSION });
          if (compressed.length < source.length) writeFileSync(`${path}.gz`, compressed);
        }
      },
    },
  };
}
