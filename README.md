# MezGuard

**Guarded dollar savings, powered by Bitcoin.**

MezGuard lets anyone save dollars in Mezo's MUSD Savings Rate vault (sMUSD, about 4.9% a year) without trusting an exchange, and adds a **Guard** that watches for danger and moves your money back to your own wallet.

- **Save and take out with one signature and no fee.** Saving uses an MUSD permit, and withdrawing uses an EIP-712 signature. The keeper pays the gas, and the contract only ever pays the owner.
- **The Guard** reads live Mezo mainnet and Base data: the MUSD price on two pools, the vault's size and rate, Mezo block production, and the Wormhole NTT bridge. If MUSD stays below $0.97 for 3 checks, or the vault looks unsafe, it exits your savings **to your own wallet**. You can switch it off, and you can run a real drill.
- **Whale Watch** shows big sMUSD deposits and withdrawals, big MUSD sells on Base, and the Stability Pool, each explained in one sentence. It is for protection, not copy-trading.
- **Reports** come weekly and monthly. Each has one big number, the amount in dollars and naira, a comparison with plain USDC, and an anonymous ranking of your saving habits (never your size) against other MezGuard savers.
- **Telegram:** sign in with Telegram (@Mezguardbot) to get alerts. You don't need to create your own bot.

## Business model
Free up to $100 saved. Above that, MezGuard keeps 10% of the **interest**, never any of the deposit. The cap is enforced in code: `MAX_FEE_BPS = 1000`.

## Contracts (Mezo testnet, chain 31611)
| | Address |
|---|---|
| MezGuardFactory (verified) | `0x73C0Dc60D6Ea3bEc8b2a40914f8a2Ff73E2aB5E4` |
| MezGuardAccount implementation | `0x75DAE3b1d34F4B530f54F49338a117d4528b3d65` |
| Mezo sMUSD vault | `0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16` |
| MUSD | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |

**Who can move money:**
- **The owner:** save, withdraw, and switch the Guard on or off.
- **The keeper:** only `guardExit`, which sends funds to the owner, and only while the Guard is on.
- **The admin:** can change the keeper and the fee (capped at 10%), but can never touch deposits.

## Run it
```bash
npm install
npm start                          # http://localhost:8787  (add ?devwallet on localhost for a throwaway test wallet)
FORK=testnet npx hardhat test      # 9 tests against a fork of Mezo with the real sMUSD vault
```

## Honest limits
- The app runs on **Mezo testnet**. The Guard, Whale Watch and the rate shown use **real mainnet data**.
- Testnet's vault pays interest in lumps, so reports also show what your balance earns at Mezo's live mainnet rate, and label it that way.
- The keeper is a single server key for now. It can only send funds to their owners.
- The implementation contract's explorer verification is still pending (the factory is verified).
