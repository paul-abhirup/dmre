// const { config } = require("hardhat");

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {}, // Local Hardhat network
    polygon: {
      url: process.env.POLYGON_RPC_URL, // Polygon RPC URL
      accounts: [process.env.PRIVATE_KEY], // Private key for deployment
    },
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL, // Ethereum RPC URL
      accounts: [process.env.PRIVATE_KEY], // Private key for deployment
    },
  },
};
