# Private NFT Transfer 🎨

Anonymously transfer ERC-721 NFT with zero-knowledge proofs

The flow of this app is similar to that of tornado.cash. The contract acts like some sort of mixnet pool:

1. User deposit their token to the contract with their proof pre-image commitment
2. Some time later, user withdraw their token by providing a zk-proof of the knowledge of those pre-image
3. The contract invalidates the commitment to prevent double spending

This original flow however, doesn't really work for NFT. The non-fungible nature of the token is itself an identifying information that is not hidden by this scheme (i.e. you can infer the previous owner of the token by following the transaction graph of _that particular token_)

We solve this problem by (among many other things) adding a 'send' function that anonymously changes the rightful withdrawer of the token while keeping the token inside the contract, thus hiding the transaction graph.

## Structure

- `circuits`: ZoKrates circuits
- `contracts`: Ethereum contracts
- `src`: frontend (Next.js)
- `public`: static file for the frontend
- `scripts`: various scripts for the project (e.g. deployment, etc.)

## Develop

### Build

- Build all circuits and contracts

```
npm run build
```

### Test

- End-to-end test: deposit, send, withdraw
- Make sure that your absolute path doesn't contain whitespaces

```
npm run test
```

## Details

Recommended prerequisites

- Ethereum fundamentals
- zk-SNARK programming
- Commit-reveal pattern

### Commitment Structure

The proof pre-image commitment consists of 3 things:

- **Second address**, to signify the rightful withdrawer of a token
- **Nullifier**, to signify the validity of the commitment and prevent double-spending
- **Token ID**, to signify which token is backed by this commitment

### Second Address

We added an additional keypair for a user to identify themselves within the system. In other words, in order anonymously send an NFT to someone else, you don't provide your Ethereum address. Instead, you use this second address from the public key of this new keypair.

We feel the need to introduce a new address because of the lack of ECDSA (signing algorithm used by Ethereum) library in current SNARK toolbox (circom and zokrates only supports EdDSA). You can think of this address as having a similar function to z-address in Zcash.

Currently, we just use a simple random bits as our secret key and its Pedersen hash as the public key / address.

Future: sign a constant string -> use signature bytes as EdDSA private key (libsodium?)

- Use public key as address
- Use private key as encryption key for the deposit event

### Send Function

While the deposit and withdrawal functionality of this project is similar to tornado.cash with some minor adjustments, the send functionality is novel. Its high-level function is basically a combination of withdrawal and deposit, and is similar to the 'Pour' functionality from the Zerocash paper:

- User proves that they own the token (i.e. proves that they know the commitment pre-image)
- User submits a new commitment signifying the new owner
- User proves that the Token ID of this new commitment is the same as the Token ID of the old commitment
- The contract invalidates the old commitment

# From Hardhat

## Advanced Sample Hardhat Project

This project demonstrates an advanced Hardhat use case, integrating other tools commonly used alongside Hardhat in the ecosystem.

The project comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts. It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# TODO

- Completing the barebone
  - Introduce info in event to privately detect balance
    - like Zerocash
  - Complete frontend
  - Introduce upgradable architecture
    - OZ Upgrade Plugin: https://docs.openzeppelin.com/upgrades-plugins/1.x/
    - Use UUPS instead of transparent
- Towards testnet
  - fleek.co
  - Deploy with admin contract?
  - Gnosis Safe MultiSig + OZ Defender Admin: https://docs.openzeppelin.com/defender/admin
    - Can be done later if the contracts are upgradeable
  - Etherscan verification
- Towards mainnet
  - Flesh up test
    - Add test to circuits too
  - Flesh up frontend
- Future
  - Support for ERC1155
