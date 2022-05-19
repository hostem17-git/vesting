// ********************************************************************************************************

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

require("dotenv").config();

const { BSCSCAN_API_KEY, NODE_RPC_URL, PRIVATE_KEY } = process.env;
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [{version: "0.8.4"},
    {version: "0.6.6"}],
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.BSCSCAN_API_KEY // for this to work go to => <project-root>/node_modules/@nomiclabs/hardhat-etherscan/src/network/prober.ts and update mainnet etherscan api urls to bscscan ones
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.NODE_RPC_URL_MAIN
      }
    },
    BSCTestnet: {
      url: process.env.NODE_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      networkCheckTimeout: 20000,
      skipDryRun: true,
      gas: 7000000,
      gasPrice: 25000000000,
      network_id: 97
    },
    BSCMainnet: {
      url: process.env.NODE_RPC_URL_MAIN,
      accounts: [`0x${PRIVATE_KEY}`],
      networkCheckTimeout: 20000,
      skipDryRun: true,
      gas: 7000000,
      gasPrice: 5000000000,
      network_id: 56
    },
  }
};