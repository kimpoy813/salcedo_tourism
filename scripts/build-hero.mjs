/**
 * Pre-generates responsive hero images. The illustration is bundled and served
 * unoptimized, so the widths are explicit rather than produced by the Next image
 * optimizer at request time.
 */
import sharp from "sharp";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "public/images/salcedo/guide-valley.webp");

for (const width of [640, 960, 1408]) {
  const base = sharp(source).resize({ width, withoutEnlargement: true });
  await base.clone().webp({ quality: 76, effort: 6 }).toFile(
    path.join(root, `public/images/salcedo/guide-valley-${width}.webp`)
  );
  await base.clone().avif({ quality: 52, effort: 6 }).toFile(
    path.join(root, `public/images/salcedo/guide-valley-${width}.avif`)
  );
}

console.log("Wrote responsive guide-valley images");
