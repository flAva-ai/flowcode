"use client";

import { Trash2, Menu, Sparkles } from "lucide-react";
import { useFlowStore } from "@/lib/flow-store";
import { TemplateMenuButton } from "./TemplateMenuButton";
import { WalletButton } from "./WalletButton";
import { DemoModeToggle } from "./DemoModeToggle";

interface TopBarProps {
  onOpenPalette: () => void;
  onOpenAssistant: () => void;
}

export function TopBar({ onOpenPalette, onOpenAssistant }: TopBarProps) {
  const nodes = useFlowStore((s) => s.nodes);
  const flowName = useFlowStore((s) => s.flowName);
  const setFlowName = useFlowStore((s) => s.setFlowName);

  function handleClear() {
    useFlowStore.setState({ nodes: [], edges: [] });
  }

  return (
    <header className="h-14 shrink-0 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] flex items-center justify-between px-3 sm:px-5 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onOpenPalette}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0"
        >
          <Menu size={15} />
        </button>
        <div className="min-w-0">
          <input
            aria-label="Flow name"
            value={flowName}
            onChange={(event) => setFlowName(event.target.value)}
            className="w-full bg-transparent text-[13.5px] font-semibold leading-tight truncate outline-none focus:text-[var(--accent-signal)]"
          />
          <p className="hidden sm:block text-[10.5px] text-[var(--text-tertiary)] leading-tight truncate">
            {nodes.length} node{nodes.length === 1 ? "" : "s"} · see the Code tab
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 sm:px-3 py-1.5 rounded-md border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Trash2 size={12} />
          <span className="hidden sm:inline">Clear</span>
        </button>
        <DemoModeToggle />
        <TemplateMenuButton compactLabel />
        <WalletButton />
        <button
          onClick={onOpenAssistant}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md border border-[var(--border-hairline)] text-[var(--accent-signal)] hover:border-[var(--accent-signal)] shrink-0"
        >
          <Sparkles size={15} />
        </button>
      </div>
    </header>
  );
}
