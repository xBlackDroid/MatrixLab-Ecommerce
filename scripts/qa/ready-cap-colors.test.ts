import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  getReadyWearColors, isReadyWearCapHandle, isReadyWearShirtHandle,
  isReadyWearHoodieHandle, readyWearColorImages, readyWearVariantImage,
  readyWearVariantColor, readyWearProductHref, resolveReadyWearColor,
} from "../../src/lib/store/ready-wear-colors";
import { readyWearTypeOf } from "../../src/lib/store/ready-wear";

const colors = [["Rosa", "rosa"], ["Negro", "negro"], ["Blanco", "blanco"], ["Rosa pastel", "rosa-pastel"]] as const;
for (let number = 1; number <= 6; number++) {
  const code = `go00${number}`, handle = `wear-gorra-${code}`;
  assert.ok(isReadyWearCapHandle(handle));
  assert.equal(isReadyWearShirtHandle(handle), false);
  assert.equal(isReadyWearHoodieHandle(handle), false);
  assert.equal(readyWearTypeOf({ handle }), "gorras");
  assert.equal(resolveReadyWearColor(handle, "lila"), "Rosa");
  assert.deepEqual(getReadyWearColors(handle).map(c => c.label), colors.map(c => c[0]));
  for (const [label, slug] of colors) {
    const image = `/images/matrixlab-wear/gorras/colors/${code}-${slug}.webp`;
    assert.deepEqual(readyWearColorImages(handle, label), [image]);
    assert.equal(readyWearVariantImage(handle, label), image);
    assert.ok(existsSync(join(__dirname, "../../public", image)));
    const color = readyWearVariantColor(handle, { title: label });
    assert.equal(readyWearProductHref(handle, color), `/tienda/producto/${handle}?color=${slug}`);
  }
}
for (const invalid of ["wear-gorra-go000", "wear-gorra-go007", "wear-gorra-go01", "gorra-personalizada"]) {
  assert.equal(isReadyWearCapHandle(invalid), false);
  assert.equal(readyWearVariantImage(invalid, "Rosa"), null);
}
assert.equal(resolveReadyWearColor("wear-lista-wr001", "rosa"), "Negra");
assert.equal(resolveReadyWearColor("wear-sudadera-su001", "rosa"), "Lila");
assert.equal(resolveReadyWearColor("wear-sudadera-su001", "rosa-pastel"), "Rosa pastel");
console.log("PASS: six caps, four photographed colors, independent garment allowlists, inventory/cart image and return-link contracts.");
