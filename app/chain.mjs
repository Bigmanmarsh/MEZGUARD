// Chain access for MezGuard: Mezo testnet (live app), Mezo mainnet + Base (Guard data, read-only).
import { readFileSync, existsSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, parseAbi, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const root = new URL('..', import.meta.url);
export const DEPLOY = JSON.parse(readFileSync(new URL('deployments/mezoTestnet.json', root)));

export const mezoTestnet = { id: 31611, name: 'Mezo Testnet', nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 }, rpcUrls: { default: { http: [process.env.MEZO_TESTNET_RPC || 'https://rpc.test.mezo.org'] } }, blockExplorers: { default: { name: 'Mezo Explorer', url: 'https://explorer.test.mezo.org' } } };
const t = (url) => http(url, { timeout: 15000, retryCount: 2 });
export const testnet = createPublicClient({ chain: mezoTestnet, transport: t(mezoTestnet.rpcUrls.default.http[0]) });
export const mezo = createPublicClient({ transport: t(process.env.MEZO_RPC || 'https://mezo.drpc.org') });
export const base = createPublicClient({ transport: t(process.env.BASE_RPC || 'https://mainnet.base.org') });

function loadKey() {
  if (process.env.KEEPER_KEY) return process.env.KEEPER_KEY;
  // Locally: secrets/dev-wallet.json. On Render: the same file uploaded as a Secret File (/etc/secrets).
  for (const f of [new URL('secrets/dev-wallet.json', root), '/etc/secrets/dev-wallet.json']) {
    if (existsSync(f)) return JSON.parse(readFileSync(f)).privateKey;
  }
  return null;
}
const key = loadKey();
export const keeper = key ? privateKeyToAccount(key) : null;
export const keeperWallet = keeper ? createWalletClient({ chain: mezoTestnet, account: keeper, transport: t(mezoTestnet.rpcUrls.default.http[0]) }) : null;

export const ABI = {
  factory: parseAbi([
    'function accountOf(address) view returns (address)', 'function predictAccount(address) view returns (address)',
    'function createAccount(address) returns (address)', 'function accountsCount() view returns (uint256)', 'function allAccounts(uint256) view returns (address)',
    'function keeper() view returns (address)', 'function feeConfig() view returns (address,uint256,uint256)',
  ]),
  account: parseAbi([
    'function owner() view returns (address)', 'function guardEnabled() view returns (bool)', 'function nonce() view returns (uint256)',
    'function principal() view returns (uint256)', 'function totalInterestPaid() view returns (uint256)', 'function totalFeesPaid() view returns (uint256)',
    'function balances() view returns (uint256 saved, uint256 idle, uint256 claimable)',
    'function sweep()', 'function withdrawWithSig(uint256,uint256,bytes)', 'function guardExit(uint8)', 'function claim()',
  ]),
  erc20: parseAbi(['function balanceOf(address) view returns (uint256)', 'function transfer(address,uint256) returns (bool)', 'function totalSupply() view returns (uint256)']),
  vault: parseAbi(['function yieldIndex() view returns (uint256)', 'function totalSupply() view returns (uint256)', 'function balanceOf(address) view returns (uint256)']),
};
export const EVENTS = {
  Deposited: parseAbiItem('event Deposited(uint256 amount, uint256 newPrincipal)'),
  Withdrawn: parseAbiItem('event Withdrawn(uint256 amount, uint256 interest, uint256 fee, address indexed to)'),
  InterestClaimed: parseAbiItem('event InterestClaimed(uint256 interest, uint256 fee)'),
  GuardSet: parseAbiItem('event GuardSet(bool enabled)'),
  GuardExit: parseAbiItem('event GuardExit(uint8 indexed reason, uint256 principalOut, uint256 interest, uint256 fee)'),
  AccountCreated: parseAbiItem('event AccountCreated(address indexed owner, address indexed account)'),
};

// Mainnet addresses used by the Guard (verified 2026-11-07, see LOG.md).
export const MAIN = {
  musd: '0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186',
  smusd: '0xb4D498029af77680cD1eF828b967f010d06C51CC',
  vaultGauge: '0x677817bF3e44b90E8F95222F75e2950b7904a401',
  stabilityPool: '0x73245Eff485aB3AAc1158B3c4d8f4b23797B0e32',
  mezoMusdUsdcPool: '0xEd812AEc0Fecc8fD882Ac3eccC43f3aA80A6c356',
  baseMusdUsdcPool: '0xb02FdA984EddfF593202eD2B5a6dE043B9b62Ea5', // Aerodrome CL, token0 USDC, token1 MUSD
  nttBase: '0x3EB418BdBE95b4b9cf465ecfBD8424685ACD1Bc1',
  nttMezo: '0x7efb386675d75280D39Aae42964A6776DE0ee0bD',
};

// Known non-retail wallets, so the Guard does not treat housekeeping as a panic.
export const LABELS = {
  '0xf36593cd2e': 'Mezo multisig (largest sMUSD holder)',
  '0x677817bf3e': 'sMUSD rewards gauge',
  '0x4da9e771': 'Mezo protocol contract',
  '0x73245eff48': 'Mezo Stability Pool',
  '0x0c0944713c': 'Savings vault strategy',
  '0x0000000000': 'Mint / burn',
};
export function label(addr = '') {
  const a = addr.toLowerCase();
  for (const [k, v] of Object.entries(LABELS)) if (a.startsWith(k)) return v;
  return null;
}
