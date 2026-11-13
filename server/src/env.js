// Carga simple de variables desde server/.env (sin dependencias externas).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const candidates = [
  path.join(process.cwd(), '.env'),
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'),
];

for (const file of candidates) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!match || line.trim().startsWith('#')) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
  break;
}
