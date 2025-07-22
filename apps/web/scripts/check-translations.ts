import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

type JsonObject = { [key: string]: any };

function getKeys(data: JsonObject, parentKey = ''): Set<string> {
  const keys = new Set<string>();
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      keys.add(newKey);
      if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
        getKeys(data[key], newKey).forEach(k => keys.add(k));
      }
    }
  }
  return keys;
}

const __filename = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(__filename);
const deJsonPath = path.join(scriptDir, '../messages/de.json');
const enJsonPath = path.join(scriptDir, '../messages/en.json');

const deJson: JsonObject = JSON.parse(fs.readFileSync(deJsonPath, 'utf-8'));
const enJson: JsonObject = JSON.parse(fs.readFileSync(enJsonPath, 'utf-8'));

const deKeys = getKeys(deJson);
const enKeys = getKeys(enJson);

const missingKeysInDe = [...enKeys].filter(key => !deKeys.has(key)).sort();
const missingKeysInEn = [...deKeys].filter(key => !enKeys.has(key)).sort();

if (missingKeysInEn.length > 0) {
  console.log('Missing keys in en.json which are in de.json:');
  missingKeysInEn.forEach(key => console.log(key));
}

if (missingKeysInDe.length > 0) {
  console.log('Missing keys in de.json which are in en.json:');
  missingKeysInDe.forEach(key => console.log(key));
}

if (missingKeysInEn.length > 0 || missingKeysInDe.length > 0) {
  process.exit(1);
}
