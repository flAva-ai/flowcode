"use client";

import { FileCode2 } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { TextField } from "./fields";
import { useFlowStore } from "@/lib/flow-store";
import type { ContractNodeData } from "@/types/flow";
import type { NodeProps } from "reactflow";

export function ContractNode({ id, data, selected }: NodeProps<ContractNodeData>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData<ContractNodeData>);

  return (
    <NodeShell
      id={id}
      kind="contract"
      icon={<FileCode2 size={13} />}
      eyebrow="Contract"
      title={data.name || "Contract"}
      hasInput={false}
      selected={selected}
      width={260}
    >
      <TextField
        label="Name"
        value={data.name}
        onChange={(v) => updateNodeData(id, { name: v })}
        mono
      />
      <TextField
        label="Inherits from (comma-separated)"
        value={data.inherits}
        onChange={(v) => updateNodeData(id, { inherits: v })}
        placeholder="ERC20, Ownable"
        mono
      />
      <TextField
        label="Base constructor calls (optional)"
        value={data.baseConstructorCalls}
        onChange={(v) => updateNodeData(id, { baseConstructorCalls: v })}
        placeholder='ERC20("MyToken", "MTK") Ownable(msg.sender)'
        mono
      />
      <div className="flex gap-1.5">
        <div className="flex-1">
          <TextField
            label="Pragma"
            value={data.pragma}
            onChange={(v) => updateNodeData(id, { pragma: v })}
            mono
          />
        </div>
        <div className="flex-1">
          <TextField
            label="License"
            value={data.license}
            onChange={(v) => updateNodeData(id, { license: v })}
            mono
          />
        </div>
      </div>
      <div className="mt-1 text-[10px] text-[var(--text-tertiary)]">
        Connect Variable, Struct, Mapping, Function, Modifier, or Event nodes
        to this to make them members of the contract.
      </div>
    </NodeShell>
  );
}
