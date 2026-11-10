// Opens one trove on Mezo TESTNET with faucet BTC to mint test MUSD for the MezGuard tester faucet.
// Usage: node scripts/borrow-test-musd.mjs [--send]   (without --send it only simulates)
import { readFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, parseAbi, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
const chain = { id: 31611, name: 'Mezo Testnet', nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 }, rpcUrls: { default: { http: ['https://rpc.test.mezo.org'] } } };
const pub = createPublicClient({ chain, transport: http(undefined, { timeout: 30000 }) });
const account = privateKeyToAccount(JSON.parse(readFileSync('secrets/dev-wallet.json')).privateKey);
const wallet = createWalletClient({ chain, account, transport: http(undefined, { timeout: 30000 }) });
const BO = '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5', PF = '0x86bCF0841622a5dAC14A313a15f96A95421b9366', HH = '0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6', TM = '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0', MUSD = '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503';
const abi = parseAbi(['function openTrove(uint256,address,address) payable', 'function minNetDebt() view returns (uint256)', 'function fetchPrice() returns (uint256)', 'function getApproxHint(uint256,uint256,uint256) view returns (address,uint256,uint256)', 'function balanceOf(address) view returns (uint256)', 'function getTCR(uint256) view returns (uint256)', 'function checkRecoveryMode(uint256) view returns (bool)', 'function getCurrentICR(address,uint256) view returns (uint256)']);
const price = (await pub.simulateContract({ address: PF, abi, functionName: 'fetchPrice', account })).result;
const minNet = await pub.readContract({ address: BO, abi, functionName: 'minNetDebt' });
const tcr = await pub.readContract({ address: TM, abi, functionName: 'getTCR', args: [price] });
const recovery = await pub.readContract({ address: TM, abi, functionName: 'checkRecoveryMode', args: [price] });
const bal = await pub.getBalance({ address: account.address });
const coll = bal - parseEther('0.002'); // keep 0.002 test BTC for gas
const debt = minNet; // borrow the protocol minimum (net), the 200 MUSD gas deposit is added on top
const icr = Number(coll * price / 10n ** 18n) / Number(debt + parseEther('200')) * 100;
console.log({ wallet: account.address, btcPrice: formatEther(price), minNetDebt: formatEther(minNet), TCR: Number(tcr) / 1e16 + '%', recovery, collateralBTC: formatEther(coll), approxICR: icr.toFixed(1) + '%' });
if (icr < 160) throw new Error('ICR too low, refusing');
const [hint] = await pub.readContract({ address: HH, abi, functionName: 'getApproxHint', args: [BigInt(Math.floor(icr * 1e16)), 50n, 42n] });
const sim = await pub.simulateContract({ address: BO, abi, functionName: 'openTrove', args: [debt, hint, hint], value: coll, account });
console.log('simulation OK');
if (!process.argv.includes('--send')) process.exit(0);
const hash = await wallet.writeContract(sim.request); console.log('tx', hash);
const rc = await pub.waitForTransactionReceipt({ hash, timeout: 120000 }); console.log('status', rc.status, 'block', rc.blockNumber);
console.log('MUSD balance', formatEther(await pub.readContract({ address: MUSD, abi, functionName: 'balanceOf', args: [account.address] })));
