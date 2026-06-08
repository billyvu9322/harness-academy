# Seminar Q&A Notes

Ghi chú bổ sung cho seminar **Harness Engineering​: Building and Operating Reliable AI Agents with Claude Code​**.

## 1. Target audience

Audience chính:

- Software engineers đang dùng hoặc chuẩn bị dùng Claude Code, Codex, Cursor, hoặc các coding agent tương tự.
- QA / automation testers muốn dùng AI để sinh, review, chạy Playwright hoặc E2E test.
- Tech lead / architect / engineering manager muốn biến việc dùng AI từ kinh nghiệm cá nhân thành quy trình team.
- Người build AI assistant hoặc agent nội bộ, cần grounding, guardrail, eval, trace, citation.

Kiến thức nên có:

- Biết Git, repo structure, pull request, code review.
- Biết cơ bản về test: unit, integration, E2E, lint, typecheck, build.
- Đã từng dùng LLM/coding agent và gặp vấn đề như agent làm sai, sửa lan man, hoặc báo done quá sớm.
- Với phần demo sâu hơn, TypeScript, Node, React, Playwright, Postgres là lợi thế nhưng không bắt buộc.

Sau seminar, người nghe nên hiểu thêm:

- Harness là gì: không phải model, mà là operating layer quanh model.
- Vì sao model mạnh vẫn fail nếu context, tools, state, guardrails, verification yếu.
- Cách thiết kế `AGENTS.md`, progress file, feature list, verification gate, trace/evidence.
- Cách tách orchestrator/sub-agent để giảm context overload.
- Cách biến "agent tự tin nói đã xong" thành "agent phải có bằng chứng".

## 2. Content mang lại lợi ích gì?

Lợi ích lớn nhất của seminar là đổi mindset:

> Không chỉ hỏi "AI làm được hay không?", mà hỏi "harness của mình có đủ tốt để AI làm việc đáng tin không?".

Các vấn đề seminar giúp giải quyết:

- Agent bắt đầu task mà không hiểu repo, không biết lệnh chạy, test, build.
- Prompt càng dài càng rối, context bị đầy, compaction làm mất quyết định cũ.
- Agent overreach: sửa quá nhiều file, đụng ngoài scope.
- Agent under-finish: mới viết code đã báo done, chưa test, chưa trace.
- Reviewer phải tự đoán agent đã làm gì vì không có evidence.
- Mỗi người trong team dùng AI theo một kiểu, không scale thành quy trình chung.
- Test automation do AI sinh ra dễ flaky: sleep bừa, assertion yếu, skip test, không có scenario approval.

Hai demo trong seminar minh hoạ lợi ích thực tế:

- **Assistant harness**: câu hỏi đi qua input guardrail, orchestrator, docs lookup, answer with citations, state trong Postgres, trace mỗi turn. Demo này giải quyết vấn đề assistant bịa nguồn, trả lời ngoài corpus, và khó debug.
- **Automation test harness**: intake, context routing, generate, review checklist, run & trace. Demo này giải quyết vấn đề AI sinh test thiếu kiểm soát, không có bằng chứng, và không phân biệt được lỗi test, lỗi app, lỗi harness.

## 3. Action sau seminar

### 1. Tạo `AGENTS.md` cho repo

Mỗi repo nên có một file hướng dẫn ngắn cho AI agent. File này trả lời các câu cơ bản: repo này làm gì, dùng stack gì, chạy bằng lệnh nào, test bằng lệnh nào, và khi nào thì được xem là "done".

### 2. Ghi rõ lệnh verification

Đừng để agent tự đoán cách kiểm tra. Hãy ghi sẵn các lệnh như typecheck, lint, test, build, E2E. Sau này khi giao việc, agent phải chạy các lệnh này hoặc nói rõ vì sao không chạy được.

### 3. Chia task thành feature list nhỏ

Thay vì giao "làm chức năng search", hãy chia thành các việc nhỏ có thể kiểm tra được: thêm input search, gọi API, hiển thị kết quả, xử lý empty state. Mỗi item phải biết rõ pass/fail.

### 4. Khóa phạm vi trước khi làm

Nói rõ agent được sửa phần nào và không được sửa phần nào. Ví dụ: "chỉ sửa trong `apps/web`, không đổi API contract". Việc này giảm lỗi agent sửa lan man hoặc refactor ngoài yêu cầu.

### 5. Ghi lại tiến độ và bằng chứng

Sau mỗi task, agent nên để lại ghi chú: đã sửa gì, file nào đổi, lệnh nào đã chạy, kết quả ra sao, còn blocker gì. Nếu chat bị mất context, người hoặc agent khác vẫn tiếp tục được.

### 6. Với QA/tester: dùng checklist khi sinh test

Không chấp nhận test AI sinh ra nếu có `sleep` bừa, assertion yếu, hoặc skip test để pass. Trước khi viết Playwright code, nên có scenario plan được review trước.

### 7. Với team lead: chọn một repo pilot

Đừng rollout toàn công ty ngay. Chọn một repo nhỏ, áp dụng harness trong 1 tuần, rồi đo các chỉ số đơn giản: agent có báo done sai không, review có nhanh hơn không, test pass rate có tốt hơn không.

