// Weekly / monthly reports from the saver's own on-chain history (Mezo testnet),
// plus dollars-vs-naira and an anonymous habit ranking against every other MezGuard saver.
import { formatEther } from 'viem';
import { testnet, DEPLOY, ABI, EVENTS } from './chain.mjs';
import { ngnRate, vaultHealth } from './guard.mjs';

let startBlock = null;
export async function deployBlock() {
  if (startBlock !== null) return startBlock;
  startBlock = DEPLOY.deployBlock != null ? BigInt(DEPLOY.deployBlock) : (await testnet.getTransactionReceipt({ hash: DEPLOY.deployTx })).blockNumber;
  return startBlock;
}

const blockTimes = new Map();
async function blockTime(n) {
  const k = String(n);
  if (!blockTimes.has(k)) blockTimes.set(k, Number((await testnet.getBlock({ blockNumber: n })).timestamp) * 1000);
  return blockTimes.get(k);
}

const n = (x) => Number(formatEther(x ?? 0n));

const histCache = new Map();
/** Every event of one MezGuard account, oldest first, in plain words (cached 15 s). */
export async function history(account) {
  const hit = histCache.get(account);
  if (hit && Date.now() - hit.at < 15_000) return hit.value;
  const value = await loadHistory(account);
  histCache.set(account, { at: Date.now(), value });
  return value;
}
export const forgetHistory = (account) => histCache.delete(account);
async function loadHistory(account) {
  const from = await deployBlock();
  const logs = await testnet.getLogs({ address: account, events: Object.values(EVENTS).filter((e) => e.name !== 'AccountCreated'), fromBlock: from, toBlock: 'latest' });
  const out = [];
  const exitTxs = new Set(logs.filter((l) => l.eventName === 'GuardExit').map((l) => l.transactionHash));
  for (const l of logs) {
    if (l.eventName === 'Withdrawn' && exitTxs.has(l.transactionHash)) continue; // a Guard exit also emits Withdrawn: count it once
    const a = l.args, at = await blockTime(l.blockNumber);
    const base = { at, block: Number(l.blockNumber), tx: l.transactionHash };
    if (l.eventName === 'Deposited') out.push({ ...base, kind: 'save', amount: n(a.amount), text: `Saved $${n(a.amount).toFixed(2)}` });
    else if (l.eventName === 'Withdrawn') out.push({ ...base, kind: 'withdraw', amount: n(a.amount), interest: n(a.interest), fee: n(a.fee), text: `Took out $${n(a.amount).toFixed(2)}` + (a.interest > 0n ? ` plus $${n(a.interest - a.fee).toFixed(4)} interest` : '') });
    else if (l.eventName === 'InterestClaimed') out.push({ ...base, kind: 'interest', interest: n(a.interest), fee: n(a.fee), text: `Collected $${n(a.interest - a.fee).toFixed(4)} interest` });
    else if (l.eventName === 'GuardSet') out.push({ ...base, kind: 'guard', enabled: a.enabled, text: !out.length ? 'Opened your savings account, Guard on' : a.enabled ? 'Turned the Guard on' : 'Turned the Guard off' });
    else if (l.eventName === 'GuardExit') out.push({ ...base, kind: 'exit', amount: n(a.principalOut), interest: n(a.interest), fee: n(a.fee), reason: a.reason, text: `The Guard moved $${n(a.principalOut).toFixed(2)} back to your wallet` });
  }
  return out;
}

/** Habit score: rewards steady saving, not size. 0-100. */
function habitScore(h, now) {
  const saves = h.filter((e) => e.kind === 'save');
  if (!saves.length) return 0;
  const days = (now - saves[0].at) / 86_400_000;
  const saveDays = new Set(saves.map((e) => Math.floor(e.at / 86_400_000))).size;
  // Guard exits (real or drills) protect the saver, so they never count against their habits.
  const outs = h.filter((e) => e.kind === 'withdraw').reduce((s, e) => s + e.amount, 0);
  const ins = saves.reduce((s, e) => s + e.amount, 0);
  const kept = ins > 0 ? Math.max(0, 1 - outs / ins) : 0;
  return Math.round(Math.min(40, days * 4) + Math.min(30, saveDays * 10) + kept * 30);
}

let cohort = { at: 0, scores: [] };
async function cohortScores() {
  if (Date.now() - cohort.at < 5 * 60_000) return cohort.scores;
  const count = Number(await testnet.readContract({ address: DEPLOY.factory, abi: ABI.factory, functionName: 'accountsCount' }));
  const now = Date.now(), scores = [];
  for (let i = 0; i < count; i++) {
    const acc = await testnet.readContract({ address: DEPLOY.factory, abi: ABI.factory, functionName: 'allAccounts', args: [BigInt(i)] });
    scores.push({ acc: acc.toLowerCase(), score: habitScore(await history(acc), now) });
  }
  cohort = { at: now, scores };
  return scores;
}

let ngnHist = { at: 0, points: [] };
async function ngnAgo(days) {
  if (Date.now() - ngnHist.at > 6 * 3600_000) {
    try {
      const j = await fetch('https://api.coingecko.com/api/v3/coins/usd-coin/market_chart?vs_currency=ngn&days=31', { signal: AbortSignal.timeout(8000) }).then((r) => r.json());
      if (j.prices?.length) ngnHist = { at: Date.now(), points: j.prices };
    } catch { /* keep last */ }
  }
  const target = Date.now() - days * 86_400_000;
  let best = null;
  for (const [t, p] of ngnHist.points) if (!best || Math.abs(t - target) < Math.abs(best[0] - target)) best = [t, p];
  return best ? best[1] : null;
}

/** The report: one big number, a plain sentence, then a few easy comparisons. */
export async function report(account, period = 'week') {
  const days = period === 'month' ? 30 : 7;
  const now = Date.now(), since = now - days * 86_400_000;
  const [h, bal, rateNow, rateThen, scores, live] = await Promise.all([
    history(account),
    testnet.readContract({ address: account, abi: ABI.account, functionName: 'balances' }),
    ngnRate(), ngnAgo(days), cohortScores(), vaultHealth().catch(() => null),
  ]);
  const [saved, , claimable] = bal;
  const inPeriod = h.filter((e) => e.at >= since);
  const paidInterest = inPeriod.reduce((s, e) => s + (e.interest ? e.interest - (e.fee || 0) : 0), 0);
  const earned = paidInterest + n(claimable); // interest waiting to be collected counts as earned this period
  const savedIn = inPeriod.filter((e) => e.kind === 'save').reduce((s, e) => s + e.amount, 0);
  const tookOut = inPeriod.filter((e) => e.kind === 'withdraw' || e.kind === 'exit').reduce((s, e) => s + e.amount, 0);
  const balance = n(saved);

  const me = scores.find((s) => s.acc === account.toLowerCase());
  const myScore = me ? me.score : habitScore(h, now);
  const others = scores.filter((s) => s.acc !== account.toLowerCase());
  const beat = others.length ? Math.round((others.filter((s) => s.score < myScore).length / others.length) * 100) : null;

  const naira = rateNow ? { rateNow, rateThen, balanceNgn: balance * rateNow, earnedNgn: earned * rateNow,
    // If these dollars had been held as naira since the start of the period, what would they be worth in dollars now?
    nairaHolderLossUsd: rateThen && rateNow > rateThen ? balance - balance * (rateThen / rateNow) : 0 } : null;

  // Testnet's vault pays interest in lumps, so also show what the same balance earns at Mezo's live mainnet rate.
  const apr = live?.apr30d ?? null;
  const projected = apr ? { apr, period: balance * (apr / 100) * (days / 365), year: balance * (apr / 100), day: balance * (apr / 100) / 365 } : null;

  const sentence = earned > 0
    ? `This ${period} your savings earned $${earned.toFixed(4)}. In plain USDC that money would have earned $0.`
    : balance > 0 ? (projected
      ? `At Mezo's live rate (${apr.toFixed(2)}% a year) your $${balance.toFixed(2)} earns about $${projected.period.toFixed(4)} a ${period}. On the test network, interest lands in lumps whenever Mezo pays the vault; paid so far: $0.`
      : `Your $${balance.toFixed(2)} is saved and starting to earn. Interest shows up as Mezo pays it into the vault.`)
      : h.some((e) => e.kind === 'save') ? 'Your savings are back in your wallet right now. Save again any time to keep earning.'
        : 'You have nothing saved yet. Save any amount to start earning.';

  return {
    period, days, big: { label: `Earned this ${period}`, usd: earned, ngn: naira ? earned * rateNow : null },
    sentence, balance, savedIn, tookOut, projected,
    vsUsdc: { usdcEarned: 0, extra: earned, text: `$${earned.toFixed(4)} more than leaving it in USDC` },
    naira,
    rank: { score: myScore, beatPercent: beat, savers: scores.length,
      text: beat === null ? 'You are one of the first MezGuard savers. Rankings start when more people join.'
        : `Your saving habits beat ${beat}% of MezGuard savers (ranked on steady saving, never on size).` },
    activity: inPeriod.slice(-10).reverse(),
  };
}
