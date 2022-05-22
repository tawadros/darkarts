const fs = require('fs')
const path = require('path')
const { initialize } = require('zokrates-js/node');

// config
const circuitsDir = __dirname + "/../circuits/"
const fileSystemResolver = (from, to) => {
    const location = path.resolve(path.dirname(path.resolve(circuitsDir + from)), to + ".zok");
    const source = fs.readFileSync(location).toString();
    return { source, location };
};
const options = {
    resolveCallback: fileSystemResolver
}

// TODO: make all of these async?
initialize().then((zokratesProvider) => {
    const artifactDir = "/../build/circuits"

    // read source
    const oneToOneMimcSource = fs.readFileSync(circuitsDir + "1to1mimc.zok", "utf-8");
    const fourToOneMimcSource = fs.readFileSync(circuitsDir + "4to1mimc.zok", "utf-8");
    const sendSource = fs.readFileSync(circuitsDir + "send.zok", "utf-8");
    const withdrawSource = fs.readFileSync(circuitsDir + "withdraw.zok", "utf-8");
    
    // compilation (artifacts = {binary, abi})
    const oneToOneMimcArtifacts = zokratesProvider.compile(oneToOneMimcSource, options);
    const fourToOneMimcArtifacts = zokratesProvider.compile(fourToOneMimcSource, options);
    const sendArtifacts = zokratesProvider.compile(sendSource, options);
    const withdrawArtifacts = zokratesProvider.compile(withdrawSource, options);
    
    try {
        // JSONs will get deleted by hardhat if placed on the same folder
        fs.writeFileSync(__dirname + artifactDir + "/1to1mimc/abi.json", oneToOneMimcArtifacts.abi) 
        fs.writeFileSync(__dirname + artifactDir + "/4to1mimc/abi.json", fourToOneMimcArtifacts.abi)
        fs.writeFileSync(__dirname + artifactDir + "/send/abi.json", sendArtifacts.abi) 
        fs.writeFileSync(__dirname + artifactDir + "/withdraw/abi.json", withdrawArtifacts.abi)
        fs.writeFileSync(__dirname + artifactDir + "/1to1mimc/program.bin", oneToOneMimcArtifacts.program)
        fs.writeFileSync(__dirname + artifactDir + "/4to1mimc/program.bin", fourToOneMimcArtifacts.program)
        fs.writeFileSync(__dirname + artifactDir + "/send/program.bin", sendArtifacts.program)
        fs.writeFileSync(__dirname + artifactDir + "/withdraw/program.bin", withdrawArtifacts.program)
    } catch (error) {
        console.log(error)
    }

    // run setup (keypair = {pk, vk}), only for send and withdraw
    const sendKeypair = zokratesProvider.setup(sendArtifacts.program);
    const withdrawKeypair = zokratesProvider.setup(withdrawArtifacts.program);

    try {
        fs.writeFileSync(__dirname + artifactDir + "/send/proving_key.bin", sendKeypair.pk)
        fs.writeFileSync(__dirname + artifactDir + "/withdraw/proving_key.bin", withdrawKeypair.pk)
    } catch (error) {
        console.log(error)
    }

    // export solidity verifier
    const sendSolVerifier = zokratesProvider.exportSolidityVerifier(sendKeypair.vk, "v1").replace("Verifier", "SendVerifier");
    const withdrawSolVerifier = zokratesProvider.exportSolidityVerifier(withdrawKeypair.vk, "v1").replace("Verifier", "WithdrawVerifier");
    // TODO: find more elegant solution for the contract name
    // TODO: add a SPDX license identifier to the output contracts

    try {
        fs.writeFileSync(__dirname + "/../contracts/SendVerifier.sol", sendSolVerifier)
        fs.writeFileSync(__dirname + "/../contracts/WithdrawVerifier.sol", withdrawSolVerifier)
    } catch (error) {
        console.log(error)
    }
})
