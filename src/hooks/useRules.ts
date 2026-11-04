"use client";

import { useCallback, useEffect, useState } from "react";
import { ruleApi } from "@/lib/api";
import type {
  CreateRuleDto,
  Rule,
  RuleEvaluationData,
  UpdateRuleDto,
} from "@/types/rule";

export function useRules(treasuryId?: string | null) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [evalResults, setEvalResults] = useState<RuleEvaluationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isActing, setIsActing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await ruleApi.list(id);
      if (res.data) {
        setRules(res.data);
      }
    } catch (err: unknown) {
      console.warn("Failed loading rules:", err);
      const msg = err instanceof Error ? err.message : "Failed to load rules";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (treasuryId) {
      void fetchRules(treasuryId);
    } else {
      setRules([]);
      setEvalResults(null);
    }
  }, [treasuryId, fetchRules]);

  const createRule = async (data: CreateRuleDto): Promise<Rule> => {
    if (!treasuryId) throw new Error("No treasury selected");

    setIsActing(true);
    setError(null);

    try {
      const res = await ruleApi.create(treasuryId, data);
      if (!res.data) throw new Error(res.message || "Failed to create rule");

      const created = res.data;
      setRules((prev) => [created, ...prev]);
      return created;
    } catch (err: unknown) {
      console.error("Create rule failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to create rule";
      setError(msg);
      throw err;
    } finally {
      setIsActing(false);
    }
  };

  const updateRule = async (id: string, data: UpdateRuleDto): Promise<Rule> => {
    if (!treasuryId) throw new Error("No treasury selected");

    setIsActing(true);
    setError(null);

    try {
      const res = await ruleApi.update(treasuryId, id, data);
      if (!res.data) throw new Error(res.message || "Failed to update rule");

      const updated = res.data;
      setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    } catch (err: unknown) {
      console.error("Update rule failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to update rule";
      setError(msg);
      throw err;
    } finally {
      setIsActing(false);
    }
  };

  const deleteRule = async (id: string): Promise<void> => {
    if (!treasuryId) return;

    setIsActing(true);
    setError(null);

    try {
      await ruleApi.delete(treasuryId, id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      console.error("Delete rule failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to delete rule";
      setError(msg);
      throw err;
    } finally {
      setIsActing(false);
    }
  };

  const toggleRule = async (id: string): Promise<void> => {
    if (!treasuryId) return;

    // Optimistic toggle
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );

    try {
      const res = await ruleApi.toggle(treasuryId, id);
      if (res.data) {
        setRules((prev) => prev.map((r) => (r.id === id ? res.data! : r)));
      }
    } catch (err: unknown) {
      console.error("Toggle rule failed:", err);
      // Revert optimistic toggle
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
      );
    }
  };

  const evaluateRules = async (): Promise<RuleEvaluationData | null> => {
    if (!treasuryId) return null;

    setIsEvaluating(true);
    setError(null);

    try {
      const res = await ruleApi.evaluate(treasuryId);
      if (res.data) {
        setEvalResults(res.data);
        return res.data;
      }
      return null;
    } catch (err: unknown) {
      console.error("Evaluate rules failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to evaluate rules";
      setError(msg);
      throw err;
    } finally {
      setIsEvaluating(false);
    }
  };

  const activeRules = rules.filter((r) => r.isActive);
  const inactiveRules = rules.filter((r) => !r.isActive);

  return {
    rules,
    activeRules,
    inactiveRules,
    evalResults,
    isLoading,
    isEvaluating,
    isActing,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    evaluateRules,
    reload: () => (treasuryId ? fetchRules(treasuryId) : Promise.resolve()),
  };
}

