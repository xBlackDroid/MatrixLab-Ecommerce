import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { NextRequest } from "next/server";
import { middleware } from "../../src/middleware";
import { IMAGE_WATERMARK_BRANDS, imageWatermarkBrand } from "../../src/lib/store/image-watermark";

const origin = "https://www.matrixlabintelligence.com";
const photo = "/images/matrixlab-wear/wr001.webp";
const optimized = `/_next/image?url=${encodeURIComponent(photo)}&w=640&q=75`;
let checks = 0;
for (const path of [photo, optimized, "/images/matrixlab-3d/3d001.webp", "/images/tumbler/listos/Book%20Addict.png"]) {
  const navigation = middleware(new NextRequest(origin + path, {
    headers: { "Sec-Fetch-Dest": "document", "Sec-Fetch-Mode": "navigate" },
  }));
  assert.equal(navigation.status, 403, `Direct navigation ${path}`);
  assert.match(navigation.headers.get("cache-control") ?? "", /no-store/);
  const embedded = middleware(new NextRequest(origin + path, {
    headers: { "Sec-Fetch-Dest": "image", "Sec-Fetch-Mode": "no-cors" },
  }));
  assert.equal(embedded.status, 200, `Embedded image ${path}`);
  checks += 3;
}

// Fetch Metadata is a browser deterrent, never an authentication boundary.
assert.equal(middleware(new NextRequest(origin + photo)).status, 200);
assert.equal(middleware(new NextRequest(origin + "/images/categories/matrixlab-wear.png", {
  headers: { "Sec-Fetch-Dest": "document" },
})).status, 200);
assert.ok(middleware(new NextRequest(origin + "/tienda")).headers.has("content-security-policy"));
checks += 3;

const cases = [
  ["playeras-prendas", "wear"], ["wear-lista-wr001", "wear"],
  ["/images/matrixlab-3d/3d001.webp", "3d"], ["impresión-3d", "3d"],
  ["wraps-glow-finish", "tumbler"], ["repuestos-consumibles", "tumbler"],
  ["snowglobe", "tumbler"], ["grabado-láser", "laser"],
  ["etiquetas-escolares", "escolar"], ["/images/matrixlab-stickers/a001.webp", "stickers"],
  ["imanes", "stickers"], ["unknown.jpg", undefined],
] as const;
for (const [context, family] of cases) {
  assert.equal(imageWatermarkBrand(context), family, context);
  checks++;
}
for (const brand of Object.values(IMAGE_WATERMARK_BRANDS)) {
  assert.ok(existsSync(`public${brand.logo}`), brand.logo);
  checks++;
}
console.log(`${checks} catalog media checks passed.`);
