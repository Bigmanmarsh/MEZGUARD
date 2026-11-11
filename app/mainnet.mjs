// Mainnet "direct mode": savers use Mezo's official MUSD savings vault (sMUSD) straight from their own
// wallet. MezGuard reads everything from Mezo mainnet; nothing here needs our own gas.
import { formatEther, parseAbi, pad, toEventSelector } from 'viem';
import { mezo, MAIN, label } from './chain.mjs';
import { habitScore, ngnAgo } from './report.mjs';
import { ngnRate, vaultHealth } from './guard.mjs';

export const MAINNET = {
  id: 31612, name: 'Mezo', rpc: 'https://rpc-http.mezo.boar.network', explorer: 'https://explorer.mezo.org',
  musd: MAIN.musd, vault: MAIN.smusd, gauge: MAIN.vaultGauge,
};
const gaugeAbi = parseAbi(['function balanceOf(address) view returns (uint256)', 'function earned(address) view returns (uint256)']);
const API = 'https://api.explorer.mezo.org/api';
const vaultAbi = parseAbi([
  'function balanceOf(address) view returns (uint256)', 'function claimableYield(address) view returns (uint256)', 'function totalSupply() view returns (uint256)',
]);
const erc20 = parseAbi(['function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)']);
const TOPIC = {
  Deposit: toEventSelector('Deposit(address,uint256)'),
  Withdraw: toEventSelector('Withdraw(address,uint256)'),
  YieldClaimed: toEventSelector('YieldClaimed(address,uint256)'),
};
const n = (x) => Number(formatEther(BigInt(x ?? 0)));
const money = (v, d = 2) => v > 0 && v < 10 ** -d ? `under $${(10 ** -d).toFixed(d)}` : '$' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const caches = new Map();
// Shared in-flight requests; an expired entry is served while a fresh one loads (stale-while-revalidate).
function cached(key, ttl, fn) {
  const hit = caches.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.p;
  const entry = { at: Date.now(), p: fn(), v: hit?.v, has: hit?.has };
  entry.p.then((v) => { entry.v = v; entry.has = true; }, () => { if (entry.has) entry.at = 0; else caches.delete(key); });
  caches.set(key, entry);
  return hit?.has ? Promise.resolve(hit.v) : entry.p;
}
const quick = (p, ms, fallback) => Promise.race([p, new Promise((r) => setTimeout(() => r(fallback), ms))]);
export const forgetMain = (owner) => { for (const k of caches.keys()) if (k.includes(owner.toLowerCase())) caches.delete(k); };

/** One event type for one saver, from the explorer's log index (no RPC block-range limits). */
async function logs(kind, owner) {
  const u = `${API}?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${MAINNET.vault}&topic0=${TOPIC[kind]}&topic1=${pad(owner.toLowerCase())}&topic0_1_opr=and`;
  const j = await fetch(u, { signal: AbortSignal.timeout(15000) }).then((r) => r.json());
  if (j.status !== '1' && !/No records/i.test(j.message || '')) throw new Error('Explorer: ' + (j.message || 'no answer'));
  return (j.result || []).map((l) => ({ kind, amount: n(l.data), at: Number(l.timeStamp) * 1000, tx: l.transactionHash, block: Number(l.blockNumber) }));
}

/** A saver's whole history in Mezo's vault, oldest first, in plain words. */
export function history(owner) {
  return cached('hist:' + owner.toLowerCase(), 20_000, async () => {
    const [d, w, y] = await Promise.all([logs('Deposit', owner), logs('Withdraw', owner), logs('YieldClaimed', owner)]);
    return [...d, ...w, ...y].sort((a, b) => a.at - b.at || a.block - b.block).map((e) => ({
      ...e,
      kind: e.kind === 'Deposit' ? 'save' : e.kind === 'Withdraw' ? 'withdraw' : 'interest',
      interest: e.kind === 'YieldClaimed' ? e.amount : undefined,
      text: e.kind === 'Deposit' ? `Saved ${money(e.amount)}` : e.kind === 'Withdraw' ? `Took out ${money(e.amount)}` : `Collected ${money(e.amount, 4)} interest`,
    }));
  });
}

export function account(owner) {
  return cached('acct:' + owner.toLowerCase(), 4_000, async () => {
    const r = (address, abi, functionName, args) => mezo.readContract({ address, abi, functionName, args });
    const [inVault, claimable, wMusd, wBtc, allowance, h, staked, mezoEarned] = await Promise.all([
      r(MAINNET.vault, vaultAbi, 'balanceOf', [owner]), r(MAINNET.vault, vaultAbi, 'claimableYield', [owner]),
      r(MAINNET.musd, erc20, 'balanceOf', [owner]), mezo.getBalance({ address: owner }), r(MAINNET.musd, erc20, 'allowance', [owner, MAINNET.vault]), history(owner),
      r(MAINNET.gauge, gaugeAbi, 'balanceOf', [owner]).catch(() => 0n), r(MAINNET.gauge, gaugeAbi, 'earned', [owner]).catch(() => 0n),
    ]);
    // Many savers stake their sMUSD in Mezo's gauge for extra MEZO rewards: it is still their savings.
    const saved = inVault + staked;
    return {
      net: 'main', owner, account: owner, exists: true, explorer: `${MAINNET.explorer}/address/${owner}`,
      savedWei: saved.toString(), saved: n(saved), inVaultWei: inVault.toString(), stakedWei: staked.toString(), staked: n(staked), mezoRewards: n(mezoEarned),
      claimable: n(claimable), allowanceWei: allowance.toString(),
      wallet: { musd: n(wMusd), musdWei: wMusd.toString(), btc: n(wBtc) }, interestPaid: h.filter((e) => e.kind === 'interest').reduce((s, e) => s + e.amount, 0),
      history: h.slice(-20).reverse(),
    };
  });
}

/** Real savers in Mezo's vault (not protocol wallets), with habit scores, so a saver can see where they stand. */
export function vaultSavers() {
  return cached('savers', 6 * 3600_000, async () => {
    // Most savers stake sMUSD in Mezo's gauge, so the token holder list hides them. Instead, find real
    // people from the vault's Deposit events (paged 1,000 at a time) and keep the 60 most recent.
    const lastSeen = new Map();
    let from = 0;
    for (let p = 0; p < 8; p++) {
      const u = `${API}?module=logs&action=getLogs&fromBlock=${from}&toBlock=latest&address=${MAINNET.vault}&topic0=${TOPIC.Deposit}`;
      const res = (await fetch(u, { signal: AbortSignal.timeout(20000) }).then((r) => r.json())).result || [];
      for (const l of res) lastSeen.set('0x' + l.topics[1].slice(26), Number(l.blockNumber));
      if (res.length < 1000) break;
      from = Number(res.at(-1).blockNumber) + 1;
    }
    const holders = [...lastSeen].filter(([a]) => !label(a)).sort((a, b) => b[1] - a[1]).map(([a]) => a).slice(0, 60);
    const now = Date.now(), out = [];
    for (let i = 0; i < holders.length; i += 5) {
      const batch = await Promise.all(holders.slice(i, i + 5).map(async (a) => {
        try { return { who: a.toLowerCase(), score: habitScore(await history(a), now) }; } catch { return null; }
      }));
      out.push(...batch.filter(Boolean));
    }
    return out;
  });
}

export function report(owner, period = 'week') {
  return cached(`rep:${owner.toLowerCase()}:${period}`, 30_000, async () => {
    const days = period === 'month' ? 30 : 7, now = Date.now(), since = now - days * 86_400_000;
    const [a, h, rateNow, rateThen, live, savers] = await Promise.all([
      account(owner), history(owner), ngnRate(), ngnAgo(days), vaultHealth().catch(() => null), quick(vaultSavers().catch(() => []), 2000, []),
    ]);
    const inPeriod = h.filter((e) => e.at >= since);
    const earned = inPeriod.filter((e) => e.kind === 'interest').reduce((s, e) => s + e.amount, 0) + a.claimable;
    const savedIn = inPeriod.filter((e) => e.kind === 'save').reduce((s, e) => s + e.amount, 0);
    const tookOut = inPeriod.filter((e) => e.kind === 'withdraw').reduce((s, e) => s + e.amount, 0);
    const balance = a.saved, apr = live?.apr30d ?? null;
    const projected = apr ? { apr, period: balance * (apr / 100) * (days / 365), year: balance * (apr / 100), day: balance * (apr / 100) / 365 } : null;
    const myScore = habitScore(h, now);
    const others = savers.filter((s) => s.who !== owner.toLowerCase());
    const beat = others.length ? Math.round((others.filter((s) => s.score < myScore).length / others.length) * 100) : null;
    const naira = rateNow ? { rateNow, rateThen, balanceNgn: balance * rateNow, earnedNgn: earned * rateNow,
      nairaHolderLossUsd: rateThen && rateNow > rateThen ? balance - balance * (rateThen / rateNow) : 0 } : null;
    // sMUSD staked in Mezo's gauge earns MEZO tokens instead of MUSD interest: say so, or a big saver's tiny MUSD number looks wrong.
    const stakedNote = a.staked > 0.01 ? ` ${money(a.staked)} of your savings is staked in Mezo's gauge, which pays MEZO rewards instead (${a.mezoRewards.toLocaleString('en-US', { maximumFractionDigits: 2 })} MEZO so far).` : '';
    const sentence = earned > 0
      ? `This ${period} your savings earned ${money(earned, 4)} in MUSD interest. In plain USDC that money would have earned $0.${stakedNote}`
      : balance > 0 ? `Your ${money(balance)} is earning about ${apr ? apr.toFixed(2) : '5'}% a year in Mezo's vault. Interest builds up every time Mezo pays the vault.${stakedNote}`
        : h.some((e) => e.kind === 'save') ? 'Your savings are back in your wallet right now. Save again any time to keep earning.'
          : 'You have nothing saved yet. Save any amount to start earning.';
    return {
      net: 'main', period, days, big: { label: `Earned this ${period}`, usd: earned, ngn: naira ? earned * rateNow : null },
      sentence, balance, savedIn, tookOut, projected, staked: a.staked, mezoRewards: a.mezoRewards,
      vsUsdc: { usdcEarned: 0, extra: earned, text: `$${earned.toFixed(4)} more than leaving it in USDC` },
      naira,
      rank: { score: myScore, beatPercent: beat, savers: others.length + 1,
        text: beat === null ? 'Rankings are loading. Check back in a minute.' : `Your saving habits beat ${beat}% of savers in Mezo's vault (ranked on steady saving, never on size).` },
      activity: inPeriod.slice(-10).reverse(),
    };
  });
}

/** Confirm a transaction a MezGuard user made really went from their wallet into (or out of) Mezo's vault. */
export async function verifyTx(owner, hash) {
  const r = await mezo.getTransactionReceipt({ hash });
  if (r.status !== 'success' || r.from.toLowerCase() !== owner.toLowerCase()) return null;
  const vaultLog = r.logs.find((l) => l.address.toLowerCase() === MAINNET.vault.toLowerCase() && [TOPIC.Deposit, TOPIC.Withdraw, TOPIC.YieldClaimed].includes(l.topics[0]));
  if (!vaultLog) return null;
  const kind = vaultLog.topics[0] === TOPIC.Deposit ? 'save' : vaultLog.topics[0] === TOPIC.Withdraw ? 'withdraw' : 'interest';
  return { owner: owner.toLowerCase(), hash, kind, amount: n(vaultLog.data), block: Number(r.blockNumber), at: Date.now() };
}

export async function vaultBalances(owners) {
  // Savings = sMUSD in the wallet + sMUSD staked in Mezo's gauge (same as the Home screen shows).
  const one = (o) => Promise.all([
    mezo.readContract({ address: MAINNET.vault, abi: vaultAbi, functionName: 'balanceOf', args: [o] }).catch(() => 0n),
    mezo.readContract({ address: MAINNET.gauge, abi: gaugeAbi, functionName: 'balanceOf', args: [o] }).catch(() => 0n),
  ]).then(([a, b]) => n(a + b));
  return Promise.all(owners.map(one));
}
