# Mezo Buildathon: rival intel (scanned 2026-11-07)

Source: AKINDO public API (submission-summaries for Wave 1 `Ql9ePKmoDCBNoQ9n` and Wave 2 `WjDnR6LJaSBkVkQz`) and the judge reviews on each product's "Voter Reviews" tab. The judge account is `civ_defi_mezo`.

**Wave 2 deadline: 2026-11-13 05:30 UTC (06:30 Lagos). Judging closes 2026-11-19.**

## How the scoring works (from Wave 1 data)
- Each criterion is scored out of 10 (a "level" from 1 to 5, shown as 2/4/6/8/10). The order is Mezo Integration / Product & Business / Technical / UX / Materials.
- Wave 1 paid out $1,800. The top 5 got $69-80 each. Almost everyone else got $10-22. There's a huge cliff between tier 1 and the rest.
- Materials gets capped at "2" if there's no reachable deck. Janus, Keel and Mezonk all lost points this way and still reached the top 5.
- In Wave 2, judges rank projects against each other: "more complete and ready projects get better points."

## Wave 1 top 5 (all Track 1 DeFi, all built on Mezo's vote-escrow system)
| Project | $ | Scores | What it is |
|---|---|---|---|
| Doji | 80 | 10/8/8/8/8 | Fixed-rate, fixed-date MUSD loans against **veBTC** (locked BTC). Lenders pick their own rate; a Thursday-dated market. Auctions for unsafe loans. |
| Surety | 73 | 8/8/8/6/8 | A MUSD lending vault where veBTC votes decide which credit lines get capital, and voters' rewards take the first loss. Built on a Morpho vault. Mainnet (capped). |
| Janus | 69 | 8/8/8/8/2 | A boost market: veMEZO vault and jMEZO token; veBTC holders buy votes for up to 5x boost via BoostVoter. |
| Keel | 69 | 8/8/8/8/2 | A plug-in strategy for Mezo's MUSD **savings vault**: lends up to 20% against BTC/veBTC, safe from redemptions. Proven on a copy of mainnet. |
| Mezonk | 69 | 8/8/8/8/2 | A prediction market that settles in MUSD; borrow MUSD against BTC in the app. |

The first top-5 project with a 10 in integration was Doji: it ran veBTC custody, PoolsVoter vote pass-through and PriceFeed auctions on testnet.

## What judges asked even the top 5 for (the bar for "level 5")
1. **Outside users / counterparties.** Every project used only its own wallets. This came up in EVERY review.
2. **Run every path on-chain**, including claims, rebases and votes, not just the main flow.
3. **Verify contracts** on the Mezo explorer.
4. **A business model:** who pays, how it lasts beyond incentives, and the fee stated clearly.
5. **A public deck link** in the form, the team and their roles, the track, and project status.
6. **Safety details:** a depeg check instead of a hard-coded $1, safe withdrawals, mainnet addresses correct.
7. **A fast-loading live app.** Judges use a headless browser, and Surety's app timed out.
8. **Composability:** e.g. "add a jMEZO/MUSD pool so the receipt becomes usable capital", or "put idle MUSD to work through sMUSD."

## Wave 2 field (25 entries so far, none of the top 5 has resubmitted yet)
Mostly Track 2 apps that earned $10-19 in Wave 1: MUSD Pay Links, Liqvera (trove risk reports + guard keeper), MUSD Reach, Morbit, PayLink, MUSD Pocket, Pocket (social payments), Bulwark (liquidation rescue), Pylon (borrower terminal), RentOuts, MUSD Books, Tillward (working capital), MUSD Pulse, Kudi (borrow app), Relayguard and ProMeo (agent payments), RELAY, BitStreamfi (payroll streaming), MUSD Yield Vault.
New in Wave 2: CreditGraph (credit identity), skim (small Mezo to Base bridge), Cobra (voice note to MUSD invoice on Telegram), Levada (MUSD savings rate on Base), **AjoChain (ajo/esusu circles in MUSD)**, Witness (passkey-approved agent spending).

Crowded spaces: payment links/invoices (5+), liquidation protection/risk (4), savings goals/pockets (3), agent payments (3).

## Known gotchas
- The minimum MUSD loan is 1,800, plus a 200 MUSD gas deposit, so total debt is at least 2,000.
- The savings vault address in the docs may have no code on testnet (chain 31611).
- ValidatorsVoter is a zero address on testnet (it's mainnet-only).
- MetaMask flags free *.vercel.app domains (mbLP moved to surge.sh).
