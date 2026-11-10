// npx hardhat run scripts/deploy-testnet.js --network mezoTestnet
const { ethers, network } = require("hardhat");
const fs = require("fs");
const VAULT = "0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16"; // official Mezo testnet sMUSD
async function main() {
  const [deployer] = await ethers.getSigners();
  if (network.config.chainId !== 31611) throw new Error("testnet only");
  console.log("deployer/keeper/treasury", deployer.address, "BTC", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  const F = await ethers.getContractFactory("MezGuardFactory");
  const f = await F.deploy(VAULT, deployer.address, deployer.address, 1000, ethers.parseEther("100"));
  await f.waitForDeployment();
  const out = { network: "mezoTestnet", chainId: 31611, factory: await f.getAddress(), implementation: await f.implementation(), vault: VAULT, musd: await f.musd(), keeper: deployer.address, treasury: deployer.address, deployTx: f.deploymentTransaction().hash, at: new Date().toISOString() };
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync("deployments/mezoTestnet.json", JSON.stringify(out, null, 2));
  console.log(out);
}
main().catch((e) => { console.error(e); process.exit(1); });
