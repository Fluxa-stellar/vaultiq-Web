"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import type { AgentChatMessage } from "@/types/agent";
import { AgentInsightCard } from "./AgentInsight";
import { AgentRecommendationCard } from "./AgentRecommendation";

interface AgentChatProps {
  messages: AgentChatMessage[];
  isSending: boolean;
  onSendMessage: (text: string) => Promise<void>;
  treasuryName?: string;
}

const QUICK_PROMPTS = [
  "Analyze this treasury and evaluate financial health.",
  "Where are most of my funds allocated?",
  "Check active spending rules and security guardrails.",
  "Transfer 0.05 BNB to my reserve wallet.",
];

export function AgentChat({
  messages,
  isSending,
  onSendMessage,
  treasuryName,
}: AgentChatProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText("");
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[650px] rounded-2xl bg-[#0f121e] border border-[#1e2335] shadow-xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2335] bg-[#121626]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-[#3538cd]/20 text-[#6366f1] flex items-center justify-center border border-[#3538cd]/30">
              <Bot size={20} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0f121e]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              AI Treasury Agent
              <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                Online
              </span>
            </h3>
            <p className="text-xs text-gray-400">
              {treasuryName ? `Connected to ${treasuryName}` : "Grounded on-chain assistant"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#161a2e] px-3 py-1.5 rounded-lg border border-[#232b45]">
          <Sparkles size={14} className="text-yellow-400" />
          <span>Grounded with Vault Context</span>
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-10">
            <div className="p-3.5 rounded-2xl bg-[#3538cd]/10 text-[#6366f1] mb-3">
              <Bot size={36} />
            </div>
            <h4 className="text-base font-bold text-white mb-1">
              How can I assist your treasury today?
            </h4>
            <p className="text-xs text-gray-400 mb-6">
              Ask questions to inspect balances and risks, or give commands to prepare transactions and policy guardrails.
            </p>

            <div className="flex flex-col w-full gap-2">
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider text-left">
                Suggested Prompts
              </span>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="text-left text-xs text-gray-300 hover:text-white bg-[#15192a] hover:bg-[#1f253e] p-2.5 rounded-xl border border-[#222a45] transition-all"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "USER";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-lg bg-[#3538cd]/20 text-[#6366f1] flex items-center justify-center shrink-0 border border-[#3538cd]/30 mt-1">
                    <Bot size={16} />
                  </div>
                )}

                <div
                  className={`flex flex-col max-w-[80%] gap-3 ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? "bg-[#3538cd] text-white rounded-tr-none shadow-md shadow-[#3538cd]/20"
                        : "bg-[#141829] text-gray-200 border border-[#20273d] rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Inline Insights if generated */}
                  {msg.insights && msg.insights.length > 0 && (
                    <div className="flex flex-col gap-2 w-full mt-1">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Insights Detected
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.insights.map((ins, i) => (
                          <AgentInsightCard key={ins.id || i} insight={ins} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Recommendations if generated */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="flex flex-col gap-2 w-full mt-1">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Action Recommendations
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.recommendations.map((rec, i) => (
                          <AgentRecommendationCard
                            key={rec.id || i}
                            recommendation={rec}
                            onActionClick={() => {
                              // Could trigger proposal modal
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-gray-500 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {isUser && (
                  <div className="h-8 w-8 rounded-lg bg-gray-800 text-gray-300 flex items-center justify-center shrink-0 border border-gray-700 mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex gap-3 justify-start items-center">
            <div className="h-8 w-8 rounded-lg bg-[#3538cd]/20 text-[#6366f1] flex items-center justify-center shrink-0 border border-[#3538cd]/30">
              <Bot size={16} />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-[#141829] border border-[#20273d] px-4 py-3 text-xs text-gray-400 rounded-tl-none">
              <Loader2 size={14} className="animate-spin text-[#6366f1]" />
              <span>Analyzing on-chain state and generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#1e2335] bg-[#121626]">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask questions or type a command (e.g. 'Transfer 0.1 BNB to 0x...')"
            rows={1}
            disabled={isSending}
            className="w-full resize-none rounded-xl bg-[#181d30] border border-[#262f4c] py-3 pl-4 pr-24 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3538cd] transition-colors"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#3538cd] text-white hover:bg-[#3538cd]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Send Message"
            >
              {isSending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 px-1">
          <span>Press Enter to send, Shift + Enter for newline</span>
          <span className="text-emerald-400">Safe Web3 Guardrails Active</span>
        </div>
      </div>
    </div>
  );
}

