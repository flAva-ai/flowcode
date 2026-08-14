"use client";

import { Bell } from "lucide-react";
import { NodeShell } from "./NodeShell";
import { TextField } from "./fields";
import { RowListEditor } from "./RowListEditor";
import { useFlowStore } from "@/lib/flow-store";
import type { EventNodeData, EventParamRow } from "@/types/flow";
import type { NodeProps } from "reactflow";

let counter = 0;
function rowId() {
  counter += 1;
  return `event-param-${Date.now()}-${counter}`;
}

export function EventNode({ id, data, selected }: NodeProps<EventNodeData>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData<EventNodeData>);

  return (
    <NodeShell
      id={id}
      kind="event"
      icon={<Bell size={13} />}
      eyebrow="Event"
      title={data.name || "Event"}
      selected={selected}
      width={270}
    >
      <TextField
        label="Name"
        value={data.name}
        onChange={(v) => updateNodeData(id, { name: v })}
        mono
      />
      <RowListEditor<EventParamRow>
        label="Parameters"
        rows={data.params}
        onChange={(params) => updateNodeData(id, { params })}
        newRow={() => ({ id: rowId(), name: "", type: "address", indexed: false })}
        datalistId={`event-param-types-${id}`}
        renderExtra={(row, update) => (
          <label className="nodrag flex items-center gap-0.5 shrink-0 text-[9.5px] text-[var(--text-tertiary)]">
            <input
              type="checkbox"
              checked={row.indexed}
              onChange={(e) => update({ indexed: e.target.checked })}
            />
            idx
          </label>
        )}
      />
    </NodeShell>
  );
}
