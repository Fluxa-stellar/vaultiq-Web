import { decodeFunctionData } from "viem";
import { AEVUM_EXPLORER, DEFAULT_VAULT_ADDRESS, TUSD8_TOKEN_ADDRESS } from "@/config/constants";

export interface UnifiedTransactionItem {
  id: string;
  timestamp: string; // ISO string
  agentAddress: string;
  agentName: string;
  recipient: string;
  recipientName?: string;
  amount: number;
  currency: string;
  purpose: string;
  txHash: string;
  isAutonomous: boolean;
  type: "VAULT_DEPOSIT" | "VAULT_WITHDRAWAL" | "AI_SPEND" | "EXTERNAL_FUNDING" | "MANUAL_WITHDRAWAL";
  category: "DEPOSIT" | "WITHDRAWAL" | "AI_SPEND" | "INCOMING";
  isPositive: boolean;
  status: "CONFIRMED" | "REVERTED_BLOCKED" | "PENDING";
}

const VAULT_DECODE_ABI = [
  {
    type: "function",
    name: "executeAgentPayment",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "memo", type: "string" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

interface ExplorerTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  input: string;
  timeStamp: string;
  isError: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
}

/**
 * Fetches and unifies all live on-chain transactions on Aevum Testnet for
 * the user's connected wallet and the Treasury Vault contract.
 */
export async function fetchAevumOnChainTransactions(
  walletAddress?: string | null,
  vaultAddress: string = DEFAULT_VAULT_ADDRESS
): Promise<UnifiedTransactionItem[]> {
  const user = (walletAddress || "").toLowerCase();
  const vault = (vaultAddress || DEFAULT_VAULT_ADDRESS).toLowerCase();

  try {
    const fetchPromises: Promise<{ result?: ExplorerTx[] } | null>[] = [
      // 1. Vault ERC-20 token transfers
      fetch(
        `https://explorer-test.qday.info/api?module=account&action=tokentx&address=${vault}&startblock=0&endblock=99999999&sort=desc`
      )
        .then((r) => r.json())
        .catch(() => null),

      // 2. Vault normal contract calls (deposits, executeAgentPayment, withdrawals)
      fetch(
        `https://explorer-test.qday.info/api?module=account&action=txlist&address=${vault}&startblock=0&endblock=99999999&sort=desc`
      )
        .then((r) => r.json())
        .catch(() => null),
    ];

    if (user) {
      // 3. User ERC-20 token transfers (incoming faucet claims, external funding)
      fetchPromises.push(
        fetch(
          `https://explorer-test.qday.info/api?module=account&action=tokentx&address=${user}&startblock=0&endblock=99999999&sort=desc`
        )
          .then((r) => r.json())
          .catch(() => null)
      );

      // 4. User normal txs (native gas funding, direct contract interactions)
      fetchPromises.push(
        fetch(
          `https://explorer-test.qday.info/api?module=account&action=txlist&address=${user}&startblock=0&endblock=99999999&sort=desc`
        )
          .then((r) => r.json())
          .catch(() => null)
      );
    }

    const [vaultTokenRes, vaultTxRes, userTokenRes, userTxRes] = await Promise.all(fetchPromises);

    const items: UnifiedTransactionItem[] = [];
    const seenHashes = new Set<string>();

    // 1. Parse normal transactions
    const allNormalTxs = [
      ...(vaultTxRes?.result || []),
      ...(userTxRes?.result || []),
    ];

    for (const tx of allNormalTxs) {
      if (!tx.hash || seenHashes.has(tx.hash.toLowerCase())) continue;
      const to = (tx.to || "").toLowerCase();
      const from = (tx.from || "").toLowerCase();
      const time = new Date(Number(tx.timeStamp) * 1000).toISOString();
      const isError = tx.isError === "1";

      // Case A: Interaction with Treasury Vault
      if (to === vault) {
        try {
          const decoded = decodeFunctionData({ abi: VAULT_DECODE_ABI, data: tx.input as `0x${string}` });

          if (decoded.functionName === "deposit") {
            const amount = Number(decoded.args[0]) / 1e6;
            items.push({
              id: `${tx.hash}-deposit`,
              timestamp: time,
              agentAddress: from,
              agentName: "Owner Wallet",
              recipient: vault,
              recipientName: "AevumAgentVault",
              amount,
              currency: "tUSD8",
              purpose: "Treasury Vault Reserve Deposit",
              txHash: tx.hash,
              isAutonomous: false,
              type: "VAULT_DEPOSIT",
              category: "DEPOSIT",
              isPositive: true,
              status: isError ? "REVERTED_BLOCKED" : "CONFIRMED",
            });
            seenHashes.add(tx.hash.toLowerCase());
          } else if (decoded.functionName === "executeAgentPayment") {
            const recipient = decoded.args[0];
            const amount = Number(decoded.args[1]) / 1e6;
            const memo = decoded.args[2];
            items.push({
              id: `${tx.hash}-payment`,
              timestamp: time,
              agentAddress: vault,
              agentName: "AevumAgentVault (Autonomous)",
              recipient,
              recipientName: "Compute / Inference Gateway",
              amount,
              currency: "tUSD8",
              purpose: memo || "Autonomous GPU Compute Refill",
              txHash: tx.hash,
              isAutonomous: true,
              type: "AI_SPEND",
              category: "AI_SPEND",
              isPositive: false,
              status: isError ? "REVERTED_BLOCKED" : "CONFIRMED",
            });
            seenHashes.add(tx.hash.toLowerCase());
          } else if (decoded.functionName === "withdraw") {
            const amount = Number(decoded.args[0]) / 1e6;
            items.push({
              id: `${tx.hash}-withdraw`,
              timestamp: time,
              agentAddress: vault,
              agentName: "AevumAgentVault",
              recipient: from,
              recipientName: "Owner Wallet",
              amount,
              currency: "tUSD8",
              purpose: "Vault Reserve Withdrawal to Owner",
              txHash: tx.hash,
              isAutonomous: false,
              type: "VAULT_WITHDRAWAL",
              category: "WITHDRAWAL",
              isPositive: false,
              status: isError ? "REVERTED_BLOCKED" : "CONFIRMED",
            });
            seenHashes.add(tx.hash.toLowerCase());
          }
        } catch {
          // Unknown or non-standard vault interaction
        }
      } else if (user && to === user && from !== user && BigInt(tx.value || "0") > BigInt(0)) {
        // Case B: Incoming native gas transfer to user wallet (e.g. from faucet)
        const amount = Number(BigInt(tx.value) / BigInt("1000000000000000")) / 1000;
        items.push({
          id: `${tx.hash}-native-in`,
          timestamp: time,
          agentAddress: from,
          agentName: from.startsWith("0x4551") ? "Aevum Gas Faucet" : "External Wallet",
          recipient: user,
          recipientName: "Connected Wallet",
          amount,
          currency: "tQDAY",
          purpose: "Native Gas Token Inflow (Aevum L2 Faucet Claim)",
          txHash: tx.hash,
          isAutonomous: false,
          type: "EXTERNAL_FUNDING",
          category: "INCOMING",
          isPositive: true,
          status: isError ? "REVERTED_BLOCKED" : "CONFIRMED",
        });
        seenHashes.add(tx.hash.toLowerCase());
      }
    }

    // 2. Parse ERC-20 token transactions (tUSD8 incoming funding or direct transfers)
    const allTokenTxs = [
      ...(vaultTokenRes?.result || []),
      ...(userTokenRes?.result || []),
    ];

    for (const tx of allTokenTxs) {
      if (!tx.hash || seenHashes.has(tx.hash.toLowerCase())) continue;
      const to = (tx.to || "").toLowerCase();
      const from = (tx.from || "").toLowerCase();
      const time = new Date(Number(tx.timeStamp) * 1000).toISOString();
      const decimals = Number(tx.tokenDecimal || "6");
      const amount = Number(BigInt(tx.value || "0")) / Math.pow(10, decimals);

      if (user && to === user && from !== user && from !== "0x0000000000000000000000000000000000000000") {
        // Funds sent from external wallet to connected wallet
        items.push({
          id: `${tx.hash}-token-in`,
          timestamp: time,
          agentAddress: from,
          agentName: from.startsWith("0x4551") ? "Aevum Faucet Gateway" : "External Wallet",
          recipient: user,
          recipientName: "Connected Wallet",
          amount,
          currency: tx.tokenSymbol || "tUSD8",
          purpose: "External Wallet Funding / Daily Faucet Claim",
          txHash: tx.hash,
          isAutonomous: false,
          type: "EXTERNAL_FUNDING",
          category: "INCOMING",
          isPositive: true,
          status: "CONFIRMED",
        });
        seenHashes.add(tx.hash.toLowerCase());
      }
    }

    // Sort newest transactions first
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items;
  } catch (err) {
    console.error("Error fetching Aevum on-chain transactions:", err);
    return [];
  }
}
