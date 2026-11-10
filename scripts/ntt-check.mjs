// Reads the MUSD Wormhole NTT bridge settings on Base and Mezo (read-only).
import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
const base = createPublicClient({ transport: http('https://mainnet.base.org', { timeout: 20000 }) });
const mezo = createPublicClient({ transport: http('https://mezo.drpc.org', { timeout: 20000 }) });
const abi = parseAbi([
  'function getMode() view returns (uint8)', 'function token() view returns (address)', 'function chainId() view returns (uint16)',
  'function getPeer(uint16) view returns ((bytes32 peerAddress, uint8 tokenDecimals))',
  'function getCurrentOutboundCapacity() view returns (uint256)', 'function getCurrentInboundCapacity(uint16) view returns (uint256)',
  'function quoteDeliveryPrice(uint16, bytes) view returns (uint256[], uint256)', 'function getThreshold() view returns (uint8)',
  'function getTransceivers() view returns (address[])', 'function isPaused() view returns (bool)', 'function rateLimitDuration() view returns (uint64)',
]);
const sides = { base: [base, '0x3EB418BdBE95b4b9cf465ecfBD8424685ACD1Bc1'], mezo: [mezo, '0x7efb386675d75280D39Aae42964A6776DE0ee0bD'] };
const ids = {};
for (const [name, [c, address]] of Object.entries(sides)) {
  const r = (f, a = []) => c.readContract({ address, abi, functionName: f, args: a }).catch(e => 'ERR ' + (e.shortMessage || e.message).slice(0, 60));
  ids[name] = await r('chainId');
  console.log(`== ${name}: wormholeChainId ${ids[name]} | mode ${await r('getMode')} (0=locking,1=burning) | token ${await r('token')} | paused ${await r('isPaused')}`);
  console.log('  transceivers', await r('getTransceivers'), 'threshold', await r('getThreshold'), 'rateLimitDuration(s)', String(await r('rateLimitDuration')));
  const out = await r('getCurrentOutboundCapacity'); console.log('  outbound capacity now:', typeof out === 'bigint' ? formatUnits(out, 18) : out, 'MUSD');
}
for (const [name, [c, address]] of Object.entries(sides)) {
  const other = name === 'base' ? ids.mezo : ids.base;
  const r = (f, a = []) => c.readContract({ address, abi, functionName: f, args: a }).catch(e => 'ERR ' + (e.shortMessage || e.message).slice(0, 80));
  console.log(`== ${name} -> peer chain ${other}:`, await r('getPeer', [other]));
  const inb = await r('getCurrentInboundCapacity', [other]); console.log('  inbound capacity from peer:', typeof inb === 'bigint' ? formatUnits(inb, 18) : inb);
  for (const instr of ['0x01000101', '0x01000100', '0x']) { // relaying on / off variants of TransceiverInstructions
    const q = await r('quoteDeliveryPrice', [other, instr]);
    console.log(`  quote (instr ${instr}):`, Array.isArray(q) ? `total ${formatUnits(q[1], 18)} native (${q[0].map(x => formatUnits(x, 18)).join(',')})` : q);
  }
}
const gp = await mezo.getGasPrice(); const bgp = await base.getGasPrice();
console.log('gas price mezo', formatUnits(gp, 9), 'gwei(BTC units) | base', formatUnits(bgp, 9), 'gwei');
