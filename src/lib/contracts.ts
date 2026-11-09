import { parseUnits, formatUnits } from "viem";
import { DEFAULT_VAULT_ADDRESS as VAULT_ADDR, TUSD8_TOKEN_ADDRESS as TOKEN_ADDR } from "@/config/constants";

export const AEVUM_AGENT_VAULT_ABI = [
  {
    type: "function",
    name: "setAgentConfig",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agent", type: "address" },
      { name: "dailyLimit", type: "uint256" },
      { name: "maxSingleTxLimit", type: "uint256" },
      { name: "enforceWhitelist", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getAgentConfig",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      { name: "dailyLimit", type: "uint256" },
      { name: "maxSingleTxLimit", type: "uint256" },
      { name: "spentToday", type: "uint256" },
      { name: "lastResetTimestamp", type: "uint256" },
      { name: "enforceWhitelist", type: "bool" },
      { name: "active", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "executeAgentTransfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agent", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "purpose", type: "string" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    type: "function",
    name: "depositStablecoin",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "treasuryBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "error",
    name: "LimitExceeded",
    inputs: [
      { name: "attempted", type: "uint256" },
      { name: "remaining", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "SingleTxCeilingExceeded",
    inputs: [
      { name: "attempted", type: "uint256" },
      { name: "ceiling", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "RecipientNotWhitelisted",
    inputs: [{ name: "recipient", type: "address" }],
  },
] as const;

export const DEFAULT_VAULT_ADDRESS = VAULT_ADDR;
export const DEFAULT_TUSD8_TOKEN_ADDRESS = TOKEN_ADDR;

export function formatTusd8(units: bigint): string {
  return formatUnits(units, 6);
}

export function parseTusd8(amount: string): bigint {
  return parseUnits(amount, 6);
}

