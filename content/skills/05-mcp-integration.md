---
title: "MCP Integration — Mở rộng tool bằng Model Context Protocol"
description: "Plug external service (Playwright, Postgres, Slack, GitHub) vô agent."
order: 5
duration: "8 phút đọc"
tags: [skill, mcp, tool]
---

## MCP là gì?

**Model Context Protocol** — chuẩn mở của Anthropic (2024) cho agent kết nối tool ngoài.

Trước MCP: mỗi agent tự define tool. Không share.

Sau MCP: viết 1 MCP server → mọi agent (Claude Code, Codex, OpenCode) đều dùng được.

## Kiến trúc

```
Agent ──── MCP Client ──── stdio/HTTP ──── MCP Server ──── External resource
                                                            (DB, browser, API)
```

MCP server expose:
- **Tools** — function callable
- **Resources** — read-only data
- **Prompts** — reusable prompt template

## MCP server phổ biến

Có thể tìm kiếm MCP server trên [MCP server registry](https://mcpservers.org/)

| Server | Mục đích | Tool nổi bật |
|--------|----------|--------------|
| `chrome-devtools` | Debug browser | navigate, click, screenshot, network |
| `playwright` | E2E browser | navigate, fill, evaluate, snapshot |
| `azure-devops` | ADO API | PR, work item, repo |
| `microsoft-docs` | MS Learn | docs search, code sample |
| `context7` | Lib docs | query-docs, resolve-id |
| `postgres` (community) | DB query | execute SQL |
| `filesystem` (community) | FS ops | beyond default Read/Write |

## Cài MCP server với Claude Code

`.claude/settings.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://user:pass@localhost:5432/mydb"
      ]
    }
  }
}
```

Restart Claude Code → tool tự xuất hiện với prefix `mcp__playwright__*`, `mcp__postgres__*`.

## Pattern: Skill orchestrate MCP

```yaml
---
name: e2e-login-test
description: Use to verify login flow end-to-end via real browser.
---

1. mcp__playwright__browser_navigate("http://localhost:3000/login")
2. mcp__playwright__browser_fill({email: "u@test.com", password: "..."})
3. mcp__playwright__browser_click("button[type=submit]")
4. mcp__playwright__browser_wait_for("dashboard heading")
5. mcp__playwright__browser_snapshot() → save screenshot
6. Assert: URL contains /dashboard
```

Skill = orchestration. MCP = execution.

## Tự viết MCP server

Trường hợp dùng:
- Internal tool / API riêng
- Database custom
- Workflow business-specific

Stack đề xuất:
- Python (`mcp` SDK) hoặc TS (`@modelcontextprotocol/sdk`)
- Stdio transport (đơn giản nhất)

Skeleton TS:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server({ name: 'my-tool', version: '0.1.0' }, {
  capabilities: { tools: {} },
})

server.setRequestHandler('tools/list', () => ({
  tools: [
    {
      name: 'query_orders',
      description: 'Query orders by status',
      inputSchema: {
        type: 'object',
        properties: { status: { type: 'string' } },
        required: ['status'],
      },
    },
  ],
}))

server.setRequestHandler('tools/call', async (req) => {
  if (req.params.name === 'query_orders') {
    const result = await db.query('SELECT * FROM orders WHERE status=$1', [
      req.params.arguments.status,
    ])
    return { content: [{ type: 'text', text: JSON.stringify(result) }] }
  }
})

await server.connect(new StdioServerTransport())
```

→ Đóng gói + register vô `.claude/settings.json`.

## Best practice

1. **Tool ngắn gọn, focused** — 1 tool 1 action
2. **Input schema chặt** — Zod hoặc JSON Schema validate
3. **Output structured** — JSON, không free-text
4. **Error explicit** — return error object, không throw silently
5. **Idempotent** nếu được
6. **Authentication** qua env var, không hardcode

## Security note

MCP server chạy local trên máy agent. Tool có thể destructive:
- DB write → permission gate ở agent level
- Filesystem → scope chặt
- Network → allowlist domain

Treat MCP server như supply chain code — review trước khi cài.

## Tổng kết

5 skill cốt lõi:

1. [Skill Anatomy](/skills/01-skill-anatomy) — cấu trúc
2. [Verification](/skills/02-skill-verification) — gate done
3. [Init/Bootstrap](/skills/03-skill-init-bootstrap) — start session
4. [Cleanup](/skills/04-skill-cleanup) — end session
5. **MCP Integration** — mở rộng tool

→ Ghép lại = harness production-grade.

## Bước tiếp

Apply vào project thật: [Project 01 — Test Automation với Playwright MCP](/projects/01-test-automation-playwright-mcp)
