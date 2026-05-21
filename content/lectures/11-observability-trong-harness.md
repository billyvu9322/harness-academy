---
title: "Lecture 11 — Observability nằm bên trong harness"
description: "Không debug được agent từ ngoài. Log, telemetry phải built-in."
order: 11
duration: "9 phút đọc"
tags: [foundation, observability]
---

## Tại sao agent khó debug?

Agent fail giữa task → bạn hỏi "vì sao?". Agent trả lời:
- *"I encountered an error"* — error nào?
- *"It seems X happened"* — guess
- *"Let me try again"* — fix mù

Không có log = không có root cause = không fix được.

## Observability = gì?

3 trụ truyền thống của observability:
1. **Logs** — sự kiện rời rạc
2. **Metrics** — số liệu theo thời gian
3. **Traces** — chuỗi sự kiện liên kết

Áp dụng cho agent:
- **Logs** — mọi tool call, input, output
- **Metrics** — token usage, success rate, latency
- **Traces** — flow của 1 task (tool sequence)

## Cái gì cần log?

### 1. Tool invocation

```
[2026-05-21 10:23:11] TOOL Read file=src/auth/login.ts
[2026-05-21 10:23:12] TOOL Edit file=src/auth/login.ts old=... new=...
[2026-05-21 10:23:15] TOOL Bash cmd="npm test" exit=1 duration=4.2s
```

### 2. Decision point

Agent chọn approach A thay B → log lý do.

### 3. Context state

Trước/sau compaction → snapshot state.

### 4. Hook execution

Hook chạy gì, exit code, output.

### 5. Error

Stack trace đầy đủ, không paraphrase.

## Triển khai: Hook ghi log

Claude Code `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"[$(date -Iseconds)] $TOOL_NAME $TOOL_INPUT_SUMMARY\" >> .claude/logs/tools.log"
          }
        ]
      }
    ]
  }
}
```

→ Mọi tool call ghi log. Sau session, đọc log = trace.

## Triển khai: Xuất transcript

Claude Code lưu transcript JSON ở `~/.claude/projects/<encoded>/`. 

Pattern:
- Hook `SessionEnd` copy transcript ra `docs/sessions/$(date).jsonl`
- Mỗi PR attach session log
- Postmortem: đọc log để hiểu chỗ agent fail

## Skill báo cáo telemetry

```yaml
---
name: tool-usage-report
description: Use after long session to summarize tool usage, token spend, failure points.
---
1. Read .claude/logs/tools.log
2. Count tool by type
3. Identify failed tool call (exit != 0)
4. Estimate token (rough: input + output char / 4)
5. Output markdown summary
```

→ Bạn dashboard hoá session.

## Anti-pattern: Lỗi im lặng

Sai:
```
Agent: [tool fail silently] [tries different approach] [eventually success]
```

→ Bạn không biết bug history. Lần sau lặp lại.

Đúng:
```
Agent: Tool X failed with: "ENOENT no such file"
       Reason: path was wrong because Y.
       Adjusted, retry. Success.
```

Verbose hơn — nhưng debuggable.

## Metric đáng theo dõi

- **Cost**: token / session
- **Success rate**: feature done / feature started
- **Test pass rate**: lần đầu / sau retry
- **Tool failure rate**: % tool exit != 0
- **Session length**: phút từ start tới done

→ Improve harness dựa trên số, không cảm tính.

## Observability cho môi trường production

Khi agent chạy tự động (CI, background job):
- Đẩy log lên storage (S3, Loki)
- Alert khi error rate tăng đột biến
- Dashboard (Grafana) cho metric

→ Đối xử với agent như một service production.

## Điểm chính

- Không debug được = không cải thiện được
- Hook log mọi tool call
- Transcript dump cho postmortem
- Metrics dẫn dắt việc tune harness

## Tiếp theo

[Lecture 12 — Mọi session phải để lại clean state](/lectures/12-clean-state-moi-session)
