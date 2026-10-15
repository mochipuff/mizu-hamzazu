import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { constants, gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt', '.xml']);
const MIN_BYTES = 1024;

export function gzipPlugin(): Plugin {
  let outDir = '';

  return {
    name: 'mizu:gzip',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
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
