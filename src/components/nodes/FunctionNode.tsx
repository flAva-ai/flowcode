"use client";

import { Zap } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { TextField, SelectField, CodeArea } from "./fields";
import { RowListEditor } from "./RowListEditor";
import { useFlowStore } from "@/lib/flow-store";
import type { FunctionNodeData } from "@/types/flow";
import type { NodeProps } from "reactflow";

let counter = 0;
function rowId() {
  counter += 1;
  return `param-${Date.now()}-${counter}`;
}

export function FunctionNode({ id, data, selected }: NodeProps<FunctionNodeData>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData<FunctionNodeData>);

  return (
    <NodeShell
      id={id}
      kind="function"
      icon={<Zap size={13} />}
      eyebrow={data.isConstructor ? "Constructor" : "Function"}
      title={data.isConstructor ? "constructor" : data.name || "function"}
      selected={selected}
      width={290}
    >
      <label className="flex items-center gap-1.5 mb-1.5 nodrag">
        <input
          type="checkbox"
          checked={data.isConstructor}
          onChange={(e) => updateNodeData(id, { isConstructor: e.target.checked })}
        />
        <span className="text-[10.5px] text-[var(--text-secondary)]">
          Is constructor
        </span>
      </label>

      {!data.isConstructor && (
        <TextField
          label="Name"
          value={data.name}
          onChange={(v) => updateNodeData(id, { name: v })}
          mono
        />
      )}

      <div className="flex gap-1.5">
        <div className="flex-1">
          <SelectField
            label="Visibility"
            value={data.visibility}
            onChange={(v) => updateNodeData(id, { visibility: v as FunctionNodeData["visibility"] })}
            options={[
              { value: "public", label: "public" },
              { value: "external", label: "external" },
              { value: "internal", label: "internal" },
              { value: "private", label: "private" },
            ]}
          />
        </div>
        <div className="flex-1">
          <SelectField
            label="Mutability"
            value={data.stateMutability}
            onChange={(v) =>
              updateNodeData(id, { stateMutability: v as FunctionNodeData["stateMutability"] })
            }
            options={[
              { value: "nonpayable", label: "nonpayable" },
              { value: "view", label: "view" },
              { value: "pure", label: "pure" },
              { value: "payable", label: "payable" },
            ]}
          />
        </div>
      </div>

      <RowListEditor
        label="Parameters"
        rows={data.params}
        onChange={(params) => updateNodeData(id, { params })}
        newRow={() => ({ id: rowId(), name: "", type: "uint256" })}
        datalistId={`fn-param-types-${id}`}
      />

      {!data.isConstructor && (
        <RowListEditor
          label="Returns"
          rows={data.returns}
          onChange={(returns) => updateNodeData(id, { returns })}
          newRow={() => ({ id: rowId(), name: "", type: "uint256" })}
          datalistId={`fn-return-types-${id}`}
        />
      )}

      <TextField
        label="Extra modifiers (e.g. onlyOwner)"
        value={data.extraModifiers}
        onChange={(v) => updateNodeData(id, { extraModifiers: v })}
        placeholder="onlyOwner, nonReentrant"
        mono
      />

      <CodeArea
        label="Body"
        value={data.body}
        onChange={(v) => updateNodeData(id, { body: v })}
        rows={4}
        placeholder="// Solidity statements…"
      />

      <div className="text-[10px] text-[var(--text-tertiary)]">
        Connect a Modifier node into this node&apos;s input to apply a
        custom modifier. Use &quot;Extra modifiers&quot; above for
        inherited/built-in ones.
      </div>
    </NodeShell>
  );
}
