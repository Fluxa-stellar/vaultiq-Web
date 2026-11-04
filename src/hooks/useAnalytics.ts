"use client";

import { useCallback, useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api";
import type { TreasuryAnalyticsData, TreasurySnapshot } from "@/types/analytics";

export function useAnalytics(treasuryId?: string | null) {
  const [analytics, setAnalytics] = useState<TreasuryAnalyticsData | null>(null);
  const [snapshots, setSnapshots] = useState<TreasurySnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSnapshotting, setIsSnapshotting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [analyticsRes, snapshotsRes] = await Promise.allSettled([
        analyticsApi.getAnalytics(id),
        analyticsApi.getSnapshots(id),
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value.data) {
        setAnalytics(analyticsRes.value.data);
      } else if (analyticsRes.status === "rejected") {
        console.warn("Analytics fetch failed:", analyticsRes.reason);
      }

      if (snapshotsRes.status === "fulfilled" && snapshotsRes.value.data) {
        setSnapshots(snapshotsRes.value.data);
      } else if (snapshotsRes.status === "rejected") {
        console.warn("Snapshots fetch failed:", snapshotsRes.reason);
      }
    } catch (err: unknown) {
      console.error("Failed loading analytics:", err);
      const msg = err instanceof Error ? err.message : "Failed to load analytics";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (treasuryId) {
      void fetchAnalytics(treasuryId);
    } else {
      setAnalytics(null);
      setSnapshots([]);
    }
  }, [treasuryId, fetchAnalytics]);

  const captureSnapshot = async (): Promise<TreasurySnapshot> => {
    if (!treasuryId) throw new Error("No treasury selected");

    setIsSnapshotting(true);
    setError(null);

    try {
      const res = await analyticsApi.captureSnapshot(treasuryId);
      if (!res.data) {
        throw new Error(res.message || "Failed to capture snapshot");
      }

      const newSnapshot = res.data;
      setSnapshots((prev) => [...prev, newSnapshot]);
      return newSnapshot;
    } catch (err: unknown) {
      console.error("Capture snapshot failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to capture snapshot";
      setError(msg);
      throw err;
    } finally {
      setIsSnapshotting(false);
    }
  };

  const reload = async () => {
    if (treasuryId) {
      await fetchAnalytics(treasuryId);
    }
  };

  return {
    analytics,
    snapshots,
    isLoading,
    isSnapshotting,
    error,
    captureSnapshot,
    reload,
  };
}

