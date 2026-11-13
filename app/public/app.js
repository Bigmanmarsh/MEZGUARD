// MezGuard web app. No libraries: talks to the wallet through window.ethereum and to our server's API.
const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const S = { cfg: null, owner: null, viewing: null, acct: null, guard: null, whales: null, period: 'week', timer: null, net: 'main' };
// Two networks: 'main' = Mezo mainnet, savers use Mezo's official vault from their own wallet (the default);
// 'test' = free test network with full MezGuard accounts (gasless, automatic Guard exit, fee contract).
const isMain = () => S.net === 'main';
const NET = {
  main: { hex: '0x7b7c', id: 31612, name: 'Mezo', label: 'Mezo mainnet' },
  test: { hex: '0x7b7b', id: 31611, name: 'Mezo Testnet', label: 'Test network (free)' },
};
const SEL = { approve: '0x095ea7b3', deposit: '0xb6b55f25', withdraw: '0x2e1a7d4d', claimYield: '0x406cf229' };
const word = (hexOrBig) => BigInt(hexOrBig).toString(16).padStart(64, '0');
const explorerUrl = () => (isMain() ? S.cfg.main.explorer : S.cfg.chain.explorer);
function setNet(net, { keepViewing = false } = {}) {
  S.net = net; S.acct = null; if (!keepViewing) S.viewing = null;
  try { localStorage.setItem('mg.net', net); } catch {}
  renderWallet(); route();
}

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const usd = (n, d) => { n = Number(n || 0); d ??= Math.abs(n) > 0 && Math.abs(n) < 1 ? 4 : 2; return '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); };
const ngn = (n) => (n == null ? '' : '₦' + (Math.abs(n) < 100 ? n.toFixed(2) : Math.round(n).toLocaleString('en-NG')));
const short = (a) => (a ? a.slice(0, 6) + '…' + a.slice(-4) : '');
const ago = (t) => { const s = Math.max(1, (Date.now() - new Date(t).getTime()) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : s < 129600 ? '1 day ago' : Math.round(s / 86400) + ' days ago'; };
const STATUS = { ok: 'All good', watch: 'Keep an eye', act: 'Danger', unknown: 'Checking…' };
function toWei(str) {
  const [i, f = ''] = String(str).trim().split('.');
  if (!/^\d*$/.test(i) || !/^\d*$/.test(f) || (!i && !f)) throw new Error('Enter a valid amount');
  return (BigInt(i || '0') * 10n ** 18n + BigInt((f + '0'.repeat(18)).slice(0, 18))).toString();
}
const hexUtf8 = (s) => '0x' + [...new TextEncoder().encode(s)].map((b) => b.toString(16).padStart(2, '0')).join('');
function toast(msg, ms = 4000) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), ms); }
async function api(path, body) {
  const r = await fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({ error: 'Server did not answer' }));
  if (!r.ok) throw new Error(j.error || 'Something went wrong');
  return j;
}

// ---------- wallet ----------
const eth = () => window.ethereum;
async function connect() {
  if (!eth()) { sheet(`<h2>You need a wallet</h2><p class="muted">Install MetaMask (or any EVM wallet) on your phone or browser, then come back and tap Connect.</p><p class="small muted">No wallet yet? You can still look around a live example account.</p><div class="row" style="margin-top:14px"><a class="btn" href="https://metamask.io/download/" target="_blank" rel="noopener">Get MetaMask</a><button class="btn ghost" data-act="example">See example</button></div>`); return; }
  const [a] = await eth().request({ method: 'eth_requestAccounts' });
  try { localStorage.removeItem('mg.off'); } catch {}
  await ensureChain();
  setOwner(a);
}
async function ensureChain() {
  const n = NET[S.net];
  const id = await eth().request({ method: 'eth_chainId' });
  if (id === n.hex) return;
  try { await eth().request({ method: 'wallet_switchEthereumChain', params: [{ chainId: n.hex }] }); }
  catch (e) {
    if (e.code !== 4902 && !/unrecognized|not added|unknown chain/i.test(e.message || '')) throw e;
    const c = isMain() ? S.cfg.main : S.cfg.chain;
    await eth().request({ method: 'wallet_addEthereumChain', params: [{ chainId: n.hex, chainName: n.name, nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 }, rpcUrls: [c.rpc], blockExplorerUrls: [c.explorer] }] });
  }
}
// Send a transaction from the user's own wallet and wait until Mezo includes it.
async function sendTx(to, data) {
  await ensureChain();
  // Mezo enforces a calldata gas floor and public nodes sometimes estimate low: give the wallet headroom.
  const tx = { from: S.owner, to, data };
  try { const est = BigInt(await eth().request({ method: 'eth_estimateGas', params: [tx] })); tx.gas = '0x' + (est * 15n / 10n + 20000n).toString(16); } catch { /* let the wallet estimate */ }
  const hash = await eth().request({ method: 'eth_sendTransaction', params: [tx] });
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const rc = await eth().request({ method: 'eth_getTransactionReceipt', params: [hash] }).catch(() => null);
    if (rc) { if (rc.status !== '0x1') throw new Error('Mezo rejected the transaction'); return hash; }
  }
  return hash;
}
// Tell the server about a mainnet vault action; it checks it on-chain before counting it on the Proof page.
const reportTx = (hash) => api('/api/main/tx', { owner: S.owner, hash }).catch(() => {});
function setOwner(a) {
  S.owner = a; S.viewing = null; S.acct = null;
  try { localStorage.setItem('mg.owner', a); } catch {}
  renderWallet(); route();
}
const who = () => S.owner || S.viewing;
const readOnly = () => !S.owner;
async function signTyped(data) { await ensureChain(); return eth().request({ method: 'eth_signTypedData_v4', params: [S.owner, JSON.stringify(data)] }); }
async function signAction(action) { const ts = Date.now(); const signature = await eth().request({ method: 'personal_sign', params: [hexUtf8(`MezGuard: ${action} ${ts}`), S.owner] }); return { ts, signature }; }
function renderWallet() {
  const b = $('#wallet');
  b.textContent = S.owner ? short(S.owner) : S.viewing ? 'Example · Connect' : 'Connect wallet';
  b.onclick = S.owner ? () => sheet(`<h2>Your wallet</h2><p class="mono">${esc(S.owner)}</p><p class="small muted">MezGuard never holds your keys. ${isMain() ? 'Your savings sit in Mezo\'s official savings vault, in your own name.' : 'Your savings account is a contract only you control.'} <a href="${esc(S.acct?.explorer || '#')}" target="_blank" rel="noopener">See it on the explorer</a>.</p><button class="btn ghost" data-act="disconnect" style="margin-top:12px">Disconnect</button>`) : () => connect().catch((e) => toast(e.message));
  const n = $('#net');
  n.textContent = isMain() ? 'Mainnet ▾' : 'Test ▾';
  n.className = 'chip net ' + (isMain() ? 'net-main' : 'net-test');
  const banner = S.viewing ? `You are looking at ${isMain() ? 'a real Mezo saver' : 'a live example account on the test network'} (read only). <a href="#" data-act="connect">Connect your wallet</a> to start saving.`
    : !isMain() ? `Free test network: test dollars, real Guard data. <a href="#" data-act="net-main">Switch to Mezo mainnet</a> to save real MUSD.` : '';
  $('#banner').hidden = !banner;
  $('#banner').innerHTML = banner;
}
function netSheet() {
  sheet(`<h2>Choose network</h2>
  <button class="btn ${isMain() ? '' : 'ghost'}" data-act="net-main" style="text-align:left">Mezo mainnet<br><span class="small" style="font-weight:400">Real MUSD in Mezo's official savings vault. About $0.03 in BTC fees per action.</span></button>
  <button class="btn ${isMain() ? 'ghost' : ''}" data-act="net-test" style="text-align:left;margin-top:10px">Test network (free)<br><span class="small" style="font-weight:400">Free test dollars. Try the full MezGuard account: no fees, automatic Guard exit.</span></button>`);
}

// ---------- sheets ----------
function sheet(html) {
  const s = $('#sheet');
  s.innerHTML = `<div role="dialog" aria-modal="true">${html}</div>`;
  s.hidden = false;
  s.onclick = (e) => { if (e.target === s) closeSheet(); };
  $('input', s)?.focus();
}
const closeSheet = () => { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; };

function saveSheet() {
  const max = S.acct?.wallet.musd || 0;
  sheet(`<h2>Save dollars</h2><p class="muted small">${isMain() ? "From your wallet into Mezo's official savings vault. Your wallet asks you to confirm (about $0.03 in BTC fees)." : 'From your wallet into your MezGuard savings. One signature, no fee.'}</p>
  <label class="amount"><span>$</span><input id="amt" inputmode="decimal" placeholder="0" autocomplete="off"></label>
  <p class="small muted">In your wallet: ${usd(max, 2)} MUSD · <a href="#" data-act="max" data-v="${max}">Use all</a></p>
  <button class="btn" data-act="do-save" style="margin-top:12px">Save</button>`);
}
function withdrawSheet() {
  const saved = S.acct?.saved || 0;
  sheet(`<h2>Take out</h2><p class="muted small">Straight back to your own wallet, with any interest earned. ${isMain() ? 'Confirm in your wallet (about $0.03 in BTC fees).' : 'One signature, no fee.'}</p>
  <label class="amount"><span>$</span><input id="amt" inputmode="decimal" placeholder="0" autocomplete="off"></label>
  <p class="small muted">Saved: ${usd(saved, 2)} · <a href="#" data-act="max" data-v="all">Take out all</a></p>
  <button class="btn" data-act="do-withdraw" style="margin-top:12px">Take out</button>`);
}
function feedbackSheet() {
  if (!S.owner) { toast('Connect your wallet first, so your feedback counts as a real tester'); return; }
  S.stars = 0;
  sheet(`<h2>How was MezGuard?</h2><p class="muted small">Your wallet signs it (free, no fee) so we know it came from a real tester. Shown on the Proof page with your wallet shortened.</p>
  <div class="stars" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" aria-label="${n} star${n > 1 ? 's' : ''}" data-act="star" data-v="${n}">★</button>`).join('')}</div>
  <label class="small muted" for="fb-worked">What worked well?</label><textarea id="fb-worked" maxlength="400" rows="2" placeholder="e.g. saving took one tap"></textarea>
  <label class="small muted" for="fb-broke">What broke or confused you?</label><textarea id="fb-broke" maxlength="400" rows="2" placeholder="e.g. I didn't get what the Guard does"></textarea>
  <button class="btn" data-act="do-feedback" style="margin-top:12px">Send feedback</button>`);
}
async function sendFeedback() {
  if (!S.stars) throw new Error('Tap 1 to 5 stars first');
  const sig = await signAction('feedback');
  await api('/api/feedback', { owner: S.owner, rating: S.stars, worked: $('#fb-worked').value, broke: $('#fb-broke').value, net: isMain() ? 'main' : 'test', page: location.pathname, ...sig });
  closeSheet(); toast('Thank you! Your feedback is on the Proof page.');
  try { localStorage.setItem('mg.fb', '1'); } catch {}
}
async function busy(btn, label, fn) {
  const old = btn.textContent; btn.disabled = true; btn.textContent = label;
  try { await fn(); } catch (e) { toast(e.code === 4001 ? 'You cancelled in your wallet' : e.message); } finally { btn.disabled = false; btn.textContent = old; }
}
// Mainnet: the saver's own wallet deposits into Mezo's official vault (approve once if needed, then deposit).
async function mainSave(btn, v, value) {
  if (BigInt(value) > BigInt(S.acct.wallet.musdWei)) value = S.acct.wallet.musdWei; // "Use all" rounding: never ask for more than the wallet has
  if (BigInt(value) === 0n) throw new Error('You have no MUSD in this wallet yet');
  if (S.acct.wallet.btc <= 0) throw new Error('You need a little BTC on Mezo for fees (about $0.03)');
  const vault = S.cfg.main.vault;
  if (BigInt(S.acct.allowanceWei) < BigInt(value)) {
    btn.textContent = 'Step 1 of 2: allow the vault…';
    await sendTx(S.cfg.main.musd, SEL.approve + word(vault) + word(value));
  }
  btn.textContent = BigInt(S.acct.allowanceWei) < BigInt(value) ? 'Step 2 of 2: saving…' : 'Saving on Mezo…';
  const hash = await sendTx(vault, SEL.deposit + word(value));
  await reportTx(hash);
  closeSheet(); toast(`Saved ${usd(v, 2)} in Mezo's vault. It is earning now.`); refresh();
}
// If part of the savings is staked in Mezo's gauge, unstake just what is needed first, then withdraw from the vault.
async function vaultExit(btn, wei) {
  const inVault = BigInt(S.acct.inVaultWei), staked = BigInt(S.acct.stakedWei);
  let want = BigInt(wei);
  if (want > inVault + staked) want = inVault + staked;
  if (want > inVault && staked > 0n) {
    const unstake = want - inVault > staked ? staked : want - inVault;
    if (btn) btn.textContent = 'Step 1 of 2: unstaking from the gauge…';
    await sendTx(S.cfg.main.gauge, SEL.withdraw + word(unstake));
    if (btn) btn.textContent = 'Step 2 of 2: sending to your wallet…';
  }
  return sendTx(S.cfg.main.vault, SEL.withdraw + word(want));
}
async function mainWithdraw(btn, wei, amount) {
  btn.textContent = 'Sending to your wallet…';
  const hash = await vaultExit(btn, wei);
  await reportTx(hash);
  closeSheet(); toast(`${usd(amount, 2)} is back in your wallet, plus any interest.`); refresh();
}
async function doSave(btn) {
  let v = $('#amt').value, value = toWei(v);
  if (BigInt(value) === 0n) throw new Error('Enter an amount');
  if (isMain()) return mainSave(btn, v, value);
  if (S.acct.wallet.musdWei && BigInt(value) > BigInt(S.acct.wallet.musdWei)) {
    if (BigInt(S.acct.wallet.musdWei) === 0n) throw new Error('Your wallet has no test MUSD yet. Close this and tap "Send me 20 test MUSD".');
    value = S.acct.wallet.musdWei; v = weiToStr(value); // "Use all" rounding: never ask for more than the wallet has
  }
  const deadline = Math.floor(Date.now() / 1000) + 1800;
  const signature = await signTyped({
    types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
      Permit: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
    primaryType: 'Permit', domain: { name: 'Mezo USD', version: '1', chainId: 31611, verifyingContract: S.cfg.musd },
    message: { owner: S.owner, spender: S.cfg.keeper, value, nonce: String(S.acct.permitNonce), deadline: String(deadline) },
  });
  btn.textContent = 'Saving on Mezo…';
  const r = await api('/api/save', { owner: S.owner, amount: v, deadline, signature });
  closeSheet(); toast(`Saved ${usd(v, 2)}. It is earning now.`); confetti(r.explorer); refresh();
}
async function doWithdraw(btn) {
  const raw = $('#amt').value;
  const all = raw === 'all' || Number(raw) >= S.acct.saved;
  const wei = all ? S.acct.savedWei : toWei(raw);
  if (BigInt(wei) === 0n) throw new Error('Enter an amount');
  if (isMain()) return mainWithdraw(btn, wei, all ? weiToStr(wei) : raw);
  const deadline = Math.floor(Date.now() / 1000) + 1800;
  const signature = await signTyped({
    types: { EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
      Withdraw: [{ name: 'account', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }] },
    primaryType: 'Withdraw', domain: { name: 'MezGuardAccount', version: '1', chainId: 31611, verifyingContract: S.acct.account },
    message: { account: S.acct.account, amount: wei, nonce: String(S.acct.nonce), deadline: String(deadline) },
  });
  btn.textContent = 'Sending to your wallet…';
  const amount = all ? weiToStr(wei) : raw;
  const r = await api('/api/withdraw', { owner: S.owner, amount, deadline, signature });
  closeSheet(); toast(`${usd(amount, 2)} is back in your wallet.`); confetti(r.explorer); refresh();
}
function weiToStr(wei) { const b = BigInt(wei); const i = b / 10n ** 18n, f = (b % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, ''); return f ? `${i}.${f}` : `${i}`; }
function confetti(link) { if (link) setTimeout(() => toast('Done on Mezo. Proof: ' + link.split('/tx/')[1].slice(0, 10) + '… (see Activity)', 5000), 4200); }

// ---------- data ----------
async function loadAcct(fresh) { if (!who()) return null; S.acct = await api((isMain() ? '/api/main/account?owner=' : '/api/account?owner=') + who() + (fresh ? '&fresh=1' : '')); return S.acct; }
async function loadGuard() { S.guard = await api('/api/guard'); return S.guard; }
function refresh(again = true) { loadAcct(again).then(() => route(true)).catch(() => {}); if (again) setTimeout(() => refresh(false), 5000); }
const apr = () => (S.guard?.vault?.apr30d ? S.guard.vault.apr30d : 4.8);

// ---------- views ----------
const footer = () => `<p class="foot">${isMain() ? "Mezo mainnet · Mezo's official MUSD savings vault" : 'Free test network · real Mezo mainnet data in the Guard'} · <a href="/proof" data-link>Proof</a> · <a href="https://github.com/Bigmanmarsh/MEZGUARD" target="_blank" rel="noopener">Code</a> · <a href="#" data-act="feedback">Give feedback</a></p>`;
const fbGiven = () => { try { return !!localStorage.getItem('mg.fb'); } catch { return false; } };
const feedbackCard = () => fbGiven() ? '' : `<div class="card"><div class="toggle"><div><h2>Testing MezGuard?</h2><p class="small muted">Tell us what worked and what broke. Takes 30 seconds, signed by your wallet, no fee.</p></div><button class="btn ghost small" data-act="feedback">Feedback</button></div></div>`;
function guardPill(g) { const st = g?.overall || 'unknown'; return `<span class="pill s-${st}">${STATUS[st]}</span>`; }

async function home() {
  if (!who()) {
    const g = S.guard || await loadGuard().catch(() => null);
    // The Guard may still be warming up on the server: fill in the live numbers as soon as they land.
    if (!g?.vault?.apr30d || g.overall === 'unknown') setTimeout(() => loadGuard().then((x) => { if (x?.vault?.apr30d && !who() && location.pathname === '/') route(true); }).catch(() => {}), 4000);
    return `<h1>Your dollars, earning about ${apr().toFixed(1)}% a year. With a Guard watching.</h1>
    <p class="muted">Save in MUSD, the Bitcoin-backed dollar of Mezo. No exchange holds your money: it sits in a savings account only you control.</p>
    <div class="card"><ol class="steps">${isMain()
      ? "<li>Connect your wallet on Mezo</li><li>Tap <b>Save</b>: your MUSD goes into Mezo's official savings vault, in your name</li><li>Interest grows every day. The Guard warns you and brings your money home in one tap if something goes wrong.</li>"
      : '<li>Connect your wallet</li><li>Get free test dollars, tap <b>Save</b> and sign once (no fee)</li><li>Interest grows every day. The Guard moves your money home by itself if something goes wrong.</li>'}</ol>
    <button class="btn" data-act="connect">Connect wallet</button>
    <button class="btn ghost" data-act="${isMain() ? 'net-test' : 'example'}" style="margin-top:10px">${isMain() ? 'Try it free first (test network)' : 'See a live example first'}</button></div>
    <a class="card" href="/guard" data-link style="display:block;text-decoration:none;color:inherit"><div class="toggle"><div><p class="label">The Guard right now</p><b>MUSD ${g?.peg?.price ? usd(g.peg.price, 3) : '…'}</b> <span class="muted small">· savings vault ${g?.vault?.apr30d ? g.vault.apr30d.toFixed(2) + '% a year' : '…'}</span></div>${guardPill(g)}</div></a>
    <div class="card small muted"><b style="color:var(--ink)">Free for small savers.</b> Up to $100 saved: no fee at all. Above that, MezGuard accounts keep 10% of the interest you earn, never any of your deposit.${isMain() ? ' Saving straight into Mezo\'s vault (beta) is free.' : ''}</div>${footer()}`;
  }
  const a = S.acct || await loadAcct();
  if (!S.guard) loadGuard().then(() => route(true)).catch(() => {});
  const rate = S.cfg?.ngn;
  const ro = readOnly();
  const needsMoney = !ro && a.wallet.musd < 0.01 && a.saved === 0;
  return `<div class="card"><p class="label">Your savings</p><div class="big">${usd(a.saved, 2)}</div>
    <p class="ngn">${rate ? ngn(a.saved * rate) : ''}</p>
    <p class="sub">${a.claimable > 0 ? `<b style="color:var(--brand)">+${usd(a.claimable)}</b> interest earned so far` : a.saved > 0 ? (isMain() && a.staked >= a.saved * 0.99 ? 'Staked in Mezo\'s gauge, earning MEZO rewards' : `Earning about ${apr().toFixed(1)}% a year`) : a.history?.some((e) => e.kind === 'save') ? 'All back in your own wallet. Save again any time.' : 'Nothing saved yet'}</p>
    ${isMain() && a.staked > 0 ? `<p class="small muted">${usd(a.staked, 2)} of it is staked in Mezo's gauge for extra rewards: <b style="color:var(--brand)">${a.mezoRewards.toLocaleString('en-US', { maximumFractionDigits: 2 })} MEZO</b> earned so far.</p>` : ''}
    <div class="row" style="margin-top:16px"><button class="btn" data-act="save" ${ro ? 'disabled' : ''}>Save</button><button class="btn ghost" data-act="withdraw" ${ro || a.saved === 0 ? 'disabled' : ''}>Take out</button></div>
    ${ro ? '' : `<p class="small muted" style="margin-top:10px">In your wallet: ${usd(a.wallet.musd, 2)} MUSD${isMain() && a.claimable > 0.0001 ? ' · <a href="#" data-act="claim">Collect interest now</a>' : ''}</p>`}</div>
    ${needsMoney && isMain() ? `<div class="card"><h2>Get MUSD</h2><p class="muted small">MUSD is Mezo's Bitcoin-backed dollar. Borrow it against your BTC in the Mezo app, then come back and tap Save. You also need a little BTC on Mezo for fees (about $0.03 per action).</p>
      <div class="row" style="margin-top:12px"><a class="btn" href="https://mezo.org" target="_blank" rel="noopener">Open Mezo</a><button class="btn ghost" data-act="net-test">Try free first</button></div></div>` : ''}
    ${needsMoney && !isMain() ? `<div class="card"><h2>Get test dollars</h2><p class="muted small">This is the Mezo test network, so the dollars are free test MUSD. We'll send you ${a.dripped ? 'nothing more (one gift per wallet)' : '20 test MUSD and a little test BTC for fees'}.</p>${a.dripped ? '' : '<button class="btn" data-act="onboard">Send me 20 test MUSD</button>'}</div>` : ''}
    <a class="card" href="/guard" data-link style="display:block;text-decoration:none;color:inherit"><div class="toggle"><div><p class="label">Guard</p><b>${isMain() ? 'Watching your savings' : a.guardEnabled ? 'Auto-protect is on' : 'Auto-protect is off'}</b><p class="small muted">${S.guard ? esc(headline(S.guard)) : 'Checking Mezo…'}</p></div>${guardPill(S.guard)}</div></a>
    ${ro ? '' : telegramCard()}
    ${ro || !a.history?.length ? '' : feedbackCard()}
    <div class="card"><h2>Activity</h2>${activity(a.history)}<p class="small muted" style="margin-top:8px">${isMain() ? 'Your wallet on Mezo' : 'Your savings account'}: <a href="${esc(a.explorer)}" target="_blank" rel="noopener">${short(a.account)}</a></p></div>${footer()}`;
}
function activity(h) {
  if (!h?.length) return '<p class="muted small">Nothing yet. Your saves, interest and Guard actions will show here.</p>';
  return `<ul class="list">${h.map((e) => `<li><div class="toggle"><span>${esc(e.text)}</span><a class="small" href="${explorerUrl()}/tx/${e.tx}" target="_blank" rel="noopener">proof</a></div><div class="when">${ago(e.at)}</div></li>`).join('')}</ul>`;
}
function headline(g) {
  if (g.overall === 'ok') return 'MUSD is holding at $1 and the savings vault is healthy.';
  if (g.peg.status === 'act') return `MUSD fell to ${usd(g.peg.price, 3)}. The Guard is ready to move savings home.`;
  if (g.peg.status === 'watch') return `MUSD is a little under $1 (${usd(g.peg.price, 3)}). Watching closely.`;
  if (g.vault.status !== 'ok') return 'The savings vault is moving fast. Watching closely.';
  if (g.bridge.status !== 'ok') return 'The MUSD bridge to Base is paused. Money on Mezo is not affected.';
  if (g.chain.status !== 'ok') return 'Mezo is slow to make blocks right now.';
  return 'Some checks could not load. Trying again.';
}

async function guard() {
  const g = S.guard && Date.now() - S.guard.at < 60_000 ? S.guard : await loadGuard();
  // Whale Watch can be slow on public RPCs: show the Guard now and fill whales in when they arrive.
  api('/api/whales').then((w) => { S.whales = w; const el = $('#whales'); if (el) el.innerHTML = whalesHtml(w); }).catch(() => { const el = $('#whales'); if (el && !S.whales) el.innerHTML = '<p class="muted small">Whale data is busy. Try again in a minute.</p>'; });
  if (who() && !S.acct) await loadAcct().catch(() => {});
  const a = S.acct, ro = readOnly();
  const row = (name, st, value, plain) => `<div class="check"><div><b>${name}</b><span class="small muted">${plain}</span></div><div style="text-align:right"><span class="pill s-${st}">${value}</span></div></div>`;
  const p = g.peg, v = g.vault, c = g.chain, b = g.bridge;
  return `<div class="status s-${g.overall}"><p class="label">Guard · live Mezo mainnet</p><h2>${STATUS[g.overall]}</h2><p>${esc(headline(g))}</p></div>
  <div class="card"><h2>What the Guard checks</h2>
    ${row('Price of MUSD', p.status, p.price ? usd(p.price, 3) : '…', p.price ? `Checked on 2 exchanges (Base ${usd(p.basePrice, 3)}${p.mezoPrice ? ', Mezo ' + usd(p.mezoPrice, 3) : ''}). Danger below $0.97.` : 'Loading')}
    ${row('Savings vault', v.status, v.apr30d ? v.apr30d.toFixed(2) + '%/yr' : '…', v.supply ? `${usd(v.supply, 0)} saved by everyone, ${v.change24h >= 0 ? 'up' : 'down'} ${Math.abs(v.change24h).toFixed(1)}% today.` : 'Loading')}
    ${row('Mezo network', c.status, c.ageSec != null ? (c.ageSec < 60 ? 'Running' : c.ageSec + 's') : '…', c.block ? `Last block ${c.ageSec}s ago (#${c.block.toLocaleString()}).` : 'Loading')}
    ${row('Bridge to Base', b.status, b.status === 'ok' ? 'Open' : b.status === 'watch' ? 'Paused' : '…', 'The road for MUSD between Base and Mezo.')}
  </div>
  ${isMain() ? `<div class="card"><b>Move my money home</b><p class="small muted">When the Guard sees danger, it warns you here and on Telegram. One tap brings all your savings and interest out of the vault into <b>your own wallet</b>.</p>
    <button class="btn ${g.overall === 'act' ? '' : 'ghost'}" data-act="move-home" style="margin-top:12px" ${ro || !a?.saved ? 'disabled' : ''}>Move my money home${a?.saved ? ' (' + usd(a.saved, 2) + ')' : ''}</button>
    <p class="small muted" style="margin-top:8px">Want the Guard to do it for you, even while you sleep? MezGuard accounts exit automatically. <a href="#" data-act="net-test">Try it free on the test network</a>.</p></div>` : `
  <div class="card"><div class="toggle"><div><b>Auto-protect</b><p class="small muted">If MUSD stays below $0.97 for 3 minutes, or the vault looks unsafe, your savings go back to <b>your own wallet</b>. Never anywhere else.</p></div>
    <button class="switch" role="switch" aria-checked="${a ? a.guardEnabled : true}" aria-label="Auto-protect" data-act="toggle-guard" ${ro || !a?.exists ? 'disabled' : ''}></button></div>
    <button class="btn ghost" data-act="drill" style="margin-top:12px" ${ro || !a?.saved ? 'disabled' : ''}>Test my Guard now</button>
    <p class="small muted" style="margin-top:6px">A real drill: the Guard moves your savings home, so you can see it work. Save again any time.</p></div>`}
  ${telegramCard()}
  <div class="card"><h2>Whale Watch</h2><p class="small muted">Big money moving around MUSD on Mezo mainnet and Base, explained in plain words. We follow whales to protect you, never to copy trades.</p>
    <div id="whales">${S.whales ? whalesHtml(S.whales) : '<p class="muted small">Looking for big moves…</p>'}</div>
  </div>${footer()}`;
}
function whalesHtml(w) {
  return `${w?.stability ? `<div class="mini" style="margin:10px 0"><span class="small muted">Mezo safety pool (covers bad loans)</span><b>${usd(w.stability.total, 0)}</b><span class="small muted">${w.stability.change24h >= 0 ? 'up' : 'down'} ${Math.abs(w.stability.change24h).toFixed(2)}% today</span></div>` : ''}
    ${w?.moves?.length ? `<ul class="list">${w.moves.slice(0, 8).map((m) => `<li><div class="toggle"><b>${m.kind === 'deposit' ? 'Saved' : m.kind === 'withdraw' ? 'Withdrew' : 'Sold'} ${usd(m.amount, 0)}</b><a class="small" href="${esc(m.tx)}" target="_blank" rel="noopener">proof</a></div><div class="small">${esc(m.meaning)}</div><div class="when">${esc(m.where)} · ${m.label ? esc(m.label) : short(m.who)}${m.at ? ' · ' + ago(m.at) : ''}</div></li>`).join('')}</ul>` : '<p class="muted small">No big moves in the last few hours. Calm water.</p>'}`;
}
function telegramCard() {
  if (readOnly()) return '';
  if (!S.cfg.telegramBot) return `<div class="card"><h2>Alerts on Telegram</h2><p class="small muted">Sign in with Telegram to get a message only when your savings need attention. Coming online shortly.</p></div>`;
  if (S.acct?.telegram) return `<div class="card"><div class="toggle"><div><h2>Alerts on Telegram</h2><p class="small muted">On. We message you only when it matters.</p></div><button class="btn ghost small" data-act="tg-unlink">Turn off</button></div></div>`;
  setTimeout(mountTelegram, 0);
  return `<div class="card"><h2>Alerts on Telegram</h2><p class="small muted">Sign in with Telegram. We send a message only when your savings need attention: a price drop, a Guard move, your weekly report.</p><div id="tg"></div></div>`;
}
function mountTelegram() {
  const box = $('#tg'); if (!box || box.childElementCount) return;
  const s = document.createElement('script');
  s.async = true; s.src = 'https://telegram.org/js/telegram-widget.js?22';
  s.dataset.telegramLogin = S.cfg.telegramBot; s.dataset.size = 'large'; s.dataset.onauth = 'onTelegramAuth(user)'; s.dataset.requestAccess = 'write';
  box.appendChild(s);
}
window.onTelegramAuth = async (tg) => {
  try { const sig = await signAction('link telegram'); const r = await api('/api/telegram', { owner: S.owner, tg, ...sig }); toast(`Telegram alerts on for ${r.name}`); refresh(); }
  catch (e) { toast(e.message); }
};

async function reports() {
  if (!who()) return `<h1>Reports</h1><div class="card"><p>Every week and month you get one clear number: what your savings earned, in dollars and naira, and how your saving habits compare to other savers.</p><button class="btn" data-act="connect" style="margin-top:12px">Connect wallet</button><button class="btn ghost" data-act="example" style="margin-top:10px">See an example report</button></div>${footer()}`;
  if (!S.acct) await loadAcct();
  if (!S.acct.exists || (isMain() && !S.acct.saved && !S.acct.history.length)) return `<h1>Reports</h1><div class="card"><p class="muted">Save something first. Your first report shows up right after.</p></div>${footer()}`;
  const r = await api(`${isMain() ? '/api/main/report' : '/api/report'}?owner=${who()}&period=${S.period}`);
  const n = r.naira;
  // Nothing paid yet: lead with what this balance earns at Mezo's live rate, clearly labelled.
  if (r.big.usd < 0.00005 && r.projected && r.balance > 0) {
    r.big = { label: `Earns this ${r.period} at today's rate`, usd: r.projected.period, ngn: n ? r.projected.period * n.rateNow : null };
    r.vsUsdc.extra = r.projected.period;
  }
  return `<div class="seg" role="group" aria-label="Report period"><button data-act="period" data-v="week" aria-pressed="${S.period === 'week'}">This week</button><button data-act="period" data-v="month" aria-pressed="${S.period === 'month'}">This month</button></div>
  <div class="card"><p class="label">${esc(r.big.label)}</p><div class="big" style="color:var(--brand)">+${usd(r.big.usd)}</div>${r.big.ngn != null ? `<p class="ngn">+${ngn(r.big.ngn)}</p>` : ''}<p style="margin-top:8px">${esc(r.sentence)}</p></div>
  <div class="grid2"><div class="mini"><span class="small muted">vs plain USDC</span><b>+${usd(r.vsUsdc.extra)}</b><span class="small muted">USDC in a wallet earns $0</span></div>
    <div class="mini"><span class="small muted">Saved now</span><b>${usd(r.balance, 2)}</b><span class="small muted">${n ? ngn(r.balance * n.rateNow) : ''}</span></div></div>
  ${r.mezoRewards > 0 ? `<div class="mini" style="margin-top:10px"><span class="small muted">Extra rewards from staking in Mezo's gauge</span><b>${r.mezoRewards.toLocaleString('en-US', { maximumFractionDigits: 2 })} MEZO</b><span class="small muted">On top of your MUSD interest, waiting to be claimed in the Mezo app.</span></div>` : ''}
  ${n ? `<div class="card"><h2>Dollars vs naira</h2><p>${n.rateThen ? `A ${r.period} ago $1 was ${ngn(n.rateThen)}. Today it is ${ngn(n.rateNow)}.` : `Today $1 is ${ngn(n.rateNow)}.`}</p>${n.nairaHolderLossUsd > 0.005 ? `<p class="muted small">If your ${usd(r.balance, 2)} had been sitting in naira, it would have lost about <b>${usd(n.nairaHolderLossUsd)}</b> of value this ${r.period}.</p>` : `<p class="muted small">Your savings stay in dollars, so a weaker naira cannot shrink them.</p>`}</div>` : ''}
  <div class="card"><h2>You vs other savers</h2><div class="bar"><i style="width:${r.rank.beatPercent ?? 50}%"></i></div><p>${esc(r.rank.text)}</p><p class="small muted">Habit score ${r.rank.score}/100 from how long you have saved, how often you add, and how much you keep in.${r.rank.beatPercent == null ? '' : ` Compared with ${r.rank.savers} savers, all anonymous.`}</p></div>
  <div class="card"><h2>This ${r.period}</h2><div class="grid2"><div><span class="small muted">You added</span><b style="display:block">${usd(r.savedIn, 2)}</b></div><div><span class="small muted">You took out</span><b style="display:block">${usd(r.tookOut, 2)}</b></div></div>${activity(r.activity)}</div>${footer()}`;
}

async function proof() {
  const [p, g] = await Promise.all([api('/api/proof'), S.guard || loadGuard().catch(() => null)]);
  const link = (a) => `<a class="mono" href="${p.explorer}/address/${a}" target="_blank" rel="noopener">${a}</a>`;
  const m = p.main, mlink = (a) => `<a class="mono" href="${m.explorer}/address/${a}" target="_blank" rel="noopener">${a}</a>`;
  const t = p.testers;
  const testersCard = t && !t.wallets ? `<div class="card"><h2>Outside testers</h2><p class="small muted">Wallets not run by the MezGuard team are counted here, with their on-chain actions and signed reviews. Be one of the first.</p><button class="btn ghost small" data-act="feedback" style="margin-top:10px">Tried it? Leave a review</button></div>` : t ? `<div class="card"><h2>Outside testers</h2><p class="small muted">Wallets not run by the MezGuard team. Every action is a real on-chain transaction; every review is signed by the tester's wallet.</p>
    <div class="grid2" style="margin-top:10px"><div class="mini"><span class="small muted">Tester wallets</span><b>${t.wallets}</b></div><div class="mini"><span class="small muted">Their on-chain actions</span><b>${t.actions}</b></div></div>
    ${t.feedback ? `<p style="margin-top:10px"><b>${t.rating} / 5</b> <span class="small muted">from ${t.feedback} signed review${t.feedback > 1 ? 's' : ''}</span></p>` : ''}
    ${t.quotes.length ? `<ul class="list small">${t.quotes.map((q) => `<li><div><span style="color:var(--brand)">${'★'.repeat(q.rating)}</span>${q.worked ? ` “${esc(q.worked)}”` : ''}</div>${q.broke ? `<div class="muted">Fix: ${esc(q.broke)}</div>` : ''}<div class="when">${esc(q.who)} · ${q.net === 'main' ? 'mainnet' : 'test network'} · ${ago(q.at)}</div></li>`).join('')}</ul>` : ''}
    <button class="btn ghost small" data-act="feedback" style="margin-top:10px">Tried it? Leave a review</button></div>` : '';
  return `<h1>Proof</h1><p class="muted">Everything MezGuard says can be checked on-chain.</p>
  ${t?.wallets ? testersCard : ''}
  <div class="card"><h2>Mezo mainnet</h2>${m.users ? `<div class="grid2"><div class="mini"><span class="small muted">Real savers using MezGuard</span><b>${m.users}</b></div><div class="mini"><span class="small muted">They have saved</span><b>${usd(m.totalSaved, 2)}</b></div></div>` : `<p class="small">Mainnet direct mode is live. Every save made through MezGuard is checked on-chain and counted here.</p>`}
    ${g?.vault?.supply ? `<p class="small muted" style="margin-top:8px">The Guard watches the whole vault: ${usd(g.vault.supply, 0)} saved in it, earning ${g.vault.apr30d.toFixed(2)}% a year.</p>` : ''}
    <p class="small muted" style="margin-top:10px">Savers deposit straight into Mezo's official MUSD savings vault from their own wallet. MezGuard never holds the money.</p>
    <p class="small muted" style="margin-top:8px">Mezo's savings vault (sMUSD)</p>${mlink(m.vault)}<p class="small muted" style="margin-top:8px">MUSD</p>${mlink(m.musd)}
    <h2 style="margin-top:14px">Recent saver actions (checked on-chain)</h2>${m.txs.length ? `<ul class="list small">${m.txs.map((t) => `<li><div class="toggle"><span>${t.kind === 'save' ? 'Saved' : t.kind === 'withdraw' ? 'Took out' : 'Collected interest'} ${usd(t.amount, 2)}</span><a href="${m.explorer}/tx/${t.hash}" target="_blank" rel="noopener">${t.hash.slice(0, 10)}…</a></div><div class="when">${short(t.owner)} · ${ago(t.at)}</div></li>`).join('')}</ul>` : '<p class="muted small">The first real saves will show here.</p>'}</div>
  ${t?.wallets ? '' : testersCard}
  <div class="grid2"><div class="mini"><span class="small muted">Test-network accounts</span><b>${p.accounts}</b></div><div class="mini"><span class="small muted">Saved in them</span><b>${usd(p.totalSaved, 2)}</b></div></div>
  <div class="card"><h2>MezGuard account contracts (test network)</h2><p class="small muted">The full version: gasless saving, automatic Guard exit, and the fee capped in code. Ready for mainnet with one deploy.</p><p class="small muted">Factory (verified)</p>${link(p.factory)}<p class="small muted" style="margin-top:8px">Account blueprint (verified)</p>${link(p.implementation)}<p class="small muted" style="margin-top:8px">Mezo's MUSD savings vault (sMUSD)</p>${link(p.vault)}<p class="small muted" style="margin-top:8px">MUSD</p>${link(p.musd)}</div>
  <div class="card"><h2>Who can move your money</h2><ul class="list small"><li><b>You</b>: save, take out, turn the Guard on or off.</li><li><b>The MezGuard keeper</b>: can only send your savings <b>to your own wallet</b> (Guard exit), and only while your Guard is on. It cannot send money anywhere else.</li><li><b>The admin</b>: can change the keeper and the fee, capped in code at 10% of interest. Cannot touch deposits.</li></ul></div>
  <div class="card"><h2>Guard data sources (Mezo mainnet)</h2><ul class="list small"><li>MUSD price: Aerodrome MUSD/USDC pool on Base + Mezo MUSD/USDC pool${g?.peg?.price ? ` (now ${usd(g.peg.price, 4)})` : ''}</li><li>Savings vault: sMUSD supply and yield index${g?.vault?.apr30d ? ` (30-day rate ${g.vault.apr30d.toFixed(2)}%)` : ''}</li><li>Bridge: Wormhole NTT managers on Base and Mezo</li><li>Network: latest Mezo block</li></ul></div>
  <div class="card"><h2>Recent keeper transactions</h2>${p.keeperTxs.length ? `<ul class="list small">${p.keeperTxs.map((t) => `<li><div class="toggle"><span>${esc(t.label)}</span><a href="${p.explorer}/tx/${t.hash}" target="_blank" rel="noopener">${t.hash.slice(0, 10)}…</a></div><div class="when">${ago(t.at)}</div></li>`).join('')}</ul>` : '<p class="muted small">None yet since the server started.</p>'}</div>
  <div class="card small"><h2>Tests</h2><p class="muted">9 tests run against a fork of Mezo with the real sMUSD vault: deposits, sweeps, fees, gasless withdrawals, replay protection, the Guard exit and admin caps.</p></div>${footer()}`;
}

// ---------- router ----------
const ROUTES = { '/': ['home', home], '/guard': ['guard', guard], '/reports': ['reports', reports], '/proof': ['home', proof] };
let renderId = 0;
async function route(soft) {
  const [tab, fn] = ROUTES[location.pathname] || ROUTES['/'];
  document.querySelectorAll('.tabs a').forEach((a) => (a.dataset.tab === tab && location.pathname !== '/proof' ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const id = ++renderId;
  if (!soft) view.innerHTML = '<div class="loading">Loading…</div>';
  try { const html = await fn(); if (id === renderId) view.innerHTML = html; }
  catch (e) { if (id === renderId) view.innerHTML = `<div class="card"><h2>Could not load</h2><p class="muted">${esc(e.message)}</p><button class="btn ghost" data-act="retry">Try again</button></div>`; }
  clearInterval(S.timer);
  if (who() && tab === 'home') S.timer = setInterval(() => refresh(false), 20_000);
}
function go(path) { if (path !== location.pathname) history.pushState({}, '', path); window.scrollTo(0, 0); route(); }

document.addEventListener('click', (e) => {
  const l = e.target.closest('a[data-link]');
  if (l) { e.preventDefault(); go(l.getAttribute('href')); return; }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (b.tagName === 'A') e.preventDefault();
  const run = {
    connect: () => connect().catch((x) => toast(x.message)),
    example: () => { closeSheet(); S.viewing = S.cfg.example; setNet('test', { keepViewing: true }); },
    disconnect: () => { closeSheet(); S.owner = null; S.acct = null; try { localStorage.removeItem('mg.owner'); localStorage.setItem('mg.off', '1'); } catch {} renderWallet(); route(); },
    save: saveSheet, withdraw: withdrawSheet,
    max: () => { $('#amt').value = b.dataset.v === 'all' ? 'all' : (isMain() && S.acct?.wallet.musdWei ? weiToStr(S.acct.wallet.musdWei) : b.dataset.v); },
    net: netSheet,
    'net-main': () => { closeSheet(); setNet('main'); },
    'net-test': () => { closeSheet(); setNet('test'); },
    claim: () => busy(b, 'Confirm in your wallet…', async () => { const h = await sendTx(S.cfg.main.vault, SEL.claimYield); await reportTx(h); toast('Interest collected into your wallet.'); refresh(); }),
    'move-home': () => busy(b, 'Confirm in your wallet…', async () => {
      if (!S.acct?.saved) throw new Error('Nothing saved to move');
      const h = await vaultExit(b, S.acct.savedWei); await reportTx(h);
      toast('All your savings are back in your own wallet.'); refresh();
    }),
    'do-save': () => busy(b, 'Check your wallet…', () => doSave(b).catch((x) => { loadAcct().catch(() => {}); throw x; })), // a half-done save (approved, not deposited) must not ask to approve again
    'do-withdraw': () => busy(b, 'Check your wallet…', () => doWithdraw(b)),
    onboard: () => busy(b, 'Sending… (about 10 seconds)', async () => { const r = await api('/api/onboard', { owner: S.owner }); toast(r.gifts.length ? `Sent: ${r.gifts.join(' and ')}` : 'Your account is ready'); await loadAcct(true); route(true); }),
    drill: () => busy(b, 'Check your wallet…', async () => { const sig = await signAction('drill'); b.textContent = 'Guard is moving your savings…'; await api('/api/drill', { owner: S.owner, ...sig }); toast('Drill done: your savings are back in your wallet.'); await loadAcct(true); route(true); }),
    'toggle-guard': () => busy(b, '', async () => {
      const on = b.getAttribute('aria-checked') !== 'true';
      toast(on ? 'Turning auto-protect on…' : 'Turning auto-protect off…');
      await sendTx(S.acct.account, '0x64d44b1e' + (on ? '1' : '0').padStart(64, '0'));
      toast(on ? 'Auto-protect is on.' : 'Auto-protect is off. You can turn it back on any time.');
      await loadAcct(true); route(true);
    }),
    'tg-unlink': () => busy(b, '…', async () => { const sig = await signAction('unlink telegram'); await api('/api/telegram/unlink', { owner: S.owner, ...sig }); await loadAcct(true); route(true); }),
    feedback: feedbackSheet,
    star: () => { S.stars = Number(b.dataset.v); document.querySelectorAll('.stars button').forEach((x) => { const on = Number(x.dataset.v) <= S.stars; x.classList.toggle('on', on); x.setAttribute('aria-checked', String(Number(x.dataset.v) === S.stars)); }); },
    'do-feedback': () => busy(b, 'Sign in your wallet…', sendFeedback),
    period: () => { S.period = b.dataset.v; route(true); },
    retry: () => route(),
  }[act];
  run?.();
});
window.addEventListener('popstate', () => route());

// ---------- start ----------
(async () => {
  const q = new URLSearchParams(location.search);
  if (q.has('devwallet') && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) await import('/dev-wallet.js');
  try { S.cfg = await api('/api/config'); } catch (e) { view.innerHTML = `<div class="card"><h2>MezGuard is waking up</h2><p class="muted">${esc(e.message)}</p></div>`; return; }
  try { S.net = localStorage.getItem('mg.net') || 'main'; } catch {}
  if (q.get('net') === 'test' || q.get('net') === 'main') S.net = q.get('net');
  if (q.has('devwallet')) S.net = q.get('net') || 'test'; // the throwaway dev wallet only has test funds
  if (q.get('as')) S.viewing = q.get('as');
  else if (q.has('example')) { S.viewing = S.cfg.example; S.net = 'test'; }
  if (eth()) {
    let saved = null, off = false; try { saved = localStorage.getItem('mg.owner'); off = !!localStorage.getItem('mg.off'); } catch {}
    const accs = await eth().request({ method: 'eth_accounts' }).catch(() => []);
    // Reconnect silently only if the saver did not press Disconnect last time.
    if (accs[0] && !off && (!saved || saved.toLowerCase() === accs[0].toLowerCase())) { S.owner = accs[0]; S.viewing = null; }
    eth().on?.('accountsChanged', (a) => { if (!S.owner) return; a[0] ? setOwner(a[0]) : (S.owner = null, S.acct = null, renderWallet(), route()); });
  }
  renderWallet(); route();
  loadGuard().catch(() => {});
})();
