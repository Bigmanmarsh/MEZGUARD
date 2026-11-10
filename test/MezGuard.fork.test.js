// Runs against a fork of Mezo testnet: real MUSD + real MUSDSavingsRate (sMUSD) vault.
// FORK=testnet npx hardhat test
const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const VAULT = "0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16"; // official testnet sMUSD
const MUSD = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
const RICH = "0xCEA259b22B76c253581C789400F7347B37Aeec83"; // our dev wallet, holds 1,800 test MUSD
const E = (n) => ethers.parseEther(String(n));

describe("MezGuard on a fork of Mezo testnet", function () {
  let factory, musd, vault, admin, keeper, treasury, alice, bob, rich;

  before(async function () {
    if (network.config.chainId !== 31611) this.skip();
    [admin, keeper, treasury, alice, bob] = await ethers.getSigners();
    await network.provider.request({ method: "hardhat_impersonateAccount", params: [RICH] });
    await network.provider.send("hardhat_setBalance", [RICH, "0x8AC7230489E80000"]);
    rich = await ethers.getSigner(RICH);
    musd = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", MUSD);
    vault = await ethers.getContractAt("IMUSDSavingsRate", VAULT);
    await musd.connect(rich).transfer(alice.address, E(600));
    await musd.connect(rich).transfer(bob.address, E(50));
    const F = await ethers.getContractFactory("MezGuardFactory");
    factory = await F.deploy(VAULT, keeper.address, treasury.address, 1000, E(100));
  });

  async function accountFor(user) {
    await factory.createAccount(user.address);
    return ethers.getContractAt("MezGuardAccount", await factory.accountOf(user.address));
  }

  // Simulates Mezo protocol fees arriving in the vault (anyone may call receiveProtocolYield).
  async function addYield(amount) {
    const v = await ethers.getContractAt(["function receiveProtocolYield(uint256)"], VAULT);
    await musd.connect(rich).approve(VAULT, amount);
    await v.connect(rich).receiveProtocolYield(amount);
  }

  it("reads the real vault's MUSD and creates one account per saver at a predictable address", async () => {
    expect(await factory.musd()).to.equal(MUSD);
    const predicted = await factory.predictAccount(alice.address);
    await factory.connect(bob).createAccount(alice.address); // anyone (the keeper) can create it
    expect(await factory.accountOf(alice.address)).to.equal(predicted);
    await factory.createAccount(alice.address);
    expect(await factory.accountsCount()).to.equal(1n);
    const acc = await ethers.getContractAt("MezGuardAccount", predicted);
    expect(await acc.owner()).to.equal(alice.address);
    expect(await acc.guardEnabled()).to.equal(true);
    await expect(acc.initialize(bob.address)).to.be.revertedWithCustomError(acc, "AlreadyInitialized");
  });

  it("owner deposit goes into the real sMUSD vault", async () => {
    const acc = await accountFor(alice);
    await musd.connect(alice).approve(await acc.getAddress(), E(200));
    await acc.connect(alice).deposit(E(200));
    expect(await vault.balanceOf(await acc.getAddress())).to.equal(E(200));
    expect(await acc.principal()).to.equal(E(200));
  });

  it("a bridge-style delivery straight to the account is swept into savings by anyone", async () => {
    const acc = await accountFor(alice);
    await musd.connect(alice).transfer(await acc.getAddress(), E(50)); // like an NTT delivery
    await acc.connect(bob).sweep();
    expect(await vault.balanceOf(await acc.getAddress())).to.equal(E(250));
    expect(await acc.principal()).to.equal(E(250));
  });

  it("strangers cannot take money out, change the Guard or rescue tokens", async () => {
    const acc = await accountFor(alice);
    await expect(acc.connect(bob).withdraw(E(1))).to.be.revertedWithCustomError(acc, "NotOwner");
    await expect(acc.connect(bob).setGuard(false)).to.be.revertedWithCustomError(acc, "NotOwner");
    await expect(acc.connect(bob).rescue(VAULT)).to.be.revertedWithCustomError(acc, "NotOwner");
    await expect(acc.connect(bob).deposit(E(1))).to.be.revertedWithCustomError(acc, "NotOwner");
    await expect(acc.connect(bob).guardExit(1)).to.be.revertedWithCustomError(acc, "NotKeeper");
  });

  it("interest is paid on withdraw and 10% fee applies above $100 (principal never touched)", async () => {
    const acc = await accountFor(alice);
    await addYield(E(500));
    const claimable = await vault.claimableYield(await acc.getAddress());
    const t0 = await musd.balanceOf(treasury.address);
    const a0 = await musd.balanceOf(alice.address);
    const tx = await acc.connect(alice).withdraw(E(50));
    const ev = (await tx.wait()).logs.map((l) => { try { return acc.interface.parseLog(l); } catch { return null; } }).find((e) => e && e.name === "Withdrawn");
    const interest = ev.args.interest, fee = ev.args.fee;
    expect(interest).to.be.gt(0n);
    expect(interest).to.be.gte(claimable);
    expect(fee).to.equal((interest * 1000n) / 10000n);
    expect(await musd.balanceOf(treasury.address)).to.equal(t0 + fee);
    expect(await musd.balanceOf(alice.address)).to.equal(a0 + E(50) + interest - fee);
    expect(await acc.principal()).to.equal(E(200));
  });

  it("small savers ($100 or less) pay no fee", async () => {
    const acc = await accountFor(bob);
    await musd.connect(bob).approve(await acc.getAddress(), E(50));
    await acc.connect(bob).deposit(E(50));
    await addYield(E(500));
    const t0 = await musd.balanceOf(treasury.address);
    await acc.connect(bob).claim();
    expect(await musd.balanceOf(treasury.address)).to.equal(t0);
    expect(await acc.totalInterestPaid()).to.be.gt(0n);
  });

  it("gasless withdrawal: owner signs, keeper submits, money still goes to the owner; no replay", async () => {
    const acc = await accountFor(alice);
    const addr = await acc.getAddress();
    const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
    const domain = { name: "MezGuardAccount", version: "1", chainId: 31611, verifyingContract: addr };
    const types = { Withdraw: [{ name: "account", type: "address" }, { name: "amount", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "deadline", type: "uint256" }] };
    const sig = await alice.signTypedData(domain, types, { account: addr, amount: E(20), nonce: 0, deadline });
    const a0 = await musd.balanceOf(alice.address), k0 = await musd.balanceOf(keeper.address);
    await acc.connect(keeper).withdrawWithSig(E(20), deadline, sig);
    expect(await musd.balanceOf(alice.address)).to.be.gte(a0 + E(20));
    expect(await musd.balanceOf(keeper.address)).to.equal(k0);
    await expect(acc.connect(keeper).withdrawWithSig(E(20), deadline, sig)).to.be.revertedWithCustomError(acc, "BadSignature");
    const bobSig = await bob.signTypedData(domain, types, { account: addr, amount: E(20), nonce: 1, deadline });
    await expect(acc.connect(keeper).withdrawWithSig(E(20), deadline, bobSig)).to.be.revertedWithCustomError(acc, "BadSignature");
    const old = await alice.signTypedData(domain, types, { account: addr, amount: E(1), nonce: 1, deadline: 1 });
    await expect(acc.connect(keeper).withdrawWithSig(E(1), 1, old)).to.be.revertedWithCustomError(acc, "Expired");
  });

  it("Guard exit: only the keeper, only when the owner allows, and only to the owner", async () => {
    const acc = await accountFor(alice);
    const addr = await acc.getAddress();
    await acc.connect(alice).setGuard(false);
    await expect(acc.connect(keeper).guardExit(1)).to.be.revertedWithCustomError(acc, "GuardOff");
    await acc.connect(alice).setGuard(true);
    const saved = await vault.balanceOf(addr);
    const a0 = await musd.balanceOf(alice.address);
    await expect(acc.connect(keeper).guardExit(2)).to.emit(acc, "GuardExit");
    expect(await vault.balanceOf(addr)).to.equal(0n);
    expect(await musd.balanceOf(alice.address)).to.be.gte(a0 + saved);
    expect(await musd.balanceOf(keeper.address)).to.equal(0n);
    expect(await acc.principal()).to.equal(0n);
  });

  it("admin controls are capped: fee can never exceed 10% of interest", async () => {
    await expect(factory.setFee(treasury.address, 1001, E(100))).to.be.revertedWithCustomError(factory, "FeeTooHigh");
    await expect(factory.connect(bob).setKeeper(bob.address)).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
  });
});
