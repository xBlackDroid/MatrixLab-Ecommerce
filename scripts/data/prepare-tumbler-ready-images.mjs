import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = process.argv[2];
if (!source) throw new Error('Indica la carpeta con fotos VL001V1, VL001V2, etc.');

const output = path.resolve('public/images/tumbler/listos');
const audit = path.resolve('tmp/3d-inventory/tumbler-ready-review');
await fs.mkdir(output, { recursive: true });
await fs.mkdir(audit, { recursive: true });

const names = (await fs.readdir(source)).filter((name) => /\.(jpe?g|png|webp)$/i.test(name));
const records = [];
const destinations = new Set();

for (const name of names.sort()) {
  const match = name.match(/^(vl\d{3})(?:v([1-3]))?\.(jpe?g|png|webp)$/i);
  if (!match) throw new Error(`Nombre no reconocido: ${name}`);
  const code = match[1].toUpperCase();
  const slot = Number(match[2] || 1);
  const filename = `${code.toLowerCase()}${slot === 1 ? '' : `-${slot}`}.webp`;
  if (destinations.has(filename)) throw new Error(`Dos archivos usan la misma foto: ${filename}`);
  destinations.add(filename);
  records.push({ code, slot, source: path.join(source, name), filename, url: `/images/tumbler/listos/${filename}` });
}

records.sort((a, b) => a.code.localeCompare(b.code) || a.slot - b.slot);
for (const record of records) {
  const info = await sharp(record.source)
    .rotate()
    .resize({ width: 1440, height: 1440, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(path.join(output, record.filename));
  Object.assign(record, { width: info.width, height: info.height, bytes: info.size });
}

await fs.writeFile(path.join(audit, 'manifest.json'), JSON.stringify(records, null, 2));

const tiles = [];
for (let i = 0; i < records.length; i++) {
  const record = records[i];
  const photo = await sharp(path.join(output, record.filename))
    .resize(300, 270, { fit: 'contain', background: '#eeeeee' })
    .png()
    .toBuffer();
  const label = Buffer.from(
    `<svg width="300" height="30"><rect width="300" height="30" fill="white"/><text x="12" y="21" font-family="Arial" font-size="16">${record.code} · Foto ${record.slot}</text></svg>`,
  );
  tiles.push({ input: photo, left: (i % 4) * 300, top: Math.floor(i / 4) * 300 });
  tiles.push({ input: label, left: (i % 4) * 300, top: Math.floor(i / 4) * 300 + 270 });
}
if (records.length) {
  await sharp({
    create: {
      width: 1200,
      height: Math.ceil(records.length / 4) * 300,
      channels: 3,
      background: 'white',
    },
  })
    .composite(tiles)
    .png()
    .toFile(path.join(audit, 'contact-sheet.png'));
}

console.log(JSON.stringify({
  photos: records.length,
  products: new Set(records.map((record) => record.code)).size,
  bytes: records.reduce((sum, record) => sum + record.bytes, 0),
  files: records.map((record) => record.filename),
}));
