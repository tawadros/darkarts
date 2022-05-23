const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const { initialize } = require('zokrates-js/node')

// config
const circuitsDir = __dirname + "/../circuits/"
const artifactsDir = __dirname + "/../build/circuits/"

async function main() {
    const zokratesProvider = await initialize();

    // read source
    [ oneToOneMimcSource, fourToOneMimcSource, sendSource, withdrawSource ] = await Promise.all([
        fsp.readFile(circuitsDir + "1to1mimc.zok", "utf-8"),
        fsp.readFile(circuitsDir + "4to1mimc.zok", "utf-8"),
        fsp.readFile(circuitsDir + "send.zok", "utf-8"),
        fsp.readFile(circuitsDir + "withdraw.zok", "utf-8")
    ])
    
    // compilation (artifacts = {binary, abi})
    console.log("Compiling circuits...")
    const fileSystemResolver = (from, to) => {
        const location = path.resolve(path.dirname(path.resolve(circuitsDir + from)), to + ".zok")
        const source = fs.readFileSync(location).toString() // must be sync?
        return { source, location }
    };
    const options = { resolveCallback: fileSystemResolver }
    const oneToOneMimcArtifacts = zokratesProvider.compile(oneToOneMimcSource, options)
    const fourToOneMimcArtifacts = zokratesProvider.compile(fourToOneMimcSource, options)
    const sendArtifacts = zokratesProvider.compile(sendSource, options)
    const withdrawArtifacts = zokratesProvider.compile(withdrawSource, options)
    console.log("Compilation complete!")
    
    // run setup (keypair = {pk, vk}), only for send and withdraw
    console.log("Setting up keys...")
    const sendKeypair = zokratesProvider.setup(sendArtifacts.program)
    const withdrawKeypair = zokratesProvider.setup(withdrawArtifacts.program)
    console.log("Setup complete!")
    
    // export solidity verifier
    const spdx = "// SPDX-License-Identifier: MIT\n"
    const sendSolVerifier = spdx + zokratesProvider.exportSolidityVerifier(sendKeypair.vk, "v1").replace("Verifier", "SendVerifier")
    const withdrawSolVerifier = spdx + zokratesProvider.exportSolidityVerifier(withdrawKeypair.vk, "v1").replace("Verifier", "WithdrawVerifier")
    
    await Promise.all([
        // JSONs will get deleted by hardhat if placed on the same folder
        fsp.writeFile(artifactsDir + "1to1mimc/abi.json", oneToOneMimcArtifacts.abi), 
        fsp.writeFile(artifactsDir + "4to1mimc/abi.json", fourToOneMimcArtifacts.abi),
        fsp.writeFile(artifactsDir + "send/abi.json", sendArtifacts.abi),
        fsp.writeFile(artifactsDir + "withdraw/abi.json", withdrawArtifacts.abi),
        
        fsp.writeFile(artifactsDir + "1to1mimc/program.bin", oneToOneMimcArtifacts.program),
        fsp.writeFile(artifactsDir + "4to1mimc/program.bin", fourToOneMimcArtifacts.program),
        fsp.writeFile(artifactsDir + "send/program.bin", sendArtifacts.program),
        fsp.writeFile(artifactsDir + "withdraw/program.bin", withdrawArtifacts.program),
        
        fsp.writeFile(artifactsDir + "send/proving_key.bin", sendKeypair.pk),
        fsp.writeFile(artifactsDir + "withdraw/proving_key.bin", withdrawKeypair.pk),
        
        fsp.writeFile(__dirname + "/../contracts/SendVerifier.sol", sendSolVerifier),
        fsp.writeFile(__dirname + "/../contracts/WithdrawVerifier.sol", withdrawSolVerifier)
    ]).catch(error => {
        console.log(error)
    })
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
