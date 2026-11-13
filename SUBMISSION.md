# MezGuard: AKINDO Wave 2 submission

## Project name
MezGuard

## One-line tagline
Guarded dollar savings, powered by Bitcoin. Save in MUSD, earn Mezo's savings rate, and let a Guard bring your money home if anything goes wrong.

## Links
- Live app: https://mezguard.onrender.com
- Code: https://github.com/Bigmanmarsh/MEZGUARD
- Proof page (live on-chain numbers, testers, keeper transactions): https://mezguard.onrender.com/proof
- Telegram bot: @Mezguardbot
- Deck: [paste the deck's share link or PDF]
- Demo video: [paste the X post or YouTube link]

## The problem
Savers whose local money keeps losing value (like the naira) want dollars. The easy way is an exchange account, which can freeze or fail. The self-custody way, on-chain savings, pays well but needs someone watching day and night. A stablecoin slip or a vault problem happens fast, and most savers find out too late.

## What MezGuard does
- **Save:** MUSD goes into Mezo's official MUSD Savings Rate vault (sMUSD), in the saver's own name. It earns about 5% a year at Mezo's live rate.
- **The Guard:** four live checks on Mezo mainnet data:
  - the MUSD price on two pools (Base and Mezo),
  - the sMUSD vault's supply and rate,
  - Mezo block production,
  - the Wormhole NTT bridge.

  If MUSD stays under $0.97 for 3 checks, or the vault looks unsafe, the Guard brings the savings back to the saver's own wallet, and only there.
- **Whale Watch:** big sMUSD deposits and withdrawals, big MUSD sells on Base, and the Stability Pool, each explained in one plain sentence.
- **Reports:** weekly and monthly. Each shows what you earned in dollars and naira, versus plain USDC, and an anonymous ranking of your saving habits (never your size).
- **Telegram:** sign in with Telegram for alerts and the weekly report. Bot commands: /status /savings /report /stop.

## Mezo integration
- **Mainnet (31612), direct mode, live:** savers deposit real MUSD into Mezo's sMUSD vault (0xb4D4…51CC) from their own wallet. MezGuard never holds the money.
  - sMUSD staked in Mezo's gauge counts as savings, and MEZO rewards are shown.
  - Take out and "Move my money home" unstake first.
- **Testnet (31611), full MezGuard accounts:**
  - gasless save (MUSD permit) and withdraw (EIP-712), with automatic Guard exit by a keeper;
  - an on-chain fee capped in code;
  - free test MUSD for new users.
- **Read from Mezo DeFi:** sMUSD vault index and supply, the gauge, the Stability Pool, the Mezo MUSD/USDC pool and the Wormhole NTT managers.

## Contracts (Mezo testnet, both verified)
- MezGuardFactory: 0x73C0Dc60D6Ea3bEc8b2a40914f8a2Ff73E2aB5E4
- MezGuardAccount implementation: 0x75DAE3b1d34F4B530f54F49338a117d4528b3d65

## Security
- **Owner:** save, withdraw, Guard on or off.
- **Keeper:** can only call guardExit, which pays the owner, and only while the Guard is on.
- **Admin:** can change the keeper and the fee (capped at 10% of interest, MAX_FEE_BPS = 1000). Can never touch deposits.
- **Tests:**
  - 9 Hardhat tests on a fork of Mezo with the real sMUSD vault: deposits, sweeps, fees, gasless withdrawals, replay protection, Guard exit, admin caps.
  - A mainnet fork script impersonates a real staked saver and runs the exact calls the app sends.
- **Server:** every write is wallet-signed, inputs are validated, and requests are rate-limited.

## Business model
Free up to $100 saved. Above that, MezGuard accounts keep 10% of the interest, never any of the deposit. Example: $1,000 at 5% earns $50 a year, so the saver keeps $45 and MezGuard earns $5. Mainnet direct mode is free during the beta.

## Users and testing
The Proof page counts outside tester wallets (team and demo wallets are listed in the repo and excluded), their on-chain actions, and wallet-signed reviews (1 to 5 stars, what worked, what broke). Current numbers: [fill in from /proof on 14–15 Nov].

## What's new in Wave 2
- Mainnet direct mode into Mezo's real sMUSD vault, with gauge staking and MEZO rewards.
- The Guard on live mainnet data, plus Whale Watch.
- Telegram sign-in, alerts, the weekly report and bot commands.
- Signed tester reviews and outside-tester stats on the Proof page.
- Both contracts verified.
- A full audit pass: input validation, RPC fallbacks, crash-proofing, and a fix for the race between save and the keeper's sweep.

## Honest limits
- **Mainnet mode:** on mainnet the saver confirms each action (direct mode). The full MezGuard accounts with automatic exit run on testnet and are ready to deploy.
- **Keeper:** the keeper is one server key for now, and it can only pay owners.

## Next
1. Deploy MezGuard accounts on mainnet.
2. A one-flow USDC (Base) → MUSD (Mezo) on-ramp.
3. More keepers, more danger signals, and veMEZO-boosted rewards.
