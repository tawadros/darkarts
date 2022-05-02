const SendVerifier = artifacts.require("SendVerifier");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(SendVerifier);
};
