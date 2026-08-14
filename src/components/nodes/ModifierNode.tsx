"use client";

import { Filter } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { TextField, CodeArea } from "./fields";
import { RowListEditor } from "./RowListEditor";
import { useFlowStore } from "@/lib/flow-store";
import type { ModifierNodeData } from "@/types/flow";
import type { NodeProps } from "reactflow";

let counter = 0;
function rowId() {
  counter += 1;
  return `mod-param-${Date.now()}-${counter}`;
}

export function ModifierNode({ id, data, selected }: NodeProps<ModifierNodeData>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData<ModifierNodeData>);

  return (
    <NodeShell
      id={id}
      kind="modifier"
      icon={<Filter size={13} />}
      eyebrow="Modifier"
      title={data.name || "modifier"}
      selected={selected}
      width={260}
    >
      <TextField
        label="Name"
        value={data.name}
        onChange={(v) => updateNodeData(id, { name: v })}
        mono
      />
      <RowListEditor
        label="Parameters"
        rows={data.params}
        onChange={(params) => updateNodeData(id, { params })}
        newRow={() => ({ id: rowId(), name: "", type: "uint256" })}
        datalistId={`mod-param-types-${id}`}
      />
      <CodeArea
        label="Body (include _; where the function runs)"
        value={data.body}
        onChange={(v) => updateNodeData(id, { body: v })}
        rows={3}
      />
      <div className="text-[10px] text-[var(--text-tertiary)]">
        Connect this node&apos;s output into a Function node to apply it.
      </div>
    </NodeShell>
  );
}
