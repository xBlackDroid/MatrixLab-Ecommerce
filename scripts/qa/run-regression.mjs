import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
const files = readdirSync('scripts/qa').filter((f) => f.endsWith('.test.ts')).sort();
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, [...(file === 'courses.test.ts' ? ['--conditions=react-server'] : []), '--import', 'tsx', join('scripts/qa', file)], { encoding: 'utf8', env: { ...process.env } });
  console.log(`${result.status === 0 ? 'PASS' : 'FAIL'} ${file}`);
  if (result.status !== 0) { failed++; console.log(result.stdout); console.error(result.stderr); }
}
console.log(`${files.length - failed}/${files.length} suites previas aprobadas.`);
process.exitCode = failed ? 1 : 0;
