import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const source = process.argv[2];
if (!source) throw new Error('Indica la carpeta con fotos 3D001v1, 3D001v2, etc.');
const output = path.resolve('public/images/matrixlab-3d');
const audit = path.resolve('tmp/3d-inventory/photo-review');
await fs.mkdir(output, { recursive: true });
await fs.mkdir(audit, { recursive: true });
const names = (await fs.readdir(source)).filter(name => /\.(jpe?g|png|webp)$/i.test(name));
const records = [];
const destinations = new Set();
for (const name of names.sort()) {
  const match = name.match(/^(3d\d+)(?:v([1-3]))?\.(jpe?g|png|webp)$/i);
  if (!match) throw new Error(`Nombre no reconocido: ${name}`);
  const sourceCode = match[1].toUpperCase();
  // Asignación confirmada por el usuario: 010 repite el calendario;
  // la foto etiquetada 016 corresponde al pack de llaveros 015.
  const digest = createHash('sha256').update(await fs.readFile(path.join(source,name))).digest('hex');
  if (sourceCode === '3D010' && digest === '52dc244ff41cb4cd264a306da1afc0c164b341d94421299d3932fad77a4c6dd5') continue;
  const code = sourceCode === '3D016' && digest === '20ff4b4bbc7a7373a0cf5c85c1b475f86a04f143065ae455e95f965ca9a0f93a' ? '3D015' : sourceCode;
  const slot = Number(match[2] || 1);
  const filename = `${code.toLowerCase()}${slot === 1 ? '' : `-${slot}`}.webp`;
  if (destinations.has(filename)) throw new Error(`Dos archivos usan la misma foto: ${filename}`);
  destinations.add(filename);
  records.push({ code, sourceCode, slot, source: path.join(source, name), filename, url: `/images/matrixlab-3d/${filename}` });
}
records.sort((a,b)=>a.code.localeCompare(b.code)||a.slot-b.slot);
for (const record of records) {
  const info = await sharp(record.source).rotate().resize({width:1440,height:1440,fit:'inside',withoutEnlargement:true}).webp({quality:78,effort:5}).toFile(path.join(output, record.filename));
  Object.assign(record, {width:info.width,height:info.height,bytes:info.size});
}
await fs.writeFile(path.join(audit,'manifest.json'), JSON.stringify(records,null,2));
// Hoja de contacto de revisión; las fotos publicadas no tienen etiquetas añadidas.
const tiles = [];
for (let i = 0; i < records.length; i++) {
  const r = records[i];
  const photo = await sharp(path.join(output,r.filename)).resize(300,270,{fit:'contain',background:'#eeeeee'}).png().toBuffer();
  const label = Buffer.from(`<svg width="300" height="30"><rect width="300" height="30" fill="white"/><text x="12" y="21" font-family="Arial" font-size="16">${r.code} · Foto ${r.slot}</text></svg>`);
  tiles.push({input:photo,left:(i%4)*300,top:Math.floor(i/4)*300});
  tiles.push({input:label,left:(i%4)*300,top:Math.floor(i/4)*300+270});
}
await sharp({create:{width:1200,height:Math.ceil(records.length/4)*300,channels:3,background:'white'}}).composite(tiles).png().toFile(path.join(audit,'contact-sheet.png'));
console.log(JSON.stringify({photos:records.length,products:new Set(records.map(r=>r.code)).size,bytes:records.reduce((s,r)=>s+r.bytes,0),files:records.map(r=>r.filename)}));
