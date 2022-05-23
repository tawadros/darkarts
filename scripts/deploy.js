const MERKLE_TREE_HEIGHT = 20
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // const Greeter = await hre.ethers.getContractFactory("Greeter");
  // const greeter = await Greeter.deploy("Hello, Hardhat!");

  [ DummyNFT, WithdrawVerifier, SendVerifier, Hasher, Vault ] = await Promise.all([
    hre.ethers.getContractFactory("DummyNFT"),
    hre.ethers.getContractFactory("WithdrawVerifier"),
    hre.ethers.getContractFactory("SendVerifier"),
    hre.ethers.getContractFactory("Hasher"),
    hre.ethers.getContractFactory("Vault")
  ]);

  [ withdrawVerifier, sendVerifier, hasher ] = await Promise.all([
    WithdrawVerifier.deploy(),
    SendVerifier.deploy(),
    Hasher.deploy()
  ]);

  [ token, vault ] = await Promise.all([
    DummyNFT.deploy(),
    Vault.deploy(withdrawVerifier.address, sendVerifier.address, hasher.address, MERKLE_TREE_HEIGHT)
  ])

  console.log("DummyNFT deployed to:", token.address);
  console.log("Vault deployed to:", vault.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
