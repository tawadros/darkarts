const WithdrawVerifier = artifacts.require("WithdrawVerifier");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(WithdrawVerifier);
};
