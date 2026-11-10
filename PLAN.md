# MezGuard: 5-day build plan

**Hard deadline:** Thu 13 Nov, 06:30 Lagos (05:30 UTC). **Our target:** submit Wed 12 Nov by 18:00 Lagos.
Rule from Suisub: if the money path isn't proven by **Sun 9 Nov 12:00**, we cut the bridge and run Mezo-only (deposit MUSD on Mezo directly).

| Day | Claude builds | Marshall does |
|---|---|---|
| **1 · Fri 7–Sat 8** | Repo + log. Map every contract on the money path. Solve "how a new saver gets gas on Mezo". Simulate the full path with read-only calls. Then one tiny real run on mainnet: USDC → MUSD (Base) → bridge → sMUSD (Mezo) → back. | Fund a fresh dev wallet with ~$10 USDC + ~$1 ETH on Base (address from me). |
| **2 · Sat 8–Sun 9** | **MezGuard Account** smart contract: each saver gets their own account that only they own. Save, withdraw, claim interest, the 10%-above-$100 fee, and **Guard exit** (a keeper can only move funds back to the owner, only when a rule triggers). Tests, fuzz tests, deploy, verify on the Mezo explorer. | Register on AKINDO + join the Mezo Discord. Start telling the WhatsApp community: "beta testers wanted, save $5–20". |
| **3 · Sun 9–Mon 10** | Web app: Home / Guard / Reports, Save and Withdraw in ≤3 taps, "Sign in with Telegram", wallet connect. The Guard + Whale Watch watcher service and Telegram alerts. Host it. | Try the app on your phone and tell me everything confusing. First 3 testers save. |
| **4 · Mon 10–Tue 11** | Weekly/monthly reports (you vs other savers, naira, share card, PDF), the public proof page, AI summaries. Fix everything testers hit. | Get 5–10 real savers. Collect their feedback. |
| **5 · Wed 12** | README (honest limits table), deck (public PDF in the repo), 2-min video (Playwright + "Mark" voice + FFmpeg), the AKINDO form text. Final checks: every link, fast load, verified contracts. | Record or approve the voice. **Submit on AKINDO.** Post on X tagging @MezoNetwork. |

## Judge checklist we tick on purpose (from the Wave 1 reviews)
- [ ] Outside users with explorer links (proof page)
- [ ] Every path run on-chain: deposit, claim, withdraw, Guard exit, fee
- [ ] Contracts verified on the Mezo explorer
- [ ] Business model + "who pays the team" in the form and deck
- [ ] Public deck link + video that plays + all form fields (track, team, roles, status)
- [ ] Depeg check (not a hard-coded $1)
- [ ] Live app loads fast in a headless browser
- [ ] Mainnet-only features labelled honestly
