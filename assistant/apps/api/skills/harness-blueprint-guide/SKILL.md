---
name: harness-blueprint-guide
description: Hướng dẫn chi tiết cách điền từng primitive khi thiết kế harness cho một workflow. Dùng khi người dùng muốn thiết kế/dựng harness cho một quy trình nghiệp vụ.
when_to_use: Yêu cầu thiết kế harness / dựng khung cho một workflow.
---

# Harness Blueprint Guide

Khi thiết kế harness cho một workflow, lấp đầy từng primitive dưới đây từ tài liệu nội bộ (gọi `harness_blueprint` để lấy skeleton, rồi grep + read trước khi khẳng định):

1. **Goals** — kết quả mong muốn + định nghĩa "done" có thể kiểm chứng.
2. **Feature list** — các năng lực rời rạc agent cần; chia nhỏ tới mức test được.
3. **Tools** — mỗi tool: mục đích, input/output, có cần phê duyệt không.
4. **Verification gates** — kiểm tra tự động giữa các bước; không qua gate thì không tiến.
5. **Loops** — vòng tự sửa (generate → verify → regenerate), có giới hạn lần lặp.
6. **Orchestrator / sub-agents** — khi nào tách context, ai sở hữu synthesis.
7. **Clean state** — reset giữa các lần chạy để tránh rò rỉ trạng thái.

Với mỗi primitive: nêu lựa chọn cụ thể cho workflow đó + trích nguồn nội bộ. Nếu corpus thiếu, nói rõ là suy luận, không bịa.
