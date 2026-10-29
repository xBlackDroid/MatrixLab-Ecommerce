import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getReadyWearColors, isReadyWearHoodieHandle, isReadyWearCapHandle, readyWearVariantImage, readyWearVariantColor, readyWearProductHref, resolveReadyWearColor } from "../../src/lib/store/ready-wear-colors";
import { readyWearTypeOf, parseReadyWearCollection } from "../../src/lib/store/ready-wear";

assert.equal(parseReadyWearCollection("ice-skating"), "ice-skating");
for (const code of ["su006", "su007", "su008", "su009"]) {
  const handle = `wear-sudadera-${code}`;
  assert.equal(isReadyWearHoodieHandle(handle), true);
  assert.equal(isReadyWearCapHandle(handle), false);
  assert.equal(readyWearTypeOf({ handle }), "sudaderas");
  const colors = getReadyWearColors(handle);
  assert.equal(colors.length, 9);
  assert.equal(resolveReadyWearColor(handle, "rosa"), "Lila");
  for (const { label, slug } of colors) {
    const image = `/images/matrixlab-wear/hoodies/${code}-${slug}.webp`;
    assert.ok(existsSync(join(__dirname, "../../public", image)), image);
    assert.equal(readyWearVariantImage(handle, label), image);
    const color = readyWearVariantColor(handle, { title: `Mujer / Grande / ${label}` });
    assert.equal(readyWearProductHref(handle, color), `/tienda/producto/${handle}?color=${slug}`);
  }
}
assert.equal(isReadyWearHoodieHandle("wear-sudadera-su010"), false);
assert.equal(readyWearVariantImage("wear-sudadera-su010", "Lila"), null);
assert.equal(getReadyWearColors("wear-lista-wr001").length, 3);
assert.equal(getReadyWearColors("wear-gorra-go006").length, 4);
assert.equal(getReadyWearColors("wear-sudadera-su001").length, 9);
console.log("PASS: four IceSkating hoodies with 36 color photos, cart/return links, closed ranges and existing garments preserved.");
