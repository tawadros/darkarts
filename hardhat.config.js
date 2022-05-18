const { task } = require("hardhat/config");

require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

const path = require('path')
const fs = require('fs')
const genContract = require('circomlib/src/mimcsponge_gencontract.js')

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("compile", "Compiles the entire project, building all artifacts, ya", async (taskArgs, hre, runSuper) => {
  await runSuper(taskArgs);

  // compile MiMC hasher
  const outputPath = path.join(__dirname, 'build', 'contracts', 'contracts', 'Hasher.sol')
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath)
  }

  const contract = {
    contractName: 'Hasher',
    sourceName: '',
    abi: genContract.abi,
    bytecode: genContract.createCode('mimcsponge', 220),
    deployedBytecode: genContract.createCode('mimcsponge', 220),
    linkReferences: {},
    deployedLinkReferences: {} 
  }

  fs.writeFileSync(path.join(outputPath, "Hasher.json"), JSON.stringify(contract))
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 120000
  },
  paths: {
    artifacts: './build/contracts' // unify all the build output to one directory
  }
};
