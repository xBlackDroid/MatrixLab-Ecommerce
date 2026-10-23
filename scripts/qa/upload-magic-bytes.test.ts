/**
 * QA del filtro de firmas previo a sharp.
 *
 *   A. detectRasterFormat acepta PNG/JPEG/WEBP reales y rechaza SVG, HEIF,
 *      TIFF, GIF y basura, sin decodificar nada.
 *   B. Toda ruta que entrega bytes del cliente a sharp llama antes al filtro.
 *
 * Correr con: npx tsx scripts/qa/upload-magic-bytes.test.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { detectRasterFormat } from "../../src/lib/uploads/magic-bytes";

const ROOT = join(__dirname, "..", "..");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

async function main() {
  console.log("\nA. Firmas");
  const base = sharp({
    create: { width: 8, height: 8, channels: 3, background: "#B197FC" },
  });
  check("PNG real", detectRasterFormat(await base.clone().png().toBuffer()) === "png");
  check("JPEG real", detectRasterFormat(await base.clone().jpeg().toBuffer()) === "jpeg");
  check("WEBP real", detectRasterFormat(await base.clone().webp().toBuffer()) === "webp");

  const rejected: Record<string, Buffer> = {
    svg: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    "svg con BOM": Buffer.from('﻿<?xml version="1.0"?><svg/>'),
    gif: Buffer.from("GIF89a\x01\x00\x01\x00", "latin1"),
    tiff: Buffer.from([0x49, 0x49, 0x2a, 0x00, 0, 0, 0, 0]),
    heif: Buffer.from("\x00\x00\x00\x18ftypheic\x00\x00\x00\x00", "latin1"),
    "RIFF no-webp": Buffer.from("RIFF\x00\x00\x00\x00WAVE", "latin1"),
    vacío: Buffer.alloc(0),
    "PNG truncado": Buffer.from([0x89, 0x50, 0x4e]),
  };
  for (const [name, bytes] of Object.entries(rejected)) {
    check(`rechaza ${name}`, detectRasterFormat(bytes) === null);
  }

  console.log("\nB. Rutas que usan sharp con bytes del cliente");
  const routes = [
    "src/app/api/uploads/design-assets/route.ts",
    "src/app/api/admin/uploads/route.ts",
    "src/app/api/designs/[id]/route.ts",
  ];
  for (const route of routes) {
    const src = readFileSync(join(ROOT, route), "utf8");
    const guard = src.indexOf("detectRasterFormat(");
    const firstSharp = src.search(/\bsharp\((buffer|inputBuffer)/);
    check(
      `${route} filtra antes de sharp`,
      guard !== -1 && firstSharp !== -1 && guard < firstSharp,
    );
  }

  console.log(failures ? `\n${failures} fallo(s)` : "\nTodo OK");
  process.exit(failures ? 1 : 0);
}

void main();
