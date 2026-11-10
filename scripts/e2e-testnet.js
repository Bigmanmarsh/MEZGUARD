// Live end-to-end run on Mezo testnet with the dev wallet as the saver.
const { ethers } = require("hardhat");
const d = require("../deployments/mezoTestnet.json");
const E = ethers.parseEther;
async function main() {
  const [me] = await ethers.getSigners();
  const f = await ethers.getContractAt("MezGuardFactory", d.factory);
  const musd = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", d.musd);
  const log = (k, tx) => console.log(k.padEnd(22), `https://explorer.test.mezo.org/tx/${tx.hash}`);
  let tx = await f.createAccount(me.address); await tx.wait(); log("createAccount", tx);
  const accAddr = await f.accountOf(me.address); console.log("account", accAddr);
  const acc = await ethers.getContractAt("MezGuardAccount", accAddr);
  tx = await musd.approve(accAddr, E("100")); await tx.wait();
  tx = await acc.deposit(E("100")); await tx.wait(); log("deposit 100", tx);
  tx = await musd.transfer(accAddr, E("10")); await tx.wait(); log("bridge-style send 10", tx);
  tx = await acc.sweep(); await tx.wait(); log("sweep", tx);
  tx = await acc.withdraw(E("20")); await tx.wait(); log("withdraw 20", tx);
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const sig = await me.signTypedData({ name: "MezGuardAccount", version: "1", chainId: 31611, verifyingContract: accAddr },
    { Withdraw: [{ name: "account", type: "address" }, { name: "amount", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] },
    { account: accAddr, amount: E("5"), nonce: await acc.nonce(), deadline });
  tx = await acc.withdrawWithSig(E("5"), deadline, sig); await tx.wait(); log("withdrawWithSig 5", tx);
  const [saved, idle, claimable] = await acc.balances();
  console.log({ saved: ethers.formatEther(saved), idle: ethers.formatEther(idle), claimable: ethers.formatEther(claimable), principal: ethers.formatEther(await acc.principal()) });
}
main().catch((e) => { console.error(e); process.exit(1); });
