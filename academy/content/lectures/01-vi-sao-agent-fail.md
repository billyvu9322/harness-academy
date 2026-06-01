---
title: "Lecture 01 — Vì sao Agent giỏi vẫn fail?"
description: "Model mạnh không đảm bảo agent đáng tin. Vấn đề gốc rễ nằm ở harness."
order: 1
duration: "10 phút đọc"
tags: [foundation, mental-model]
---

## Tình huống điển hình

Một AI model hàng đầu (Claude, GPT-5, Gemini) trả lời hoàn hảo các câu hỏi đơn lẻ. Khi giao nhiệm vụ thực tế — *"sửa bug authentication, đảm bảo test pass, không phá feature khác"* — kết quả thường:

- Bug được sửa, test cục bộ pass
- CI fail do agent xoá file config không liên quan
- Hoặc tuyên bố hoàn thành mà chưa chạy test
- Hoặc tự ý refactor toàn module ngoài phạm vi

Nguyên nhân **không phải năng lực reasoning của model**.

## Vấn đề thật: lỗi harness lặp lại

### 1. Lose context (mất ngữ cảnh)

Task dài → context window đầy → harness compact → chi tiết quan trọng biến mất. Agent quên decision đã chốt 20 phút trước.

### 2. Overreach (lan rộng phạm vi)

Được giao "sửa bug nhỏ" → agent thấy code "không sạch" → refactor luôn → 200 file thay đổi → bạn không review nổi.

### 3. Premature victory (báo done sớm)

Agent viết: *"I've successfully implemented the feature."* — nhưng chưa chạy test, chưa kiểm e2e, có khi chưa lưu file.

### 4. Dirty state (rác giữa session)

Session trước tạo file tạm, không clean. Session sau load lại, tưởng là code thật, build lên đó. Bug cascade.

### 5. Không có observability

Agent fail giữa chừng nhưng không có trace: không biết tool nào chạy, lệnh nào fail, context nào bị thiếu. Lần sau lại fail cùng kiểu.

### 6. Self-evaluation bias

Agent tự đánh giá code do chính nó viết. Không có evaluator, test, log, browser check bên ngoài → confidence cao nhưng bằng chứng thấp.

## Vì sao model giỏi không sửa được?

Vì những lỗi trên **không phải lỗi reasoning**. Đó là lỗi:
- **Hành vi** (behavior) — biết nên dừng nhưng vẫn làm
- **Trí nhớ** (memory) — không có chỗ lưu state dài hạn
- **Kỷ luật** (discipline) — không có gate ép verify trước claim done

Model có thể *biết* nên làm đúng. Nhưng không có **cơ chế ép buộc** thì vẫn trượt.

## Đây chính là vai trò của Harness

**Harness Engineering** là kỹ thuật thiết kế, kiểm thử, và cải thiện hệ thống điều khiển quanh model: instruction, tool, environment, state, permission, verification, recovery, observability, và operating discipline.

Nói đơn giản hơn: mỗi khi agent mắc lỗi, bạn không cầu nguyện nó làm tốt hơn lần sau. Bạn sửa harness layer làm lỗi đó xảy ra.

**Harness** = bộ scaffolding quanh model, cung cấp:
- Cơ chế lưu state ngoài context window
- Cơ chế ép verify
- Cơ chế khoá scope
- Cơ chế clean cuối session

Model cung cấp năng lực. Harness cung cấp kỷ luật.

## Điểm chính

- Đừng đoán phần trăm. Hãy đo failure mode: lỗi do thiếu context, thiếu tool, thiếu environment, thiếu state, hay thiếu feedback.
- Mọi tool thương mại (Claude Code, Codex, OpenCode, Gemini CLI) đều là harness — khác về chi tiết, chung về nguyên lý
- Học harness = thiết kế **hệ thống vận hành** quanh AI, không phải kỹ thuật prompt khéo léo

## Tiếp theo

[Lecture 02 — Harness thực sự là gì?](/lectures/02-harness-la-gi)
