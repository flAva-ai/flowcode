"use client";

import { Box } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { TextField, SelectField, SOLIDITY_TYPES } from "./fields";
import { useFlowStore } from "@/lib/flow-store";
import type { VariableNodeData } from "@/types/flow";
import type { NodeProps } from "reactflow";

export function VariableNode({ id, data, selected }: NodeProps<VariableNodeData>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData<VariableNodeData>);

  return (
    <NodeShell
      id={id}
      kind="variable"
      icon={<Box size={13} />}
      eyebrow="Variable"
      title={data.name || "variable"}
      selected={selected}
      width={240}
    >
      <TextField
        label="Name"
        value={data.name}
        onChange={(v) => updateNodeData(id, { name: v })}
        mono
      />
      <TextField
        label="Type"
        value={data.varType}
        onChange={(v) => updateNodeData(id, { varType: v })}
        list="sol-types-var"
        mono
      />
      <datalist id="sol-types-var">
        {SOLIDITY_TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <div className="flex gap-1.5">
        <div className="flex-1">
          <SelectField
            label="Visibility"
            value={data.visibility}
            onChange={(v) => updateNodeData(id, { visibility: v as VariableNodeData["visibility"] })}
            options={[
              { value: "public", label: "public" },
              { value: "private", label: "private" },
              { value: "internal", label: "internal" },
            ]}
          />
        </div>
        <div className="flex-1">
          <SelectField
            label="Mutability"
            value={data.mutability}
            onChange={(v) => updateNodeData(id, { mutability: v as VariableNodeData["mutability"] })}
            options={[
              { value: "mutable", label: "mutable" },
              { value: "constant", label: "constant" },
              { value: "immutable", label: "immutable" },
            ]}
          />
        </div>
      </div>
      <TextField
        label="Initial value (optional)"
        value={data.initialValue}
        onChange={(v) => updateNodeData(id, { initialValue: v })}
        placeholder="0"
        mono
      />
    </NodeShell>
  );
}
