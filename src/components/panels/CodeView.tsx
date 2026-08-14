"use client";

import { useMemo, useState } from "react";
import { Copy, Check, ShieldCheck, Loader2, AlertTriangle, Download } from "lucide-react";
import { useFlowStore } from "@/lib/flow-store";
import { useDemoStore } from "@/lib/demo-store";
import { getDemoAuditResult } from "@/lib/demo-data";
import { compileToSolidity } from "@/lib/compiler";
import { highlightSolidity } from "@/lib/highlight-solidity";
import { exportProjectZip, downloadBlob } from "@/lib/export-project";
import { DeployPanel } from "./DeployPanel";
import type { AuditResponse, DeployPreviewResponse } from "@/types/flow";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--accent-critical)",
  high: "#ff8a5c",
  medium: "var(--accent-warn)",
  low: "var(--accent-signal)",
  info: "var(--text-tertiary)",
};

type Tab = "code" | "audit" | "deploy";

export function CodeView() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const demoMode = useDemoStore((s) => s.demoMode);
  const [tab, setTab] = useState<Tab>("code");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);

  const [showScript, setShowScript] = useState(false);
  const [deployScriptLoading, setDeployScriptLoading] = useState(false);
  const [deployScriptResult, setDeployScriptResult] = useState<DeployPreviewResponse | null>(null);

  const compiled = useMemo(() => compileToSolidity(nodes, edges), [nodes, edges]);
  const highlighted = useMemo(() => highlightSolidity(compiled.code), [compiled.code]);

  async function handleCopy() {
    await navigator.clipboard.writeText(compiled.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleExportZip() {
    setExporting(true);
    try {
      const blob = await exportProjectZip({
        code: compiled.code,
        contractName: compiled.contractName,
      });
      downloadBlob(blob, `${compiled.contractName || "avalanche-contract"}.zip`);
    } finally {
      setExporting(false);
    }
  }

  async function handleAudit() {
    setTab("audit");
    setAuditLoading(true);
    setAuditError(null);
    try {
      if (demoMode) {
        setAuditResult(await getDemoAuditResult());
        return;
      }
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: compiled.code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed (${res.status})`);
      }
      setAuditResult(await res.json());
    } catch (e) {
      setAuditError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleToggleScript() {
    const next = !showScript;
    setShowScript(next);
    if (next && !deployScriptResult) {
      setDeployScriptLoading(true);
      try {
        const res = await fetch("/api/deploy-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: compiled.code,
            contractName: compiled.contractName,
            network: "fuji",
          }),
        });
        if (res.ok) setDeployScriptResult(await res.json());
      } finally {
        setDeployScriptLoading(false);
      }
    }
  }

  const hasErrors = compiled.errors.length > 0;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* header */}
      <div className="min-h-11 shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 border-b border-[var(--border-hairline)] flex-wrap py-1.5">
        <div className="flex items-center gap-1 overflow-x-auto thin-scroll">
          {(["code", "audit", "deploy"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 text-[11.5px] font-medium px-3 py-1.5 rounded-md capitalize transition-colors ${
                tab === t
                  ? "bg-[var(--bg-raised)] text-[var(--text-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <span className="hidden sm:inline">
                {t === "code" ? "Compiled code" : t === "audit" ? "AI Review" : t}
              </span>
              <span className="sm:hidden">{t === "code" ? "Code" : t}</span>
            </button>
          ))}
          {hasErrors && (
            <span className="hidden md:flex items-center gap-1 text-[10.5px] text-[var(--accent-warn)] ml-1 shrink-0">
              <AlertTriangle size={11} />
              {compiled.errors[0]}
            </span>
          )}
          {!hasErrors && compiled.warnings.length > 0 && (
            <span className="hidden lg:flex items-center gap-1 text-[10.5px] text-[var(--text-tertiary)] ml-1 shrink-0">
              <AlertTriangle size={11} />
              {compiled.warnings[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {tab === "code" && (
            <>
              <button
                onClick={handleExportZip}
                disabled={exporting || hasErrors}
                className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-md border border-[var(--border-hairline)] hover:border-[var(--border-strong)] disabled:opacity-40"
              >
                {exporting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Download size={12} />
                )}
                <span className="hidden sm:inline">{exporting ? "Zipping…" : "Save to ZIP"}</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-md border border-[var(--border-hairline)] hover:border-[var(--border-strong)]"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </>
          )}
          {tab === "audit" && (
            <button
              onClick={handleAudit}
              disabled={auditLoading || hasErrors}
              className="flex items-center gap-1 text-[11px] font-medium text-[var(--accent-warn)] hover:opacity-80 disabled:opacity-40 px-2.5 py-1.5 rounded-md border border-[var(--border-hairline)]"
            >
              {auditLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ShieldCheck size={12} />
              )}
              Run AI Review
            </button>
          )}
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-auto thin-scroll min-h-0">
        {tab === "code" && (
          <div className="p-4 sm:p-6 space-y-5">
            <pre className="text-[12.5px] leading-relaxed font-mono whitespace-pre-wrap">
              <code
                className="text-[var(--text-secondary)]"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
            <section className="max-w-2xl rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-raised)] p-4">
              <h2 className="text-[12px] font-medium text-[var(--text-primary)]">Run this contract locally</h2>
              <p className="mt-1 text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
                Save to ZIP for a ready-to-run Hardhat project, then run <code className="font-mono">npm install</code> and <code className="font-mono">npx hardhat compile</code>. To use Foundry, place the contract in <code className="font-mono">src/</code>, run <code className="font-mono">forge init</code>, then <code className="font-mono">forge build</code>.
              </p>
            </section>
          </div>
        )}

        {tab === "audit" && (
          <div className="p-4 sm:p-6">
            {auditError && (
              <p className="text-[12px] text-[var(--accent-critical)]">{auditError}</p>
            )}
            {!auditResult && !auditError && !auditLoading && (
              <p className="text-[12px] text-[var(--text-tertiary)]">
              Run AI Review to get a security and gas review of the compiled code. Treat its suggestions as learning prompts, not a substitute for a professional audit.
              </p>
            )}
            {auditResult && (
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="text-[26px] font-semibold text-[var(--text-primary)]">
                    {auditResult.score}
                    <span className="text-[13px] text-[var(--text-tertiary)]">/100</span>
                  </div>
                  <p className="text-[12.5px] text-[var(--text-secondary)] leading-snug">
                    {auditResult.summary}
                  </p>
                </div>
                <div className="space-y-2">
                  {auditResult.findings.map((f) => (
                    <div key={f.id} className="flex items-start gap-2 text-[12.5px]">
                      <span
                        className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: SEVERITY_COLOR[f.severity] }}
                      />
                      <div>
                        <span className="text-[var(--text-primary)] font-medium">{f.title}</span>
                        <span className="text-[var(--text-tertiary)]"> — {f.description}</span>
                        <div className="text-[var(--text-secondary)] mt-0.5">
                          {f.recommendation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {auditResult.gasFindings.length > 0 && (
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wide text-[var(--text-tertiary)] mb-1.5">
                      Gas
                    </div>
                    <div className="space-y-1">
                      {auditResult.gasFindings.map((g) => (
                        <div key={g.id} className="text-[12.5px] text-[var(--text-secondary)]">
                          {g.title}
                          {g.estimatedSavings ? ` — ~${g.estimatedSavings}` : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "deploy" && (
          <div className="p-4 sm:p-6">
            <DeployPanel
              code={compiled.code}
              contractName={compiled.contractName}
              disabled={hasErrors}
            />
            {hasErrors && (
              <p className="text-[12px] text-[var(--accent-warn)] mt-3">
                Fix the canvas errors first — {compiled.errors[0]}
              </p>
            )}
            <div className="mt-6 pt-4 border-t border-[var(--border-hairline)] max-w-xl">
              <button
                onClick={handleToggleScript}
                className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline underline-offset-2"
              >
                {showScript ? "Hide" : "Show"} Hardhat deploy script instead
              </button>
              {showScript && (
                <div className="mt-3 space-y-2">
                  {deployScriptLoading && (
                    <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-tertiary)]">
                      <Loader2 size={12} className="animate-spin" />
                      Generating…
                    </div>
                  )}
                  {deployScriptResult && (
                    <>
                      <pre className="text-[11.5px] leading-relaxed font-mono text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--bg-raised)] rounded-lg p-3 border border-[var(--border-hairline)]">
                        {deployScriptResult.deployScript}
                      </pre>
                      <ul className="text-[10.5px] text-[var(--text-tertiary)] list-disc pl-4 space-y-0.5">
                        {deployScriptResult.notes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
