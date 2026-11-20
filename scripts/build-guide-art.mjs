// Resize the existing guide illustrations. No network or image generation involved.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const output = new URL('../public/app/art/', import.meta.url);
const sources = JSON.parse(await readFile(new URL('sources.json', output), 'utf8'));
for (const file of sources) {
  for (const [suffix, width] of [['thumb', 240], ['cover', 1024]]) {
    const input = fileURLToPath(new URL(`../assets/photo-masters/${file}`, import.meta.url));
    const stem = file.replace(/\.[^.]+$/, '');
    const image = sharp(input).resize({width, withoutEnlargement:true});
    await image.clone().webp({quality:80, effort:6}).toFile(fileURLToPath(new URL(`${stem}-${suffix}.webp`,output)));
    // AVIF is the first source in GuideImage; WebP remains the fallback.
    await image.clone().avif({quality:55, effort:6}).toFile(fileURLToPath(new URL(`${stem}-${suffix}.avif`,output)));
  }
}
