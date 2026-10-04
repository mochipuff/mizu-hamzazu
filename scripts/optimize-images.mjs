import { readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const FOLDERS = { emotes: 384, hero: 460, membership: 256 };
const QUALITY = 82;

const convert = async (folder, maxSize, file) => {
  const source = join('public', folder, file);
  const target = join('public', folder, `${basename(file, extname(file))}.webp`);
  const { size } = await sharp(source)
    .resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY, alphaQuality: 90, effort: 6 })
    .toFile(target);
  console.log(`${target}  ${Math.round(size / 1024)} KB`);
};

for (const [folder, maxSize] of Object.entries(FOLDERS)) {
  const files = (await readdir(join('public', folder))).filter((file) => extname(file).toLowerCase() === '.png');
  await Promise.all(files.map((file) => convert(folder, maxSize, file)));
}
