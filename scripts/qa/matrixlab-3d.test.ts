/** QA del inventario confirmado. */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  MATRIXLAB_3D, MATRIXLAB_3D_PRICE_PENDING, MATRIXLAB_3D_PLACEHOLDER_IMAGE,
  matrixLab3dByCode, matrixLab3dCategoryCounts, matrixLab3dCustomizable,
  matrixLab3dHandle, matrixLab3dSku, matrixLab3dImagePaths, selectMatrixLab3dImages,
} from "../../src/lib/store/matrixlab-3d";
const codes = Array.from({length:20},(_,i)=>`3D${String(i+1).padStart(3,"0")}`);
assert.deepEqual(MATRIXLAB_3D.map(p=>p.code),codes);
assert.equal(new Set(codes.map(matrixLab3dHandle)).size,20);
assert.equal(new Set(codes.map(matrixLab3dSku)).size,20);
assert.equal(matrixLab3dByCode("3D021"),null);
assert.deepEqual(matrixLab3dCategoryCounts(),{
  "lamparas-rgb":1,calendarios:1,"decoracion-escolar":4,
  organizadores:2,coleccionables:5,personalizados:4,gaming:3,
});
assert.deepEqual(MATRIXLAB_3D.map(p=>p.price),[1900,1100,85,220,220,800,160,299,349,155,85,900,2000,2000,299,1500,null,null,null,null]);
assert.equal(MATRIXLAB_3D_PRICE_PENDING,true);
assert.deepEqual(MATRIXLAB_3D.filter(p=>p.priceFrom).map(p=>p.code),["3D005","3D007"]);
assert.equal(matrixLab3dByCode("3D007")?.salesUnit,"paquete de 12 piezas");
assert.equal(matrixLab3dByCode("3D015")?.salesUnit,"paquete de 3 piezas");
assert.deepEqual(MATRIXLAB_3D.map(p=>p.inventory),Array(20).fill(99));
assert.deepEqual(matrixLab3dCustomizable().map(p=>p.code),["3D004","3D005","3D007","3D008","3D009","3D010"]);
assert.equal(MATRIXLAB_3D.filter(p=>p.customizable===null).length,10);
const photos=MATRIXLAB_3D.flatMap(p=>p.imagePaths??[]);
assert.equal(photos.length,26);
assert.equal(new Set(photos).size,26);
assert.deepEqual(MATRIXLAB_3D.filter(p=>!p.imagePaths?.length).map(p=>p.code),[]);
assert.deepEqual(matrixLab3dByCode("3D001")?.imagePaths,matrixLab3dImagePaths("3D001"));
assert.deepEqual(matrixLab3dByCode("3D015")?.imagePaths,["/images/matrixlab-3d/3d015.webp"]);
for(const path of [...photos,MATRIXLAB_3D_PLACEHOLDER_IMAGE]) assert.ok(existsSync(join(__dirname,"../../public",path)),path);
assert.deepEqual(selectMatrixLab3dImages([],[]),[MATRIXLAB_3D_PLACEHOLDER_IMAGE]);
assert.deepEqual(selectMatrixLab3dImages(["a","a","b"],["b","c","d"]),["a","b","c"]);
assert.ok(MATRIXLAB_3D.every(p=>p.description && !/agrega descrip/i.test(p.description)));
console.log("QA MatrixLab 3D OK: 20 artículos con 99 unidades, 26 fotos, precios y paquetes preservados.");
