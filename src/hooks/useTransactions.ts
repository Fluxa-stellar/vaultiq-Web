"use client";

import { useCallback, useEffect, useState } from "react";
import { approvalApi, transactionApi } from "@/lib/api";
import type {
  Approval,
  ProposeTransactionDto,
  RecordTransactionDto,
  Transaction,
} from "@/types/transaction";

export function useTransactions(treasuryId?: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProposing, setIsProposing] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [txRes, appRes] = await Promise.all([
        transactionApi.list(id).catch(() => null),
        approvalApi.list(id).catch(() => null),
      ]);

      if (txRes?.data?.items) {
        setTransactions(txRes.data.items);
      }
      if (appRes?.data) {
        setApprovals(appRes.data);
      }
    } catch (err: unknown) {
      console.warn("Failed loading transactions and approvals:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (treasuryId) {
      void loadData(treasuryId);
    } else {
      setTransactions([]);
      setApprovals([]);
    }
  }, [treasuryId, loadData]);

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
    reload: () => (treasuryId ? loadData(treasuryId) : Promise.resolve()),
  };
}

