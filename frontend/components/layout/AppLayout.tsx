// If this file exists or needs to be created
"use client";

import React from "react";
import { HeaderWrapper } from "@/components/common/HeaderWrapper";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {isAuthenticated && (
        <header className="shrink-0 border-b">
          <HeaderWrapper />
        </header>
      )}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
