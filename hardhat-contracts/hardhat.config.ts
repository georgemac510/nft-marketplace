import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import dotenv from 'dotenv';
dotenv.config();

const GOERLI_INFURA_URL = process.env.GOERLI_INFURA_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY as string;

// console.log("GIU ", GOERLI_INFURA_URL);

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    goerli: {
      url: GOERLI_INFURA_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  }
};

export default config;
