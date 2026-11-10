# Mezo Buildathon Wave 2 — Deep Recon
**Compiled Nov 7, 2026 · Research only — no project ideas · every fact sourced or marked "not found"**

Event page: https://app.akindo.io/wave-hacks/OVOO0gdrVU8379D10
Companion data files: `mezo-wave1-rankings.csv` (all 135 Wave 1 submissions + judge scores), `mezo-wave2-submissions.csv` (25 Wave 2 entries + links)

**How this data was obtained:** AKINDO's page is client-side rendered, but its **public JSON API is open (no auth)**: `https://api.akindo.io/public/wave-hacks/{id}`, `.../waves`, `.../waves/{waveId}/submissions`, `.../threads?type=waveHack|waveSubmission&parentId={id}`. All Wave 1 votes (with per-criterion ratings + written feedback) and all Wave 2 submissions were pulled from it on Nov 7, 2026. This is the same data the site's "Voter Reviews" / "Submission Comments" tabs render.

---

## 0) Event snapshot

| Item | Value | Source |
|---|---|---|
| Program | "Build with MUSD and MEZO: $7,000 USD in MEZO Grants", 2 waves on AKINDO, run with Mezo ("built by Thesis, the team behind tBTC, Fold, and Taho"), powered by Supernormal Foundation | [event page](https://app.akindo.io/wave-hacks/OVOO0gdrVU8379D10); "third edition" per [blog](https://mezo.org/blog/mezo-buildathon-is-underway/) |
| Pools | Wave 1: $2,000 · Wave 2: **$5,000**, paid in MEZO tokens | event page |
| Payout math | "Each project's share of that Wave's pool is proportional to its share of total points. If a project earns 20% of the points, it receives 20% of the pool." MEZO amount set by **14-day TWAP on the day you complete KYC** | event page |
| Payout reality | **KYC/KYB required** ("No KYB, no payout"): W9 or W8-BEN, govt ID, proof of address, wallet address; contact by email; fail verification → prize forfeited to next-highest scorer. Wave-1 winners were still chasing payouts on Nov 5–6 ("I still haven't received the fund") in the comments thread | event page; [comments thread](https://app.akindo.io/wave-hacks/OVOO0gdrVU8379D10) via API |
| **Wave 2 deadline** | **API field: `submissionDeadline: 2026-11-13T05:30:06Z`** (= Nov 13, 06:30 Lagos). ⚠️ The page description and blog both say "November 15". Treat **Nov 12 end-of-day as the real deadline**. Page countdown on Nov 7 read "5Days 13:38" (consistent with Nov 13 05:30 UTC) | API `activeWave`; [event page](https://app.akindo.io/wave-hacks/OVOO0gdrVU8379D10); [blog](https://mezo.org/blog/mezo-buildathon-is-underway/) |
| Wave 2 judging | Judging Nov 16–22 (page text; API says judgement deadline Nov 19 05:30 UTC). **Winner announcement + online demo session Nov 23** | event page; API |
| Eligibility | 18+, global, any team size, **one team per participant per wave**. Nigeria is NOT on the prohibited list (DPRK, DRC, Cuba, Donetsk/Luhansk/Crimea, Iran, Iraq, China, Syria + sanctioned jurisdictions). Excluded: Supernormal employees + relatives | event page |
| Tracks | **Track 1 DeFi** (borrowing/lending/looping/yield; "How might we expand MUSD and MEZO utility as collateral and productive capital across DeFi?") · **Track 2 Access & Distribution** ("How might we make MUSD and MEZO easier to discover, access, and use?" — Telegram/WhatsApp bots, discovery, marketplaces, wallets) | event page |
| Chains | Mezo, Ethereum, Base, BNB Chain; Mezo testnet accepted. Team Q&A: "Mezo, Base, Ethereum, BNB are all eligible" | event page; comments thread via API |
| Required materials | 1) live testnet/mainnet link, 2) public GitHub repo, 3) deck, 4) **2-minute pitch video**. Missing any → fails Stage-1 screening | event page |
| Two-stage judging | **Stage 1 (AKINDO DevRel screening):** integration present + working deployment + all materials, else "not forwarded". **Stage 2 (Mezo core team):** allocates points per criteria | event page |
| Criteria (exact descriptions) | **Mezo Integration 30%** — "Effective and meaningful use of MUSD or MEZO. Depth of integration matters more than surface-level usage" · **Product & Business Viability 30%** — "How directly the project extends MUSD/MEZO utility in line with your track's challenge question. Problem-solution fit, business viability, and complementarity with the Mezo ecosystem and its audience" · **Technical Implementation 20%** — "Code quality, architecture, security, and whether the solution is genuinely composable and deployable rather than just a demo" · **UX 10%** — "Design, usability, and accessibility" · **Submission Materials Quality 10%** — "Demo clarity and pitch effectiveness" | API criteria object (mirrored on event page) |
| Form fields (AKINDO) | name, category (3–5 words), TL;DR, how it works, target group, tech stack, track, chain deployed on, project status, **project readiness (mainnet/testnet/demo only)**, future milestones (next 3 + timelines), team info (members, roles, X/LinkedIn). "For Wave 2 resubmissions, be explicit about what changed since Wave 1" | event page |

---

## 1) Wave 1 results (judged Oct 27 – Nov 1, completed)

**Numbers:** 135 submissions · **101 received funds** · **$1,800 of the $2,000 pool distributed** · sole reviewer: AKINDO account **`civ_defi_mezo`** (Mezo core team; "Judged by the Mezo core team") — all 135 votes were cast by this one account (API `votedBy`). The event page's Judges tab currently shows **"No judges yet"** for Wave 2. Judge criterion-value distribution across 135×5 ratings: 0×105, 2×92, 4×108, 5×5, 6×196, 7×19, 8×146, **9×0, 10×4** — the four 10s all went to *Mezo Integration* (Doji, mbLP, Baserate, Deed).

### Top scorers (award = share of $2,000)

| # | Project | $ | Mezo30 | Prod30 | Tech20 | UX10 | Mat10 | One-liner (tagline) |
|---|---|---|---|---|---|---|---|---|
| 1 | **Doji** | 80 | **10** | 8 | 8 | 8 | 8 | "Keep your Bitcoin locked on Mezo. Borrow MUSD anyway, at a fixed rate to a fixed date." |
| 2 | **Surety** | 73 | 8 | 8 | 8 | 6 | 8 | "veBTC holders decide where MUSD credit goes, and their rewards take the first loss." |
| 3 | **Janus** | 69 | 8 | 8 | 8 | 8 | **2** | "The boost market for Mezo: buy votes for up to 5x veBTC boost, or sell yours and keep 90%." |
| 4 | **Keel** | 69 | 8 | 8 | 8 | 8 | **2** | "Borrow against your Bitcoin. Never Redeemed" |
| 5 | **Mezonk** | 69 | 8 | 8 | 8 | 8 | **2** | "A prediction market on Mezo where you keep your bitcoin. Borrow MUSD against your BTC" |
| 6 | mbLP | 22 | **10** | 8 | 8 | 8 | 8 | "Deposit BTC, hold one token, earn MEZO as BTC/MUSD liquidity. One transaction, no upkeep." |
| 7 | MezoRoute | 20 | – | – | – | – | – | "Compare MUSD routes by BTC risk, then borrow and deploy in one transaction." |
| 8 | Baserate | 20 | **10** | 8 | 8 | 8 | **2** | "Borrow MUSD against BTC on Mezo's own Morpho Blue, with no redemption queue and no minimum." |
| 9 | Plumb | 20 | – | – | – | – | – | "A peg module for MUSD: standing bids under its price…" |
| 10 | MUSD Compass | 20 | 8 | 8 | 8 | 8 | 8 | "Every Mezo earning spot, ranked by the cash you keep. Live from Mezo and Ethereum." |

(long tail: ~$19–20 tier through rank ~15, then $18s; 34 submissions got $0. Full list in `mezo-wave1-rankings.csv`.)

These top 5 match Mezo's Nov 5 X post: "Congratulations to the Wave 1 winners of the Mezo Buildathon 🍄 … Meet our judges' top 5 from Wave 1 below 👇" ([x.com/MezoNetwork](https://x.com/MezoNetwork), Nov 5, 2026).

⚠️ **The $ amounts are NOT a formula of the visible ratings** — mbLP has an identical profile to Doji (10/8/8/8/8) but got $22 vs Doji's $80. The judge allocates dollars holistically; the per-criterion numbers are coarse signals. The money followed overall completeness + how much the judge wanted to see the project continue.

### Judge feedback — verbatim quotes (the "Voter Reviews")

**Doji ($80):** "Doji already composes Mezo deeply: veBTC custody and lock-and-borrow, PoolsVoter vote pass-through and PriceFeed-driven auctions all ran on testnet… The biggest gap is real counterparties: **every borrower, lender and auction buyer so far is your own wallet**, so bringing in outside veBTC holders and MUSD lenders, even on testnet, would most strengthen the product case. **Fix the landing-page stat tiles that show negative or conflicting numbers**, and make sure the deck link is publicly viewable. Note that **ValidatorsVoter is a zero address on testnet**, so describe it as mainnet-only in your materials."

**Surety ($73):** "Your integration is deep on the veBTC side (voting power, veBTC custody as collateral, PoolsVoter and RewardsDistributor pass-through, the Skip oracle), but on-chain only the veBTC escrow transfer and auction release were exercised, and the mainnet vault holds no MUSD. For Wave 2, run the escrow vote, fee/bribe and rebase claim paths on chain, **put real MUSD through the mainnet vault on Mezo's own Morpho Blue** (testnet used a self-deployed Morpho), and get outside users borrowing against veBTC. **Add a MUSD/USD price feed or depeg check in place of the hard-coded $1**, and widen the gap between the auction trigger and the floor. State who pays the team and how the protocol sustains itself beyond sponsor incentives, and make sure the live app loads quickly; **our headless browser timed out on it**."

**Janus ($69):** "Janus already composes Mezo deeply: the vault locks veMEZO, votes on BoostVoter and the boost lands on veBTC on-chain, so the next step up is showing the mechanism works with real third parties: fill the outside bids, run several rounds, and fix the soundness gaps (vault bribe claiming, guaranteed boost pokes, jMEZO fungibility). **Verify both contracts on the Mezo explorer** and fix the mainnet veBTC address in Deploy.s.sol, then aim for a mainnet deployment. Add a jMEZO/MUSD pool so the receipt becomes usable capital, and include a pitch deck plus track, team roles and project status in the form."

**Keel ($69):** "Keel already composes Mezo primitives (veBTC custody and votes, PriceFeed, a Mezo pool TWAP and the savings-vault strategy interface), so the clearest step up to the top integration level is to exercise it against Mezo-deployed contracts… **Materials was capped at 1 because no deck was reachable**: the claude.ai deck link appears only in docs/AKINDO_FORM.md… for Wave 2 put a public deck link (or a PDF committed to the repo) in the form. Also commit the video's script or subtitles, and name the team and roles in the form."

**Mezonk ($69):** "Mezonk already composes with Mezo: the /borrow page opens and draws real troves through BorrowerOperations, with correct MCR, Recovery Mode and fee handling. The only on-chain use so far is one trove and about 726 MUSD of trades from your own wallets. **To reach level 5 in Wave 2, get outside users borrowing and trading.** Link positions to loans… and consider settling BTC-price markets with Mezo's PriceFeed. Also verify the contracts on the Mezo explorer, add a pitch deck, use Mezonk rather than your own name as the product name on AKINDO, and state the 1% taker-fee business model in the submission."

**mbLP ($22, the other 10/10 integration):** "Your integration is at the top of the ladder: one deposit opens a MUSD trove, borrows, adds BTC/MUSD liquidity, stakes in Mezo's gauge and recycles fees as gauge bribes, and every leg shows up in testnet transactions. For Wave 2, **handle MUSD's maxBorrowingCapacity** (for example through refinance, or by resizing the trove) so the vault can grow past roughly 0.27 BTC without new deposits sitting idle, and plan a degraded exit for Recovery Mode."

**Baserate ($20):** "**Baserate has the deepest integration we saw: the first MUSD market on Mezo's own Morpho Blue, with sMUSD, Tigris and veBTC bribes all used in one loop.** … A mainnet proof deployment with real users would strengthen both the product and technical scores."

**Deed ($19):** "Your integration is among the deepest in the wave: vaults that open and adjust real MUSD troves through BorrowerOperations, plus a market and a rescue auction gated on TroveManager ICR at the Mezo PriceFeed price… Your materials score was held down by a YouTube link that won't play…"

**MUSD Compass ($20):** "Your Mezo integration is already deep: the live app reads PriceFeed, TroveManager, StabilityPool and the sMUSD gauge, and the /vault flow opens real troves and deposits into sMUSD on testnet. To push higher in Wave 2, take the Borrow -> Earn flow to mainnet with HintHelpers… **Also add WalletConnect or Mezo Passport**, fill in the team and track fields, and update the README video and deck links."

**Pegforge ($0 — cautionary tale):** "Pegforge scored 0 in Wave 1 because it failed two gates. **G0 (valid submission): the GitHub repo was created 20 minutes before the deadline and is still empty**… **G2 (real integration): MUSD appears only in the write-up, with no deployed contract, app config or transaction that uses canonical MUSD or MEZO.**"

### The judge's internal scoring ladder (reconstructed from all 135 reviews)

**Hard gates (fail = $0):**
- **G0 — valid submission**: working links, non-empty repo, materials reachable
- **G1 — chain**: something actually runs on Mezo/Ethereum/Base/BNB
- **G2 — real integration**: canonical MUSD/MEZO/Mezo contract addresses used. "**A self-deployed MUSD fails G2 on any chain where real MUSD exists, and testnets count here too.**" (Beam's $0 review)

**Integration levels (from ~49 reviews that mention them):**
- **L1–L2**: token mentioned in text / surface usage
- **L3 "protocol-aware"**: app *reads* Trove/PriceFeed/StabilityPool state, but writes live in demo scripts or link-outs — damning phrase: "it would work the same with USDC"
- **L4 "Composes Mezo"**: your own contracts call real Mezo primitives on-chain (openTrove by signature, veBTC ops, pool swaps, ICR-gated auctions)
- **L5 "top of the ladder"**: + **real outside users** (not your own wallets — even testnet burners count), mainnet or real MUSD through contracts, and full risk handling: **Recovery Mode, maxBorrowingCapacity, redemptions, closeTrove/claimCollateral**, explorer-verified contracts

Recurring judge asks across the top ~20 (by frequency): ① outside/real counterparties (named in 5 of the top-5 reviews) ② verify contracts on Mezo explorer ③ public deck + complete form fields ④ business model / "who pays the team" ⑤ mainnet usage ⑥ handle Recovery Mode + maxBorrowingCapacity.

---

## 2) Every Wave 2 submission (as of Nov 7 — 25 total; judging pool $5,000)

21 are Wave-1 returnees; 4 are new. "W1$" = their Wave-1 award. Links are `app.akindo.io/communities/{id}/products/{id}`.

| # | Project | Track | One-line idea | Chain / net | Mezo integration depth (self-reported) | W1$ | Link |
|---|---|---|---|---|---|---|---|
| 1 | MUSD Pay Links | T2 | MUSD payment links w/ pre-pay contract checks + live borrow quote + invoice inbox | Mezo testnet (mainnet mentioned) | Verifies payment from on-chain Transfer events; in-product borrowing | 16 | [→](https://app.akindo.io/communities/RDgkLQzMni6M9mm98/products/Pv1lNjOBGIjwEZZj) |
| 2 | Liqvera | T2 | Verifiable BTC liquidity + MUSD Trove risk reports, paid per report in MUSD (x402) | Mezo testnet 31611 (+Base mention) | Reads troves/redemption queue; wallet-signed addColl/repayMUSD; x402 in test MUSD, gas sponsored | 18 | [→](https://app.akindo.io/communities/GLX6zWqv4hW7EP41/products/Drk1AoWNguaZnWMB) |
| 3 | MUSD Reach | T2 | "Makes Mezo savings portable" | (comment literally says "To be done") | — | 17 | [→](https://app.akindo.io/communities/eaq2zk9BEf837Emxq/products/xKq2eRzkECVKPkrG) |
| 4 | Morbit | T1 (+T2 bot) | Borrow MUSD vs BTC + earn BTC on MUSD, one dashboard | Mezo testnet | Rebuilt as Mezo borrow+earn dashboard + Telegram alert bot | 16 | [→](https://app.akindo.io/communities/Vwp11kkDLcG9j97g/products/La7ME0ozJIkrDv1Or) |
| 5 | PayLink — Digital Products | T2 | Sell digital products for MUSD; private downloads, purchase recovery | Mezo testnet 31611 | MUSD checkout + "Mezo Pools funding inside checkout" (BTC→MUSD in-flow) | 12 | [→](https://app.akindo.io/communities/4eN1gp6GBT2keJ8ol/products/OVdoVwqKKuP4OK4l) |
| 6 | CreditGraph | new | On-chain credit identity layer; MUSD-collateral underwritten loans | Mezo (vault on Mezo) | Protocol vault on Mezo, MUSD as loan collateral; social vouch bonds, agent staking | new | [→](https://app.akindo.io/communities/mVqgJZPj4fmEXkDJ/products/wKqXRa4lwc8AM3V7v) |
| 7 | MUSD Pocket | T2 | BTC-backed savings goals; invite chip-in; PWA | Mezo testnet | Verified borrow-into-goal tx (0xEC03…D460), live ICR/liq, Passport BTC wallets (Unisat/Xverse/OKX) | 13 | [→](https://app.akindo.io/communities/7mNwdW6lMHBpD8vA/products/lrkJw68jAfL634ne) |
| 8 | skim | T1/bridge | Sends small MUSD/mUSDC Mezo→USDC on Base in ~30s, "no $20 minimum" | **Mezo + Base mainnet** | "MUSD is live… Deposits valued at lower of $0.99 and what Mezo's MUSD/mUSDC pool actually pays, then paid out in USDC on Base" | 0 | [→](https://app.akindo.io/communities/JBVwZOQ2mUW1adBzo/products/eaq2BjR7xHEVGKan) |
| 9 | Pocket (mpocket) | T2 | Social payments (send/request/save mUSD), merchant checkout, Android APK | Mezo testnet (+mainnet mentions) | Direct mUSD transfers, checkout, weekly tasks; Android app | 16 | [→](https://app.akindo.io/communities/d87nqA9A4CJK1ZeL8/products/4eNnZ0KW7t0Q69VW) |
| 10 | Bulwark | T1 | Rescue BTC loans on-chain before liquidation | Mezo testnet | v2 vaults keep rescue reserve in **Mezo's own Stability Pool** (75/25 split, owner-adjustable) | 17 | [→](https://app.akindo.io/communities/GLzp4Nd79IQJdKQ2/products/jaeO9apOqtKLO1pn) |
| 11 | ProMeo | T2/AI | AI-agent procurement + settlement network | Mezo testnet 31611 | Escrow 0x0F12…7Aa8; lists canonical TroveManager/BorrowerOps/PriceFeed/MUSD; dry-run agent console | 0 | [→](https://app.akindo.io/communities/83mdAZPMjc3wAGKV/products/WjDeGJlXnh8jnZ9d) |
| 12 | RELAY | T2 | "secure the deal, move the value" | (comment is just "⏳⏳") | — | 13 | [→](https://app.akindo.io/communities/4e9BMWpMoHkjL2oo/products/3dJE3v1KdfK3N0VVe) |
| 13 | BitStreamfi | T1/T2 | BTC-backed streaming payroll + autonomous credit | Mezo testnet | Web app + Telegram bot + GDocs deck; "100% res…" (reserve claim) | 10 | [→](https://app.akindo.io/communities/63Nwvv0epILOKJenr/products/4eNwvZZBEh2DMRGRD) |
| 14 | MUSD Yield Vault | T1 | Idle MUSD → automated yield | Mezo testnet | "Wave 2 addresses the Wave 1 judge feedback (civ_defi_mezo) point by point": SP BTC gains valued via chain BTC/USD feed into totalAssets | 12 | [→](https://app.akindo.io/communities/BeNoK1DMpFDP1aXL/products/kzq7Wo6OecwV83ow) |
| 15 | Cobra (Telegram invoices) | new | Voice note → MUSD invoice on Telegram; paid to your Mezo wallet | Mezo testnet | MUSD payout option, EIP-681 QR, wallet-switch to Mezo | new | [→](https://app.akindo.io/communities/OVdXd7zZzUorEqDp/products/kzq4169Zgcq2dOrr) |
| 16 | Pylon | T1 | "Execution and risk terminal for Mezo borrowers" | Mezo (mainnet page exists; "I can't afford mainnet launch (need 0.04 BTC locked)") | Native BTC price, ICR/TCR, Recovery Mode, owner collateral actions | 18 | [→](https://app.akindo.io/communities/1PrjMj61aiJnq8mJ/products/gXlGLvqpoHZ0RkkN) |
| 17 | Levada | new/T1 | Brings Mezo's MUSD Savings Rate to Base; deposit MUSD on Base → lsMUSD | Base (+Sepolia; Mezo backend) | Bridges MUSD to Mezo **over Wormhole NTT ("the bridge MUSD itself uses")**, deposits in sMUSD, returns yield to Base | new | [→](https://app.akindo.io/communities/63NwD9x8ju1gQVO6/products/jaePWjgWWtW4QVw4) |
| 18 | Relayguard | T2/AI | MUSD payments for agents, with policy + proof; invoices + Node.js SDK | Mezo testnet | Exact-value invoices, checkout links/QR, API-payment protection | 12 | [→](https://app.akindo.io/communities/WjDeAkwQWC76wZmo/products/eaq41k7DrUK4wP) |
| 19 | RentOuts — Rent in MUSD | T2 | Tenants pay rent + deposits in MUSD via non-custodial escrow | Mezo testnet | "Every lease is new real-world demand for MUSD: rent is borrowed against BTC each month and paid to landlords in MUSD" | **19** | [→](https://app.akindo.io/communities/lrk3Q93dDt9olkVP/products/xKqB4gwBGhdRnpGl) |
| 20 | MUSD Books | T2 | Verifiable MUSD statements + invoice-referenced payments | Mezo testnet 31611 (+mainnet) | Co-attested statements, Trove reports, permit/approve scripted tests | 16 | [→](https://app.akindo.io/communities/eamQa93eps8JNX3n8/products/wKmLKL9g0Id8NrWW) |
| 21 | Tillward | T2 | BTC-backed working capital repaid from customer receipts | Mezo testnet | Native BTC price, ICR/TCR, Recovery Mode, owner collateral actions, verified contracts | 18 | [→](https://app.akindo.io/communities/o6Xgma29Vun4VWEE/products/A8Ng3lnKNUMpaqxvO) |
| 22 | MUSD Pulse | T2 | Read-only MUSD dashboard + #practice/#bridge/#alerts guides | Mezo testnet 31611 (Ethereum/Base mentioned) | Read-only; documents official borrow UI, faucet, "1,800 MUSD min + 200 gas" | 12 | [→](https://app.akindo.io/communities/1PojdM1e2TqJ9xMk/products/q3qvva3gkhL7WXPD) |
| 23 | AjoChain | new | "Ajo/esusu savings circles in MUSD on Mezo. Your locked collateral earns BTC while you save." | Mezo testnet | AjoManager 0xD9f1…653A; started at Portaldot Hacker House | new | [→](https://app.akindo.io/communities/Nmg4enqLlhd1ov1Vq/products/EN83PXGdRcla379Q) |
| 24 | Kudi | T1/T2 | Borrow MUSD against your Bitcoin | Mezo testnet | Full borrow flow on testnet with tx hashes (open trove, add collateral…) | 15 | [→](https://app.akindo.io/communities/JBRLwjXBvT4l4m1g/products/83NnvOGa8TlAWR3GZ) |
| 25 | Witness | Infra | Passkey-gated MUSD spending for programs ("a program can ask, but MUSD leaves only when your passkey approves") | Mezo testnet 31611 | Allowlisted relayer, replay protection; Stability Pool deposit+withdrawal on testnet; 0.10% fee | 0 | [→](https://app.akindo.io/communities/WjDemABP4i3308DJQ/products/3dJwnPoe7i3aWGwL) |

**Field observations:** strongest Wave-2 returnee by Wave-1 money is RentOuts at $19 — the entire Wave-1 top 5 (Doji, Surety, Janus, Keel, Mezonk) **had not submitted to Wave 2 as of Nov 7**. Two entries (#3, #12) are placeholder submissions. Notable Wave-1 projects that also have product pages but no Wave-2 submission yet: Pegforge (its W2 plan: push contracts, deploy with faucet MUSD, include addresses/tx hashes — per the judge's $0 review).

---

## 3) The Mezo builder stack (features, addresses, SDKs)

### Networks
| | Testnet | Mainnet |
|---|---|---|
| Chain ID | **31611** | **31612** |
| RPC | `https://rpc.test.mezo.org` (WSS `wss://rpc-ws.test.mezo.org`) | Boar `mezo-mainnet.boar.network` · Imperator · Validation Cloud · dRPC `mezo.drpc.org` |
| Explorer | explorer.test.mezo.org | explorer.mezo.org |
| Gas | **BTC** (18 decimals) — native currency is BTC, not MEZO | same |

Source: [dev getting-started](https://mezo.org/docs/developers/getting-started/). Solidity 0.8.28 (london), Hardhat/Foundry both fine. Mezo = Evmos fork (Cosmos SDK + CometBFT), client `mezod`. EVM up to **Cancun** (mezod v7, Mar 2026). Faucet: [faucet.test.mezo.org](https://faucet.test.mezo.org/) (CAPTCHA-protected; also the Discord `#testnet` channel).

### Tokens (canonical — using fakes fails gate G2)
| Token | Mezo mainnet | Mezo testnet | Ethereum | Base | BSC |
|---|---|---|---|---|---|
| **MUSD** | 0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186 | 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503 | same 0xdD46…F186 | same 0xdD46…F186 | not found (contracts reference lists no MUSD on BSC) |
| **MEZO** | 0x7B7c000000000000000000000000000000000001 | not found | 0x8e4cbBcc33dB6c0a18561fDE1F6bA35906d4848b | same | same (+ **Solana** 8niMFW4yuv3vLoqTtBaC6rchyasmUhgvpgSyPEeeCrw6) |
| BTC (tBTC) | 0x7b7C000000000000000000000000000000000000 | – | 0x18084fbA666a33d37592fA2633fD49a74DD93a88 | – | – |

Bridged assets on Mezo (mainnet): mUSDC 0x04671C72Aab5AC02A03c1098314b1BB6B560c197 · mUSDT 0xeB5a5d39dE4Ea42C2Aa6A57EcA2894376683bB8E · mDAI · mcbBTC · mFBTC · mSolvBTC · mswBTC · mT · mUSDe · sUSDat. aMUSD (Morpho Alpha MUSD Core Vault receipt) **Ethereum-only**: 0x52317a47585A6ACDfbD7a29B494c3E2baAE96aBc. Source: [contracts reference](https://mezo.org/docs/users/resources/contracts-reference).

### MUSD core protocol (troves) — from [mezo-org/musd](https://github.com/mezo-org/musd) `solidity/artifacts/deployments/`
| Contract | Mezo mainnet | Mezo testnet ("matsnet") |
|---|---|---|
| MUSD | 0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186 | 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503 |
| TroveManager | 0x94AfB503dBca74aC3E4929BACEeDfCe19B93c193 | 0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0 |
| BorrowerOperations | 0x44b1bac67dDA612a41a58AAf779143B181dEe031 | 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5 |
| BorrowerOperationsSignatures | 0xB57ab578BF20b3e318f3EFAA587C51DBccE5df7a | 0xD757e3646AF370b15f32EB557F0F8380Df7D639e |
| StabilityPool | 0x73245Eff485aB3AAc1158B3c4d8f4b23797B0e32 | 0x1CCA7E410eE41739792eA0A24e00349Dd247680e |
| PriceFeed | 0xc5aC5A8892230E0A3e1c473881A2de7353fFcA88 | 0x86bCF0841622a5dAC14A313a15f96A95421b9366 |
| HintHelpers | 0xD267b3bE2514375A075fd03C3D9CBa6b95317DC3 | 0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6 |
| GasPool | 0x3EB418BdBE95b4b9cf465ecfBD8424685ACD1Bc1 | 0x8fa3EF45137C3AFF337e42f98023C1D7dd3666C0 |
| ActivePool | 0x3012C2fE1240e3754E5C200A0946bb0E07474876 | 0x143A063F62340DA3A8bEA1C5642d18C6D0F7FF51 |
| InterestRateManager | 0x4a453700d157717Fe02fB62E7700ED7845048285 | 0xD4D6c36A592A2c5e86035A6bca1d57747a567f37 |
| SortedTroves | 0x8C5DB4C62BF29c1C4564390d10c20a47E0b2749f | 0x722E4D24FD6Ff8b0AC679450F3D91294607268fA |

(Mechanics vocabulary the judge uses: `openTrove`, `openTroveWithSignature`, `adjustTrove`, `closeTrove`, `claimCollateral`, `withdrawMUSDWithSignature`, `provideToSP`, `redeemCollateral`, `getEntireDebtAndColl`, `maxBorrowingCapacity`, ICR/TCR/MCR, Recovery Mode.)

### Borrow economics ([fees doc](https://mezo.org/docs/users/borrow/fees))
- Issuance fee **0.1%** of borrowed MUSD · Interest **1–5% APR fixed at open** (refinance to move; simple interest, not compound) · Redemption fee **0.75%** (paid by redeemer; redemptions target **lowest-CR** loans above 110%) · Refinance fee **0.02%** of debt · **Gas deposit: 200 MUSD flat** (minted as extra debt, held in escrow, returned on close, **counts toward collateralization**)
- Liquidation below **110%** ICR · **Recovery Mode when system TCR < 150% (CCR)** — unlike Liquity v1, liquidation threshold stays 110% in Recovery Mode; borrowing/refinancing restricted instead ([liquidation mechanics](https://mezo.org/docs/users/borrow/liquidation-mechanics))
- On Base/Ethereum the MUSD contracts are **NoOp stubs** (borrowing lives on Mezo only) — musd repo `deployments/base/*NoOp.json`
- **Testnet minimum borrow: 2,000 MUSD (1,800 principal + 200 gas deposit)** — "This is a protocol floor… you borrow once and reuse the balance" ([x402 quickstart](https://mezo.org/docs/developers/getting-started/musd-payments-x402/x402-quickstart)). **Testnet MUSD is minted by borrowing against testnet BTC — the faucet only gives BTC.** Mainnet minimum: not found in docs (builder Pylon reports needing "0.04 BTC locked" for a mainnet launch — collateral, self-reported).

### Savings & earn
- **MUSD Savings Vault (sMUSD)**: deposit MUSD → sMUSD receipt; yield accrues in exchange rate, **distributed weekly**; sources = MUSD protocol fees + BTC fees converted to MUSD; fee split 50/50 between vault and the protocol bootstrap loan (governable, min 50% to loan until repaid). **Staking sMUSD in the gauge redirects your fee yield to veBTC voters and pays MEZO emissions instead.** Vault page: [mezo.org/earn/vaults/0xb4D498029af77680cD1eF828b967f010d06C51CC](https://mezo.org/earn/vaults/0xb4D498029af77680cD1eF828b967f010d06C51CC). Withdrawal fee none, no time-lock. ([doc](https://mezo.org/docs/users/mezo-earn/vaults/musd-savings-vault))
- **Ditto MUSD savings vault** (cross-chain "DTO vault") — [doc](https://mezo.org/docs/users/mezo-earn/vaults/ditto-musd-savings-vault) · **USDC Lending Vault**: borrow mUSDC against BTC, variable rate, Morpho-based; depositor yield from borrower interest ([blog](https://mezo.org/blog/borrow-usdc-against-your-bitcoin/)) · **sUSDat** (tokenized STRC yield) live on Mezo ([blog](https://mezo.org/blog/how-to-earn-strc-yield-on-mezo/))
- **veBTC**: lock BTC → NFT; votes direct MEZO emissions to gauges; bribes/rebases; **ValidatorsVoter is a zero address on testnet (mainnet-only)** — per judge's Doji review
- **veMEZO**: lock MEZO (1 week–4 years, linear decay, auto-max-lock) → NFT; **up to 5x boost** on veBTC voting power; rebases; matching market; votes on MEZO Gauges ([doc](https://mezo.org/docs/users/mezo-earn/lock/vemezo))
- **MEZO Gauges** (launched Sep 11, 2026): veMEZO holders direct ~**200k MEZO/epoch** to MUSD pools on **Curve + Uniswap (Ethereum, via Merkl)** and **Aerodrome (Base, direct)**; anyone can add gauge rewards; pools: MUSD/USDC/USDT (Curve), MUSD/USDC (Uniswap), MUSD/USDC + MUSD/MEZO (Aerodrome). New Aero pools added Oct 20 ([intro post](https://mezo.org/blog/introducing-mezo-gauges), [Aero update](https://mezo.org/blog/mezo-gauges-on-aero/))

### DEX — Mezo Pools / "Tigris" ([dev doc](https://mezo.org/docs/developers/features/mezo-pools), [repo](https://github.com/mezo-org/tigris))
- Basic pools (Aerodrome-style): factory 0x83FE469C636C4081b87bA5b3Ae9991c6Ed104248 · router 0x16A76d3cd3C1e3CE843C6680d6B37E9116b5C706 · fees 0.30% volatile / 0.02% stable · MUSD/BTC 0x52e604c44417233b6CcEDDDc0d640A405Caacefb · MUSD/mUSDC 0xEd812AEc0Fecc8fD882Ac3eccC43f3aA80A6c356 · MUSD/mUSDT 0x10906a9E9215939561597b4C8e4b98F93c02031A
- Concentrated liquidity (Velodrome Slipstream-style): CL factory 0xBB24AF5c6fB88F1d191FA76055e30BF881BeEb79 · ERC-721 positions · `unstakedFeeModule` redirects 10% of unstaked-position fees to staked
- **Morpho is deployed on Mezo** (powers the USDC lending market; Baserate built "the first MUSD market on Mezo's own Morpho Blue" per judge)

### Payments & wallet
- **x402 MUSD payments**: HTTP-402 paywall protocol; `@x402/*` SDKs (TypeScript/Go/Python), Mezo mainnet supported since `@x402/evm` v2.15.0 (2026-06-12); **facilitator pays gas for both parties** (buyer needs no BTC); bundled `@x402/paywall` UI; demo at [demo.vativ.io](https://demo.vativ.io), facilitator [facilitator.vativ.io](https://facilitator.vativ.io) ([quickstart](https://mezo.org/docs/developers/getting-started/musd-payments-x402/x402-quickstart))
- **Mezo Passport**: official wallet-connect library `@mezo-org/passport` (RainbowKit-based) — connects **native BTC wallets (Xverse, Unisat) + EVM (MetaMask)** in one flow; optional but judges name-check it. ⚠️ Mezo is **"sunsetting native BTC wallet sign-up and native BTC wallet bridge-ins"** after the Oct 5 exploit ([incident report](https://mezo.org/blog/incident-report-october-5-2026/)) — check current status before building on BTC-wallet flows. Mezo ID + send-assets in the Passport app ([docs](https://mezo.org/docs/users/passport/mezo-id))
- MUSD Monitor (third-party): [mezotools.cc](https://mezotools.cc) — trove health, redemptions/liquidations, oracle prices

### Bridges & oracles
- **Native bridge**: stables + tBTC between Mezo ↔ Ethereum (Portal contracts on Ethereum; MezoBridge/BitcoinDepositor) ([reference](https://mezo.org/docs/users/resources/contracts-reference))
- **Wormhole NTT** for MUSD and MEZO (Mezo ↔ Ethereum ↔ Base ↔ BSC ↔ Solana); Portal UI at portalbridge.com; NTT manager/transceiver addresses per chain in the contracts reference; SDKs available ([kickoff](https://www.youtube.com/live/eAiaQpzvVE0)). **Triparty Bridge** shipped in mezod v9.0.0 (Apr 2026) ([release notes](https://mezo.org/docs/users/resources/release-notes))
- **Oracles**: **Skip Connect** is the native oracle (price written during consensus via x/oracle Cosmos module — what the judge calls "the Skip oracle") · **Pyth** on Mezo mainnet+testnet (proxy 0x2880aB155794e7179c9eE2e38200202908C17B43) · Stork (testnet) · Supra DORA (testnet) ([oracle doc](https://mezo.org/docs/developers/architecture/oracles))

### SDKs & tooling
`@mezo-org/passport` (wallet) · [mezo-org/chains](https://github.com/mezo-org/chains) (viem chain configs) · `@x402/evm` ≥2.15 (payments) · Wormhole NTT SDK · standard viem/wagmi/Hardhat/Foundry (EVM, Cancun) · Goldsky subgraphs (slug `mezo-testnet`) · Onchain Den / safe.mezo.org (SAFE) · Merkl (incentives) · explorer contract verification on explorer.(test.)mezo.org · audits collected at [mezo-org/audits](https://github.com/mezo-org/audits)

### Launches, last ~3 months (Aug 7 – Nov 7, 2026)
| Date | Launch | Source |
|---|---|---|
| Aug 10 | "How to Build a Bitcoin-Backed Credit Market" (design essay: "repayment known in advance, lenders who pick their date, credit that can change hands") | [blog](https://mezo.org/blog/how-to-build-a-bitcoin-backed-credit-market/) |
| Sep 11 | **MEZO Gauges** — ~200k MEZO/epoch allocated by veMEZO vote to Curve/Uniswap/Aerodrome MUSD pools | [blog](https://mezo.org/blog/introducing-mezo-gauges/) |
| Oct 5–6 | **veBTC exploit + chain halt** (see gotchas) | [incident report](https://mezo.org/blog/incident-report-october-5-2026/) |
| Oct 16 | Buildathon Wave 1 starts | [blog](https://mezo.org/blog/mezo-buildathon-is-underway/) |
| Oct 20 | New Aero pools added to MEZO Gauges | [blog](https://mezo.org/blog/mezo-gauges-on-aero/) |
| (Jun 12, slightly older) | x402 SDK Mezo mainnet support | [x402 doc](https://mezo.org/docs/developers/getting-started/musd-payments-x402/x402-quickstart) |

Scale reference (H1 2026): **1,000 BTC deployed through Mezo Prime, $28M MUSD in circulation** ([H1 review](https://mezo.org/blog/mezo-h1-2026/)).

---

## 4) What the Mezo team says it wants

**From the kickoff workshop** ([youtube.com/live/eAiaQpzvVE0](https://www.youtube.com/live/eAiaQpzvVE0), Oct 13, 1h25m; host Miles/AKINDO, Andre + Dimitri/Mezo; transcript chunks 0–1 read, later chunks blocked during this session):
- Andre (Mezo): "**if you want to win this hackathon you should get at the end of the hackathon building a close to a live product on mainnet** be it on Ethereum or Mezo or base or BNB as possible"
- "What we're looking for are **projects that are going to be able to survive after the hackathon**… if you just have ideas or… a mockup or prototype, it will be very hard for you to win… you'll be competing against people that have done fully-fledged products"
- "If your project is good enough, **we have other builder tracks… builder grants and other builder incentives on Mezo**" you can apply to afterwards
- Ecosystem map he presented: DEXes (Uniswap + Curve on Ethereum, **Aerodrome = main MUSD liquidity pool outside Mezo** on Base, PancakeSwap on BNB); Morpho on Mezo; native bridge (stables/tBTC) + **Wormhole for MUSD/MEZO**; earn partners — Matchbox (veBTC×veMEZO max-boost matching), Bore Finance (automated veBTC voting), VZO (buy/sell veNFTs at discount), **Arov** (previous hackathon participant; turns veNFTs into liquid tokens); Merkl (core incentive platform), StakeDAO (Curve pool); CEXes: Coinbase (largest), Gate.io, Kraken
- Blog (Oct 19): "The best projects can keep building after the Buildathon by applying to **Supernormal Foundation's builder programs** — the **Mezo Ignition Program** (prototype → mainnet) and the **Mezo Founder Program** (working products with traction)… milestone-based grants, integration assistance" ([blog](https://mezo.org/blog/mezo-buildathon-is-underway/))

**From the Mezo/AKINDO team in the event comments thread** (via API):
- **"For wave 2, we'll rank projects against each other rather than simply checking the boxes on quality of integration and so on. Therefore, more 'complete' and 'ready' projects will get better points"**
- Q: what do judges prioritize? A: "**it works as expected; users can fully test all features; no clear security flaws**"
- Q: deploy on Mezo required? A: "Mezo, Base, Ethereum, BNB are all eligible"
- Wave-1 deadline reminder checklist: working MUSD/MEZO integration · project link + GitHub repo · **2-minute pitch video** — "Not finished? Submit your progress anyway and keep building in Wave 2"

**Gaps/problems the Mezo team itself named:**
- Thin MUSD liquidity off-Mezo: "MUSD is only useful if it's liquid where people already are. **Thin pools on other chains mean MUSD can't be entered or exited at size, limiting MUSD debt book, and putting pressure on the stablecoin's peg**" ([MEZO Gauges post](https://mezo.org/blog/introducing-mezo-gauges/))
- veBTC couldn't be used as collateral ("Mezo's FAQ says veBTC cannot be used as collateral, so the 800+ BTC locked on Mezo cannot be borrowed against" — Doji's framing, confirmed direction by judge's interest); the credit market Mezo wants: "repayment known in advance, lenders who pick their date, credit that can change hands" ([Aug 10 essay](https://mezo.org/blog/how-to-build-a-bitcoin-backed-credit-market/))
- Judge's repeated "biggest gap" across top reviews: **no real counterparties** — "every borrower, lender and auction buyer so far is your own wallet"
- Judge-named under-used surfaces: sMUSD for idle capital, Mezo's own Morpho Blue (only one market existed), fee/bribe/rebase claim paths, prepareSettle + existing-veBTC deposits, ValidatorsVoter (mainnet-only), x402 pricing, jMEZO-style receipt liquidity
- Docs gaps found: MUSD on BNB is claimed in the tagline but has no address in the contracts reference (not found); mainnet min-borrow not documented; Waves 2 deadline inconsistency (Nov 13 API vs Nov 15 page/blog)

---

## 5) Known gotchas

1. **Testnet MUSD isn't faucet-dispensed** — faucet gives BTC only; you **borrow** MUSD (min **2,000 MUSD = 1,800 principal + 200 gas deposit**; borrow once, reuse). ([x402 quickstart](https://mezo.org/docs/developers/getting-started/musd-payments-x402/x402-quickstart))
2. **Gas is BTC on Mezo** (not MEZO, not ETH) — plan balances accordingly; x402 facilitator can sponsor gas for MUSD payments.
3. **Self-deployed/fake MUSD fails gate G2 automatically** ("testnets count here too") — use canonical addresses above. Several Wave-1 $0s died on exactly this + empty repos + dead links.
4. **ValidatorsVoter is a zero address on testnet** — mainnet-only feature; mislabeling it cost Doji a materials ding.
5. **Oct 5, 2026 veBTC exploit**: meta-txn + external-library flaw; 37 positions / 5.52 BTC taken; **chain fully halted ~5.5h** (09:27–15:00 Oct 6); meta-transactions disabled chain-wide; **native BTC wallet sign-up and BTC-wallet bridge-ins being sunset**; bridge-out limits being calibrated. Users made whole. If your design assumed veBTC meta-txns or BTC-wallet flows, re-check. ([incident report](https://mezo.org/blog/incident-report-october-5-2026/))
6. **Trove mechanics**: 110% liquidation floor; 150% TCR Recovery Mode (borrowing/refi restricted); redemptions skim lowest-ICR loans; the 200-MUSD gas deposit is debt that counts in your ICR; per-trove **maxBorrowingCapacity** caps vault-style products (~0.27 BTC cited in mbLP review) — handle or you're leaving points on the table (judge explicitly checks).
7. **Fees**: 0.1% issuance · 0.75% redemption · 0.02% refinance · 1–5% fixed APR · sMUSD yield is weekly, in the exchange rate. Pool fees 0.30%/0.02% (basic), CL tiers 0.01–1%.
8. **Faucet is CAPTCHA-gated** (rate-limits not published — not found); Discord `#testnet` is the alternative drip source.
9. **Bridge minimums**: skim claims a "$20 minimum" on the MUSD bridge (self-reported, not in docs — not verified). Wormhole NTT is the official MUSD/MEZO route (Portal UI).
10. **Judges run headless browsers and time out on slow apps** (Surety's review: "our headless browser timed out on it"); they click every link — unreachable decks got Materials capped at 1–2/10 three times in the top 5.
11. **Deadline confusion**: API says Nov 13 05:30 UTC; page/blog say Nov 15. Don't gamble — be done by Nov 12. Also note AKINDO's "Grant Distribution Network: Ethereum" field on the page, while rewards are paid in MEZO by Mezo directly (14-day TWAP at KYC).
12. **KYC/KYB before payout** — W8-BEN etc.; unresponsive winners forfeit to the next-highest submission. Wave-1 payouts were still pending days after the "by Nov 6" email (comments thread).
13. **One judge, deep reads**: `civ_defi_mezo` wrote all 135 Wave-1 reviews and references exact function names and tx history — assume your repo, explorer verification status, and on-chain activity will be read line-by-line.

---

## OPEN — surprising things a top team would notice (facts, not ideas)

1. **The Wave-1 top 5 are absent from Wave 2** (as of Nov 7): Doji, Surety, Janus, Keel, Mezonk have not resubmitted. The strongest confirmed returnee scored $19 in Wave 1. Six days out, the $5,000 pool is contested mostly by $10–19-tier projects — and two of the 25 entries are literal placeholders ("To be done", "⏳⏳").
2. **Materials is free money**: 10% of the score, and the judge repeatedly capped it at 1–2/10 for unreachable decks, dead YouTube links, or missing form fields. Three of the top five lost placement to this. A public PDF deck committed in the repo + working 2-min video + every form field filled (team roles, track, status, milestones, business model) is a measurable edge over most of the current field.
3. **"Outside users" is the judge's #1 lever** — said in five of the top-five reviews; even testnet wallets that aren't the team's own count as evidence. This is the cheapest gap to close relative to how loudly it's rewarded.
4. **The Wave-2 rubric shift is explicit**: "rank projects against each other rather than simply checking the boxes" — relative completeness wins, not checkbox depth alone.
5. **Integration 10/10 was given only 4 times in 135 submissions**, all to projects that chained multiple Mezo primitives end-to-end on-chain (trove → pool → gauge → bribes). 9/10 was never used; the practical ceiling is 8 unless everything runs on-chain.
6. **Under-farmed surfaces the judge name-dropped**: sMUSD as the idle-capital default, Mezo's own Morpho Blue (one MUSD market existed as of Wave 1), x402 with a real price, fee/bribe/rebase claim paths, MEZO Gauges rewards, the veBTC-collateral question (Doji/Surety both built there and took the top spots), and ValidatorsVoter (mainnet-only).
7. **The money isn't the rubric**: identical criterion profiles got $22 and $80 in Wave 1 — the judge pays for projects he wants to see survive (his own words in the kickoff: "projects that are going to be able to survive after the hackathon", plus Ignition/Founder programs as the follow-on money).
8. **Nigeria-eligibility is clean** (not on the prohibited list), but payout requires W8-BEN-grade KYC and a wallet — worth preparing early given Wave-1 payout lag.

---

### Sources index
- Event page + public API (all Wave 1 votes/ratings/feedback, Wave 2 submissions, threads): https://app.akindo.io/wave-hacks/OVOO0gdrVU8379D10 · `api.akindo.io/public/...` (fetched Nov 7, 2026)
- Mezo docs: [developers](https://mezo.org/docs/developers/) · [getting-started](https://mezo.org/docs/developers/getting-started/) · [contracts reference](https://mezo.org/docs/users/resources/contracts-reference) · [fees](https://mezo.org/docs/users/borrow/fees) · [liquidations](https://mezo.org/docs/users/borrow/liquidation-mechanics) · [architecture](https://mezo.org/docs/users/borrow/architecture-and-terminology) · [x402](https://mezo.org/docs/developers/getting-started/musd-payments-x402/x402-quickstart) · [Mezo Pools](https://mezo.org/docs/developers/features/mezo-pools) · [oracles](https://mezo.org/docs/developers/architecture/oracles) · [integrations](https://mezo.org/docs/developers/getting-started/integrations-and-partners) · [sMUSD](https://mezo.org/docs/users/mezo-earn/vaults/musd-savings-vault) · [veMEZO](https://mezo.org/docs/users/mezo-earn/lock/vemezo) · [release notes](https://mezo.org/docs/users/resources/release-notes)
- Code: [mezo-org/musd](https://github.com/mezo-org/musd) (deployments) · [mezo-org/tigris](https://github.com/mezo-org/tigris) · [mezo-org/chains](https://github.com/mezo-org/chains) · [mezo-org/documentation](https://github.com/mezo-org/documentation)
- Blog: [buildathon underway](https://mezo.org/blog/mezo-buildathon-is-underway/) · [MEZO Gauges](https://mezo.org/blog/introducing-mezo-gauges/) · [Aero pools](https://mezo.org/blog/mezo-gauges-on-aero/) · [incident Oct 5](https://mezo.org/blog/incident-report-october-5-2026/) · [credit market](https://mezo.org/blog/how-to-build-a-bitcoin-backed-credit-market/) · [H1 2026](https://mezo.org/blog/mezo-h1-2026/) · [borrow USDC](https://mezo.org/blog/borrow-usdc-against-your-bitcoin/)
- Kickoff workshop: https://www.youtube.com/live/eAiaQpzvVE0 (Oct 13, 2026)
- Mezo X (Wave 1 top-5 announcement, Nov 5, 2026): https://x.com/MezoNetwork

**Not found / unverified (flagged, not guessed):** MUSD contract on BNB Chain · mainnet minimum borrow · faucet rate limits · bridge "$20 minimum" (builder-reported only) · kickoff transcript beyond the first ~25 minutes (YouTube blocked further transcript fetches this session; video link above) · identities behind `civ_defi_mezo` beyond "Mezo core team" · Wave-2 judges (tab shows "No judges yet").
