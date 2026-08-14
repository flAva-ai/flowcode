import type { Connection } from "reactflow";
import type { FlowEdge, FlowNode, FlowNodeType } from "@/types/flow";

const CONTRACT_MEMBERS = new Set<FlowNodeType>([
  "variable",
  "struct",
  "mapping",
  "function",
  "modifier",
  "event",
]);

export interface CanvasDiagnostic {
  severity: "error" | "warning";
  message: string;
}

/** The two meaningful relationships in the current one-contract model. */
export function isValidCanvasConnection(
  connection: Pick<Connection, "source" | "target">,
  nodes: FlowNode[]
) {
  const source = nodes.find((node) => node.id === connection.source);
  const target = nodes.find((node) => node.id === connection.target);
  if (!source || !target || !source.type || !target.type || source.id === target.id) return false;

  return (
    (source.type === "contract" && CONTRACT_MEMBERS.has(target.type)) ||
    (source.type === "modifier" && target.type === "function")
  );
}

export function getCanvasDiagnostics(
  nodes: FlowNode[],
  edges: FlowEdge[]
): CanvasDiagnostic[] {
  const diagnostics: CanvasDiagnostic[] = [];
  const contracts = nodes.filter((node) => node.type === "contract");

  if (!contracts.length) {
    diagnostics.push({ severity: "error", message: "Add a Contract node to start building." });
  }
  if (contracts.length > 1) {
    diagnostics.push({ severity: "warning", message: "This version compiles one contract at a time. Remove or export the extra Contract node." });
  }

  const stateDeclarations = nodes.filter(
    (node) => node.type === "variable" || node.type === "mapping"
  );
  const names = new Map<string, FlowNode[]>();
  for (const node of stateDeclarations) {
    const name = (node.data as { name?: string }).name?.trim();
    if (!name) continue;
    names.set(name, [...(names.get(name) ?? []), node]);
  }
  for (const [name, matchingNodes] of names) {
    if (matchingNodes.length > 1) {
      diagnostics.push({ severity: "error", message: `Duplicate state declaration: \"${name}\".` });
    }
  }

  for (const edge of edges) {
    if (!isValidCanvasConnection(edge, nodes)) {
      diagnostics.push({ severity: "error", message: "Invalid connection found. Use Contract → member or Modifier → Function." });
      break;
    }
  }

  const connectedToContract = new Set(
    edges.filter((edge) => nodes.some((n) => n.id === edge.source && n.type === "contract")).map((edge) => edge.target)
  );
  const detached = nodes.filter(
    (node) => node.type !== "contract" && node.type !== "note" && !connectedToContract.has(node.id)
  );
  if (detached.length) {
    diagnostics.push({ severity: "warning", message: `${detached.length} node${detached.length === 1 ? " is" : "s are"} not connected to a Contract and will not be compiled.` });
  }

  return diagnostics;
}
