const UserInfo = artifacts.require("UserInfo");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(UserInfo);
};
