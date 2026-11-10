import { createPublicClient, http, parseAbi } from 'viem';
const base = createPublicClient({ transport: http('https://mainnet.base.org', { timeout: 20000 }) });
const SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
for (const a of ['0x3EB418BdBE95b4b9cf465ecfBD8424685ACD1Bc1', '0x15C465E7dF34f8cA06FDCae0569206cEDf3f4467']) {
  const s = await base.getStorageAt({ address: a, slot: SLOT }); console.log(a.slice(0, 8), 'impl', '0x' + s.slice(26));
}
const pool = '0xb02FdA984EddfF593202eD2B5a6dE043B9b62Ea5';
const pabi = parseAbi(['function token0() view returns (address)', 'function token1() view returns (address)', 'function tickSpacing() view returns (int24)', 'function factory() view returns (address)', 'function fee() view returns (uint24)', 'function stable() view returns (bool)', 'function liquidity() view returns (uint128)']);
for (const f of ['token0', 'token1', 'tickSpacing', 'factory', 'fee', 'stable', 'liquidity']) console.log('pool', f, await base.readContract({ address: pool, abi: pabi, functionName: f }).catch(e => 'n/a'));
