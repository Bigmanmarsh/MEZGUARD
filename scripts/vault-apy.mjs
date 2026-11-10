// Measures the real yield of Mezo's MUSD Savings Rate vault (sMUSD) on mainnet from on-chain history.
import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
const client = createPublicClient({ transport: http(process.env.RPC || 'https://mezo.drpc.org', { timeout: 20000 }) });
const address = '0xb4D498029af77680cD1eF828b967f010d06C51CC';
const abi = parseAbi(['function yieldIndex() view returns (uint256)', 'function totalSupply() view returns (uint256)', 'function yieldToken() view returns (address)', 'function musdToken() view returns (address)', 'function pendingYield() view returns (uint256)', 'function symbol() view returns (string)', 'function strategy() view returns (address)', 'function vaultGauge() view returns (address)']);
const read = (functionName, blockNumber) => client.readContract({ address, abi, functionName, blockNumber });
const latest = await client.getBlock();
const old = await client.getBlock({ blockNumber: latest.number - 100000n });
const perDay = 100000 * 86400 / Number(latest.timestamp - old.timestamp);
console.log('symbol', await read('symbol'), '| yieldToken', await read('yieldToken'), '| musd', await read('musdToken'));
console.log('strategy', await read('strategy'), '| gauge', await read('vaultGauge'));
const supply = await read('totalSupply'); console.log('deposited (sMUSD supply):', formatUnits(supply, 18));
console.log('pendingYield:', formatUnits(await read('pendingYield'), 18));
const idxNow = await read('yieldIndex'); console.log('yieldIndex now', idxNow.toString());
for (const d of [7, 14, 30, 60, 90]) {
  const bn = latest.number - BigInt(Math.round(perDay * d));
  try {
    const idx = await read('yieldIndex', bn); const sup = await read('totalSupply', bn);
    const perUnit = Number(idxNow - idx) / 1e18; // yield per 1 sMUSD (assumes 1e18 index scale)
    console.log(`${d}d: index delta per unit ${perUnit.toFixed(6)} -> simple APR ~ ${(perUnit * 365 / d * 100).toFixed(2)}% | supply then ${formatUnits(sup, 18)}`);
  } catch (e) { console.log(`${d}d: n/a ${e.shortMessage || e.message}`.slice(0, 120)); }
}
