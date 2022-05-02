const Hasher = artifacts.require("Hasher");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Hasher);
};
