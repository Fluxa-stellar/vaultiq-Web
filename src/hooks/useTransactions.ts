"use client";

import { useCallback, useEffect, useState } from "react";
import { approvalApi, transactionApi } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";
import {
  fetchAevumOnChainTransactions,
  type UnifiedTransactionItem,
} from "@/lib/onchainTransactions";
import { DEFAULT_VAULT_ADDRESS } from "@/config/constants";
import type {
  Approval,
  ProposeTransactionDto,
  RecordTransactionDto,
  Transaction,
} from "@/types/transaction";

export function useTransactions(treasuryId?: string | null, customVaultAddress?: string | null) {
  const { address } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [onChainTransactions, setOnChainTransactions] = useState<UnifiedTransactionItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProposing, setIsProposing] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (id?: string | null) => {
      setIsLoading(true);
      setError(null);

      const targetVault = customVaultAddress || DEFAULT_VAULT_ADDRESS;

      try {
        const [txRes, appRes, onChainItems] = await Promise.all([
          id ? transactionApi.list(id).catch(() => null) : null,
          id ? approvalApi.list(id).catch(() => null) : null,
          fetchAevumOnChainTransactions(address, targetVault),
        ]);

        if (txRes?.data?.items) {
          setTransactions(txRes.data.items);
        }
        if (appRes?.data) {
          setApprovals(appRes.data);
        }
        if (onChainItems && onChainItems.length > 0) {
          setOnChainTransactions(onChainItems);
        }
      } catch (err: unknown) {
        console.warn("Failed loading transactions and approvals:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [address, customVaultAddress]
  );

  useEffect(() => {
    void loadData(treasuryId);
  }, [treasuryId, address, loadData]);

  const proposeTransaction = async (data: Omit<ProposeTransactionDto, "treasuryId">) => {
    if (!treasuryId) throw new Error("No treasury selected");

    setIsProposing(true);
    setError(null);

    try {
      const res = await transactionApi.propose({
        ...data,
        treasuryId,
      });

      if (res.data?.approval) {
        setApprovals((prev) => [res.data!.approval, ...prev]);
      }
      return res.data;
    } catch (err: unknown) {
      console.error("Propose transaction failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to propose transaction";
      setError(msg);
      throw err;
    } finally {
      setIsProposing(false);
    }
  };

  const approveRequest = async (approvalId: string) => {
    if (!treasuryId) return;

    setIsProcessingAction(true);
    setError(null);

    try {
      const res = await approvalApi.approve(treasuryId, approvalId);
      if (res.data) {
        setApprovals((prev) =>
          prev.map((a) => (a.id === approvalId ? res.data! : a))
        );
      }
    } catch (err: unknown) {
      console.error("Approve failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to approve request";
      setError(msg);
      throw err;
    } finally {
      setIsProcessingAction(false);
    }
  };

  const rejectRequest = async (approvalId: string) => {
    if (!treasuryId) return;

    setIsProcessingAction(true);
    setError(null);

    try {
      const res = await approvalApi.reject(treasuryId, approvalId);
      if (res.data) {
        setApprovals((prev) =>
          prev.map((a) => (a.id === approvalId ? res.data! : a))
        );
      }
    } catch (err: unknown) {
      console.error("Reject failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to reject request";
      setError(msg);
      throw err;
    } finally {
      setIsProcessingAction(false);
    }
  };

  const executeRequest = async (approvalId: string, txHash: string) => {
    if (!treasuryId) return;

    setIsProcessingAction(true);
    setError(null);

    try {
      const res = await approvalApi.execute(treasuryId, approvalId, { txHash });
      if (res.data) {
        setApprovals((prev) =>
          prev.map((a) => (a.id === approvalId ? res.data! : a))
        );
        // Refresh confirmed transactions
        const txRes = await transactionApi.list(treasuryId);
        if (txRes.data?.items) {
          setTransactions(txRes.data.items);
        }
      }
    } catch (err: unknown) {
      console.error("Execute failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to execute request";
      setError(msg);
      throw err;
    } finally {
      setIsProcessingAction(false);
    }
  };

  const recordTransaction = async (data: Omit<RecordTransactionDto, "treasuryId">) => {
    if (!treasuryId) return;

    try {
      const res = await transactionApi.record({
        ...data,
        treasuryId,
      });

      if (res.data) {
        setTransactions((prev) => [res.data!, ...prev]);
      }
      return res.data;
    } catch (err: unknown) {
      console.error("Record tx failed:", err);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === "PENDING");
  const approvedApprovals = approvals.filter((a) => a.status === "APPROVED");
  const completedApprovals = approvals.filter(
    (a) => a.status === "EXECUTED" || a.status === "REJECTED"
  );

  return {
    transactions,
    approvals,
    pendingApprovals,
    approvedApprovals,
    completedApprovals,
    isLoading,
    isProposing,
    isProcessingAction,
    error,
    proposeTransaction,
    approveRequest,
    rejectRequest,
    executeRequest,
    recordTransaction,
    onChainTransactions,
    reload: () => loadData(treasuryId),
  };
}

