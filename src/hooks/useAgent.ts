"use client";

import { useCallback, useEffect, useState } from "react";
import { agentApi } from "@/lib/api";
import type {
  AgentChatMessage,
  AgentInsight,
  AgentRecommendation,
} from "@/types/agent";

export function useAgent(treasuryId?: string | null) {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const [msgRes, insightsRes, recRes] = await Promise.all([
        agentApi.getMessages(id).catch(() => null),
        agentApi.getInsights(id).catch(() => null),
        agentApi.getRecommendations(id).catch(() => null),
      ]);

      if (msgRes?.data) {
        setMessages(msgRes.data);
      }
      if (insightsRes?.data) {
        setInsights(insightsRes.data);
      }
      if (recRes?.data) {
        setRecommendations(recRes.data);
      }
    } catch (err: unknown) {
      console.warn("Failed loading agent data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (treasuryId) {
      void loadData(treasuryId);
    } else {
      setMessages([]);
      setInsights([]);
      setRecommendations([]);
    }
  }, [treasuryId, loadData]);

  const sendMessage = async (text: string, targetTreasuryId?: string) => {
    const id = targetTreasuryId || treasuryId;
    if (!id || !text.trim()) return;

    setIsSending(true);
    setError(null);

    // Optimistic user message
    const tempUserMsg: AgentChatMessage = {
      id: `temp-${Date.now()}`,
      treasuryId: id,
      role: "USER",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await agentApi.chat(id, text.trim());
      if (res.data) {
        const assistantMsg: AgentChatMessage = {
          id: `resp-${Date.now()}`,
          treasuryId: id,
          role: "ASSISTANT",
          content: res.data.reply,
          insights: res.data.insights,
          recommendations: res.data.recommendations,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Update active insights and recommendations if returned
        if (res.data.insights && res.data.insights.length > 0) {
          setInsights((prev) => [...res.data!.insights!, ...prev]);
        }
        if (res.data.recommendations && res.data.recommendations.length > 0) {
          setRecommendations((prev) => [...res.data!.recommendations!, ...prev]);
        }
      }
    } catch (err: unknown) {
      console.error("Agent chat failed:", err);
      let msg = err instanceof Error ? err.message : "Failed to communicate with AI agent";

      if (msg.includes("prisma.agentInsight.create") || msg.includes("Expected InsightType")) {
        msg = "The AI model encountered a classification schema mismatch on the backend while recording an insight. Please try asking your question again or rephrase slightly.";
      }

      setError(msg);
      // Add error system message
      const errorMsg: AgentChatMessage = {
        id: `err-${Date.now()}`,
        treasuryId: id,
        role: "ASSISTANT",
        content: msg,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const runAnalysis = async (targetTreasuryId?: string) => {
    const id = targetTreasuryId || treasuryId;
    if (!id) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await agentApi.analyze(id);
      if (res.data?.savedInsights) {
        setInsights((prev) => [...res.data!.savedInsights, ...prev]);
      }
      // Re-fetch insights
      const insightsRes = await agentApi.getInsights(id);
      if (insightsRes.data) {
        setInsights(insightsRes.data);
      }
    } catch (err: unknown) {
      console.error("Analysis failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to run analysis";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    messages,
    insights,
    recommendations,
    isLoading,
    isSending,
    isAnalyzing,
    error,
    sendMessage,
    runAnalysis,
    reload: () => (treasuryId ? loadData(treasuryId) : Promise.resolve()),
  };
}

