"use client";

import { Network } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { TextField, SelectField, SOLIDITY_TYPES } from "./fields";
import { useFlowStore } from "@/lib/flow-store";
import type { MappingNodeData } from "@/types/flow";
import type { NodeProps } from "reactflow";

export function MappingNode({ id, data, selected }: NodeProps<MappingNodeData>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData<MappingNodeData>);

  return (
    <NodeShell
      id={id}
      kind="mapping"
      icon={<Network size={13} />}
      eyebrow="Mapping"
      title={data.name || "mapping"}
      selected={selected}
      width={250}
    >
      <TextField
        label="Name"
        value={data.name}
        onChange={(v) => updateNodeData(id, { name: v })}
        mono
      />
      <div className="flex gap-1.5">
        <div className="flex-1">
          <TextField
            label="Key type"
            value={data.keyType}
            onChange={(v) => updateNodeData(id, { keyType: v })}
            list="sol-types-map-key"
            mono
          />
        </div>
        <div className="flex-1">
          <TextField
            label="Value type"
            value={data.valueType}
            onChange={(v) => updateNodeData(id, { valueType: v })}
            list="sol-types-map-val"
            mono
          />
        </div>
      </div>
      <datalist id="sol-types-map-key">
        {SOLIDITY_TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <datalist id="sol-types-map-val">
        {SOLIDITY_TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
      <SelectField
        label="Visibility"
        value={data.visibility}
        onChange={(v) => updateNodeData(id, { visibility: v as MappingNodeData["visibility"] })}
        options={[
          { value: "public", label: "public" },
          { value: "private", label: "private" },
          { value: "internal", label: "internal" },
        ]}
      />
    </NodeShell>
  );
}
