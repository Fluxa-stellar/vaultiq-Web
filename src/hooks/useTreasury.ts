"use client";

import { useCallback, useEffect, useState } from "react";
import { treasuryApi } from "@/lib/api";
import { useWallet } from "./useWallet";
import type {
  CreateTreasuryDto,
  Treasury,
  TreasuryAsset,
  TreasuryOverview,
} from "@/types/treasury";

export function useTreasury() {
  const { isAuthenticated } = useWallet();

  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [selectedTreasury, setSelectedTreasury] = useState<Treasury | null>(null);
  const [overview, setOverview] = useState<TreasuryOverview | null>(null);
  const [assets, setAssets] = useState<TreasuryAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverviewAndAssets = useCallback(async (treasuryId: string) => {
    try {
      const [overviewRes, assetsRes] = await Promise.all([
        treasuryApi.getOverview(treasuryId).catch(() => null),
        treasuryApi.getAssets(treasuryId).catch(() => null),
      ]);

      if (overviewRes?.data) {
        setOverview(overviewRes.data);
      }
      if (assetsRes?.data) {
        setAssets(assetsRes.data);
      }
    } catch (err: unknown) {
      console.warn("Failed loading treasury overview:", err);
    }
  }, []);

  const fetchTreasuries = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await treasuryApi.list();
      if (res.data) {
        setTreasuries(res.data);

        // Auto-select first treasury if none selected
        if (res.data.length > 0) {
          const target = res.data[0];
          setSelectedTreasury(target);
          await loadOverviewAndAssets(target.id);
        } else {
          setSelectedTreasury(null);
          setOverview(null);
          setAssets([]);
        }
      }
    } catch (err: unknown) {
      console.error("Failed fetching treasuries:", err);
      const msg = err instanceof Error ? err.message : "Failed to load treasuries";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadOverviewAndAssets]);

  // Load when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      void fetchTreasuries();
    } else {
      setTreasuries([]);
      setSelectedTreasury(null);
      setOverview(null);
      setAssets([]);
    }
  }, [isAuthenticated, fetchTreasuries]);

  const selectTreasury = async (itemOrId: Treasury | string) => {
    let target: Treasury | undefined;
    if (typeof itemOrId === "string") {
      target = treasuries.find((t) => t.id === itemOrId);
      if (!target) {
        try {
          const res = await treasuryApi.get(itemOrId);
          if (res.data) target = res.data;
        } catch {
          // ignore
        }
      }
    } else {
      target = itemOrId;
    }

    if (target) {
      setSelectedTreasury(target);
      setIsLoading(true);
      await loadOverviewAndAssets(target.id);
      setIsLoading(false);
    }
  };

  const createTreasury = async (data: CreateTreasuryDto): Promise<Treasury> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await treasuryApi.create(data);
      if (!res.data) {
        throw new Error(res.message || "Failed to create treasury");
      }

      const newTreasury = res.data;
      setTreasuries((prev) => [newTreasury, ...prev]);
      setSelectedTreasury(newTreasury);
      await loadOverviewAndAssets(newTreasury.id);
      return newTreasury;
    } catch (err: unknown) {
      console.error("Create treasury failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to create treasury";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const syncBalances = async (targetId?: string) => {
    const idToSync = targetId || selectedTreasury?.id;
    if (!idToSync) return;

    setIsSyncing(true);
    setError(null);
    try {
      const syncRes = await treasuryApi.sync(idToSync);
      if (syncRes.data?.assets) {
        setAssets(syncRes.data.assets);
      }
      // Refresh overview
      await loadOverviewAndAssets(idToSync);
    } catch (err: unknown) {
      console.error("Sync failed:", err);
      const msg = err instanceof Error ? err.message : "Sync failed";
      setError(msg);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshOverview = async () => {
    if (selectedTreasury?.id) {
      await loadOverviewAndAssets(selectedTreasury.id);
    }
  };

  return {
    treasuries,
    selectedTreasury,
    overview,
    assets,
    isLoading,
    isSyncing,
    error,
    fetchTreasuries,
    selectTreasury,
    createTreasury,
    syncBalances,
    refreshOverview,
  };
}

