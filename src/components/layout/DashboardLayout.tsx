"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { FloatingChatDrawer } from "@/components/agent/FloatingChatDrawer";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0c16] text-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
        <FloatingChatDrawer />
      </div>
    </div>
  );
}
