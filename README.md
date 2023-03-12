# Full-stack Web3 NFT markeplace

## Build, test, deploy and verify contracts

### Prerequisites

    nvm 
    git
    a Github account in which to push your repo
    Metamask browser extension funded with Goerli ETH

### Project setup

    nvm install 18.4.0

    npx create-next-app --typescript nft-marketplace

Delete `tsconfig.json`

    npx hardhat

    `Create Typescript project`
    `Install hardhat-toolbox?` y

Compile contract and run tests

    npx hardhat test

Deploy contract to the Goerli testnet
1. Add data to `.env.example` file
2. Rename `.env.example` to `.env`
3. Command to deploy to Goerli
   
        npx hardhat run scripts/deploy.ts --network goerli

4. Command to verify contract
   
        npx hardhat verify --network goerli YOUR_NEW_CONTRACT_FROM_DEPLOYMENT


## NFT Marketplace Marketplace front-end

### Prerequisites

Installed with Node.js 16.15.0

### Steps to install and run

1. Add applicable data to your .env file
   
        NEXT_PUBLIC_NFT_MARKET_ADDRESS=new contract address
        NEXT_PUBLIC_GRAPH_URL=get from GraphQL setup
        NFT_STORAGE_KEY=go to https://nft.storage and sign up for key

2. Install and run app

        yarn install

        yarn dev 
