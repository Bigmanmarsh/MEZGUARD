# Build log: MezGuard (Mezo Buildathon, Wave 2)

Deadline: Thu 13 Nov 2026, 05:30 UTC (06:30 Lagos). Target: Wed 12 Nov.

## 2026-11-07
- Recon done (RIVALS.md, research/mezo-buildathon-recon.md). Idea locked: MezGuard, guarded dollar savings (BLUEPRINT.md).
- Verified on-chain: sMUSD (MUSDSavingsRate) pays ~4.8% APR over 30 days. One multisig holds 85% of sMUSD. MUSD trades at $0.991 on Aerodrome Base ($1.13M liquidity).
- Decisions: mainnet with a $100 beta cap, Telegram sign-in + alerts, free under $100 and 10% of interest above.
- Money path mapped from public chain data (scripts/ntt-check.mjs, quote.mjs, probe*.mjs):
  - MUSD bridge = Wormhole NTT. Base manager 0x3EB4…1Bc1 (burning, wormhole chain 30); Mezo manager 0x7efb…e0bD (locking, chain 50). Inbound limit 10M MUSD/day. Not paused.
  - Wormhole automatic relaying is OFF both ways, so delivery is manual: fetch the VAA from Wormholescan, then anyone calls receiveMessage on the destination transceiver (Mezo transceiver is 0x62DE…1C83, not the docs' 0x56E2…). quoteDeliveryPrice view reverts, but real transfers work.
  - A real Base→Mezo transfer (tx 0xe03e…4504): transfer(amount, 50, recipient, refund, false, 0x01010101), msg.value 0, 180k gas. Delivered on Mezo ~18 min later.
  - Base swap: LI.FI quotes 10 USDC → 10.06 MUSD, gas ~$0.009. Main pool is CL 0xb02F…2Ea5 (fee 0.05%, tick 10).
  - Mezo gas ~0.0015 gwei (BTC). deposit ≈ $0.02, receiveMessage ≈ $0.10.
  - Real users already do this by hand: 0xC853… bridged 4 Nov, then deposited into sMUSD and staked in the gauge 6 Nov.
- DESIGN: each saver gets a MezGuard Account contract on Mezo. The bridge sends MUSD straight to it; our keeper delivers the VAA and sweeps it into sMUSD (keeper pays the tiny BTC gas). Withdrawals happen via an EIP-712 signature from the owner (no gas on Mezo). Savers only ever need Base.
- Dev/keeper wallet created: 0xCEA259b22B76c253581C789400F7347B37Aeec83 (key in secrets/, gitignored).
- Blocker: the keeper needs a few $ of BTC on Mezo mainnet for gas. Researching the cheapest route.
- BUDGET IS $0 (Marshall). Switched to: live app on Mezo testnet (official testnet sMUSD 0x6f46…8e16 + canonical test MUSD), with mainnet paths proven in fork tests and Guard/Whale/report data read from real mainnet. Free test MUSD faucet in-app for testers. Mainnet launch waits on a gas grant.
