import type {
  AssistantResponse,
  AuditResponse,
  CanvasOp,
} from "@/types/flow";

/** Random delay in [min, max] ms — mirrors typical live-API latency.  */
function jitter(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ */
/* Assistant — scripted replies, matched loosely against user input so */
/* the canned suggestion buttons (and close paraphrases) trigger the   */
/* right "build". Anything unmatched gets a safe, ops-free reply.      */
/* ------------------------------------------------------------------ */

interface DemoAssistantScript {
  /** Keywords tested against the lowercased user message; any hit matches. */
  keywords: string[];
  reply: string;
  ops: CanvasOp[];
  /** Simulated "thinking" time before the reply appears, in ms. */
  delayRange: [number, number];
}

const STAKING_SCRIPT: DemoAssistantScript = {
  keywords: ["staking", "stake", "30-day", "30 day", "lock"],
  reply:
    "Added a StakingVault contract with a 30-day lock: a constant lock period, unlock-time mapping, Staked event, `unlocked` modifier, and stake/unstake functions wired together.",
  delayRange: [2200, 3400],
  ops: [
    {
      op: "add_node",
      tempId: "n1",
      nodeType: "contract",
      data: {
        name: "StakingVault",
        license: "MIT",
        pragma: "^0.8.24",
        inherits: "ERC20, Ownable",
        baseConstructorCalls: 'ERC20("StakingVault", "SVT") Ownable(msg.sender)',
      },
    },
    {
      op: "add_node",
      tempId: "n2",
      nodeType: "variable",
      parentId: "n1",
      data: {
        name: "lockPeriod",
        varType: "uint256",
        visibility: "public",
        mutability: "constant",
        initialValue: "30 days",
      },
    },
    {
      op: "add_node",
      tempId: "n3",
      nodeType: "mapping",
      parentId: "n1",
      data: {
        name: "unlockTime",
        keyType: "address",
        valueType: "uint256",
        visibility: "public",
      },
    },
    {
      op: "add_node",
      tempId: "n4",
      nodeType: "event",
      parentId: "n1",
      data: {
        name: "Staked",
        params: [
          { id: "p1", name: "user", type: "address", indexed: true },
          { id: "p2", name: "amount", type: "uint256", indexed: false },
        ],
      },
    },
    {
      op: "add_node",
      tempId: "n5",
      nodeType: "modifier",
      parentId: "n1",
      data: {
        name: "unlocked",
        params: [],
        body: 'require(block.timestamp >= unlockTime[msg.sender], "Still locked");\n_;',
      },
    },
    {
      op: "add_node",
      tempId: "n6",
      nodeType: "function",
      parentId: "n1",
      data: {
        name: "stake",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [{ id: "p1", name: "amount", type: "uint256" }],
        returns: [],
        body: "_transfer(msg.sender, address(this), amount);\nunlockTime[msg.sender] = block.timestamp + lockPeriod;\nemit Staked(msg.sender, amount);",
        extraModifiers: "",
      },
    },
    {
      op: "add_node",
      tempId: "n7",
      nodeType: "function",
      parentId: "n1",
      data: {
        name: "constructor",
        isConstructor: true,
        visibility: "public",
        stateMutability: "nonpayable",
        params: [{ id: "p1", name: "initialSupply", type: "uint256" }],
        returns: [],
        body: "_mint(msg.sender, initialSupply);",
        extraModifiers: "",
      },
    },
    {
      op: "add_node",
      tempId: "n8",
      nodeType: "function",
      parentId: "n1",
      data: {
        name: "unstake",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [{ id: "p1", name: "amount", type: "uint256" }],
        returns: [],
        body: "_burn(address(this), amount);\n_mint(msg.sender, amount);",
        extraModifiers: "",
      },
    },
    { op: "add_edge", source: "n5", target: "n6" },
    { op: "add_edge", source: "n5", target: "n8" },
  ],
};

const REENTRANCY_SCRIPT: DemoAssistantScript = {
  keywords: ["withdraw", "reentrancy", "guard", "nonreentrant"],
  reply:
    "Added a `nonReentrant` modifier using a simple locked flag, plus a `withdraw` function guarded by it that follows checks-effects-interactions.",
  delayRange: [1800, 2800],
  ops: [
    {
      op: "add_node",
      tempId: "n1",
      nodeType: "variable",
      data: {
        name: "locked",
        varType: "bool",
        visibility: "private",
        mutability: "mutable",
        initialValue: "false",
      },
    },
    {
      op: "add_node",
      tempId: "n2",
      nodeType: "modifier",
      data: {
        name: "nonReentrant",
        params: [],
        body: 'require(!locked, "Reentrant call");\nlocked = true;\n_;\nlocked = false;',
      },
    },
    {
      op: "add_node",
      tempId: "n3",
      nodeType: "function",
      data: {
        name: "withdraw",
        isConstructor: false,
        visibility: "external",
        stateMutability: "nonpayable",
        params: [{ id: "p1", name: "amount", type: "uint256" }],
        returns: [],
        body: 'require(balances[msg.sender] >= amount, "Insufficient balance");\nbalances[msg.sender] -= amount;\n(bool ok, ) = msg.sender.call{value: amount}("");\nrequire(ok, "Transfer failed");',
        extraModifiers: "",
      },
    },
    { op: "add_edge", source: "n2", target: "n3" },
  ],
};

const TRANSFER_EVENT_SCRIPT: DemoAssistantScript = {
  keywords: ["event", "transfer", "indexed"],
  reply:
    "Added a Transfer event with indexed `from` and `to` addresses and a non-indexed `value` field.",
  delayRange: [1400, 2200],
  ops: [
    {
      op: "add_node",
      tempId: "n1",
      nodeType: "event",
      data: {
        name: "Transfer",
        params: [
          { id: "p1", name: "from", type: "address", indexed: true },
          { id: "p2", name: "to", type: "address", indexed: true },
          { id: "p3", name: "value", type: "uint256", indexed: false },
        ],
      },
    },
  ],
};

const SCRIPTS: DemoAssistantScript[] = [
  STAKING_SCRIPT,
  REENTRANCY_SCRIPT,
  TRANSFER_EVENT_SCRIPT,
];

const FALLBACK_REPLIES = [
  "Good idea — but demo mode keeps replies to a fixed script, so I can't build that one live. Try one of the suggestions above, or turn Demo Mode off to talk to the real assistant.",
  "I'm running in Demo Mode right now, so I only know a few scripted moves. Ask for the staking vault, the reentrancy-guarded withdraw, or the Transfer event to see one.",
];

let fallbackIndex = 0;

export async function getDemoAssistantResponse(
  userText: string
): Promise<AssistantResponse> {
  const lower = userText.toLowerCase();
  const script = SCRIPTS.find((s) => s.keywords.some((k) => lower.includes(k)));

  if (script) {
    await wait(jitter(script.delayRange[0], script.delayRange[1]));
    return { reply: script.reply, ops: script.ops };
  }

  await wait(jitter(900, 1500));
  const reply = FALLBACK_REPLIES[fallbackIndex % FALLBACK_REPLIES.length];
  fallbackIndex += 1;
  return { reply, ops: [] };
}

/* ------------------------------------------------------------------ */
/* Audit — one realistic, fixed finding set. Timed like a real review. */
/* ------------------------------------------------------------------ */

const DEMO_AUDIT_RESULT: AuditResponse = {
  score: 78,
  summary:
    "No critical vulnerabilities found. One high-severity reentrancy risk should be fixed before mainnet, and a few gas and access-control improvements are recommended.",
  findings: [
    {
      id: "f1",
      severity: "high",
      title: "External call before state update",
      description:
        "A withdraw-style function sends value before all balance changes are finalized, leaving a reentrancy window.",
      line: 42,
      recommendation:
        "Apply checks-effects-interactions: update balances before the external call, or add a nonReentrant guard.",
    },
    {
      id: "f2",
      severity: "medium",
      title: "Missing zero-address check",
      description:
        "Constructor and setter functions accept address parameters without validating against address(0).",
      line: 18,
      recommendation: "Add `require(addr != address(0), \"Zero address\")` checks.",
    },
    {
      id: "f3",
      severity: "low",
      title: "Timestamp used for time-locked logic",
      description:
        "block.timestamp is used for the unlock check. Miners/validators can influence it by a small margin.",
      line: 55,
      recommendation:
        "Acceptable for day-scale locks like this one; avoid for sub-minute precision.",
    },
    {
      id: "f4",
      severity: "info",
      title: "No events on state-changing admin functions",
      description:
        "Some owner-only setters don't emit an event, making off-chain monitoring harder.",
      recommendation: "Emit an event whenever privileged state changes.",
    },
  ],
  gasFindings: [
    {
      id: "g1",
      title: "Cache storage reads in loops",
      description:
        "A storage variable is read multiple times inside a loop body instead of being cached in memory.",
      estimatedSavings: "~2,000 gas per iteration",
    },
    {
      id: "g2",
      title: "Pack struct fields",
      description:
        "Reordering struct fields by size would let two of them share a storage slot.",
      estimatedSavings: "~20,000 gas on write",
    },
  ],
};

export async function getDemoAuditResult(): Promise<AuditResponse> {
  await wait(jitter(2600, 3800));
  return DEMO_AUDIT_RESULT;
}
