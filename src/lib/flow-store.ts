import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "reactflow";
import type {
  CanvasOp,
  ContractNodeData,
  EventNodeData,
  FlowEdge,
  FlowNode,
  FlowNodeData,
  FlowNodeType,
  FunctionNodeData,
  MappingNodeData,
  ModifierNodeData,
  NoteNodeData,
  StructNodeData,
  VariableNodeData,
} from "@/types/flow";
import { TEMPLATES } from "@/lib/templates";
import { isValidCanvasConnection } from "@/lib/graph-validation";

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}
function rowId() {
  idCounter += 1;
  return `row-${idCounter}`;
}

export function defaultDataFor(type: FlowNodeType): FlowNodeData {
  switch (type) {
    case "contract":
      return {
        label: "Contract",
        name: "MyContract",
        license: "MIT",
        pragma: "^0.8.24",
        inherits: "",
        baseConstructorCalls: "",
      } satisfies ContractNodeData;
    case "variable":
      return {
        label: "Variable",
        name: "myVariable",
        varType: "uint256",
        visibility: "public",
        mutability: "mutable",
        initialValue: "",
      } satisfies VariableNodeData;
    case "struct":
      return {
        label: "Struct",
        name: "MyStruct",
        fields: [{ id: rowId(), name: "value", type: "uint256" }],
      } satisfies StructNodeData;
    case "mapping":
      return {
        label: "Mapping",
        name: "balances",
        keyType: "address",
        valueType: "uint256",
        visibility: "public",
      } satisfies MappingNodeData;
    case "function":
      return {
        label: "Function",
        name: "myFunction",
        isConstructor: false,
        visibility: "public",
        stateMutability: "nonpayable",
        params: [],
        returns: [],
        body: "",
        extraModifiers: "",
      } satisfies FunctionNodeData;
    case "modifier":
      return {
        label: "Modifier",
        name: "onlyValid",
        params: [],
        body: "require(true, \"condition\");\n_;",
      } satisfies ModifierNodeData;
    case "event":
      return {
        label: "Event",
        name: "MyEvent",
        params: [],
      } satisfies EventNodeData;
    case "note":
    default:
      return { label: "Note", text: "Add notes about this flow…" } satisfies NoteNodeData;
  }
}

interface FlowState {
  flowName: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (type: FlowNodeType, position: { x: number; y: number }) => string;
  addNodeAuto: (type: FlowNodeType) => string;
  updateNodeData: <T>(id: string, data: Partial<T>) => void;
  removeNode: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setFlowName: (name: string) => void;

  loadTemplate: (templateKey: string) => void;
  applyAssistantOps: (ops: CanvasOp[]) => void;
}

function nextPosition(
  nodes: FlowNode[],
  parentId: string | undefined,
  indexInBatch: number
) {
  if (parentId) {
    const parent = nodes.find((n) => n.id === parentId);
    if (parent) {
      const siblingCount = nodes.filter(
        (n) => n.position.x > parent.position.x + 200 &&
          Math.abs(n.position.y - parent.position.y) < 2000
      ).length;
      return {
        x: parent.position.x + 340,
        y: parent.position.y + (siblingCount + indexInBatch) * 140,
      };
    }
  }
  const count = nodes.length + indexInBatch;
  return { x: 80 + (count % 4) * 300, y: 80 + Math.floor(count / 4) * 180 };
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flowName: "Untitled flow",
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) as FlowNode[] });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection) => {
    if (!isValidCanvasConnection(connection, get().nodes)) return;
    set({
      edges: addEdge(
        { ...connection, style: { strokeWidth: 2 } },
        get().edges
      ),
    });
  },

  addNode: (type, position) => {
    const id = nextId(type);
    const node: FlowNode = { id, type, position, data: defaultDataFor(type) };
    set({ nodes: [...get().nodes, node] });
    return id;
  },

  addNodeAuto: (type) => {
    const nodes = get().nodes;
    const position = nextPosition(nodes, undefined, 0);
    const id = nextId(type);
    const node: FlowNode = { id, type, position, data: defaultDataFor(type) };
    set({ nodes: [...nodes, node] });
    return id;
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    });
  },

  removeNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    });
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setFlowName: (flowName) => set({ flowName }),

  loadTemplate: (templateKey) => {
    const template = TEMPLATES.find((t) => t.key === templateKey);
    if (!template) return;
    const { nodes, edges } = template.build();
    set({ nodes, edges });
  },

  /** Applies a batch of ops proposed by the AI Assistant panel to the canvas. */
  applyAssistantOps: (ops) => {
    const idMap = new Map<string, string>();
    let nodes = [...get().nodes];
    let edges = [...get().edges];
    let batchIndex = 0;

    const resolve = (ref: string) => idMap.get(ref) ?? ref;

    for (const rawOp of ops) {
      switch (rawOp.op) {
        case "add_node": {
          const realId = nextId(rawOp.nodeType);
          idMap.set(rawOp.tempId, realId);
          const parentReal = rawOp.parentId ? resolve(rawOp.parentId) : undefined;
          const position = nextPosition(nodes, parentReal, batchIndex);
          batchIndex += 1;

          const node: FlowNode = {
            id: realId,
            type: rawOp.nodeType,
            position,
            data: {
              ...defaultDataFor(rawOp.nodeType),
              ...rawOp.data,
            } as FlowNodeData,
          };
          nodes = [...nodes, node];

          if (parentReal && nodes.some((n) => n.id === parentReal)) {
            edges = [
              ...edges,
              {
                id: nextId("edge"),
                source: parentReal,
                target: realId,
                style: { strokeWidth: 2 },
              },
            ];
          }
          break;
        }
        case "add_edge": {
          const source = resolve(rawOp.source);
          const target = resolve(rawOp.target);
          if (
            nodes.some((n) => n.id === source) &&
            nodes.some((n) => n.id === target)
          ) {
            edges = [
              ...edges,
              { id: nextId("edge"), source, target, style: { strokeWidth: 2 } },
            ];
          }
          break;
        }
        case "update_node": {
          const id = resolve(rawOp.id);
          nodes = nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...rawOp.data } } : n
          );
          break;
        }
        case "remove_node": {
          const id = resolve(rawOp.id);
          nodes = nodes.filter((n) => n.id !== id);
          edges = edges.filter((e) => e.source !== id && e.target !== id);
          break;
        }
      }
    }

    set({ nodes, edges });
  },
}));
