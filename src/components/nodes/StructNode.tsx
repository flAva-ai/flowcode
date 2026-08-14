"use client";

import { Layers } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { TextField } from "./fields";
import { RowListEditor } from "./RowListEditor";
import { useFlowStore } from "@/lib/flow-store";
import type { StructNodeData } from "@/types/flow";
import type { NodeProps } from "reactflow";

let counter = 0;
function rowId() {
  counter += 1;
  return `struct-field-${Date.now()}-${counter}`;
}

export function StructNode({ id, data, selected }: NodeProps<StructNodeData>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData<StructNodeData>);

  return (
    <NodeShell
      id={id}
      kind="struct"
      icon={<Layers size={13} />}
      eyebrow="Struct"
      title={data.name || "Struct"}
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
        label="Fields"
        rows={data.fields}
        onChange={(fields) => updateNodeData(id, { fields })}
        newRow={() => ({ id: rowId(), name: "", type: "uint256" })}
        datalistId={`struct-types-${id}`}
      />
    </NodeShell>
  );
}
