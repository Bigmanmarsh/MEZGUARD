// Proves MezGuard's mainnet "direct mode" transactions work against REAL Mezo mainnet state, at $0:
// forks mainnet, impersonates a real saver who has sMUSD staked in Mezo's gauge, and sends the exact
// calldata the web app builds (same selectors, same encoding as app/public/app.js).
// Run: FORK=mainnet npx hardhat run scripts/mainnet-direct-fork.js
const { ethers, network } = require("hardhat");

const VAULT = "0xb4D498029af77680cD1eF828b967f010d06C51CC";
const GAUGE = "0x677817bF3e44b90E8F95222F75e2950b7904a401";
const MUSD = "0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186";
const SAVER = "0xC853E78877c758cC43ad152726Cb593f03D23030"; // real mainnet saver with staked sMUSD
const SEL = { approve: "0x095ea7b3", deposit: "0xb6b55f25", withdraw: "0x2e1a7d4d", claimYield: "0x406cf229" };
const word = (v) => BigInt(v).toString(16).padStart(64, "0");
const fmt = (v) => ethers.formatEther(v);

async function main() {
  if (network.config.chainId !== 31612) throw new Error("Run with FORK=mainnet");
  await network.provider.send("hardhat_mine", ["0x1"]); // work on a local block, not the historical fork block
  await network.provider.request({ method: "hardhat_impersonateAccount", params: [SAVER] });
  // The fork's default gas price is far above Mezo's real one (~0.0000015 gwei), so give the fork copy gas money.
  await network.provider.send("hardhat_setBalance", [SAVER, "0xDE0B6B3A7640000"]);
  const s = await ethers.getSigner(SAVER);
  const bal = (a, t) => new ethers.Contract(t, ["function balanceOf(address) view returns (uint256)"], ethers.provider).balanceOf(a);
  const send = async (label, to, data) => {
    const tx = await s.sendTransaction({ to, data });
    const r = await tx.wait();
    console.log(`  ok  ${label.padEnd(34)} gas ${r.gasUsed}`);
  };
  const show = async (t) => console.log(`${t}: wallet ${fmt(await bal(SAVER, MUSD))} MUSD | vault ${fmt(await bal(SAVER, VAULT))} | staked ${fmt(await bal(SAVER, GAUGE))}`);

  await show("start");
  // "Take out $100" when everything is staked: unstake exactly 100 sMUSD, then withdraw 100 from the vault.
  const amt = ethers.parseEther("100");
  await send("gauge unstake 100 (Take out step 1)", GAUGE, SEL.withdraw + word(amt));
  await send("vault withdraw 100 (Take out step 2)", VAULT, SEL.withdraw + word(amt));
  await show("after take out");
  // "Save $50": approve the vault, then deposit.
  const dep = ethers.parseEther("50");
  await send("approve vault 50 (Save step 1)", MUSD, SEL.approve + word(VAULT) + word(dep));
  await send("deposit 50 (Save step 2)", VAULT, SEL.deposit + word(dep));
  await show("after save");
  await send("claimYield (Collect interest)", VAULT, SEL.claimYield);
  // "Move my money home": unstake everything, then withdraw everything.
  const staked = await bal(SAVER, GAUGE), inVault = await bal(SAVER, VAULT);
  await send("gauge unstake all (Move home 1)", GAUGE, SEL.withdraw + word(staked));
  await send("vault withdraw all (Move home 2)", VAULT, SEL.withdraw + word(staked + inVault));
  await show("after move home");
  if ((await bal(SAVER, VAULT)) !== 0n || (await bal(SAVER, GAUGE)) !== 0n) throw new Error("savings not fully home");
  console.log("PASS: every mainnet direct-mode action works on real Mezo state");
}
main().catch((e) => { console.error(e); process.exit(1); });
