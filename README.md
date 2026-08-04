# Avalanche AI Flow Builder

A visual, node-based editor for Avalanche smart contracts, split into two
deliberately separate surfaces:

- **The canvas** is a deterministic visual programming tool. `Contract`,
  `Variable`, `Struct`, `Mapping`, `Function`, `Modifier`, and `Event` nodes
  compile straight to Solidity via a pure, non-AI compiler
  (`src/lib/compiler.ts`). Nothing on the canvas calls an LLM.
- **The AI Assistant** is a persistent chat panel next to the canvas. It's a
  copilot, not a node — you describe what you want, it proposes a batch of
  node/edge operations, and those get dropped onto the canvas for you to
  keep editing by hand.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **React Flow** for the node canvas
- **Zustand** for canvas state (nodes/edges + the op-application bridge for the assistant) and wallet state
- **viem** for wallet connection (injected provider) and the deploy transaction — no wagmi/RainbowKit
- **solc** (real compiler, server-side) + **@openzeppelin/contracts** for import resolution — actual bytecode, not a stub
- **Claude (Anthropic API)**, used in exactly two places: the Assistant
  panel (via tool-calling) and the Audit action in the Code tab — never
  embedded in a canvas node
- **Tailwind CSS v4** for styling

## How the pieces fit together

```
┌────────────┬─────────────────────────────────────┬──────────────────┐
│  Palette   │  Canvas  |  Code  ← tabs              │  AI Assistant    │
│  (drag     │                                        │  (chat, calls    │
│  nodes in) │  Canvas tab: React Flow graph          │  /api/assistant, │
│            │  (Contract/Variable/Struct/Mapping/    │  proposes ops)   │
│            │  Function/Modifier/Event/Note nodes)   │                  │
│            │  — no AI calls here                    │                  │
│            │                                        │                  │
│            │  Code tab: full syntax-highlighted     │                  │
│            │  compiled Solidity, + Audit /           │                  │
│            │  Deploy-preview sub-tabs                │                  │
└────────────┴─────────────────────────────────────┴──────────────────┘
```

### Canvas → Solidity (deterministic, no AI)

- A `Contract` node is the root. Connect any other node type to it
  (`contract -> node` edge) to make it a member.
- Connect a `Modifier` node's output into a `Function` node's input
  (`modifier -> function` edge) to apply that modifier to the function.
- `src/lib/compiler.ts` walks the graph and emits real Solidity — imports
  for a few common OpenZeppelin parents (`ERC20`, `Ownable`,
  `AccessControl`, `ReentrancyGuard`, `Pausable`, …), structs, events,
  state variables, modifiers, and functions/constructor in order.

### AI Assistant → canvas ops (separate surface)

- `src/app/api/assistant/route.ts` sends the chat history plus a summary
  of the current graph to Claude with a `propose_canvas_changes` tool.
- Claude replies with normal chat text, and — only when asked to build or
  change something — a batch of ops: `add_node`, `add_edge`,
  `update_node`, `remove_node`.
- `useFlowStore.applyAssistantOps` (in `src/lib/flow-store.ts`) resolves
  temporary ids to real node ids, auto-lays-out new nodes near their
  parent, and applies the batch to the canvas.
- The assistant never emits raw Solidity as its answer — it always speaks
  in nodes, so anything it "writes" is inspectable and editable on the
  canvas afterward.

### Wallet connection + real deploy to Fuji

- **Connect Wallet** (top bar) connects an injected browser wallet
  (MetaMask, Core, etc. — anything exposing `window.ethereum`) via a thin
  `viem`-based store (`src/lib/wallet-store.ts`), no wagmi/RainbowKit
  needed. Shows a network badge and offers to switch/add Avalanche Fuji
  if you're on the wrong chain.
- The **Deploy** sub-tab (in the Code tab) is a real three-step flow:
  1. **Compile** — `/api/compile` runs the actual `solc` compiler
     (Node.js, server-side) against the graph's compiled Solidity,
     resolving `@openzeppelin/*` imports straight from `node_modules`.
     Returns a real ABI and bytecode — this isn't illustrative.
  2. **Constructor arguments** — a form generated from the compiled ABI's
     constructor inputs (plus a value field if it's payable).
  3. **Deploy** — signs and sends the deployment transaction from your
     connected wallet via `walletClient.deployContract`, waits for the
     receipt, and links the tx and the new contract address on Snowtrace
     (Fuji).
- Real deploy is **Fuji-only** by design — there's no mainnet deploy
  button, only the mainnet option in the Hardhat script preview (still
  available via "Show Hardhat deploy script instead" further down the
  same tab) for anyone who wants to deploy via their own tooling.

### Other Code-tab utility actions

- **Run audit** — sends the compiled Solidity to Claude for a scored
  security + gas review (`/api/audit`).

### Save to ZIP

**Save to ZIP** (Code tab → Compiled code, next to Copy) downloads a
complete, ready-to-run Hardhat project — not just the `.sol` file:
`contracts/{Name}.sol`, `scripts/deploy.ts`, `hardhat.config.ts` (Fuji +
mainnet networks pre-wired, Solidity version auto-matched to your
contract's pragma), `package.json`, `.env.example`, `.gitignore`, and a
`README.md`. If the constructor takes arguments, the README calls that
out explicitly so it's not a silent deploy failure. Built client-side
with `jszip` — no server round-trip.

## Getting started

```bash
npm install
cp .env.local.example .env.local
# then edit .env.local and set ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Pick a **Template**
(top-right dropdown, or the empty-canvas grid) for a ready-made contract,
or drag nodes in from the left panel and connect them yourself. Try asking
the Assistant something like *"add a withdraw function with a reentrancy
guard modifier"*.

## Starter templates

`src/lib/templates.ts` ships six ready-made graphs, each a fully wired
node set you can load, inspect, and keep editing:

| Template | Pattern |
|---|---|
| **Staking Token** | ERC20 + 30-day lock-to-stake, custom `unlocked` modifier |
| **ERC20 Token** | Mintable/burnable token, owner-gated `mint` via `onlyOwner` |
| **NFT Collection** | ERC721 with sequential owner-only minting |
| **Simple Voting** | Struct-backed proposals, one vote per address |
| **Escrow** | Buyer/seller/arbiter release-or-refund pattern |
| **ETH Vesting Wallet** | Linear vesting with `vestedAmount`/`releasable`/`release` |

All six compile cleanly (verified against the compiler directly, not just
visually) and demonstrate the two fields that make inheritance actually
work: a contract's `baseConstructorCalls` (for parent constructors like
`ERC20("Name","SYM")`) and a function's `extraModifiers` (for inherited
modifiers like `onlyOwner` that don't need their own Modifier node).

## API routes

- `POST /api/assistant` — `{ messages, graph }` → `{ reply, ops }`. The
  only route that can add/change canvas nodes, and only because the user
  asked in chat.
- `POST /api/audit` — `{ code }` → `{ score, summary, findings, gasFindings }`
- `POST /api/compile` — `{ code, contractName }` → `{ abi, bytecode, warnings }`, real `solc` compilation
- `POST /api/deploy-preview` — `{ code, contractName, network, constructorArgs? }` → `{ deployScript, abiPreview, notes }` (Hardhat script text, no compilation)

## What's stubbed / not wired up yet

- **No wallet-agnostic connect UI.** Wallet connection uses the raw
  injected-provider API (`window.ethereum`) directly — works with
  MetaMask, Core, and most browser wallets, but there's no WalletConnect
  / mobile-wallet support and no multi-wallet picker.
- **No mainnet deploy.** Real signed deployment is Fuji-only by design;
  mainnet is preview-script-only.
- **No persistence.** Flows and chat history live in memory and reset on
  reload; deployed-contract history isn't saved anywhere either.
- **Single contract per canvas.** The compiler takes the first `Contract`
  node it finds; multi-contract graphs (and cross-contract calls) aren't
  supported yet.
- **No struct-typed function params.** The compiler auto-adds `memory`
  for `string`/`bytes`/array parameter types, but doesn't know your
  custom struct names, so a struct-typed parameter needs `memory` added
  by hand in its type field (e.g. `Proposal memory`).
# flava
