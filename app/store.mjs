// Durable app state that survives redeploys: Upstash Redis (free tier, REST) when configured,
// otherwise a local JSON file. Holds Telegram links, faucet gifts, the alert log and keeper tx history.
import { readFileSync, existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const KEY = 'mezguard:state';
const FILE = fileURLToPath(new URL('./data/state.json', import.meta.url));

function upstashConfig() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) return { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN };
  for (const f of [fileURLToPath(new URL('../secrets/upstash.json', import.meta.url)), '/etc/secrets/upstash.json']) {
    if (existsSync(f)) { const j = JSON.parse(readFileSync(f, 'utf8')); if (j.url && j.token) return { url: j.url.replace(/\/$/, ''), token: j.token }; }
  }
  return null;
}
const up = upstashConfig();
export const storeKind = up ? 'upstash' : 'file';

async function redis(cmd) {
  const r = await fetch(up.url, { method: 'POST', headers: { authorization: `Bearer ${up.token}`, 'content-type': 'application/json' }, body: JSON.stringify(cmd), signal: AbortSignal.timeout(8000) });
  const j = await r.json();
  if (j.error) throw new Error('Upstash: ' + j.error);
  return j.result;
}

export async function loadState() {
  try {
    if (up) { const s = await redis(['GET', KEY]); return s ? JSON.parse(s) : {}; }
    return existsSync(FILE) ? JSON.parse(await readFile(FILE, 'utf8')) : {};
  } catch (e) { console.error('state load failed:', e.message); return {}; }
}

let last = '';
export async function saveState(state) {
  const s = JSON.stringify(state);
  if (s === last) return; // nothing changed: no write (keeps us far inside the free tier)
  last = s;
  try {
    if (up) await redis(['SET', KEY, s]);
    else { await mkdir(fileURLToPath(new URL('./data/', import.meta.url)), { recursive: true }); await writeFile(FILE, s); }
  } catch (e) { console.error('state save failed:', e.message); last = ''; }
}
