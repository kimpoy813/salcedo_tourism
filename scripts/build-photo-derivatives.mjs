/**
 * Creates compact WebP derivatives for the original photo masters. Requests for
 * the original .png/.jpg paths are redirected in next.config.ts, so existing
 * database rows and imports keep working without shipping multi-megabyte files.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dir = path.join(process.cwd(), "assets/photo-masters");
const output = path.join(process.cwd(), "public/images/salcedo");
for (const file of await readdir(dir)) {
  if (!/\.(png|jpe?g)$/i.test(file)) continue;
  const target = file.replace(/\.(png|jpe?g)$/i, ".webp");
  await sharp(path.join(dir, file))
    .rotate()
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toFile(path.join(output, target));
  console.log(`${file} -> ${target}`);
}
