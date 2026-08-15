import type {
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

let counter = 0;
function id(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
function row(name: string, type: string) {
  return { id: id("row"), name, type };
}
function eventRow(name: string, type: string, indexed = false) {
  return { id: id("row"), name, type, indexed };
}

export interface Template {
  key: string;
  title: string;
  description: string;
  build: () => { nodes: FlowNode[]; edges: FlowEdge[] };
}

/* ------------------------------------------------------------------ */
/* 1. Staking Token                                                    */
/* ------------------------------------------------------------------ */

function buildStakingToken() {
  const contractId = id("contract");
  const varId = id("variable");
  const mappingId = id("mapping");
  const eventId = id("event");
  const modifierId = id("modifier");
  const fnId = id("function");
  const ctorId = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId,
      type: "contract",
      position: { x: 40, y: 220 },
      data: {
        label: "Contract",
        name: "StakingToken",
        license: "MIT",
        pragma: "^0.8.24",
        inherits: "ERC20, Ownable",
        baseConstructorCalls: 'ERC20("StakingToken", "STK") Ownable(msg.sender)',
      } satisfies ContractNodeData,
    },
    {
      id: varId,
      type: "variable",
      position: { x: 420, y: 40 },
      data: {
        label: "Variable",
        name: "lockPeriod",
        varType: "uint256",
        visibility: "public",
        mutability: "constant",
        initialValue: "30 days",
      } satisfies VariableNodeData,
    },
    {
      id: mappingId,
      type: "mapping",
      position: { x: 420, y: 180 },
      data: {
        label: "Mapping",
        name: "unlockTime",
        keyType: "address",
        valueType: "uint256",
        visibility: "public",
      } satisfies MappingNodeData,
    },
    {
      id: eventId,
      type: "event",
      position: { x: 420, y: 320 },
      data: {
        label: "Event",
        name: "Staked",
        params: [eventRow("user", "address", true), eventRow("amount", "uint256")],
      } satisfies EventNodeData,
    },
    {
      id: modifierId,
      type: "modifier",
      position: { x: 420, y: 460 },
      data: {
        label: "Modifier",
        name: "unlocked",
        params: [],
        body: 'require(block.timestamp >= unlockTime[msg.sender], "Still locked");\n_;',
      } satisfies ModifierNodeData,
    },
    {
      id: fnId,
      type: "function",
      position: { x: 800, y: 200 },
      data: {
        label: "Function",
        name: "stake",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [row("amount", "uint256")],
        returns: [],
        body: "_transfer(msg.sender, address(this), amount);\nunlockTime[msg.sender] = block.timestamp + lockPeriod;\nemit Staked(msg.sender, amount);",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
    {
      id: ctorId,
      type: "function",
      position: { x: 800, y: 40 },
      data: {
        label: "Function",
        name: "constructor",
        isConstructor: true,
        visibility: "public",
        stateMutability: "nonpayable",
        params: [row("initialSupply", "uint256")],
        returns: [],
        body: "_mint(msg.sender, initialSupply);",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
  ];

  const edges: FlowEdge[] = [
    { id: id("edge"), source: contractId, target: varId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: mappingId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: eventId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: modifierId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: fnId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: ctorId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: modifierId, target: fnId, style: { strokeWidth: 2, strokeDasharray: "4 3" } },
  ];

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 2. Mintable ERC20 Token                                             */
/* ------------------------------------------------------------------ */

function buildErc20Token() {
  const contractId = id("contract");
  const ctorId = id("function");
  const mintId = id("function");
  const burnId = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId,
      type: "contract",
      position: { x: 40, y: 160 },
      data: {
        label: "Contract",
        name: "MyToken",
        license: "MIT",
        pragma: "^0.8.24",
        inherits: "ERC20, Ownable",
        baseConstructorCalls: 'ERC20("MyToken", "MTK") Ownable(msg.sender)',
      } satisfies ContractNodeData,
    },
    {
      id: ctorId,
      type: "function",
      position: { x: 420, y: 20 },
      data: {
        label: "Function",
        name: "constructor",
        isConstructor: true,
        visibility: "public",
        stateMutability: "nonpayable",
        params: [row("initialSupply", "uint256")],
        returns: [],
        body: "_mint(msg.sender, initialSupply);",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
    {
      id: mintId,
      type: "function",
      position: { x: 420, y: 180 },
      data: {
        label: "Function",
        name: "mint",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [row("to", "address"), row("amount", "uint256")],
        returns: [],
        body: "_mint(to, amount);",
        extraModifiers: "onlyOwner",
      } satisfies FunctionNodeData,
    },
    {
      id: burnId,
      type: "function",
      position: { x: 420, y: 340 },
      data: {
        label: "Function",
        name: "burn",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [row("amount", "uint256")],
        returns: [],
        body: "_burn(msg.sender, amount);",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
  ];

  const edges: FlowEdge[] = [
    { id: id("edge"), source: contractId, target: ctorId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: mintId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: burnId, style: { strokeWidth: 2 } },
  ];

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 3. NFT Collection (ERC721)                                          */
/* ------------------------------------------------------------------ */

function buildNftCollection() {
  const contractId = id("contract");
  const varId = id("variable");
  const ctorId = id("function");
  const mintId = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId,
      type: "contract",
      position: { x: 40, y: 160 },
      data: {
        label: "Contract",
        name: "MyNFT",
        license: "MIT",
        pragma: "^0.8.24",
        inherits: "ERC721, Ownable",
        baseConstructorCalls: 'ERC721("MyNFT", "MNFT") Ownable(msg.sender)',
      } satisfies ContractNodeData,
    },
    {
      id: varId,
      type: "variable",
      position: { x: 420, y: 20 },
      data: {
        label: "Variable",
        name: "nextTokenId",
        varType: "uint256",
        visibility: "public",
        mutability: "mutable",
        initialValue: "0",
      } satisfies VariableNodeData,
    },
    {
      id: ctorId,
      type: "function",
      position: { x: 420, y: 160 },
      data: {
        label: "Function",
        name: "constructor",
        isConstructor: true,
        visibility: "public",
        stateMutability: "nonpayable",
        params: [],
        returns: [],
        body: "// nextTokenId starts at 0",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
    {
      id: mintId,
      type: "function",
      position: { x: 420, y: 300 },
      data: {
        label: "Function",
        name: "mint",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [row("to", "address")],
        returns: [],
        body: "_safeMint(to, nextTokenId);\nnextTokenId++;",
        extraModifiers: "onlyOwner",
      } satisfies FunctionNodeData,
    },
  ];

  const edges: FlowEdge[] = [
    { id: id("edge"), source: contractId, target: varId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: ctorId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: mintId, style: { strokeWidth: 2 } },
  ];

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 4. Simple Voting                                                    */
/* ------------------------------------------------------------------ */

function buildSimpleVoting() {
  const contractId = id("contract");
  const structId = id("struct");
  const proposalsVarId = id("variable");
  const hasVotedId = id("mapping");
  const eventId = id("event");
  const ctorId = id("function");
  const addProposalId = id("function");
  const voteId = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId,
      type: "contract",
      position: { x: 40, y: 220 },
      data: {
        label: "Contract",
        name: "SimpleVoting",
        license: "MIT",
        pragma: "^0.8.24",
        inherits: "Ownable",
        baseConstructorCalls: "Ownable(msg.sender)",
      } satisfies ContractNodeData,
    },
    {
      id: structId,
      type: "struct",
      position: { x: 420, y: 20 },
      data: {
        label: "Struct",
        name: "Proposal",
        fields: [
          { id: id("row"), name: "description", type: "string" },
          { id: id("row"), name: "voteCount", type: "uint256" },
        ],
      } satisfies StructNodeData,
    },
    {
      id: proposalsVarId,
      type: "variable",
      position: { x: 420, y: 160 },
      data: {
        label: "Variable",
        name: "proposals",
        varType: "Proposal[]",
        visibility: "public",
        mutability: "mutable",
        initialValue: "",
      } satisfies VariableNodeData,
    },
    {
      id: hasVotedId,
      type: "mapping",
      position: { x: 420, y: 280 },
      data: {
        label: "Mapping",
        name: "hasVoted",
        keyType: "address",
        valueType: "bool",
        visibility: "public",
      } satisfies MappingNodeData,
    },
    {
      id: eventId,
      type: "event",
      position: { x: 420, y: 400 },
      data: {
        label: "Event",
        name: "Voted",
        params: [eventRow("voter", "address", true), eventRow("proposalId", "uint256")],
      } satisfies EventNodeData,
    },
    {
      id: ctorId,
      type: "function",
      position: { x: 800, y: 20 },
      data: {
        label: "Function",
        name: "constructor",
        isConstructor: true,
        visibility: "public",
        stateMutability: "nonpayable",
        params: [],
        returns: [],
        body: "// nothing else to initialize",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
    {
      id: addProposalId,
      type: "function",
      position: { x: 800, y: 160 },
      data: {
        label: "Function",
        name: "addProposal",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [row("description", "string")],
        returns: [],
        body: "proposals.push(Proposal({ description: description, voteCount: 0 }));",
        extraModifiers: "onlyOwner",
      } satisfies FunctionNodeData,
    },
    {
      id: voteId,
      type: "function",
      position: { x: 800, y: 320 },
      data: {
        label: "Function",
        name: "vote",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [row("proposalId", "uint256")],
        returns: [],
        body: 'require(!hasVoted[msg.sender], "Already voted");\nhasVoted[msg.sender] = true;\nproposals[proposalId].voteCount++;\nemit Voted(msg.sender, proposalId);',
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
  ];

  const edges: FlowEdge[] = [
    { id: id("edge"), source: contractId, target: structId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: proposalsVarId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: hasVotedId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: eventId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: ctorId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: addProposalId, style: { strokeWidth: 2 } },
    { id: id("edge"), source: contractId, target: voteId, style: { strokeWidth: 2 } },
  ];

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 5. Escrow                                                           */
/* ------------------------------------------------------------------ */

function buildEscrow() {
  const contractId = id("contract");
  const buyerId = id("variable");
  const sellerId = id("variable");
  const arbiterId = id("variable");
  const amountId = id("variable");
  const releasedId = id("variable");
  const eventId = id("event");
  const ctorId = id("function");
  const releaseId = id("function");
  const refundId = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId,
      type: "contract",
      position: { x: 40, y: 260 },
      data: {
        label: "Contract",
        name: "SimpleEscrow",
        license: "MIT",
        pragma: "^0.8.24",
        inherits: "",
        baseConstructorCalls: "",
      } satisfies ContractNodeData,
    },
    {
      id: buyerId,
      type: "variable",
      position: { x: 420, y: 0 },
      data: { label: "Variable", name: "buyer", varType: "address", visibility: "public", mutability: "mutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: sellerId,
      type: "variable",
      position: { x: 420, y: 100 },
      data: { label: "Variable", name: "seller", varType: "address", visibility: "public", mutability: "mutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: arbiterId,
      type: "variable",
      position: { x: 420, y: 200 },
      data: { label: "Variable", name: "arbiter", varType: "address", visibility: "public", mutability: "mutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: amountId,
      type: "variable",
      position: { x: 420, y: 300 },
      data: { label: "Variable", name: "amount", varType: "uint256", visibility: "public", mutability: "mutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: releasedId,
      type: "variable",
      position: { x: 420, y: 400 },
      data: { label: "Variable", name: "released", varType: "bool", visibility: "public", mutability: "mutable", initialValue: "false" } satisfies VariableNodeData,
    },
    {
      id: eventId,
      type: "event",
      position: { x: 420, y: 500 },
      data: {
        label: "Event",
        name: "Released",
        params: [eventRow("to", "address", true), eventRow("amount", "uint256")],
      } satisfies EventNodeData,
    },
    {
      id: ctorId,
      type: "function",
      position: { x: 800, y: 120 },
      data: {
        label: "Function",
        name: "constructor",
        isConstructor: true,
        visibility: "public",
        stateMutability: "payable",
        params: [row("seller_", "address"), row("arbiter_", "address")],
        returns: [],
        body: "buyer = msg.sender;\nseller = seller_;\narbiter = arbiter_;\namount = msg.value;",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
    {
      id: releaseId,
      type: "function",
      position: { x: 800, y: 300 },
      data: {
        label: "Function",
        name: "release",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [],
        returns: [],
        body: 'require(msg.sender == arbiter, "Only arbiter");\nrequire(!released, "Already released");\nreleased = true;\npayable(seller).transfer(amount);\nemit Released(seller, amount);',
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
    {
      id: refundId,
      type: "function",
      position: { x: 800, y: 460 },
      data: {
        label: "Function",
        name: "refundBuyer",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [],
        returns: [],
        body: 'require(msg.sender == arbiter, "Only arbiter");\nrequire(!released, "Already released");\nreleased = true;\npayable(buyer).transfer(amount);\nemit Released(buyer, amount);',
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
  ];

  const edges: FlowEdge[] = [
    buyerId, sellerId, arbiterId, amountId, releasedId, eventId, ctorId, releaseId, refundId,
  ].map((target) => ({
    id: id("edge"),
    source: contractId,
    target,
    style: { strokeWidth: 2 },
  }));

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 6. ETH Vesting Wallet                                               */
/* ------------------------------------------------------------------ */

function buildVestingWallet() {
  const contractId = id("contract");
  const beneficiaryId = id("variable");
  const startId = id("variable");
  const durationId = id("variable");
  const releasedId = id("variable");
  const eventId = id("event");
  const ctorId = id("function");
  const vestedAmountId = id("function");
  const releasableId = id("function");
  const releaseId = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId,
      type: "contract",
      position: { x: 40, y: 260 },
      data: {
        label: "Contract",
        name: "EthVestingWallet",
        license: "MIT",
        pragma: "^0.8.24",
        inherits: "",
        baseConstructorCalls: "",
      } satisfies ContractNodeData,
    },
    {
      id: beneficiaryId,
      type: "variable",
      position: { x: 420, y: 0 },
      data: { label: "Variable", name: "beneficiary", varType: "address", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: startId,
      type: "variable",
      position: { x: 420, y: 100 },
      data: { label: "Variable", name: "start", varType: "uint256", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: durationId,
      type: "variable",
      position: { x: 420, y: 200 },
      data: { label: "Variable", name: "duration", varType: "uint256", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: releasedId,
      type: "variable",
      position: { x: 420, y: 300 },
      data: { label: "Variable", name: "released", varType: "uint256", visibility: "public", mutability: "mutable", initialValue: "0" } satisfies VariableNodeData,
    },
    {
      id: eventId,
      type: "event",
      position: { x: 420, y: 400 },
      data: {
        label: "Event",
        name: "EthReleased",
        params: [eventRow("amount", "uint256")],
      } satisfies EventNodeData,
    },
    {
      id: ctorId,
      type: "function",
      position: { x: 800, y: 20 },
      data: {
        label: "Function",
        name: "constructor",
        isConstructor: true,
        visibility: "public",
        stateMutability: "payable",
        params: [row("beneficiary_", "address"), row("durationSeconds", "uint256")],
        returns: [],
        body: "beneficiary = beneficiary_;\nstart = block.timestamp;\nduration = durationSeconds;",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
    {
      id: vestedAmountId,
      type: "function",
      position: { x: 800, y: 180 },
      data: {
        label: "Function",
        name: "vestedAmount",
        isConstructor: false,
        visibility: "public",
        stateMutability: "view",
        params: [],
        returns: [row("", "uint256")],
        body: "if (block.timestamp < start) return 0;\nif (block.timestamp >= start + duration) return address(this).balance + released;\nreturn ((address(this).balance + released) * (block.timestamp - start)) / duration;",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
    {
      id: releasableId,
      type: "function",
      position: { x: 800, y: 340 },
      data: {
        label: "Function",
        name: "releasable",
        isConstructor: false,
        visibility: "public",
        stateMutability: "view",
        params: [],
        returns: [row("", "uint256")],
        body: "return vestedAmount() - released;",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
    {
      id: releaseId,
      type: "function",
      position: { x: 800, y: 480 },
      data: {
        label: "Function",
        name: "release",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [],
        returns: [],
        body: "uint256 amount = releasable();\nreleased += amount;\npayable(beneficiary).transfer(amount);\nemit EthReleased(amount);",
        extraModifiers: "",
      } satisfies FunctionNodeData,
    },
  ];

  const edges: FlowEdge[] = [
    beneficiaryId, startId, durationId, releasedId, eventId, ctorId, vestedAmountId, releasableId, releaseId,
  ].map((target) => ({
    id: id("edge"),
    source: contractId,
    target,
    style: { strokeWidth: 2 },
  }));

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/*  7. Multisig Wallet                                                 */
/* ------------------------------------------------------------------ */

function buildMultisig() {
  const contractId = id("contract");
  const ownersId   = id("mapping");
  const reqId      = id("variable");
  const txStructId = id("struct");
  const txsId      = id("variable");
  const submitId   = id("function");
  const confirmId  = id("function");
  const executeId  = id("function");
  const confirmMod = id("modifier");

  const nodes: FlowNode[] = [
    {
      id: contractId, type: "contract",
      position: { x: 40, y: 200 },
      data: { label: "Contract", name: "MultisigWallet", license: "MIT", pragma: "^0.8.24", inherits: "", baseConstructorCalls: "" } satisfies ContractNodeData,
    },
    {
      id: ownersId, type: "mapping",
      position: { x: 420, y: 40 },
      data: { label: "Mapping", name: "isOwner", keyType: "address", valueType: "bool", visibility: "public" } satisfies MappingNodeData,
    },
    {
      id: reqId, type: "variable",
      position: { x: 420, y: 180 },
      data: { label: "Variable", name: "required", varType: "uint256", visibility: "public", mutability: "mutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: txStructId, type: "struct",
      position: { x: 420, y: 320 },
      data: { label: "Struct", name: "Transaction", fields: [
        row("to", "address"), row("value", "uint256"), row("data", "bytes"), row("executed", "bool"), row("confirmations", "uint256"),
      ] } satisfies StructNodeData,
    },
    {
      id: txsId, type: "variable",
      position: { x: 420, y: 540 },
      data: { label: "Variable", name: "transactions", varType: "Transaction[]", visibility: "public", mutability: "mutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: confirmMod, type: "modifier",
      position: { x: 800, y: 40 },
      data: { label: "Modifier", name: "onlyOwner", params: [], body: 'require(isOwner[msg.sender], "Not owner");\n_;' } satisfies ModifierNodeData,
    },
    {
      id: submitId, type: "function",
      position: { x: 800, y: 220 },
      data: { label: "Function", name: "submitTransaction", isConstructor: false, visibility: "public", stateMutability: "nonpayable",
        params: [row("to", "address"), row("value", "uint256"), row("data", "bytes")],
        returns: [], extraModifiers: "onlyOwner",
        body: 'transactions.push(Transaction({ to: to, value: value, data: data, executed: false, confirmations: 0 }));\nreturn transactions.length - 1;',
      } satisfies FunctionNodeData,
    },
    {
      id: confirmId, type: "function",
      position: { x: 800, y: 440 },
      data: { label: "Function", name: "confirmTransaction", isConstructor: false, visibility: "public", stateMutability: "nonpayable",
        params: [row("txIndex", "uint256")],
        returns: [], extraModifiers: "onlyOwner",
        body: 'Transaction storage txn = transactions[txIndex];\nrequire(!txn.executed, "Already executed");\ntxn.confirmations += 1;',
      } satisfies FunctionNodeData,
    },
    {
      id: executeId, type: "function",
      position: { x: 800, y: 640 },
      data: { label: "Function", name: "executeTransaction", isConstructor: false, visibility: "public", stateMutability: "nonpayable",
        params: [row("txIndex", "uint256")],
        returns: [], extraModifiers: "onlyOwner",
        body: 'Transaction storage txn = transactions[txIndex];\nrequire(txn.confirmations >= required, "Not enough confirmations");\nrequire(!txn.executed, "Already executed");\ntxn.executed = true;\n(bool success,) = txn.to.call{value: txn.value}(txn.data);\nrequire(success, "Transaction failed");',
      } satisfies FunctionNodeData,
    },
  ];

  const edges: FlowEdge[] = [
    { id: id("e"), source: contractId, target: ownersId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: reqId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: txStructId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: txsId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: confirmMod, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: submitId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: confirmId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: executeId, style: { strokeWidth: 2 } },
  ];
  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/*  8. ERC20 Crowdsale / ICO                                          */
/* ------------------------------------------------------------------ */

function buildCrowdsale() {
  const contractId = id("contract");
  const tokenId    = id("variable");
  const rateId     = id("variable");
  const raisedId   = id("variable");
  const capId      = id("variable");
  const buyEvent   = id("event");
  const buyFn      = id("function");
  const withdrawFn = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId, type: "contract",
      position: { x: 40, y: 200 },
      data: { label: "Contract", name: "Crowdsale", license: "MIT", pragma: "^0.8.24", inherits: "Ownable", baseConstructorCalls: "Ownable(msg.sender)" } satisfies ContractNodeData,
    },
    {
      id: tokenId, type: "variable",
      position: { x: 420, y: 40 },
      data: { label: "Variable", name: "token", varType: "IERC20", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: rateId, type: "variable",
      position: { x: 420, y: 180 },
      data: { label: "Variable", name: "rate", varType: "uint256", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: capId, type: "variable",
      position: { x: 420, y: 320 },
      data: { label: "Variable", name: "hardCap", varType: "uint256", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: raisedId, type: "variable",
      position: { x: 420, y: 460 },
      data: { label: "Variable", name: "weiRaised", varType: "uint256", visibility: "public", mutability: "mutable", initialValue: "0" } satisfies VariableNodeData,
    },
    {
      id: buyEvent, type: "event",
      position: { x: 420, y: 600 },
      data: { label: "Event", name: "TokensPurchased", params: [
        eventRow("buyer", "address", true), eventRow("value", "uint256", false), eventRow("amount", "uint256", false),
      ] } satisfies EventNodeData,
    },
    {
      id: buyFn, type: "function",
      position: { x: 800, y: 40 },
      data: { label: "Function", name: "buyTokens", isConstructor: false, visibility: "external", stateMutability: "payable",
        params: [], returns: [], extraModifiers: "",
        body: 'require(weiRaised + msg.value <= hardCap, "Hard cap reached");\nuint256 tokens = msg.value * rate;\nweiRaised += msg.value;\ntoken.transfer(msg.sender, tokens);\nemit TokensPurchased(msg.sender, msg.value, tokens);',
      } satisfies FunctionNodeData,
    },
    {
      id: withdrawFn, type: "function",
      position: { x: 800, y: 280 },
      data: { label: "Function", name: "withdrawFunds", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [], returns: [], extraModifiers: "onlyOwner",
        body: 'payable(owner()).transfer(address(this).balance);',
      } satisfies FunctionNodeData,
    },
  ];

  const edges: FlowEdge[] = [
    { id: id("e"), source: contractId, target: tokenId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: rateId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: capId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: raisedId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: buyEvent, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: buyFn, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: withdrawFn, style: { strokeWidth: 2 } },
  ];
  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/*  9. ERC1155 Multi-Token                                            */
/* ------------------------------------------------------------------ */

function buildMultiToken() {
  const contractId = id("contract");
  const uriId      = id("variable");
  const mintFn     = id("function");
  const mintBatchFn = id("function");
  const burnFn     = id("function");
  const ctorId     = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId, type: "contract",
      position: { x: 40, y: 200 },
      data: { label: "Contract", name: "MultiToken", license: "MIT", pragma: "^0.8.24", inherits: "ERC1155, Ownable", baseConstructorCalls: 'ERC1155("https://api.example.com/token/{id}.json") Ownable(msg.sender)' } satisfies ContractNodeData,
    },
    {
      id: uriId, type: "variable",
      position: { x: 420, y: 40 },
      data: { label: "Variable", name: "baseURI", varType: "string", visibility: "public", mutability: "mutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: ctorId, type: "function",
      position: { x: 800, y: 40 },
      data: { label: "Function", name: "constructor", isConstructor: true, visibility: "public", stateMutability: "nonpayable",
        params: [row("_baseURI", "string")], returns: [], extraModifiers: "",
        body: 'baseURI = _baseURI;',
      } satisfies FunctionNodeData,
    },
    {
      id: mintFn, type: "function",
      position: { x: 800, y: 220 },
      data: { label: "Function", name: "mint", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("to", "address"), row("id", "uint256"), row("amount", "uint256")],
        returns: [], extraModifiers: "onlyOwner",
        body: '_mint(to, id, amount, "");',
      } satisfies FunctionNodeData,
    },
    {
      id: mintBatchFn, type: "function",
      position: { x: 800, y: 420 },
      data: { label: "Function", name: "mintBatch", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("to", "address"), row("ids", "uint256[]"), row("amounts", "uint256[]")],
        returns: [], extraModifiers: "onlyOwner",
        body: '_mintBatch(to, ids, amounts, "");',
      } satisfies FunctionNodeData,
    },
    {
      id: burnFn, type: "function",
      position: { x: 800, y: 620 },
      data: { label: "Function", name: "burn", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("id", "uint256"), row("amount", "uint256")],
        returns: [], extraModifiers: "",
        body: '_burn(msg.sender, id, amount);',
      } satisfies FunctionNodeData,
    },
  ];

  const edges: FlowEdge[] = [
    { id: id("e"), source: contractId, target: uriId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: ctorId, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: mintFn, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: mintBatchFn, style: { strokeWidth: 2 } },
    { id: id("e"), source: contractId, target: burnFn, style: { strokeWidth: 2 } },
  ];
  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 10. DAO Governor (on-chain governance)                             */
/* ------------------------------------------------------------------ */

function buildDAO() {
  const contractId  = id("contract");
  const tokenId     = id("variable");
  const periodId    = id("variable");
  const quorumId    = id("variable");
  const propStruct  = id("struct");
  const propsId     = id("variable");
  const proposeFn   = id("function");
  const voteFn      = id("function");
  const executeFn   = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId, type: "contract",
      position: { x: 40, y: 200 },
      data: { label: "Contract", name: "SimpleDAO", license: "MIT", pragma: "^0.8.24", inherits: "Ownable", baseConstructorCalls: "Ownable(msg.sender)" } satisfies ContractNodeData,
    },
    {
      id: tokenId, type: "variable",
      position: { x: 420, y: 40 },
      data: { label: "Variable", name: "governanceToken", varType: "IERC20", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: periodId, type: "variable",
      position: { x: 420, y: 180 },
      data: { label: "Variable", name: "votingPeriod", varType: "uint256", visibility: "public", mutability: "mutable", initialValue: "3 days" } satisfies VariableNodeData,
    },
    {
      id: quorumId, type: "variable",
      position: { x: 420, y: 320 },
      data: { label: "Variable", name: "quorumVotes", varType: "uint256", visibility: "public", mutability: "mutable", initialValue: "100e18" } satisfies VariableNodeData,
    },
    {
      id: propStruct, type: "struct",
      position: { x: 420, y: 460 },
      data: { label: "Struct", name: "Proposal", fields: [
        row("description", "string"), row("voteEnd", "uint256"),
        row("forVotes", "uint256"), row("againstVotes", "uint256"), row("executed", "bool"),
      ] } satisfies StructNodeData,
    },
    {
      id: propsId, type: "variable",
      position: { x: 420, y: 700 },
      data: { label: "Variable", name: "proposals", varType: "Proposal[]", visibility: "public", mutability: "mutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: proposeFn, type: "function",
      position: { x: 800, y: 40 },
      data: { label: "Function", name: "propose", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("description", "string")], returns: [row("proposalId", "uint256")], extraModifiers: "",
        body: 'proposals.push(Proposal({ description: description, voteEnd: block.timestamp + votingPeriod, forVotes: 0, againstVotes: 0, executed: false }));\nreturn proposals.length - 1;',
      } satisfies FunctionNodeData,
    },
    {
      id: voteFn, type: "function",
      position: { x: 800, y: 280 },
      data: { label: "Function", name: "castVote", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("proposalId", "uint256"), row("support", "bool")],
        returns: [], extraModifiers: "",
        body: 'Proposal storage p = proposals[proposalId];\nrequire(block.timestamp < p.voteEnd, "Voting ended");\nuint256 weight = governanceToken.balanceOf(msg.sender);\nif (support) { p.forVotes += weight; } else { p.againstVotes += weight; }',
      } satisfies FunctionNodeData,
    },
    {
      id: executeFn, type: "function",
      position: { x: 800, y: 500 },
      data: { label: "Function", name: "execute", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("proposalId", "uint256")], returns: [], extraModifiers: "",
        body: 'Proposal storage p = proposals[proposalId];\nrequire(block.timestamp >= p.voteEnd, "Voting not ended");\nrequire(!p.executed, "Already executed");\nrequire(p.forVotes >= quorumVotes, "Quorum not reached");\nrequire(p.forVotes > p.againstVotes, "Defeated");\np.executed = true;',
      } satisfies FunctionNodeData,
    },
  ];

  const edges: FlowEdge[] = [
    contractId, tokenId, periodId, quorumId, propStruct, propsId, proposeFn, voteFn, executeFn,
  ].slice(1).map((target) => ({ id: id("e"), source: contractId, target, style: { strokeWidth: 2 } }));
  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 11. Yield Farming / Liquidity Mining                               */
/* ------------------------------------------------------------------ */

function buildYieldFarm() {
  const contractId   = id("contract");
  const stakingId    = id("variable");
  const rewardId     = id("variable");
  const rewardRateId = id("variable");
  const balancesId   = id("mapping");
  const rewardsId    = id("mapping");
  const stakeEvent   = id("event");
  const withdrawEvent = id("event");
  const stakeFn      = id("function");
  const withdrawFn   = id("function");
  const claimFn      = id("function");
  const earnedFn     = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId, type: "contract",
      position: { x: 40, y: 200 },
      data: { label: "Contract", name: "YieldFarm", license: "MIT", pragma: "^0.8.24", inherits: "Ownable, ReentrancyGuard", baseConstructorCalls: "Ownable(msg.sender)" } satisfies ContractNodeData,
    },
    {
      id: stakingId, type: "variable", position: { x: 420, y: 40 },
      data: { label: "Variable", name: "stakingToken", varType: "IERC20", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: rewardId, type: "variable", position: { x: 420, y: 180 },
      data: { label: "Variable", name: "rewardToken", varType: "IERC20", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: rewardRateId, type: "variable", position: { x: 420, y: 320 },
      data: { label: "Variable", name: "rewardRate", varType: "uint256", visibility: "public", mutability: "mutable", initialValue: "1e15" } satisfies VariableNodeData,
    },
    {
      id: balancesId, type: "mapping", position: { x: 420, y: 460 },
      data: { label: "Mapping", name: "stakedBalance", keyType: "address", valueType: "uint256", visibility: "public" } satisfies MappingNodeData,
    },
    {
      id: rewardsId, type: "mapping", position: { x: 420, y: 600 },
      data: { label: "Mapping", name: "pendingRewards", keyType: "address", valueType: "uint256", visibility: "public" } satisfies MappingNodeData,
    },
    {
      id: stakeEvent, type: "event", position: { x: 420, y: 740 },
      data: { label: "Event", name: "Staked", params: [eventRow("user", "address", true), eventRow("amount", "uint256", false)] } satisfies EventNodeData,
    },
    {
      id: withdrawEvent, type: "event", position: { x: 420, y: 860 },
      data: { label: "Event", name: "Withdrawn", params: [eventRow("user", "address", true), eventRow("amount", "uint256", false)] } satisfies EventNodeData,
    },
    {
      id: stakeFn, type: "function", position: { x: 800, y: 40 },
      data: { label: "Function", name: "stake", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("amount", "uint256")], returns: [], extraModifiers: "nonReentrant",
        body: 'require(amount > 0, "Cannot stake 0");\nstakedBalance[msg.sender] += amount;\nstakingToken.transferFrom(msg.sender, address(this), amount);\nemit Staked(msg.sender, amount);',
      } satisfies FunctionNodeData,
    },
    {
      id: withdrawFn, type: "function", position: { x: 800, y: 260 },
      data: { label: "Function", name: "withdraw", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("amount", "uint256")], returns: [], extraModifiers: "nonReentrant",
        body: 'require(stakedBalance[msg.sender] >= amount, "Insufficient balance");\nstakedBalance[msg.sender] -= amount;\nstakingToken.transfer(msg.sender, amount);\nemit Withdrawn(msg.sender, amount);',
      } satisfies FunctionNodeData,
    },
    {
      id: earnedFn, type: "function", position: { x: 800, y: 460 },
      data: { label: "Function", name: "earned", isConstructor: false, visibility: "public", stateMutability: "view",
        params: [row("account", "address")], returns: [row("", "uint256")], extraModifiers: "",
        body: 'return stakedBalance[account] * rewardRate / 1e18 + pendingRewards[account];',
      } satisfies FunctionNodeData,
    },
    {
      id: claimFn, type: "function", position: { x: 800, y: 620 },
      data: { label: "Function", name: "claimReward", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [], returns: [], extraModifiers: "nonReentrant",
        body: 'uint256 reward = earned(msg.sender);\nif (reward > 0) {\n    pendingRewards[msg.sender] = 0;\n    rewardToken.transfer(msg.sender, reward);\n}',
      } satisfies FunctionNodeData,
    },
  ];

  const memberIds = [stakingId, rewardId, rewardRateId, balancesId, rewardsId, stakeEvent, withdrawEvent, stakeFn, withdrawFn, earnedFn, claimFn];
  const edges: FlowEdge[] = memberIds.map((target) => ({ id: id("e"), source: contractId, target, style: { strokeWidth: 2 } }));
  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 12. NFT Marketplace (list, buy, cancel)                            */
/* ------------------------------------------------------------------ */

function buildNFTMarketplace() {
  const contractId  = id("contract");
  const feeId       = id("variable");
  const listingStruct = id("struct");
  const listingsId  = id("mapping");
  const listedEvent = id("event");
  const soldEvent   = id("event");
  const listFn      = id("function");
  const buyFn       = id("function");
  const cancelFn    = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId, type: "contract",
      position: { x: 40, y: 200 },
      data: { label: "Contract", name: "NFTMarketplace", license: "MIT", pragma: "^0.8.24", inherits: "Ownable, ReentrancyGuard", baseConstructorCalls: "Ownable(msg.sender)" } satisfies ContractNodeData,
    },
    {
      id: feeId, type: "variable", position: { x: 420, y: 40 },
      data: { label: "Variable", name: "platformFeeBps", varType: "uint256", visibility: "public", mutability: "mutable", initialValue: "250" } satisfies VariableNodeData,
    },
    {
      id: listingStruct, type: "struct", position: { x: 420, y: 180 },
      data: { label: "Struct", name: "Listing", fields: [
        row("seller", "address"), row("nftContract", "address"), row("tokenId", "uint256"), row("price", "uint256"), row("active", "bool"),
      ] } satisfies StructNodeData,
    },
    {
      id: listingsId, type: "mapping", position: { x: 420, y: 440 },
      data: { label: "Mapping", name: "listings", keyType: "uint256", valueType: "Listing", visibility: "public" } satisfies MappingNodeData,
    },
    {
      id: listedEvent, type: "event", position: { x: 420, y: 580 },
      data: { label: "Event", name: "ItemListed", params: [
        eventRow("listingId", "uint256", true), eventRow("seller", "address", true), eventRow("price", "uint256", false),
      ] } satisfies EventNodeData,
    },
    {
      id: soldEvent, type: "event", position: { x: 420, y: 720 },
      data: { label: "Event", name: "ItemSold", params: [
        eventRow("listingId", "uint256", true), eventRow("buyer", "address", true), eventRow("price", "uint256", false),
      ] } satisfies EventNodeData,
    },
    {
      id: listFn, type: "function", position: { x: 800, y: 40 },
      data: { label: "Function", name: "listItem", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("nftContract", "address"), row("tokenId", "uint256"), row("price", "uint256")],
        returns: [row("listingId", "uint256")], extraModifiers: "",
        body: 'require(price > 0, "Price must be > 0");\nuint256 listingId = uint256(keccak256(abi.encodePacked(nftContract, tokenId, msg.sender)));\nlistings[listingId] = Listing({ seller: msg.sender, nftContract: nftContract, tokenId: tokenId, price: price, active: true });\nIERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);\nemit ItemListed(listingId, msg.sender, price);\nreturn listingId;',
      } satisfies FunctionNodeData,
    },
    {
      id: buyFn, type: "function", position: { x: 800, y: 300 },
      data: { label: "Function", name: "buyItem", isConstructor: false, visibility: "external", stateMutability: "payable",
        params: [row("listingId", "uint256")], returns: [], extraModifiers: "nonReentrant",
        body: 'Listing storage listing = listings[listingId];\nrequire(listing.active, "Not active");\nrequire(msg.value == listing.price, "Wrong price");\nlisting.active = false;\nuint256 fee = msg.value * platformFeeBps / 10000;\nuint256 sellerAmount = msg.value - fee;\npayable(listing.seller).transfer(sellerAmount);\nIERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);\nemit ItemSold(listingId, msg.sender, listing.price);',
      } satisfies FunctionNodeData,
    },
    {
      id: cancelFn, type: "function", position: { x: 800, y: 540 },
      data: { label: "Function", name: "cancelListing", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("listingId", "uint256")], returns: [], extraModifiers: "",
        body: 'Listing storage listing = listings[listingId];\nrequire(listing.seller == msg.sender, "Not seller");\nrequire(listing.active, "Not active");\nlisting.active = false;\nIERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);',
      } satisfies FunctionNodeData,
    },
  ];

  const memberIds = [feeId, listingStruct, listingsId, listedEvent, soldEvent, listFn, buyFn, cancelFn];
  const edges: FlowEdge[] = memberIds.map((t) => ({ id: id("e"), source: contractId, target: t, style: { strokeWidth: 2 } }));
  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 13. Token Timelock                                                  */
/* ------------------------------------------------------------------ */

function buildTokenTimelock() {
  const contractId   = id("contract");
  const tokenId      = id("variable");
  const benefId      = id("variable");
  const releaseId    = id("variable");
  const releasedId   = id("variable");
  const releaseEvent = id("event");
  const releaseFn    = id("function");
  const ctorId       = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId, type: "contract",
      position: { x: 40, y: 200 },
      data: { label: "Contract", name: "TokenTimelock", license: "MIT", pragma: "^0.8.24", inherits: "", baseConstructorCalls: "" } satisfies ContractNodeData,
    },
    {
      id: tokenId, type: "variable", position: { x: 420, y: 40 },
      data: { label: "Variable", name: "token", varType: "IERC20", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: benefId, type: "variable", position: { x: 420, y: 180 },
      data: { label: "Variable", name: "beneficiary", varType: "address", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: releaseId, type: "variable", position: { x: 420, y: 320 },
      data: { label: "Variable", name: "releaseTime", varType: "uint256", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: releasedId, type: "variable", position: { x: 420, y: 460 },
      data: { label: "Variable", name: "released", varType: "bool", visibility: "public", mutability: "mutable", initialValue: "false" } satisfies VariableNodeData,
    },
    {
      id: releaseEvent, type: "event", position: { x: 420, y: 600 },
      data: { label: "Event", name: "TokensReleased", params: [
        eventRow("beneficiary", "address", true), eventRow("amount", "uint256", false),
      ] } satisfies EventNodeData,
    },
    {
      id: ctorId, type: "function", position: { x: 800, y: 40 },
      data: { label: "Function", name: "constructor", isConstructor: true, visibility: "public", stateMutability: "nonpayable",
        params: [row("_token", "address"), row("_beneficiary", "address"), row("_releaseTime", "uint256")],
        returns: [], extraModifiers: "",
        body: 'require(_releaseTime > block.timestamp, "Release time must be in the future");\ntoken = IERC20(_token);\nbeneficiary = _beneficiary;\nreleaseTime = _releaseTime;',
      } satisfies FunctionNodeData,
    },
    {
      id: releaseFn, type: "function", position: { x: 800, y: 280 },
      data: { label: "Function", name: "release", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [], returns: [], extraModifiers: "",
        body: 'require(block.timestamp >= releaseTime, "Tokens not yet unlocked");\nrequire(!released, "Already released");\nreleased = true;\nuint256 amount = token.balanceOf(address(this));\nrequire(amount > 0, "No tokens to release");\ntoken.transfer(beneficiary, amount);\nemit TokensReleased(beneficiary, amount);',
      } satisfies FunctionNodeData,
    },
  ];

  const memberIds = [tokenId, benefId, releaseId, releasedId, releaseEvent, ctorId, releaseFn];
  const edges: FlowEdge[] = memberIds.map((t) => ({ id: id("e"), source: contractId, target: t, style: { strokeWidth: 2 } }));
  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 14. Pausable ERC20 (emergency stop)                                */
/* ------------------------------------------------------------------ */

function buildPausableToken() {
  const contractId = id("contract");
  const ctorId     = id("function");
  const mintFn     = id("function");
  const pauseFn    = id("function");
  const unpauseFn  = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId, type: "contract",
      position: { x: 40, y: 200 },
      data: { label: "Contract", name: "PausableToken", license: "MIT", pragma: "^0.8.24", inherits: "ERC20, Ownable, Pausable", baseConstructorCalls: 'ERC20("PausableToken","PTKN") Ownable(msg.sender)' } satisfies ContractNodeData,
    },
    {
      id: ctorId, type: "function", position: { x: 800, y: 40 },
      data: { label: "Function", name: "constructor", isConstructor: true, visibility: "public", stateMutability: "nonpayable",
        params: [row("initialSupply", "uint256")], returns: [], extraModifiers: "",
        body: '_mint(msg.sender, initialSupply);',
      } satisfies FunctionNodeData,
    },
    {
      id: mintFn, type: "function", position: { x: 800, y: 220 },
      data: { label: "Function", name: "mint", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("to", "address"), row("amount", "uint256")], returns: [], extraModifiers: "onlyOwner whenNotPaused",
        body: '_mint(to, amount);',
      } satisfies FunctionNodeData,
    },
    {
      id: pauseFn, type: "function", position: { x: 800, y: 400 },
      data: { label: "Function", name: "pause", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [], returns: [], extraModifiers: "onlyOwner",
        body: '_pause();',
      } satisfies FunctionNodeData,
    },
    {
      id: unpauseFn, type: "function", position: { x: 800, y: 540 },
      data: { label: "Function", name: "unpause", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [], returns: [], extraModifiers: "onlyOwner",
        body: '_unpause();',
      } satisfies FunctionNodeData,
    },
  ];

  const memberIds = [ctorId, mintFn, pauseFn, unpauseFn];
  const edges: FlowEdge[] = memberIds.map((t) => ({ id: id("e"), source: contractId, target: t, style: { strokeWidth: 2 } }));
  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 15. Dutch Auction                                                   */
/* ------------------------------------------------------------------ */

function buildDutchAuction() {
  const contractId  = id("contract");
  const startPriceId = id("variable");
  const endPriceId  = id("variable");
  const durationId  = id("variable");
  const startTimeId = id("variable");
  const soldId      = id("variable");
  const nftId       = id("variable");
  const tokenIdId   = id("variable");
  const priceFn     = id("function");
  const buyFn       = id("function");
  const soldEvent   = id("event");

  const nodes: FlowNode[] = [
    {
      id: contractId, type: "contract",
      position: { x: 40, y: 200 },
      data: { label: "Contract", name: "DutchAuction", license: "MIT", pragma: "^0.8.24", inherits: "Ownable", baseConstructorCalls: "Ownable(msg.sender)" } satisfies ContractNodeData,
    },
    {
      id: startPriceId, type: "variable", position: { x: 420, y: 40 },
      data: { label: "Variable", name: "startingPrice", varType: "uint256", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: endPriceId, type: "variable", position: { x: 420, y: 180 },
      data: { label: "Variable", name: "reservePrice", varType: "uint256", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: durationId, type: "variable", position: { x: 420, y: 320 },
      data: { label: "Variable", name: "duration", varType: "uint256", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: startTimeId, type: "variable", position: { x: 420, y: 460 },
      data: { label: "Variable", name: "startAt", varType: "uint256", visibility: "public", mutability: "immutable", initialValue: "block.timestamp" } satisfies VariableNodeData,
    },
    {
      id: nftId, type: "variable", position: { x: 420, y: 600 },
      data: { label: "Variable", name: "nft", varType: "IERC721", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: tokenIdId, type: "variable", position: { x: 420, y: 740 },
      data: { label: "Variable", name: "nftId", varType: "uint256", visibility: "public", mutability: "immutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: soldId, type: "variable", position: { x: 420, y: 880 },
      data: { label: "Variable", name: "sold", varType: "bool", visibility: "public", mutability: "mutable", initialValue: "false" } satisfies VariableNodeData,
    },
    {
      id: soldEvent, type: "event", position: { x: 420, y: 1000 },
      data: { label: "Event", name: "AuctionEnded", params: [eventRow("winner", "address", true), eventRow("price", "uint256", false)] } satisfies EventNodeData,
    },
    {
      id: priceFn, type: "function", position: { x: 800, y: 40 },
      data: { label: "Function", name: "getPrice", isConstructor: false, visibility: "public", stateMutability: "view",
        params: [], returns: [row("", "uint256")], extraModifiers: "",
        body: 'uint256 elapsed = block.timestamp - startAt;\nif (elapsed >= duration) return reservePrice;\nuint256 discount = (startingPrice - reservePrice) * elapsed / duration;\nreturn startingPrice - discount;',
      } satisfies FunctionNodeData,
    },
    {
      id: buyFn, type: "function", position: { x: 800, y: 260 },
      data: { label: "Function", name: "buy", isConstructor: false, visibility: "external", stateMutability: "payable",
        params: [], returns: [], extraModifiers: "",
        body: 'require(!sold, "Auction ended");\nuint256 price = getPrice();\nrequire(msg.value >= price, "ETH < price");\nsold = true;\nuint256 refund = msg.value - price;\nif (refund > 0) payable(msg.sender).transfer(refund);\nnft.transferFrom(owner(), msg.sender, nftId);\npayable(owner()).transfer(price);\nemit AuctionEnded(msg.sender, price);',
      } satisfies FunctionNodeData,
    },
  ];

  const memberIds = [startPriceId, endPriceId, durationId, startTimeId, nftId, tokenIdId, soldId, soldEvent, priceFn, buyFn];
  const edges: FlowEdge[] = memberIds.map((t) => ({ id: id("e"), source: contractId, target: t, style: { strokeWidth: 2 } }));
  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* 16. Access Control (role-based permissions)                        */
/* ------------------------------------------------------------------ */

function buildAccessControl() {
  const contractId  = id("contract");
  const adminId     = id("variable");
  const rolesId     = id("mapping");
  const grantEvent  = id("event");
  const revokeEvent = id("event");
  const onlyAdmin   = id("modifier");
  const grantFn     = id("function");
  const revokeFn    = id("function");
  const hasRoleFn   = id("function");

  const nodes: FlowNode[] = [
    {
      id: contractId, type: "contract",
      position: { x: 40, y: 200 },
      data: { label: "Contract", name: "RoleManager", license: "MIT", pragma: "^0.8.24", inherits: "", baseConstructorCalls: "" } satisfies ContractNodeData,
    },
    {
      id: adminId, type: "variable", position: { x: 420, y: 40 },
      data: { label: "Variable", name: "admin", varType: "address", visibility: "public", mutability: "mutable", initialValue: "" } satisfies VariableNodeData,
    },
    {
      id: rolesId, type: "mapping", position: { x: 420, y: 180 },
      data: { label: "Mapping", name: "roles", keyType: "bytes32", valueType: "mapping(address => bool)", visibility: "private" } satisfies MappingNodeData,
    },
    {
      id: grantEvent, type: "event", position: { x: 420, y: 320 },
      data: { label: "Event", name: "RoleGranted", params: [eventRow("role", "bytes32", true), eventRow("account", "address", true)] } satisfies EventNodeData,
    },
    {
      id: revokeEvent, type: "event", position: { x: 420, y: 460 },
      data: { label: "Event", name: "RoleRevoked", params: [eventRow("role", "bytes32", true), eventRow("account", "address", true)] } satisfies EventNodeData,
    },
    {
      id: onlyAdmin, type: "modifier", position: { x: 800, y: 40 },
      data: { label: "Modifier", name: "onlyAdmin", params: [], body: 'require(msg.sender == admin, "Not admin");\n_;' } satisfies ModifierNodeData,
    },
    {
      id: grantFn, type: "function", position: { x: 800, y: 220 },
      data: { label: "Function", name: "grantRole", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("role", "bytes32"), row("account", "address")], returns: [], extraModifiers: "",
        body: 'require(msg.sender == admin, "Not admin");\nroles[role][account] = true;\nemit RoleGranted(role, account);',
      } satisfies FunctionNodeData,
    },
    {
      id: revokeFn, type: "function", position: { x: 800, y: 420 },
      data: { label: "Function", name: "revokeRole", isConstructor: false, visibility: "external", stateMutability: "nonpayable",
        params: [row("role", "bytes32"), row("account", "address")], returns: [], extraModifiers: "",
        body: 'require(msg.sender == admin, "Not admin");\nroles[role][account] = false;\nemit RoleRevoked(role, account);',
      } satisfies FunctionNodeData,
    },
    {
      id: hasRoleFn, type: "function", position: { x: 800, y: 620 },
      data: { label: "Function", name: "hasRole", isConstructor: false, visibility: "public", stateMutability: "view",
        params: [row("role", "bytes32"), row("account", "address")], returns: [row("", "bool")], extraModifiers: "",
        body: 'return roles[role][account];',
      } satisfies FunctionNodeData,
    },
  ];

  const memberIds = [adminId, rolesId, grantEvent, revokeEvent, onlyAdmin, grantFn, revokeFn, hasRoleFn];
  const edges: FlowEdge[] = memberIds.map((t) => ({ id: id("e"), source: contractId, target: t, style: { strokeWidth: 2 } }));
  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/* export                                                              */
/* ------------------------------------------------------------------ */

export const TEMPLATES: Template[] = [
  {
    key: "staking-token",
    title: "Staking Token",
    description: "ERC20 token where holders lock tokens for 30 days to stake",
    build: buildStakingToken,
  },
  {
    key: "erc20-token",
    title: "ERC20 Token",
    description: "Simple mintable & burnable token, owner-controlled minting",
    build: buildErc20Token,
  },
  {
    key: "nft-collection",
    title: "NFT Collection",
    description: "ERC721 collection with sequential owner-only minting",
    build: buildNftCollection,
  },
  {
    key: "simple-voting",
    title: "Simple Voting",
    description: "Owner-created proposals, one vote per address",
    build: buildSimpleVoting,
  },
  {
    key: "escrow",
    title: "Escrow",
    description: "Buyer/seller/arbiter escrow releasing or refunding ETH",
    build: buildEscrow,
  },
  {
    key: "vesting-wallet",
    title: "ETH Vesting Wallet",
    description: "Linear ETH vesting to a beneficiary over a fixed duration",
    build: buildVestingWallet,
  },
  {
    key: "multisig-wallet",
    title: "Multisig Wallet",
    description: "M-of-N multi-signature wallet — submit, confirm, then execute transactions",
    build: buildMultisig,
  },
  {
    key: "crowdsale",
    title: "ERC20 Crowdsale",
    description: "ICO contract that sells tokens for ETH at a fixed rate with a hard cap",
    build: buildCrowdsale,
  },
  {
    key: "multi-token",
    title: "ERC1155 Multi-Token",
    description: "Multi-token contract supporting fungible and non-fungible tokens in one",
    build: buildMultiToken,
  },
  {
    key: "dao",
    title: "DAO Governor",
    description: "On-chain governance — propose, vote with token weight, execute passed proposals",
    build: buildDAO,
  },
  {
    key: "yield-farm",
    title: "Yield Farm",
    description: "Stake one token, earn another — deposit, withdraw, and claim reward functions",
    build: buildYieldFarm,
  },
  {
    key: "nft-marketplace",
    title: "NFT Marketplace",
    description: "List ERC721 NFTs for sale, buy with ETH, cancel listings, with platform fee",
    build: buildNFTMarketplace,
  },
  {
    key: "token-timelock",
    title: "Token Timelock",
    description: "Lock ERC20 tokens for a beneficiary until a future timestamp then release",
    build: buildTokenTimelock,
  },
  {
    key: "pausable-token",
    title: "Pausable Token",
    description: "ERC20 with an emergency pause switch — owner can halt all transfers",
    build: buildPausableToken,
  },
  {
    key: "dutch-auction",
    title: "Dutch Auction",
    description: "NFT auction where price starts high and falls over time until someone buys",
    build: buildDutchAuction,
  },
  {
    key: "access-control",
    title: "Role-Based Access",
    description: "Grant and revoke arbitrary roles per address — lightweight AccessControl from scratch",
    build: buildAccessControl,
  },
];

/* ------------------------------------------------------------------ */
/* Auto-layout helper (fixes template node overlap)                   */
/* ------------------------------------------------------------------ */

/**
 * Re-positions nodes so they don't overlap.
 * Contract stays on the left; members spread in two columns to the right.
 * Functions/modifiers go in a third column.
 */
export function autoLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const CONTRACT_X = 40;
  const COL1_X = 420;   // variables, structs, mappings, events
  const COL2_X = 780;   // functions, modifiers
  const COL_SPACING = 240;

  const contractNodes = nodes.filter((n) => n.type === "contract");
  const others = nodes.filter((n) => n.type !== "contract");

  const positioned = new Map<string, { x: number; y: number }>();

  // Place contracts in a vertical stack on the left
  contractNodes.forEach((n, i) => {
    positioned.set(n.id, { x: CONTRACT_X, y: 40 + i * COL_SPACING });
  });

  // For each contract, lay out its connected members
  contractNodes.forEach((contractNode, ci) => {
    const contractY = 40 + ci * COL_SPACING;
    const memberIds = new Set(
      edges.filter((e) => e.source === contractNode.id).map((e) => e.target)
    );
    const members = others.filter((n) => memberIds.has(n.id));

    // Split members into state (col1) and logic (col2)
    const stateMembers = members.filter((n) =>
      ["variable", "struct", "mapping", "event"].includes(n.type as string)
    );
    const logicMembers = members.filter((n) =>
      ["function", "modifier"].includes(n.type as string)
    );

    stateMembers.forEach((n, i) => {
      positioned.set(n.id, { x: COL1_X, y: contractY + i * 220 });
    });
    logicMembers.forEach((n, i) => {
      positioned.set(n.id, { x: COL2_X, y: contractY + i * 240 });
    });
  });

  // Any unconnected nodes go below
  let orphanY = 60;
  others.forEach((n) => {
    if (!positioned.has(n.id)) {
      positioned.set(n.id, { x: COL1_X, y: orphanY });
      orphanY += 220;
    }
  });

  return nodes.map((n) => ({
    ...n,
    position: positioned.get(n.id) ?? n.position,
  }));
}