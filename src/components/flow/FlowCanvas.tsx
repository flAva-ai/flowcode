"use client";

import { useCallback, useMemo, useRef } from "react";
import { AlertTriangle, Info } from "lucide-react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type ReactFlowInstance,
} from "reactflow";
import { useFlowStore } from "@/lib/flow-store";
import { getCanvasDiagnostics, isValidCanvasConnection } from "@/lib/graph-validation";
import type { FlowNodeType } from "@/types/flow";
import { ContractNode } from "@/components/nodes/ContractNode";
import { VariableNode } from "@/components/nodes/VariableNode";
import { StructNode } from "@/components/nodes/StructNode";
import { MappingNode } from "@/components/nodes/MappingNode";
import { FunctionNode } from "@/components/nodes/FunctionNode";
import { ModifierNode } from "@/components/nodes/ModifierNode";
import { EventNode } from "@/components/nodes/EventNode";
import { NoteNode } from "@/components/nodes/NoteNode";

const nodeTypes = {
  contract: ContractNode,
  variable: VariableNode,
  struct: StructNode,
  mapping: MappingNode,
  function: FunctionNode,
  modifier: ModifierNode,
  event: EventNode,
  note: NoteNode,
};

export function FlowCanvas() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReactFlowInstance | null>(null);

  const defaultEdgeOptions = useMemo(() => ({ style: { strokeWidth: 2 } }), []);
  const diagnostics = useMemo(() => getCanvasDiagnostics(nodes, edges), [nodes, edges]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(
        "application/flow-node-type"
      ) as FlowNodeType;
      if (!type || !wrapperRef.current || !instanceRef.current) return;

      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = instanceRef.current.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      addNode(type, position);
    },
    [addNode]
  );

  return (
    <div ref={wrapperRef} className="flex-1 h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={(connection) => isValidCanvasConnection(connection, nodes)}
        deleteKeyCode={["Backspace", "Delete"]}
        onInit={(instance) => (instanceRef.current = instance)}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--border-hairline)"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={() => "var(--border-strong)"}
          maskColor="rgba(10,11,13,0.7)"
          pannable
          zoomable
        />
      </ReactFlow>
      {diagnostics.length > 0 && (
        <aside className="absolute left-3 bottom-3 z-10 max-w-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]/95 shadow-lg backdrop-blur px-3 py-2.5 space-y-1.5">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">Canvas checks</div>
          {diagnostics.slice(0, 3).map((diagnostic, index) => (
            <div key={`${diagnostic.message}-${index}`} className={`flex gap-1.5 text-[11px] leading-snug ${diagnostic.severity === "error" ? "text-[var(--accent-critical)]" : "text-[var(--text-secondary)]"}`}>
              {diagnostic.severity === "error" ? <AlertTriangle size={12} className="shrink-0 mt-0.5" /> : <Info size={12} className="shrink-0 mt-0.5 text-[var(--accent-warn)]" />}
              <span>{diagnostic.message}</span>
            </div>
          ))}
        </aside>
      )}
    </div>
  );
}
