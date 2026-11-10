require("@nomicfoundation/hardhat-toolbox");
const fs = require("fs");

const dev = fs.existsSync("secrets/dev-wallet.json") ? JSON.parse(fs.readFileSync("secrets/dev-wallet.json")) : null;
const FORK = process.env.FORK; // "testnet" | "mainnet" | undefined

module.exports = {
  solidity: { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 500 }, evmVersion: "paris" } },
  networks: {
    hardhat: FORK
      ? { chainId: FORK === "mainnet" ? 31612 : 31611, forking: { url: FORK === "mainnet" ? "https://mezo.drpc.org" : "https://rpc.test.mezo.org" } }
      : {},
    mezoTestnet: { url: "https://rpc.test.mezo.org", chainId: 31611, accounts: dev ? [dev.privateKey] : [] },
  },
  etherscan: {
    apiKey: { mezoTestnet: "empty" },
    customChains: [
      { network: "mezoTestnet", chainId: 31611, urls: { apiURL: "https://api.explorer.test.mezo.org/api", browserURL: "https://explorer.test.mezo.org" } },
    ],
  },
  sourcify: { enabled: false },
  mocha: { timeout: 300000 },
};
