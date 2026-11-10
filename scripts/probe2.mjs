import { createPublicClient, http, parseAbi, formatUnits, encodeFunctionData } from 'viem';
const base = createPublicClient({ transport: http('https://mainnet.base.org', { timeout: 20000 }) });
const mezo = createPublicClient({ transport: http('https://mezo.drpc.org', { timeout: 20000 }) });
const tabi = parseAbi(['function isWormholeRelayingEnabled(uint16) view returns (bool)', 'function isSpecialRelayingEnabled(uint16) view returns (bool)', 'function wormholeRelayer() view returns (address)', 'function specialRelayer() view returns (address)', 'function quoteDeliveryPrice(uint16, (bool shouldSkipRelayerSend)) view returns (uint256)', 'function wormhole() view returns (address)']);
const mabi = parseAbi(['function quoteDeliveryPrice(uint16, bytes) view returns (uint256[], uint256)']);
for (const [n, c, tr, mgr, peer] of [['base', base, '0x15C465E7dF34f8cA06FDCae0569206cEDf3f4467', '0x3EB418BdBE95b4b9cf465ecfBD8424685ACD1Bc1', 50], ['mezo', mezo, '0x62DEeaFEe06c7442A21c93edeDc79A0cb5791C83', '0x7efb386675d75280D39Aae42964A6776DE0ee0bD', 30]]) {
  const r = (f, a = []) => c.readContract({ address: tr, abi: tabi, functionName: f, args: a }).catch(e => 'ERR ' + (e.shortMessage || e.message).split('\n').slice(0, 2).join(' ').slice(0, 120));
  console.log(n, 'whRelay', await r('isWormholeRelayingEnabled', [peer]), 'special', await r('isSpecialRelayingEnabled', [peer]), 'relayer', await r('wormholeRelayer'), 'core', await r('wormhole'));
  for (const skip of [true, false]) console.log('  transceiver quote skip=' + skip, await r('quoteDeliveryPrice', [peer, { shouldSkipRelayerSend: skip }]));
  try { await c.call({ to: mgr, data: encodeFunctionData({ abi: mabi, functionName: 'quoteDeliveryPrice', args: [peer, '0x01000101'] }) }); } catch (e) { console.log('  mgr raw revert:', (e.details || e.shortMessage || '').slice(0, 200), e.data || e.cause?.data || ''); }
}
