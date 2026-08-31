/**
 * Genera los `placeholder.webp` de marca de MatrixLab Stickers / Wear / 3D.
 *
 * Usa `sharp`, que YA es dependencia del proyecto: no agrega ninguna
 * dependencia nueva. El placeholder sólo se muestra cuando todavía no existe
 * la foto real `public/images/<linea>/<codigo>.webp`.
 *
 * Correr con: node scripts/data/build-matrixlab-placeholders.mjs
 */
import sharp from "sharp";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SIZE = 900;

const LINES = [
  {
    dir: "matrixlab-stickers",
    title: "MatrixLab",
    subtitle: "Stickers",
    from: "#7C3AED",
    to: "#22D3EE",
  },
  {
    dir: "matrixlab-wear",
    title: "MatrixLab",
    subtitle: "Wear",
    from: "#7C3AED",
    to: "#F472B6",
  },
  {
    dir: "matrixlab-3d",
    title: "MatrixLab",
    subtitle: "3D",
    from: "#22D3EE",
    to: "#34D399",
  },
];

function svg({ title, subtitle, from, to }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${to}" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="#0B0B12"/>
  <rect x="40" y="40" width="${SIZE - 80}" height="${SIZE - 80}" rx="56" fill="url(#g)" opacity="0.18"/>
  <rect x="40.5" y="40.5" width="${SIZE - 81}" height="${SIZE - 81}" rx="56" fill="none" stroke="url(#g)" stroke-width="3" opacity="0.55"/>
  <text x="50%" y="45%" text-anchor="middle" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="#F8FAFC" opacity="0.92">${title}</text>
  <text x="50%" y="57%" text-anchor="middle" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="86" font-weight="800" fill="url(#g)">${subtitle}</text>
  <text x="50%" y="70%" text-anchor="middle" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="34" font-weight="500" fill="#F8FAFC" opacity="0.55">Foto en camino</text>
</svg>`;
}

for (const line of LINES) {
  const out = join(ROOT, "public", "images", line.dir, "placeholder.webp");
  await sharp(Buffer.from(svg(line)))
    .webp({ quality: 88 })
    .toFile(out);
  console.log("ok", out);
}
