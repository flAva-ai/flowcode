import type {
  CompileResult,
  ContractNodeData,
  EventNodeData,
  FlowEdge,
  FlowNode,
  FunctionNodeData,
  MappingNodeData,
  ModifierNodeData,
  StructNodeData,
  VariableNodeData,
} from "@/types/flow";
import { getCanvasDiagnostics } from "@/lib/graph-validation";

const KNOWN_IMPORTS: Record<string, string> = {
  ERC20: "@openzeppelin/contracts/token/ERC20/ERC20.sol",
  ERC721: "@openzeppelin/contracts/token/ERC721/ERC721.sol",
  ERC1155: "@openzeppelin/contracts/token/ERC1155/ERC1155.sol",
  Ownable: "@openzeppelin/contracts/access/Ownable.sol",
  AccessControl: "@openzeppelin/contracts/access/AccessControl.sol",
  ReentrancyGuard: "@openzeppelin/contracts/utils/ReentrancyGuard.sol",
  Pausable: "@openzeppelin/contracts/utils/Pausable.sol",
};

function childrenOf(parentId: string, nodes: FlowNode[], edges: FlowEdge[]) {
  const childIds = new Set(
    edges.filter((e) => e.source === parentId).map((e) => e.target)
  );
  return nodes.filter((n) => childIds.has(n.id));
}

function modifiersAppliedTo(
  functionId: string,
  nodes: FlowNode[],
  edges: FlowEdge[]
) {
  const sourceIds = edges
    .filter((e) => e.target === functionId)
    .map((e) => e.source);
  return nodes.filter(
    (n) => sourceIds.includes(n.id) && n.type === "modifier"
  );
}

function needsMemoryLocation(type: string) {
  const t = type.trim();
  return t === "string" || t === "bytes" || t.endsWith("[]");
}

function paramsToSig(params: { name: string; type: string }[]) {
  return params
    .filter((p) => p.type?.trim())
    .map((p) => {
      const type = p.type.trim();
      const location = needsMemoryLocation(type) ? " memory" : "";
      return `${type}${location}${p.name ? ` ${p.name}` : ""}`;
    })
    .join(", ");
}

function indent(text: string, spaces = 8) {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.trim() ? pad + line : ""))
    .join("\n");
}

export function compileToSolidity(
  nodes: FlowNode[],
  edges: FlowEdge[]
): CompileResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const diagnostic of getCanvasDiagnostics(nodes, edges)) {
    (diagnostic.severity === "error" ? errors : warnings).push(diagnostic.message);
  }

  const contractNodes = nodes.filter((n) => n.type === "contract");

  if (contractNodes.length === 0) {
    return {
      code: "// Add a Contract node to the canvas to start generating Solidity.",
      contractName: "",
      errors: Array.from(new Set([...errors, "No Contract node found on the canvas."])),
      warnings,
    };
  }

  if (contractNodes.length > 1) {
    warnings.push(
      `Found ${contractNodes.length} Contract nodes — compiling the first one only.`
    );
  }

  const contractNode = contractNodes[0];
  const contractData = contractNode.data as ContractNodeData;
  const contractName = contractData.name?.trim() || "MyContract";

  const members = childrenOf(contractNode.id, nodes, edges);
  const structs = members.filter((n) => n.type === "struct");
  const mappings = members.filter((n) => n.type === "mapping");
  const variables = members.filter((n) => n.type === "variable");
  const events = members.filter((n) => n.type === "event");
  const modifiers = members.filter((n) => n.type === "modifier");
  const functions = members.filter((n) => n.type === "function");

  if (functions.length === 0) {
    warnings.push("No Function nodes are connected to the Contract node.");
  }

  // ---- imports ----
  const inheritList = (contractData.inherits || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const importLines: string[] = [];
  for (const parent of inheritList) {
    const path = KNOWN_IMPORTS[parent];
    if (path) importLines.push(`import "${path}";`);
    else warnings.push(`Unknown parent contract "${parent}" — no import added automatically.`);
  }

  // ---- structs ----
  const structLines = structs.map((s) => {
    const data = s.data as StructNodeData;
    const fields = data.fields
      .filter((f) => f.name && f.type)
      .map((f) => `        ${f.type} ${f.name};`)
      .join("\n");
    return `    struct ${data.name || "Unnamed"} {\n${fields || "        // no fields"}\n    }`;
  });

  // ---- events ----
  const eventLines = events.map((e) => {
    const data = e.data as EventNodeData;
    const sig = data.params
      .filter((p) => p.type?.trim())
      .map((p) => `${p.type}${p.indexed ? " indexed" : ""}${p.name ? ` ${p.name}` : ""}`)
      .join(", ");
    return `    event ${data.name || "Unnamed"}(${sig});`;
  });

  // ---- state variables (mappings + plain variables) ----
  const mappingLines = mappings.map((m) => {
    const data = m.data as MappingNodeData;
    return `    mapping(${data.keyType || "address"} => ${
      data.valueType || "uint256"
    }) ${data.visibility} ${data.name || "unnamedMapping"};`;
  });

  const variableLines = variables.map((v) => {
    const data = v.data as VariableNodeData;
    const modifierKeyword =
      data.mutability === "constant"
        ? " constant"
        : data.mutability === "immutable"
        ? " immutable"
        : "";
    const assignment = data.initialValue?.trim()
      ? ` = ${data.initialValue.trim()}`
      : "";
    return `    ${data.varType || "uint256"} ${data.visibility}${modifierKeyword} ${
      data.name || "unnamedVar"
    }${assignment};`;
  });

  // ---- modifiers ----
  const modifierLines = modifiers.map((m) => {
    const data = m.data as ModifierNodeData;
    const sig = paramsToSig(data.params);
    const body = data.body?.trim() || "_;";
    return `    modifier ${data.name || "unnamedModifier"}(${sig}) {\n${indent(
      body,
      8
    )}\n    }`;
  });

  // ---- functions ----
  const functionLines = functions.map((f) => {
    const data = f.data as FunctionNodeData;
    const applied = modifiersAppliedTo(f.id, nodes, edges);
    const connectedModifierNames = applied
      .map((m) => (m.data as ModifierNodeData).name)
      .filter(Boolean);
    const extraModifierNames = (data.extraModifiers || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const modifierNames = [...extraModifierNames, ...connectedModifierNames];

    const paramSig = paramsToSig(data.params);
    const returnSig = paramsToSig(data.returns);
    const body = data.body?.trim() || "// TODO: implement";

    if (data.isConstructor) {
      const baseCalls = (contractData.baseConstructorCalls || "").trim();
      const parts = [
        `constructor(${paramSig})`,
        ...(baseCalls ? [baseCalls] : []),
        ...(data.stateMutability === "payable" ? ["payable"] : []),
        ...modifierNames,
      ];
      return `    ${parts.join(" ")} {\n${indent(body, 8)}\n    }`;
    }

    const parts = [
      `function ${data.name || "unnamedFunction"}(${paramSig})`,
      data.visibility,
      ...(data.stateMutability !== "nonpayable" ? [data.stateMutability] : []),
      ...modifierNames,
      ...(returnSig ? [`returns (${returnSig})`] : []),
    ];

    return `    ${parts.join(" ")} {\n${indent(body, 8)}\n    }`;
  });

  if (
    (contractData.baseConstructorCalls || "").trim() &&
    !functions.some((f) => (f.data as FunctionNodeData).isConstructor)
  ) {
    warnings.push(
      "Contract has base constructor calls set but no constructor Function node — add one and mark it as constructor."
    );
  }

  const bodyBlocks = [
    structLines.join("\n\n"),
    eventLines.join("\n"),
    [...mappingLines, ...variableLines].join("\n"),
    modifierLines.join("\n\n"),
    functionLines.join("\n\n"),
  ].filter((block) => block.trim().length > 0);

  const inheritsClause = inheritList.length
    ? ` is ${inheritList.join(", ")}`
    : "";

  const code = `// SPDX-License-Identifier: ${contractData.license || "MIT"}
pragma solidity ${contractData.pragma || "^0.8.24"};

${importLines.join("\n")}${importLines.length ? "\n\n" : ""}contract ${contractName}${inheritsClause} {

${bodyBlocks.join("\n\n")}
}
`;

  return { code, contractName, errors, warnings };
}
