/** Layout principal da versão web do Baú Mental. */

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ContextPanel } from "./ContextPanel";

interface WebLayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
}

export function WebLayout({
  children,
  onSearch,
}: WebLayoutProps) {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar - z-20 para ficar acima de tudo */}
      <TopBar onSearch={onSearch} />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Sidebar - z-10, abaixo do TopBar mas acima do conteúdo */}
        <Sidebar />

        {/* Área Principal - z-0, base */}
        <main className="flex-1 overflow-hidden min-w-0 relative z-0">
          <div className="h-full">{children}</div>
        </main>
      </div>

      {/* Context Panel (Drawer) */}
      <ContextPanel />
    </div>
  );
}
