import { defineChain } from "viem";

export const aevumTestnet = defineChain({
  id: 44005,
  name: "Aevum Testnet",
  nativeCurrency: {
    name: "tQDAY",
    symbol: "tQDAY",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-test.qday.info"],
    },
    public: {
      http: ["https://rpc-test.qday.info"],
    },
  },
  blockExplorers: {
    default: {
      name: "QDay Explorer",
      url: "https://explorer-test.qday.info",
    },
  },
  testnet: true,
});

export const bscTestnet = defineChain({
  id: 97,
  name: "BNB Smart Chain Testnet",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "BscScan",
      url: "https://testnet.bscscan.com",
    },
  },
  testnet: true,
});

