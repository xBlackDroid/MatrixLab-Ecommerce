import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  getReadyWearColors, getDefaultReadyWearColor, parseReadyWearColorFor,
  readyWearColorImages, readyWearPhotoDescription, isReadyWearGarmentHandle,
} from "../../src/lib/store/ready-wear-colors";
import { cupCatalogKind, TUMBLER_CUPS } from "../../src/lib/store/tumbler-cups";
import { readyTumblerByHandle } from "../../src/lib/store/tumbler-ready";
import { filterReadyWearListings, readyWearTypeOf, type ReadyWearListing } from "../../src/lib/store/ready-wear";

const root = join(__dirname, "../..");
const hoodies = ["su010", "su011", "su012", "su013"];
const caps = ["go007", "go008", "go009", "go010"];
let photos = 0;
for (const [type, codes] of [["sudadera", hoodies], ["gorra", caps]] as const) {
  for (const code of codes) {
    const handle = `wear-${type}-${code}`;
    assert.equal(isReadyWearGarmentHandle(handle), true);
    const colors = getReadyWearColors(handle);
    assert.equal(colors.length, type === "sudadera" ? 9 : 5);
    assert.deepEqual(colors.slice(0, 2).map(c => c.label), ["Rosa pastel", "Azul royal"]);
    assert.equal(getDefaultReadyWearColor(handle), "Rosa pastel");
    assert.equal(parseReadyWearColorFor(handle, "AZUL ROYAL"), "Azul royal");
    assert.equal(parseReadyWearColorFor(handle, "../outside"), null);
    for (const color of colors) {
      const images = readyWearColorImages(handle, color.label);
      assert.equal(images.length, 1);
      assert.equal(existsSync(join(root, "public", images[0])), true, images[0]);
      photos += images.length;
    }
  }
}
assert.equal(photos, 56);
assert.equal(getDefaultReadyWearColor("wear-sudadera-su001"), "Lila");
assert.equal(getReadyWearColors("wear-gorra-go001").length, 4);
assert.equal(parseReadyWearColorFor("wear-gorra-go001", "azul-royal"), null);
assert.equal(isReadyWearGarmentHandle("wear-sudadera-su014"), false);
assert.equal(isReadyWearGarmentHandle("wear-gorra-go011"), false);
assert.match(readyWearPhotoDescription("wear-sudadera-su011", "Rosa pastel"), /frontal/);
assert.match(readyWearPhotoDescription("wear-sudadera-su013", "Azul royal"), /frontal/);
assert.match(readyWearPhotoDescription("wear-sudadera-su010", "Rosa pastel"), /espalda/);

const gta = [...hoodies.map(c => `wear-sudadera-${c}`), ...caps.map(c => `wear-gorra-${c}`)].map(handle => ({
  id: handle, handle, title: handle, tags: ["matrixlab-wear", "coleccion:gta"],
  readyWearType: readyWearTypeOf({ handle }),
})) as ReadyWearListing[];
assert.equal(filterReadyWearListings(gta, { type: null, collection: "gta", query: "" }).length, 8);
assert.equal(filterReadyWearListings(gta, { type: "sudaderas", collection: "gta", query: "" }).length, 4);
assert.equal(filterReadyWearListings(gta, { type: "gorras", collection: "gta", query: "" }).length, 4);

assert.equal(TUMBLER_CUPS.filter(c => cupCatalogKind(c) === "vasos").length, 5);
assert.equal(TUMBLER_CUPS.filter(c => cupCatalogKind(c) === "termos").length, 5);
assert.equal(TUMBLER_CUPS.find(c => c.code === "V010")?.colors?.[0], "Rosa");
assert.equal(new Set(TUMBLER_CUPS.map(c => c.code)).size, TUMBLER_CUPS.length);
for (const item of TUMBLER_CUPS) {
  assert.ok(item.imagePaths?.length);
  for (const image of item.imagePaths ?? []) {
    assert.match(image, /aprobadas-20261105/);
    assert.ok(existsSync(join(root, "public", image)), image);
  }
}
const alien = readyTumblerByHandle("vaso-listo-vl001");
assert.deepEqual(alien?.imagePaths.slice(0, 2), [
  "/images/tumbler/listos/vl001-2.webp", "/images/tumbler/listos/vl001.webp",
]);
console.log("PASS: GTA colors/assets/filtering, unchanged legacy color options, cups/thermos classification and alien gallery order.");
