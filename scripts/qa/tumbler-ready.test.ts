import assert from "node:assert/strict";
import { READY_TUMBLERS, readyTumblerHandle, readyTumblerSku, visibleReadyTumblers, type ReadyTumblerItem } from "../../src/lib/store/tumbler-ready";
import { tumblerSections } from "../../src/lib/store/tumbler-sections";

assert.deepEqual(READY_TUMBLERS.map((item) => item.code), ["VL001", "VL002", "VL003"]);
assert.equal(READY_TUMBLERS.every((item) => item.status === "Activo"), true);
assert.equal(READY_TUMBLERS.every((item) => item.imagePaths.length === 3), true);
assert.equal(READY_TUMBLERS.some((item) => item.name === "Prueba"), false, "No publicar artículos de ejemplo");
assert.deepEqual(READY_TUMBLERS.map((item) => readyTumblerHandle(item.code)), ["vaso-listo-vl001", "vaso-listo-vl002", "vaso-listo-vl003"]);
assert.deepEqual(READY_TUMBLERS.map((item) => readyTumblerSku(item.code)), ["TML-VL001", "TML-VL002", "TML-VL003"]);
const example: ReadyTumblerItem = { code: "VL001", name: "Prueba", collection: "Temáticos", status: "Borrador", description: "Prueba", capacity: "", finish: "", inventory: null, price: null, customizable: null, imagePaths: [] };
assert.equal(visibleReadyTumblers([example, {...example,code:"VL002",status:"Pausado"}]).length,0);
assert.equal(visibleReadyTumblers([{...example,status:"Activo"},{...example,code:"VL002",status:"Agotado"}]).length,2);
const sections=tumblerSections(["snowglobe","llaveros","tags-acrilico","acrilicos","accesorios-personalizacion","repuestos-consumibles","magic-flow","wraps-glow-finish"]);
assert.deepEqual(sections.map(s=>s.handle),["vasos-listos","repuestos-consumibles","snowglobe","llaveros","tags-acrilico","wraps-glow-finish","magic-flow","acrilicos","accesorios-personalizacion"]);
assert.deepEqual(tumblerSections([]).map(s=>s.handle),["vasos-listos"]);
console.log("Vasos listos: navegación común y visibilidad por estado verificadas.");
