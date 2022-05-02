const Hasher = artifacts.require("Hasher");
const WithdrawVerifier = artifacts.require("WithdrawVerifier");
const SendVerifier = artifacts.require("SendVerifier");
const Vault = artifacts.require("Vault");
const MERKLE_TREE_HEIGHT = 20;

module.exports = async function (deployer, network, accounts) {
  const withdrawVerifier = await WithdrawVerifier.deployed();
  const sendVerifier = await SendVerifier.deployed();
  const hasher = await Hasher.deployed();
  await deployer.deploy(Vault, withdrawVerifier.address, sendVerifier.address, hasher.address, MERKLE_TREE_HEIGHT);
};
