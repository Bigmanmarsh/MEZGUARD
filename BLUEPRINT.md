# MezGuard: blueprint v0.2 (LOCKED 2026-11-07)

Tagline: **Guarded dollar savings, powered by Bitcoin.**

Name: **MezGuard** (chosen by Marshall). Lead every text with "savings" so judges never file it as another liquidation-guard tool.

## One line
Save your stablecoins in your own wallet, earn the interest Bitcoin borrowers pay on Mezo (~5% a year), with a Guard that watches the risks for you and a report that shows exactly what your money did.

## Who it's for (Marshall's own words)
People in Nigeria and other emerging markets who save in stablecoins because altcoins keep dipping. They are scared of exchange hacks, so they keep funds in their own wallets, and they hate that "money not growing is money being lost." Many are paid in USDC on Base.

## Verified facts (2026-11-07, on-chain, script `scripts/vault-apy.mjs`)
- sMUSD (MUSDSavingsRate, mainnet `0xb4D4…51CC`) paid **~4.8% APR over 30 days and ~4.75% over 60 days**. The last 7 days show ~12.75%, because 5.25M + 0.9M MUSD of protocol/multisig deposits left on 30 Oct-5 Nov while the same fees kept flowing. About 1.3M sMUSD remains; retail deposits are ongoing, mostly staked into the VaultGauge `0x6778…a401`.
- The yield is paid via `yieldIndex` and `claimYield()`, **not** as an ERC-4626 exchange rate, despite what the docs say.
- MUSD on Base trades at **$0.991**. Aerodrome MUSD/USDC on Base: **$1.13M liquidity, $120k volume a day**. Ethereum Uniswap: $60k.
- Mezo gas is paid in BTC. Meta-transactions were reportedly disabled after the 5 Oct exploit (Arena; needs verifying).

## Features
### 1. Save (core)
- Connect a wallet. Deposit USDC on Base. It swaps to MUSD on Aerodrome, bridges to Mezo, and deposits into sMUSD, all in one guided flow. Withdraw the same way in reverse.
- No minimum, no BTC needed, no exchange account. Funds sit only in the user's wallet or Mezo's official vault.

### 2. The Guard (Marshall's idea, aimed at savers)
Watches the four things that can actually hurt a saver:
1. **Peg:** MUSD price from the Aerodrome and Mezo pools and the Mezo PriceFeed. Alert below $0.99; exit rule below a user-set floor.
2. **Vault health:** a sudden drop in yield, a big outflow (like the one on 5 Nov), or a strategy change (`setStrategy` events).
3. **Bridge:** a stuck transfer, or the rate limit hit.
4. **Mezo incidents:** a chain halt (no new blocks), a pause, an admin change.

It alerts on Telegram (and WhatsApp later). **Auto-exit** follows rules the user sets in advance: sMUSD → MUSD → USDC, always back to the user's own address only. It explains every alert in plain words.

### 2b. Whale Watch (Marshall's request, part of the Guard)
Verified 2026-11-07: savings is very concentrated. One multisig (`0xf365…`) holds 1.1M of the 1.3M sMUSD (85%). The StabilityPool holds 14.2M MUSD. Watch the big wallets that can move YOUR risk or YOUR rate:
- **Vault whales:** big deposits or withdrawals in sMUSD. A whale leaving does not endanger savers (the MUSD sits 1:1 in the IdleStrategy) but changes your rate; we explain it ("the big multisig left, so your rate rose").
- **Peg whales:** large MUSD sells into Aerodrome MUSD/USDC (Base) or the Mezo pools, and large redemptions. These are the early depeg warning.
- **Safety-net whales:** large StabilityPool withdrawals mean a thinner liquidation buffer, which is a system risk signal.
- **Labels:** known protocol, team and pool contracts are tagged so they don't cause false alarms.
- **"Follow" rules (the copy part):** "If whales pull more than X% of the vault or dump more than $Y of MUSD in 24h, exit me to USDC" or "tell me when whales are adding." Savers copy the protective moves; no altcoin copy-trading.
- Every report includes a "Whale moves this week" section.

### 3. Reports and stats (Marshall's request)
- **Weekly and monthly reports:** earned this period and in total, the rate you actually received, comparisons (vs holding plain USDC, vs naira savings at the bank, vs inflation), deposits and withdrawals, guard events, and "where your yield came from" (Bitcoin borrowers' interest → Mezo fees → you).
- Delivered in the Telegram bot, plus a shareable image card and a downloadable PDF statement.
- **A dashboard** with charts: balance over time, yield per week, the peg history, the guard log.
- **You vs other savers** (from public on-chain vault data, fully anonymous, no names or addresses shown):
  - Ranks: "You're ahead of 62% of savers on consistency" (weeks in a row you saved), "on time saved" (days without withdrawing), and "on growth" (% your balance grew this month).
  - We compare **habits and growth, never size**, so a $10 saver can beat a whale. Protocol, team and whale wallets are excluded from the "average saver".
  - "The average saver this month": deposited $X, kept it Y days, earned Z%. Is your rate the same, higher or lower, and why (e.g. you joined mid-week)?
- **Easy-to-read rules for every statistic:**
  - One idea per line, one big number, and a plain sentence under it ("You earned $0.81. Plain USDC would have earned $0.00.").
  - Show dollars **and naira** side by side. Never show APR/APY jargon; say "about 5% a year, or $5 on every $100".
  - Use everyday comparisons ("this week's interest covers ~2 days of data").
  - Green means good, amber means watch, red means act. Always with words, never color alone.
  - Arrows show change since last week (up 0.4%).
  - Charts: max one per section; bars for weekly earnings, a line for balance.
- **AI summary:** a short plain-English paragraph per report ("Your $200 earned $0.81 this week. MUSD stayed at $0.99. Nothing needed your attention.").

### 4. Public proof page (the judges' #1 lever)
Live totals: number of savers, total saved, yield paid, guard events. Every saver wallet is listed with its explorer links (addresses only, no names). This proves real outside users.

## UI rules (Marshall: "user friendly and simple to navigate")
- Only 3 tabs: **Home** (balance, earned, guard status, Save/Withdraw), **Guard** (4 checks, whale moves, exit rules), **Reports** (weekly/monthly, share card, PDF).
- One main action per screen. Plain words, no jargon (say "savings", not "sMUSD"). Show dollars, not token amounts.
- Save or withdraw in at most 3 taps. Every step tells you what's happening and how long it takes.
- Mobile first (most of the community is on phones). Fast to load; judges' headless browser must not time out.
- Telegram bot mirrors the same 3 things: balance, alerts, reports.

## Mezo integration depth (target: level 5 / 10 out of 10)
Aerodrome MUSD/USDC (Base) → Wormhole NTT MUSD bridge → sMUSD MUSDSavingsRate (deposit, claimYield, withdraw) → optional VaultGauge (choose fee yield or MEZO rewards) → Mezo PriceFeed and pool prices for the Guard → Mezo DEX MUSD/mUSDC for emergency exits. Contracts verified on the Mezo explorer.

## Rivals and how we beat them
- **Levada** (new, strong contracts): an MUSD savings vault on Base via Wormhole. It needs MUSD already, and it has no consumer app, guard, reports or users. We beat it on usefulness, safety, materials and real users.
- **MUSD Yield Vault / MUSD Compass / MUSD Pocket:** yield or savings tools with no guard, no real users, and no stablecoin-saver story.

## Decisions (2026-11-07)
1. **Network (revised, $0 budget): Mezo TESTNET live app + mainnet-fork proof + real mainnet data.** The live app uses the official testnet sMUSD (0x6f46…8e16) and canonical testnet MUSD (0x1189…C503), which passes the judges' G2 gate. Testers get free test MUSD from our in-app faucet (we borrow 2,000 test MUSD once with free faucet BTC), so community members can join with zero risk; testnet outside wallets count. Every mainnet path (Base swap, NTT bridge, sMUSD deposit/claim/withdraw, Guard exit) is proven in fork tests against real mainnet contracts, at no cost. The Guard, Whale Watch and reports read REAL mainnet data (free RPC reads). Mainnet deploy scripts are ready; we launch capped on mainnet once a small gas grant arrives (we ask in the Mezo Discord). The Wave 1 top 4 were testnet too; real users matter more.
2. **Telegram: "Sign in with Telegram"** on the web app. No chat bot to talk to (unlike Suisub). Alerts and reports arrive as Telegram messages after the user taps "Connect Telegram". (Telegram requires a bot account behind the scenes to send messages, but users never chat with it.) Stretch: open the same app as a Telegram Mini App.
3. **Business model:** saving, the Guard, reports and Whale Watch are **free for everyone**. On balances **over $100**, we keep **10% of the interest earned, never the deposit** (the user keeps ~4.5% instead of ~5%). Shown clearly in the app and the deck. Future: premium alerts for pros, and a B2B Guard API for other Mezo apps.
4. Name: see suggestions below.

## Verified 2026-11-07
Bridge: no fee, ~18 min, manual delivery (see LOG). Testnet: official sMUSD 0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16 (same yieldIndex interface). Testnet NTT (NttManagerWithExecutor 0x484b…cfE2) exists; its peer chain is still to check.

## Must verify next
Wormhole NTT Base↔Mezo: fees, time, minimums, rate limits. How a new user gets BTC gas on Mezo (we sponsor a tiny drip?). Whether ERC-2771/meta-transactions are really off. sMUSD vs VaultGauge yield. Whether withdrawals have any lock or fee.
