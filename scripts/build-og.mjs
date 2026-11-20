/**
 * Builds the static Open Graph card used for the home page and share fallbacks.
 * Run with `node scripts/build-og.mjs` after changing the source illustration.
 */
import sharp from "sharp";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, "public/images/salcedo/guide-valley.webp");
const target = path.join(root, "public/og/salcedo-guide.jpg");

const base = await sharp(source)
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .modulate({ brightness: 0.92, saturation: 1.04 })
  .toBuffer();

const overlay = Buffer.from(`
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0f3028" stop-opacity="0.93"/>
      <stop offset="0.52" stop-color="#0f3028" stop-opacity="0.58"/>
      <stop offset="1" stop-color="#0f3028" stop-opacity="0.06"/>
    </linearGradient>
    <linearGradient id="foot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0f3028" stop-opacity="0"/>
      <stop offset="1" stop-color="#0f3028" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <rect y="470" width="1200" height="160" fill="url(#foot)"/>
  <g font-family="DejaVu Sans, Helvetica, Arial, sans-serif">
    <text x="76" y="132" fill="#e9d8a6" font-size="23" font-weight="700" letter-spacing="5">ILOCOS SUR · PHILIPPINES</text>
  </g>
  <g font-family="DejaVu Serif, Georgia, serif" fill="#ffffff">
    <text x="72" y="270" font-size="96" font-weight="700">Visit Salcedo</text>
    <text x="76" y="332" font-size="30" fill="#f2efe4">Waterfalls, spring resorts and local food</text>
    <text x="76" y="372" font-size="30" fill="#f2efe4">in the Buaya River valley.</text>
  </g>
  <g font-family="DejaVu Sans, Helvetica, Arial, sans-serif">
    <line x1="76" y1="474" x2="188" y2="474" stroke="#e9d8a6" stroke-width="3"/>
    <text x="76" y="524" fill="#ffffff" font-size="24" font-weight="700">Official visitor guide</text>
    <text x="76" y="558" fill="#d9e3d6" font-size="21">Municipality of Salcedo · 21 barangays</text>
  </g>
</svg>`);

await sharp(base)
  .composite([{ input: overlay, top: 0, left: 0 }])
  .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(target);

console.log(`Wrote ${path.relative(root, target)}`);
