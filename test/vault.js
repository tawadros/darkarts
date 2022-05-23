const MERKLE_TREE_HEIGHT = 20

const { expect } = require("chai");
const { ethers } = require("hardhat")

const fs = require('fs')
const merkleTree = require('fixed-merkle-tree')
const { initialize } = require('zokrates-js/node')

describe("Vault (e2e test, should be around a minute)", function() {
    let vault;
    let token;
    let owner, addr1, addr2;

    let sendArtifact;
    let sendProvingKey;

    let withdrawArtifact;
    let withdrawProvingKey;

    before(async () => {
        sendArtifact = readArtifact(
            __dirname + "/../build/circuits/send/program.bin", 
            __dirname + "/../build/circuits/send/abi.json"
        )
        sendProvingKey = readProvingKey(__dirname + "/../build/circuits/send/proving_key.bin")
        
        withdrawArtifact = readArtifact(
            __dirname + "/../build/circuits/withdraw/program.bin", 
            __dirname + "/../build/circuits/withdraw/abi.json"
        )
        withdrawProvingKey = readProvingKey(__dirname + "/../build/circuits/withdraw/proving_key.bin")
    })

    beforeEach(async function() {
        const DummyNFT = await ethers.getContractFactory("DummyNFT")
        const WithdrawVerifier = await ethers.getContractFactory("WithdrawVerifier")
        const SendVerifier = await ethers.getContractFactory("SendVerifier")
        const Hasher = await ethers.getContractFactory("Hasher")
        const Vault = await ethers.getContractFactory("Vault")
        token = await DummyNFT.deploy();
        withdrawVerifier = await WithdrawVerifier.deploy()
        sendVerifier = await SendVerifier.deploy()
        hasher = await Hasher.deploy()
        vault = await Vault.deploy(withdrawVerifier.address, sendVerifier.address, hasher.address, MERKLE_TREE_HEIGHT);
        [owner, addr1, addr2] = await ethers.getSigners()
    })
    
    it("e2e test", async function() {
        // addr1 has a pre-minted token with tokenId == 1
        const tokenId = "1"

        // String fixtures (for ZoKrates)
        const secretId1 = "254080219567091772673909445246567392088208036796494585251815984474602972369"
        const secretId2 = "381081628386906533194738143309184053498881367127906410807449526152710014129"
        const nullifier1 = "272418632970930087013102078582984595767243027035861303396446195359448020486"
        const nullifier2 = "218278570709644582400354933544764600979629809596418196314625408049795099009"
        const tokenContract = BigInt(token.address, 16).toString() // token address in decimal form (needed by MiMC?)

        // Create deposit commitment object
        const deposit1 = await createDeposit(secretId1, nullifier1, tokenContract, tokenId)
        const deposit2 = await createDeposit(secretId2, nullifier2, tokenContract, tokenId)

        // Approve
        await token.connect(addr1).approve(vault.address, toHex(tokenId))

        // Deposit
        // console.log("Deposit") 
        let tx = await vault.connect(addr1).deposit(toHex(deposit1.commitment), token.address, toHex(tokenId))
        await expect(tx).to.emit(vault, "Deposit").withArgs(toHex(deposit1.commitment), 0)

        // Send
        // console.log("Send") 
        const r1 = await generateSendProof(vault, deposit1, deposit2, sendArtifact, sendProvingKey)
        tx = await vault.connect(addr1).send(r1.proof, ...r1.args)
        await expect(tx).to.emit(vault, "Withdrawal").withArgs(toHex(deposit1.nullifierHash))
        await expect(tx).to.emit(vault, "Deposit").withArgs(toHex(deposit2.commitment), 1)

        // Withdraw
        // console.log("Withdraw") 
        const r2 = await generateWithdrawProof(vault, deposit2, withdrawArtifact, withdrawProvingKey)
        tx = await vault.connect(addr2).withdraw(r2.proof, ...r2.args)
        await expect(tx).to.emit(vault, "Withdrawal").withArgs(toHex(deposit2.nullifierHash))
    })
})

// ---
// Util functions
// ---
// const mimcSponge = input => circomlib.mimcsponge.multiHash(input, undefined, 1).toString()
function toHex(number, length = 32) {
    const str = number instanceof Buffer ? number.toString('hex') : BigInt(number).toString(16)
    return '0x' + str.padStart(length * 2, '0')
}

function readArtifact(programPath, abiPath) {
    const program = Uint8Array.from(fs.readFileSync(programPath))
    const abi = fs.readFileSync(abiPath, "utf-8")
    return { program, abi }
}

function readProvingKey(path) {
    return Uint8Array.from(fs.readFileSync(path))
}

async function createDeposit(secretId, nullifier, tokenContract, tokenId) {
    const deposit = { secretId, nullifier, tokenContract, tokenId }

    oneToOneMimcArtifact = readArtifact(
        __dirname + "/../build/circuits/1to1mimc/program.bin", 
        __dirname + "/../build/circuits/1to1mimc/abi.json"
    )

    fourToOneMimcArtifact = readArtifact(
        __dirname + "/../build/circuits/4to1mimc/program.bin", 
        __dirname + "/../build/circuits/4to1mimc/abi.json"
    )
    
    const zokratesProvider = await initialize()
    // for some reason the output of computeWitness is a string of array
    const oneToOneMimc = input => JSON.parse(zokratesProvider.computeWitness(oneToOneMimcArtifact, input).output)[0]
    const fourToOneMimc = input => JSON.parse(zokratesProvider.computeWitness(fourToOneMimcArtifact, input).output)[0]
    
    deposit.publicId = oneToOneMimc([secretId])
    deposit.nullifierHash = oneToOneMimc([nullifier])
    // TODO: change order
    deposit.commitment = fourToOneMimc([deposit.publicId, nullifier, tokenContract, tokenId])

    return deposit
}

async function generateSendProof(vault, oldDeposit, newDeposit, artifact, provingKey) {
    // Compute merkle proof of our commitment
    const { root, pathElements, pathIndices } = await generateMerkleProof(vault, oldDeposit)

    // Prepare circuit input
    const input = [
        // Public snark inputs
        root,
        oldDeposit.nullifierHash,
        newDeposit.commitment,
    
        // Private snark inputs
        oldDeposit.secretId,
        oldDeposit.nullifier,
        oldDeposit.tokenContract,
        oldDeposit.tokenId,
        pathElements,
        pathIndices.map(Boolean),
        newDeposit.publicId,
        newDeposit.nullifier,
        newDeposit.tokenContract,
        newDeposit.tokenId,
    ]
    
    // generate witness and prove
    // console.log('Generating SNARK proof, this should take less than a minute...')
    // console.time('Proof time')
    const proof = await generateSnarkProof(artifact, provingKey, input)
    // console.timeEnd('Proof time')

    const args = [
        toHex(root),
        toHex(oldDeposit.nullifierHash),
        toHex(newDeposit.commitment),
    ]

    return { proof, args }
}

/**
 * Generate SNARK proof for withdrawal
 * @param deposit Deposit object
 * @param recipient Funds recipient
 * @param relayer Relayer address
 * @param fee Relayer fee
 * @param refund Receive ether for exchanged tokens
 */
async function generateWithdrawProof(vault, deposit, artifact, provingKey) {
    // Compute merkle proof of our commitment
    const { root, pathElements, pathIndices } = await generateMerkleProof(vault, deposit)

    // Prepare circuit input
    const input = [
        // Public snark inputs
        root,
        deposit.nullifierHash,
        deposit.tokenContract,
        deposit.tokenId,
    
        // Private snark inputs
        deposit.secretId,
        deposit.nullifier,
        pathElements,
        pathIndices.map(Boolean),
    ]
    
    // generate witness and prove
    // console.log('Generating SNARK proof, this should take less than a minute...')
    // console.time('Proof time')
    const proof = await generateSnarkProof(artifact, provingKey, input)
    // console.timeEnd('Proof time')

    const args = [
        toHex(root),
        toHex(deposit.nullifierHash),
        toHex(deposit.tokenContract),
        toHex(deposit.tokenId)
    ]

    return { proof, args }
}

/**
 * Copied from tornado, adapted for ethers.js:
 * Generate merkle tree for a deposit.
 * Download deposit events from the tornado, reconstructs merkle tree, finds our deposit leaf
 * in it and generates merkle proof
 * @param deposit Deposit object
 */
 async function generateMerkleProof(contract, deposit) {
    // Get all deposit events from smart contract and assemble merkle tree from them
    const events = await contract.queryFilter(contract.filters.Deposit())
    const leaves = events
      .sort((a, b) => a.args.leafIndex - b.args.leafIndex) // Sort events in chronological order
      .map(e => e.args.commitment)

    const tree = new merkleTree(MERKLE_TREE_HEIGHT, leaves)
  
    // Find current commitment in the tree
    const depositEvent = events.find(e => e.args.commitment === toHex(deposit.commitment))
    const leafIndex = depositEvent ? depositEvent.args.leafIndex : -1
    await expect(leafIndex).to.be.above(-1, 'The deposit is not found in the tree')

    // Validate that our data is correct
    const root = tree.root()
    const isValidRoot = await contract.isKnownRoot(toHex(root))
    await expect(isValidRoot).to.equal(true, 'Merkle tree is corrupted')
  
    // Validate nullifier
    const isSpent = await contract.isSpent(toHex(deposit.nullifierHash))
    await expect(isSpent).to.equal(false, 'The note is already spent')
  
    // Compute merkle proof of our commitment
    const { pathElements, pathIndices } = tree.path(leafIndex)
    return { pathElements, pathIndices, root: tree.root() }
}

async function generateSnarkProof(artifacts, pk, input) {
    zokratesProvider = await initialize()
    const { witness, output } = zokratesProvider.computeWitness(artifacts, input);
    const proofRaw = zokratesProvider.generateProof(artifacts.program, witness, pk);
    return Object.values(proofRaw.proof)
}