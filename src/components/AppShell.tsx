import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  topBar: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  detail: ReactNode;
  sidebarOpen: boolean;
  detailOpen: boolean;
  onCloseSidebar: () => void;
  onCloseDetail: () => void;
}

export function AppShell({
  topBar,
  sidebar,
  main,
  detail,
  sidebarOpen,
  detailOpen,
  onCloseSidebar,
  onCloseDetail,
}: AppShellProps) {
  return (
    <div className="h-screen overflow-hidden bg-bg bg-radial-console text-slate-100">
      <div className="flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-border/70 bg-panel/90 backdrop-blur-sm">
          {topBar}
        </header>
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {(sidebarOpen || detailOpen) && (
            <button
              type="button"
              onClick={() => {
                onCloseSidebar();
                onCloseDetail();
              }}
              className="absolute inset-0 z-20 bg-slate-950/60 lg:hidden"
              aria-label="Close mobile panels"
            />
          )}
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_360px]">
            <aside
              className={cn(
                "absolute inset-y-0 left-0 z-30 w-[300px] min-h-0 overflow-hidden border-r border-border/70 bg-panel transition-transform duration-200 lg:static lg:z-0 lg:w-auto lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              {sidebar}
            </aside>
            <main className="min-h-0 min-w-0 overflow-hidden">{main}</main>
            <aside
              className={cn(
                "absolute inset-y-0 right-0 z-30 w-[360px] min-h-0 overflow-hidden border-l border-border/70 bg-panel transition-transform duration-200 lg:static lg:z-0 lg:w-auto lg:translate-x-0",
                detailOpen ? "translate-x-0" : "translate-x-full"
              )}
            >
              {detail}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
