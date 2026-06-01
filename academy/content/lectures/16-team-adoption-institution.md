---
title: "Lecture 16 — Biến công cụ thành quy trình của cả team"
description: "Một người giỏi tame agent qua kinh nghiệm. Cả team không thể dựa vào đó. Cần quy trình chung."
order: 16
duration: "10 phút đọc"
tags: [team, adoption, process]
---

## Vấn đề: cá nhân thành công, cả team không scale

Một thành viên senior biết cách làm việc với AI agent qua kinh nghiệm — viết hướng dẫn (CLAUDE.md) tốt, biết khi nào dùng skill, biết kiểm tra (verify) bằng bằng chứng cụ thể. Họ ra kết quả ổn.

Cả team thì không. Vì:
- Mỗi người setup file hướng dẫn khác nhau
- Quy tắc cho phép tool mỗi người mỗi kiểu
- Tiêu chuẩn "đã xong" không thống nhất
- Skill viết riêng, không chia sẻ
- Lịch sử session không lưu, kinh nghiệm mất theo

→ Đây là "thủ thuật cá nhân", không phải "năng lực tổ chức".

> Một chuyên gia có thể tame agent bằng kinh nghiệm. Cả team thì không thể dựa vào điều đó.

## 6 trụ của một quy trình team

Để chuyển từ cá nhân thành team capability, cần 6 thứ:

### 1. File hướng dẫn theo lớp

Mục tiêu không phải bắt mọi tool dùng cùng tên file. Mục tiêu là có **project-level instruction** nằm trong version control.

Ví dụ lớp hướng dẫn:

```
Cấp tổ chức:        policy/runbook chung
Cấp người dùng:     preference cá nhân, không quyết định output project
Cấp project:        <repo>/AGENTS.md hoặc <repo>/CLAUDE.md
Cấp module:         nested AGENTS.md / rules theo thư mục
Cấp local:          file local không commit, chỉ cho override cá nhân
```

→ Quy tắc của team sống trong **cấp project**, có version control, ai trong team cũng đọc cùng nội dung.

Template gợi ý cho project:

```markdown
# Project — <Tên>

## Stack (đã team thống nhất)
...

## Lệnh chạy
...

## Quy tắc (team bắt buộc)
- Không commit khi test chưa pass
- Mọi thay đổi API yêu cầu ADR trong docs/decisions/
- Action destructive yêu cầu user duyệt explicit

## Skill được load tự động
- .claude/skills/verification-before-completion/
- .claude/skills/init-session/
- .claude/skills/session-cleanup/

## Convention
...
```

### 2. Ranh giới phê duyệt rõ ràng

Định nghĩa **3 mức quyền** cho mọi tool có rủi ro:

```json
{
  "permissions": {
    "allow": [
      "Read", "Edit", "Glob", "Grep",
      "Bash(npm test:*)",
      "Bash(git status:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(git push --force:*)"
    ],
    "ask": [
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Write(.env*)"
    ]
  }
}
```

3 mức:
- **allow**: tự động cho phép (action an toàn)
- **deny**: từ chối thẳng (action nguy hiểm)
- **ask**: hỏi người dùng trước khi chạy (action quan trọng)

→ Cùng project, mọi người có cùng quy tắc quyền. Không "tôi tin agent hơn bạn nên cho phép nhiều hơn". Secret, deploy, migration, billing, production data luôn thuộc nhóm `ask` hoặc `deny`.

### 3. Skill chạy được, không phải tài liệu để đọc

Skill phải là **gói có thể chạy**, không phải file README để tham khảo.

Mỗi skill là 1 folder trong `.claude/skills/`:

```
.claude/skills/
├── verification-before-completion/
│   ├── SKILL.md        ← điều kiện trigger + workflow
│   └── scripts/
│       └── run-checks.sh   ← script chạy thật
├── init-session/
└── session-cleanup/
```

Workflow chuẩn:
- Skill có description rõ trigger → agent tự load đúng lúc
- Script làm việc cụ thể → output có thể đoán trước
- Cả team chia sẻ cùng skill → hành vi nhất quán

### 4. Tự động hoá qua Hook lifecycle

Hook chạy tự động trên các sự kiện — không phụ thuộc vào việc cá nhân có nhớ hay không.

`.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "startup", "hooks": [
          { "type": "command", "command": "cat CLAUDE.md" },
          { "type": "command", "command": "git status --short" }
      ]}
    ],
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [
          { "type": "command", "command": "scripts/permission-check.sh" }
      ]}
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write", "hooks": [
          { "type": "command", "command": "scripts/format-file.sh" }
      ]}
    ],
    "SessionEnd": [
      { "matcher": "*", "hooks": [
          { "type": "command", "command": "scripts/save-transcript.sh" }
      ]}
    ]
  }
}
```

→ Hook là **enforcement tự động**. Dev không cần nhớ "phải format file" — hook tự làm.

### 5. Lưu lại transcript có thể tra cứu

Mọi session phải có dấu vết:

- Hook SessionEnd lưu transcript ra `docs/sessions/<ngày>-<chủ-đề>.jsonl`
- PR đính kèm session log liên quan
- Khi có sự cố: đọc transcript để hiểu agent fail ở đâu, học bài học
- Redact secret, token, customer data trước khi lưu hoặc attach vào PR

Format gợi ý:

```
docs/sessions/
├── 2026-05-21-auth-rewrite.jsonl
├── 2026-05-22-add-search-endpoint.jsonl
└── 2026-05-23-bugfix-cookie.jsonl
```

→ Kinh nghiệm được tích luỹ. Lần sau gặp lỗi tương tự → tìm trong transcript cũ.

### 6. Định nghĩa "đã xong" thống nhất (Definition of Done)

Tất cả thành viên dùng **cùng một định nghĩa "đã xong"**:

```markdown
# Definition of Done — chuẩn team

Task được coi là XONG khi TẤT CẢ:
- [ ] Type check pass
- [ ] Lint pass
- [ ] Unit test pass
- [ ] E2E test pass (nếu có thay đổi UI/API)
- [ ] Output test đã paste vào PR description
- [ ] Không có TODO mới không kèm ticket link
- [ ] ADR đã tạo (nếu có quyết định kiến trúc)
```

→ Lưu trong `docs/dod.md` hoặc CLAUDE.md. Skill verify check theo đúng list này.

## Lộ trình onboarding cho thành viên mới

Khi có người mới join team:

| Ngày | Hoạt động | Kết quả |
|------|-----------|---------|
| 1 | Clone repo + đọc CLAUDE.md | Hiểu stack, lệnh, quy tắc |
| 1 | Cài tool team đang dùng (Claude Code / Codex) | settings.json đã có trong repo → hook tự load |
| 2 | Làm task nhỏ đầu tiên | Skill init chạy · skill verify enforce DoD · hook lưu transcript |
| 3 | Review transcript ngày 2 | Hiểu pattern team |
| 5 | Tự tin nhận task vừa | Onboarded |

→ Thành viên mới đi theo workflow chuẩn ngay. Không cần "senior train 2 tuần".

## Anti-pattern (cần tránh)

### ❌ "Tôi setup riêng cho mình"

Mỗi người dùng `~/.claude/CLAUDE.md` riêng, project không có file chung. Khi pair, mỗi người làm một kiểu.

→ Đúng: project `AGENTS.md` / `CLAUDE.md` là nguồn chung. Cấp user chỉ chứa preference cá nhân không ảnh hưởng output (theme, alias).

### ❌ "Skill là tài liệu để đọc"

Skill viết kiểu README → không trigger được → không ai dùng.

→ Đúng: skill có description trigger rõ ràng, body có step actionable, script chạy được.

### ❌ "Hook là chuyện của admin"

Dev nghĩ hook do admin setup. Không ai sửa khi outdated.

→ Đúng: hook là code, có version control, dev review trong PR như code khác.

### ❌ "Transcript là log debug, xoá định kỳ"

Transcript là **tài sản kiến thức**. Xoá = mất bài học.

→ Đúng: archive theo task, search được, đính kèm PR liên quan.

### ❌ DoD ngầm hiểu

"Mọi người biết là phải chạy test mà" → người mới không biết → bug.

→ Đúng: DoD viết ra, link từ CLAUDE.md, skill verify enforce.

## Lộ trình áp dụng 4 tuần

Team đang dùng agent ad-hoc → muốn quy trình hoá? Đề xuất:

| Tuần | Mục tiêu | Output |
|------|---------|--------|
| 1 | Tập trung quy tắc chung | Viết `AGENTS.md` hoặc `CLAUDE.md` cấp project, commit vô repo |
| 2 | Quyền + skill | Setup `.claude/settings.json` + 3 skill cơ bản (init / verify / cleanup) |
| 3 | Hook + transcript | Setup lifecycle hook + folder `docs/sessions/` |
| 4 | DoD + onboarding | Viết `docs/dod.md` + onboarding guide cho người mới |

→ Sau 4 tuần, team có quy trình thật, không phải kỹ năng cá nhân.

## Đo hiệu quả

Số liệu cần theo dõi:

- **Thời gian onboard**: bao lâu thành viên mới đạt productive (mục tiêu: < 1 tuần)
- **Tỷ lệ bug**: bug lọt qua task có dùng agent (mục tiêu: giảm 50% sau 2 tháng)
- **Token chi tiêu / feature**: chi phí agent trung bình mỗi feature
- **Thời gian từ task đến merge** (PR cycle time)
- **Tỷ lệ skill được dùng**: skill được trigger / tổng số session

→ Đánh giá bằng số, không cảm tính.

## Ai phụ trách gì?

| Vai trò | Trách nhiệm |
|---------|-------------|
| **Tech Lead** | Định nghĩa instruction cấp project, approval boundary, DoD |
| **DevOps / Admin** | Setup hook lifecycle, lưu transcript, dashboard metric |
| **Developer** | Viết và bảo trì skill, đóng góp pattern mới |
| **QA / Tester** | Định nghĩa verify gate, test pattern lỗi, kiểm DoD |
| **BA / PM** | Quyết định scope agent, approval policy ở góc độ business |

→ Mỗi vai trò có phần việc rõ. Không "ai cũng có thể, nhưng không ai làm".

## Điểm chính

- Thủ thuật cá nhân không scale. Cần quy trình team
- 6 trụ: file hướng dẫn layered · ranh giới phê duyệt · skill chạy được · hook lifecycle · transcript lưu được · DoD thống nhất
- Hook = tự động hoá, không phụ thuộc kỷ luật cá nhân
- DoD viết ra, không ngầm hiểu
- Transcript = tài sản kiến thức, archive + search được
- Lộ trình 4 tuần khả thi cho team đang ad-hoc
- Mọi vai trò (dev / QA / BA / PM / Lead) đều có phần việc trong quy trình

## Tổng kết toàn khoá

16 lecture đã đi qua, chia 3 nhóm:

**Nền tảng (L01 → L12)** — vì sao agent fail, harness là gì, 5 subsystem cốt lõi, kỷ luật vận hành.

**Mở rộng pattern (L13 → L14)** — orchestrator + sub-agent, vòng lặp hoạt động runtime.

**Resilience + Team (L15 → L16)** — lỗi là chuyện thường ngày, biến công cụ thành quy trình team.

Bước thực hành tiếp theo: [Projects](/projects) — áp vào dự án thật. Hoặc thiết kế [Skills](/skills) riêng phù hợp với team bạn.
