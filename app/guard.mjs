// The Guard and Whale Watch: reads REAL Mezo mainnet + Base data (read-only, free).
import { parseAbi, parseAbiItem, formatUnits } from 'viem';
import { mezo, base, MAIN, label } from './chain.mjs';

const BLOCKS_PER_DAY_MEZO = 23264n; // measured 2026-11-07
const BLOCKS_PER_HOUR_BASE = 1800n;
const cache = new Map();
async function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  try {
    const value = await fn();
    cache.set(key, { at: Date.now(), value });
    return value;
  } catch (e) {
    if (hit) return { ...hit.value, stale: true };
    throw e;
  }
}

const poolAbi = parseAbi([
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, bool)',
  'function getAmountOut(uint256, address) view returns (uint256)',
]);
const nttAbi = parseAbi(['function isPaused() view returns (bool)']);
const vaultAbi = parseAbi(['function totalSupply() view returns (uint256)', 'function yieldIndex() view returns (uint256)']);
const spAbi = parseAbi(['function getTotalMUSDDeposits() view returns (uint256)']);
const swapEvent = parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)');

const level = (ok, watch) => (ok ? 'ok' : watch ? 'watch' : 'act');

/** MUSD price in dollars from two independent pools (Base Aerodrome and Mezo's own pool). */
export async function peg() {
  return cached('peg', 60_000, async () => {
    const [s0] = await base.readContract({ address: MAIN.baseMusdUsdcPool, abi: poolAbi, functionName: 'slot0' });
    const ratio = (Number(s0) / 2 ** 96) ** 2; // MUSD-wei per USDC-unit
    const basePrice = 1 / (ratio * 1e6 / 1e18);
    let mezoPrice = null;
    try {
      // Mezo's pool is a stable curve: quote a real 10 MUSD sell instead of reading reserves.
      const out = await mezo.readContract({ address: MAIN.mezoMusdUsdcPool, abi: poolAbi, functionName: 'getAmountOut', args: [10n ** 19n, MAIN.musd] });
      mezoPrice = Number(formatUnits(out, 6)) / 10;
    } catch { /* second source is optional */ }
    const price = Math.min(basePrice, mezoPrice ?? basePrice); // be conservative: the worse of the two
    return { price, basePrice, mezoPrice, status: level(price >= 0.985, price >= 0.97), at: Date.now() };
  });
}

export async function chainHealth() {
  return cached('chain', 30_000, async () => {
    const b = await mezo.getBlock();
    const age = Math.max(0, Math.round(Date.now() / 1000 - Number(b.timestamp)));
    return { block: Number(b.number), ageSec: age, status: level(age < 120, age < 600), at: Date.now() };
  });
}

export async function vaultHealth() {
  return cached('vault', 5 * 60_000, async () => {
    const now = await mezo.getBlockNumber();
    const read = (fn, blockNumber) => mezo.readContract({ address: MAIN.smusd, abi: vaultAbi, functionName: fn, blockNumber });
    const [supply, supply24, idx, idx30] = await Promise.all([
      read('totalSupply'), read('totalSupply', now - BLOCKS_PER_DAY_MEZO), read('yieldIndex'), read('yieldIndex', now - 30n * BLOCKS_PER_DAY_MEZO),
    ]);
    const apr30 = (Number(idx - idx30) / 1e18) * (365 / 30) * 100;
    const change24 = supply24 > 0n ? (Number(supply) - Number(supply24)) / Number(supply24) * 100 : 0;
    return { supply: Number(formatUnits(supply, 18)), change24h: change24, apr30d: apr30, status: level(change24 > -30 && apr30 > 0.5, change24 > -60), at: Date.now() };
  });
}

export async function bridgeHealth() {
  return cached('bridge', 5 * 60_000, async () => {
    const [b, m] = await Promise.all([
      base.readContract({ address: MAIN.nttBase, abi: nttAbi, functionName: 'isPaused' }),
      mezo.readContract({ address: MAIN.nttMezo, abi: nttAbi, functionName: 'isPaused' }),
    ]);
    return { basePaused: b, mezoPaused: m, status: b || m ? 'watch' : 'ok', at: Date.now() };
  });
}

/** All four checks; a failing source becomes "unknown" instead of breaking the page. */
export async function guardStatus() {
  const wrap = (p) => p.catch((e) => ({ status: 'unknown', error: String(e.message || e).slice(0, 120) }));
  const [p, c, v, b] = await Promise.all([wrap(peg()), wrap(chainHealth()), wrap(vaultHealth()), wrap(bridgeHealth())]);
  const order = { act: 3, watch: 2, unknown: 1, ok: 0 };
  const worst = [p, c, v, b].reduce((w, x) => (order[x.status] > order[w] ? x.status : w), 'ok');
  return { overall: worst, peg: p, chain: c, vault: v, bridge: b, at: Date.now() };
}

/** Whale Watch: big sMUSD moves on Mezo mainnet, big MUSD sells on Base, Stability Pool size. */
export async function whales() {
  return cached('whales', 5 * 60_000, async () => {
    const moves = [];
    // 1) Savings vault (sMUSD) mints/burns from the public explorer.
    try {
      const r = await fetch('https://api.explorer.mezo.org/api/v2/tokens/' + MAIN.smusd + '/transfers', { signal: AbortSignal.timeout(12000) });
      const j = await r.json();
      for (const t of j.items || []) {
        const amt = Number(t.total?.value || 0) / 1e18;
        if (amt < 5000) continue;
        const from = t.from?.hash || '', to = t.to?.hash || '';
        const kind = /^0x0+$/.test(from) ? 'deposit' : /^0x0+$/.test(to) ? 'withdraw' : 'move';
        if (kind === 'move') continue;
        const who = kind === 'deposit' ? to : from;
        moves.push({ where: 'Mezo savings vault', kind, amount: amt, who, label: label(who), at: t.timestamp, tx: 'https://explorer.mezo.org/tx/' + t.transaction_hash,
          meaning: kind === 'withdraw' ? 'A big saver left. Your money is still held 1:1, and the same fees now go to fewer savers, so your rate rises.' : 'A big saver joined. A sign of confidence; the rate is shared by more savers.' });
      }
    } catch { /* optional */ }
    // 2) Big MUSD sells into the Base Aerodrome pool over the last ~3 hours (early depeg warning).
    try {
      const to = await base.getBlockNumber();
      const logs = await base.getLogs({ address: MAIN.baseMusdUsdcPool, event: swapEvent, fromBlock: to - 3n * BLOCKS_PER_HOUR_BASE, toBlock: to });
      for (const l of logs) {
        const musdIn = Number(formatUnits(l.args.amount1, 18));
        if (musdIn < 5000) continue; // positive amount1 = MUSD sold into the pool
        // Base makes a block every 2 seconds: estimate the time instead of one RPC call per swap.
        const at = new Date(Date.now() - Number(to - l.blockNumber) * 2000).toISOString();
        moves.push({ where: 'Base MUSD/USDC pool', kind: 'sell', amount: musdIn, who: l.args.recipient, label: label(l.args.recipient), at, block: Number(l.blockNumber), tx: 'https://basescan.org/tx/' + l.transactionHash,
          meaning: 'Someone sold a lot of MUSD for USDC. Several of these in a row can push MUSD below $1; the Guard watches the price.' });
      }
    } catch { /* optional */ }
    // 3) Stability Pool: Mezo's safety net for bad loans.
    let stability = null;
    try {
      const now = await mezo.getBlockNumber();
      const [a, b] = await Promise.all([
        mezo.readContract({ address: MAIN.stabilityPool, abi: spAbi, functionName: 'getTotalMUSDDeposits' }),
        mezo.readContract({ address: MAIN.stabilityPool, abi: spAbi, functionName: 'getTotalMUSDDeposits', blockNumber: now - BLOCKS_PER_DAY_MEZO }),
      ]);
      const nowV = Number(formatUnits(a, 18)), dayV = Number(formatUnits(b, 18));
      stability = { total: nowV, change24h: dayV ? (nowV - dayV) / dayV * 100 : 0 };
    } catch { /* optional */ }
    moves.sort((x, y) => new Date(y.at || 0) - new Date(x.at || 0)); // newest first, across both chains
    return { moves: moves.slice(0, 20), stability, at: Date.now() };
  });
}

let ngnCache = null;
/** USD to naira rate for reports (CoinGecko, cached 30 min). */
export async function ngnRate() {
  if (ngnCache && Date.now() - ngnCache.at < 30 * 60_000) return ngnCache.rate;
  try {
    const j = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ngn', { signal: AbortSignal.timeout(8000) }).then((r) => r.json());
    const rate = j?.['usd-coin']?.ngn;
    if (rate) ngnCache = { rate, at: Date.now() };
  } catch { /* try the backup below */ }
  if (!ngnCache || Date.now() - ngnCache.at > 30 * 60_000) {
    try { // backup source (free, no key) when CoinGecko throttles us
      const j = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(8000) }).then((r) => r.json());
      if (j?.rates?.NGN) ngnCache = { rate: j.rates.NGN, at: Date.now() };
    } catch { /* keep last */ }
  }
  return ngnCache?.rate ?? null;
}
