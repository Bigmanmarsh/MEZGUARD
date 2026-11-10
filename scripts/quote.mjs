import { createPublicClient, http, parseAbi, formatUnits, parseUnits } from 'viem';
const base = createPublicClient({ transport: http('https://mainnet.base.org', { timeout: 20000 }) });
const mezo = createPublicClient({ transport: http('https://mezo.drpc.org', { timeout: 20000 }) });
const abi = parseAbi(['function quoteDeliveryPrice(uint16, bytes) view returns (uint256[], uint256)']);
for (const [name, c, addr, peer] of [['base->mezo', base, '0x3EB418BdBE95b4b9cf465ecfBD8424685ACD1Bc1', 50], ['mezo->base', mezo, '0x7efb386675d75280D39Aae42964A6776DE0ee0bD', 30]]) {
  for (const instr of ['0x00', '0x01000101']) {
    try { const [arr, total] = await c.readContract({ address: addr, abi, functionName: 'quoteDeliveryPrice', args: [peer, instr] }); console.log(name, instr, 'fee', formatUnits(total, 18), 'native', arr.map(String)); }
    catch (e) { console.log(name, instr, 'ERR', (e.shortMessage || e.message).split('\n')[0].slice(0, 100)); }
  }
}
// Aerodrome: quote 10 USDC -> MUSD via the Base MUSD/USDC pool
const AERO_ROUTER = '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43';
const AERO_FACTORY = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', MUSD = '0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186';
const rabi = parseAbi(['function getAmountsOut(uint256 amountIn, (address from, address to, bool stable, address factory)[] routes) view returns (uint256[])']);
for (const stable of [true, false]) {
  try {
    const out = await base.readContract({ address: AERO_ROUTER, abi: rabi, functionName: 'getAmountsOut', args: [parseUnits('10', 6), [{ from: USDC, to: MUSD, stable, factory: AERO_FACTORY }]] });
    console.log(`aerodrome ${stable ? 'stable' : 'volatile'} pool: 10 USDC ->`, formatUnits(out[1], 18), 'MUSD');
    const back = await base.readContract({ address: AERO_ROUTER, abi: rabi, functionName: 'getAmountsOut', args: [parseUnits('10', 18), [{ from: MUSD, to: USDC, stable, factory: AERO_FACTORY }]] });
    console.log(`   10 MUSD ->`, formatUnits(back[1], 6), 'USDC');
  } catch (e) { console.log('aero', stable, 'ERR', (e.shortMessage || e.message).split('\n')[0].slice(0, 100)); }
}
