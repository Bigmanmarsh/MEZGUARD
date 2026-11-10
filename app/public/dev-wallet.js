// Localhost-only test wallet for automated testing and demo recording (loaded with ?devwallet).
// Makes a throwaway key in this browser; it only ever holds free Mezo testnet tokens.
import { privateKeyToAccount, generatePrivateKey } from 'https://esm.sh/viem@2.21.0/accounts';
import { createWalletClient, http } from 'https://esm.sh/viem@2.21.0';

let k = localStorage.getItem('mg.testkey');
if (!k) { k = generatePrivateKey(); localStorage.setItem('mg.testkey', k); }
const acct = privateKeyToAccount(k);
const RPC = 'https://rpc.test.mezo.org';
const chain = { id: 31611, name: 'Mezo Testnet', nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 }, rpcUrls: { default: { http: [RPC] } } };
const wc = createWalletClient({ account: acct, chain, transport: http(RPC) });
const rpc = (method, params) => fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }).then((r) => r.json()).then((j) => j.result);
window.__walletLog = [];
window.ethereum = {
  isDevWallet: true,
  on() {},
  async request({ method, params }) {
    window.__walletLog.push(method);
    if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [acct.address];
    if (method === 'eth_chainId') return '0x7b7b';
    if (method.startsWith('wallet_')) return null;
    if (method === 'eth_signTypedData_v4') { const d = JSON.parse(params[1]); const { EIP712Domain, ...types } = d.types; return acct.signTypedData({ domain: d.domain, types, primaryType: d.primaryType, message: d.message }); }
    if (method === 'personal_sign') return acct.signMessage({ message: { raw: params[0] } });
    if (method === 'eth_sendTransaction') {
      const t = params[0];
      const est = BigInt(await rpc('eth_estimateGas', [{ from: acct.address, to: t.to, data: t.data }]));
      return wc.sendTransaction({ to: t.to, data: t.data, value: t.value ? BigInt(t.value) : 0n, gas: est * 15n / 10n + 20000n });
    }
    return rpc(method, params);
  },
};
