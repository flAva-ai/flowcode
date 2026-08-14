"use client";

import { useState } from "react";
import { Wallet, ChevronDown, LogOut, AlertTriangle } from "lucide-react";
import { useWalletStore, avalancheFuji } from "@/lib/wallet-store";

function truncate(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, chainId, connecting, error, connect, disconnect, switchToFuji } =
    useWalletStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const onFuji = chainId === avalancheFuji.id;

  if (!address) {
    return (
      <div className="relative">
        <button
          onClick={connect}
          disabled={connecting}
          className="flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 sm:px-3 py-1.5 rounded-md border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-colors"
        >
          <Wallet size={12} />
          <span className="hidden sm:inline">
            {connecting ? "Connecting…" : "Connect Wallet"}
          </span>
        </button>
        {error && (
          <span className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-md border border-[var(--accent-critical)]/30 bg-[var(--bg-surface)] px-2 py-1.5 text-[9.5px] text-[var(--accent-critical)] shadow-lg leading-snug">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 sm:px-3 py-1.5 rounded-md border border-[var(--border-hairline)] hover:border-[var(--border-strong)] transition-colors"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            onFuji ? "bg-[var(--accent-signal)]" : "bg-[var(--accent-warn)]"
          }`}
        />
        <span className="hidden sm:inline text-[var(--text-secondary)]">
          {onFuji ? "Fuji" : "Wrong network"}
        </span>
        <span className="font-mono text-[var(--text-primary)]">{truncate(address)}</span>
        <ChevronDown size={11} className={`text-[var(--text-tertiary)] transition-transform ${menuOpen ? "rotate-180" : ""}`} />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="px-3.5 py-3 border-b border-[var(--border-hairline)]">
              <div className="text-[10px] text-[var(--text-tertiary)] mb-0.5">Connected as</div>
              <div className="text-[12px] font-mono text-[var(--text-primary)]">{truncate(address)}</div>
            </div>
            {!onFuji && (
              <button
                onClick={() => {
                  switchToFuji();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[12px] text-[var(--accent-warn)] hover:bg-[var(--bg-raised)] transition-colors"
              >
                <AlertTriangle size={13} />
                Switch to Fuji testnet
              </button>
            )}
            <button
              onClick={() => {
                disconnect();
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] transition-colors"
            >
              <LogOut size={13} />
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
