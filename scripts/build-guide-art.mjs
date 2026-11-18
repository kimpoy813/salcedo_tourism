// Resize the existing guide illustrations. No network or image generation involved.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const output = new URL('../public/app/art/', import.meta.url);
const sources = JSON.parse(await readFile(new URL('sources.json', output), 'utf8'));
for (const file of sources) {
  for (const [suffix, width] of [['thumb', 240], ['cover', 1024]]) {
    const input = fileURLToPath(new URL(`../public/images/salcedo/${file}`, import.meta.url));
    const out = file.replace(/\.[^.]+$/, `-${suffix}.webp`);
    await sharp(input).resize({width, withoutEnlargement:true}).webp({quality:80, effort:6}).toFile(fileURLToPath(new URL(out,output)));
  }
}
