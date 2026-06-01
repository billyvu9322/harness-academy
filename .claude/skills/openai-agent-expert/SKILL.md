---
name: openai-agent-expert
description: >
  Expert guidance for building agents with the OpenAI Agents SDK for JavaScript/TypeScript
  (@openai/agents). Use this skill whenever the user wants to build, debug, review, or architect
  code using @openai/agents — including single agents, multi-agent orchestration, tool definitions,
  guardrails, sessions, streaming, MCP server integration, and production Agent Harness patterns.
  Trigger this skill for any mention of: OpenAI Agents SDK, @openai/agents, Agent Harness,
  handoffs between agents, MCP server in the context of OpenAI, agent tools with zod, MemorySession,
  RunContext, AgentHooks, guardrails/tripwire, SandboxAgent, or streaming agent runs.
  Also use when the user asks to "build an agent with OpenAI" even without specifying the SDK.
---

# OpenAI Agents SDK Skill

You are an expert in the **OpenAI Agents SDK for JavaScript/TypeScript** (`@openai/agents`).

**Official references** (always cite when relevant):
- Docs: https://openai.github.io/openai-agents-js/
- Source: https://github.com/openai/openai-agents-js
- Examples: https://github.com/openai/openai-agents-js/tree/main/examples

---

## SDK Architecture Overview

```
@openai/agents
├── Agent                      — LLM with instructions, tools, guardrails, handoffs
├── Runner / run()             — Executes the agent loop → RunResult | StreamedRunResult
├── RunContext<T>              — Typed shared context across the run
├── AgentHooks                 — Lifecycle: onStart, onEnd, onToolStart, onToolEnd, onHandoff
├── Guardrails                 — Input/output validation with tripwire mechanism
├── Handoff                    — Transfers control between agents
├── MemorySession              — Conversation history across turns
├── MCPServerStdio             — MCP via local stdio subprocess
├── MCPServerSSE               — MCP via Server-Sent Events
├── MCPServerStreamableHttp    — MCP via HTTP streaming
└── SandboxAgent               — Agent + managed filesystem workspace (beta)
```

### The Agent Loop
```
1. Call LLM with model + settings + full message history
2. LLM returns:
   ├── final_output  → exit loop, return RunResult
   ├── handoff       → switch agent, restart loop
   └── tool_calls    → execute tools, append results, restart loop
```
> Exceeding `maxTurns` throws `MaxTurnsExceededError`.

---

## Core Coding Principles

1. **TypeScript-first** — Always use full type annotations; use `zod` for tool parameter schemas.
2. **Wrap `run()` in try-catch** — Handle each specific error class; never swallow unknown errors.
3. **Clean up MCP resources** — Always call `mcpServer.close()` in a `finally` block.
4. **Inject context, avoid globals** — Use `RunContext<T>` for cross-cutting data.
5. **Prefer streaming for UX** — Use `{ stream: true }` and handle events progressively.
6. **Use sessions for multi-turn** — Pass a `MemorySession` to preserve conversation history.
7. **Guard production inputs** — Always attach `inputGuardrails` to production-facing agents.
8. **Enable tracing** — Configure `setTraceProcessors` for observability.
9. **Cap `maxTurns`** — Set an explicit limit in production to prevent unbounded loops.

---

## Quick Pattern Reference

See `references/patterns.md` for full, copy-paste-ready code for all patterns:
- Basic Agent
- Agent with Function Tools (zod)
- Multi-Agent Handoff / Orchestration
- Agent as Tool (Nested Composition)
- Streaming
- Structured Output
- Typed Context (`RunContext<T>`)
- Input Guardrails
- Lifecycle Hooks (`AgentHooks`)
- Sessions (`MemorySession`)
- MCP Integration
- Human-in-the-Loop
- Retry Policy
- Sandbox Agent (beta)
- Full Agent Harness (production pattern)

Read `references/patterns.md` when you need to produce or verify code for any of these patterns.

---

## Quick API Reference

| API | Purpose |
|---|---|
| `new Agent({ name, instructions, tools, model })` | Define an agent |
| `run(agent, input, options?)` | Run to completion → `RunResult` |
| `run(agent, input, { stream: true })` | Streaming run → `StreamedRunResult` |
| `tool({ name, description, parameters, execute })` | Define a typed function tool |
| `handoff(agent)` | Declare a handoff target |
| `inputGuardrail({ name, execute })` | Input validation with tripwire |
| `outputGuardrail({ name, execute })` | Output validation with tripwire |
| `new MemorySession()` | In-memory multi-turn session |
| `RunContext<T>` | Generic typed run-wide context |
| `AgentHooks` | Extend for lifecycle callbacks |
| `new MCPServerStdio(...)` | MCP via local stdio subprocess |
| `new MCPServerSSE(...)` | MCP via Server-Sent Events |
| `new MCPServerStreamableHttp(...)` | MCP via HTTP streaming |
| `SandboxAgent` | Agent with managed filesystem (beta) |
| `setTraceProcessors([...])` | Configure trace exporters |

---

## Error Handling Reference

```typescript
import {
  MaxTurnsExceededError,
  ModelBehaviorError,
  ModelRefusalError,
  InputGuardrailTripwireTriggered,
  OutputGuardrailTripwireTriggered,
} from '@openai/agents';

try {
  const result = await run(agent, input, { maxTurns: 10 });
  return result.finalOutput;
} catch (err) {
  if (err instanceof MaxTurnsExceededError)
    console.error('Agent hit the maxTurns limit.');
  else if (err instanceof InputGuardrailTripwireTriggered)
    console.error('Input rejected:', err.message);
  else if (err instanceof OutputGuardrailTripwireTriggered)
    console.error('Output rejected:', err.message);
  else if (err instanceof ModelRefusalError)
    console.error('Model refused the request.');
  else if (err instanceof ModelBehaviorError)
    console.error('Unexpected model behaviour:', err.message);
  else throw err;
}
```

---

## Tracing & Observability

```typescript
import { setTraceProcessors, BatchTraceProcessor, OpenAITracingExporter, ConsoleSpanExporter } from '@openai/agents';

// Production
setTraceProcessors([new BatchTraceProcessor(new OpenAITracingExporter())]);

// Development
setTraceProcessors([new BatchTraceProcessor(new ConsoleSpanExporter())]);
```

---

## Agent Harness Architecture (Production)

When the user is building a production system, recommend the **Agent Harness** pattern:

```
AgentHarness
├── ToolRegistry        — Shared tools reused across agents
├── HarnessHooks        — Centralized observability (metrics, logging, tracing)
├── AgentFactory        — Consistent agent construction with shared config
├── SessionStore        — Per-user conversation history
└── RunOrchestrator     — Error handling, maxTurns policy, result routing
```

Full implementation in `references/patterns.md` → Pattern 15: Agent Harness.

---

## MCP Integration Notes

- Use `MCPServerStdio` for local subprocesses (e.g., filesystem, database tools).
- Use `MCPServerStreamableHttp` for remote MCP endpoints (e.g., OpenAI Developer Docs MCP at `https://developers.openai.com/learn/docs-mcp`).
- **Always** call `await mcpServer.connect()` before `run()` and `await mcpServer.close()` in `finally`.
- Use `toolFilter` to restrict which MCP tools are exposed to the agent.

```typescript
// Static allowlist
toolFilter: { allowedTools: ['read_file', 'list_files'] }

// Dynamic predicate
toolFilter: async (tool, _ctx) => tool.name.startsWith('read_')
```