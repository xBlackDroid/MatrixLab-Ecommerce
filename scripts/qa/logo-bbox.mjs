#!/usr/bin/env node
/**
 * Mide cuánto del lienzo ocupa REALMENTE cada logo de categoría.
 *
 * Los PNG de las familias vienen con márgenes transparentes distintos: el de
 * MatrixLab 3D deja un 15% de aire alrededor y el escolar no deja ninguno. Si
 * se pintan todos en una caja del mismo tamaño, el de 3D se ve notablemente
 * más pequeño aunque el `width`/`height` sea idéntico.
 *
 * Este script recorre el canal alfa, calcula la caja del contenido opaco y
 * devuelve la fracción ocupada. El inverso de esa fracción es el factor de
 * escala que iguala el tamaño visual, y es lo que vive en
 * `src/lib/store/category-logos.ts`. Vuelve a correrlo si se reemplaza algún
 * logo:
 *
 *   node scripts/qa/logo-bbox.mjs
 */
import sharp from "sharp";

const FILES = [
  "matrixlab-stickers.png",
  "matrixlab-wear.png",
  "matrixlab-tumbler.png",
  "impresion-3d.png",
  "matrixlab-laser.png",
  "etiquetas-escolares.png",
];

/** Alfa por debajo de esto cuenta como transparente (los bordes suelen traer halo). */
const ALPHA_MIN = 12;

for (const file of FILES) {
  const path = "public/images/categories/" + file;
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] > ALPHA_MIN) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const frac = Math.max(bw, bh) / Math.max(W, H);
  const cx = ((minX + maxX + 1) / 2 / W) * 100;
  const cy = ((minY + maxY + 1) / 2 / H) * 100;

  console.log(
    `${file.padEnd(26)} lienzo ${W}x${H}  contenido ${bw}x${bh}  ` +
      `ocupa ${(frac * 100).toFixed(1)}%  escala ${(1 / frac).toFixed(3)}  ` +
      `centro ${cx.toFixed(1)}%,${cy.toFixed(1)}%`,
  );
}
