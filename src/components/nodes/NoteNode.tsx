"use client";

import { StickyNote } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { useFlowStore } from "@/lib/flow-store";
import type { NoteNodeData } from "@/types/flow";
import type { NodeProps } from "reactflow";

export function NoteNode({ id, data, selected }: NodeProps<NoteNodeData>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData<NoteNodeData>);

  return (
    <NodeShell
      id={id}
      kind="note"
      icon={<StickyNote size={13} />}
      eyebrow="Note"
      title={data.label}
      hasInput={false}
      hasOutput={false}
      selected={selected}
      width={220}
    >
      <textarea
        className="nodrag w-full text-[12px] leading-snug bg-transparent text-[var(--text-secondary)] placeholder:text-[var(--text-tertiary)] resize-none focus:outline-none"
        rows={3}
        value={data.text}
        placeholder="Add notes…"
        onChange={(e) => updateNodeData(id, { text: e.target.value })}
      />
    </NodeShell>
  );
}
