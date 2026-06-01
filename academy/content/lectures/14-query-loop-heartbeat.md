---
title: "Lecture 14 — Vòng lặp hoạt động của Agent"
description: "Agent thật không phải hỏi một câu trả lời một câu. Cần vòng lặp liên tục có 5 thành phần để xử lý task dài."
order: 14
duration: "9 phút đọc"
tags: [runtime, architecture]
---

## Đặt vấn đề

Nhiều người thấy AI Agent trông giống chatbot — gõ câu hỏi, nhận câu trả lời, hết. Đó chỉ là **demo**.

Agent thật phải xử lý task kéo dài: đọc file, gọi tool, chờ kết quả, gặp lỗi, quyết định bước tiếp, dừng khi xong. Tất cả nằm trong một **vòng lặp** chạy liên tục — gọi là **vòng lặp hoạt động** (query loop) của agent.

> Không có vòng lặp đúng, agent chỉ trông đẹp khi demo, không dùng được trong thực tế.

Trong kiến trúc harness, loop này thuộc **control plane**. File system, shell, browser, sandbox là **execution plane**. Control plane quyết định thấy gì, gọi tool nào, approve ra sao, và khi nào dừng.

## 5 thành phần của vòng lặp

Hình dung vòng lặp như nhịp đập trái tim. Mỗi nhịp gồm 5 bước:

### 1. Tiếp nhận đầu vào

Trước khi đẩy yêu cầu cho AI, harness phải:

- Kiểm tra định dạng đầu vào hợp lệ
- Loại bỏ thông tin nhạy cảm (mật khẩu, token vô tình lộ)
- Cắt bớt nếu quá dài
- Bổ sung ngữ cảnh cần thiết (file hướng dẫn, skill liên quan)

→ Đầu vào lộn xộn = đầu ra lộn xộn. Bước đầu phải sạch.

### 2. Đọc phản hồi từng phần

AI không trả lời cả gói. Nó trả về **từng đoạn** một (gọi là stream — luồng dữ liệu). Vòng lặp phải:

- Đọc từng đoạn ngay khi có
- Phát hiện khi nào AI muốn gọi tool (đọc file, chạy lệnh)
- Hiển thị nội dung dần dần cho người dùng
- Xử lý nếu kết nối bị ngắt giữa chừng

→ Đọc từng phần giúp **dừng được giữa chừng** + người dùng thấy phản hồi sớm.

### 3. Điều phối công cụ

Khi AI muốn dùng tool, vòng lặp quyết định:

- **Tool nào chạy song song được, tool nào phải chạy tuần tự**
  Ví dụ: đọc 5 file song song được. Sửa cùng 1 file song song = hỏng.
- **Tool nào cần xin phép**
  Đọc file: thường cho phép. Xoá file: phải hỏi người dùng.
- **Theo dõi thứ tự ảnh hưởng**
  Nếu tool A và B đều sửa context, kết quả phải xếp đúng thứ tự AI đã yêu cầu — không phải "tool nào xong trước thắng".

→ Đây là điểm phân biệt agent đồ chơi với agent dùng thật.

### 4. Nhánh khôi phục lỗi

Trong khi loop chạy, sẽ có sự cố:

- Tool báo lỗi → thử lại hoặc bỏ qua?
- Hết thời gian chờ → dừng hay tiếp tục?
- Context đầy → kích hoạt nén (compact) lại
- Hook báo lỗi → giảm cấp độ thay vì kill cả session

→ Lỗi là chuyện thường ngày của agent. Không có nhánh xử lý lỗi = session chết ngang.

### 5. Điều kiện dừng

Vòng lặp phải biết khi nào kết thúc:

- AI báo "xong"
- Người dùng bấm Ctrl+C dừng
- Đạt giới hạn số lượt lặp tối đa
- Vượt ngân sách token cho phép
- Gate kiểm tra (verify/evaluator) đã pass → task hoàn tất

→ Không có điều kiện dừng rõ → vòng lặp vô hạn hoặc dừng sai chỗ.

## Sơ đồ vòng lặp

```
┌─────────────────────────────────────────┐
│           VÒNG LẶP HOẠT ĐỘNG            │
│                                         │
│   1. Tiếp nhận đầu vào                  │
│            ↓                            │
│   2. Đọc phản hồi từng phần ←──┐        │
│            ↓                   │        │
│   3. Điều phối công cụ         │        │
│      ├─ Xin phép               │        │
│      ├─ Song song / tuần tự    │ nhánh  │
│      └─ Chạy + ghi log         │ khôi   │
│            ↓                   │ phục   │
│   4. Có lỗi? ──────────────────┘        │
│            ↓                            │
│   5. Đã đến điều kiện dừng?             │
│      ├─ chưa → lặp tiếp                 │
│      └─ rồi → kết thúc + dọn dẹp        │
│                                         │
└─────────────────────────────────────────┘
```

## Ai cần hiểu điều này?

### Tester & QA

Khi viết test cho AI agent, bạn cần biết loop có 5 thành phần để **test đúng chỗ**:

- Test input governance → check input bẩn có bị từ chối không
- Test stream → kiểm Ctrl+C có thật sự dừng không
- Test permission → tool destructive có hỏi không
- Test recovery → tool fail có cascade làm hỏng session không
- Test stop → max iteration có hoạt động không

→ Không hiểu loop = test thiếu, bug lọt.

### Business Analyst & Product Manager

Khi định nghĩa workflow agent cho team, bạn cần quyết định:

- Tool nào tự động, tool nào hỏi user
- Khi lỗi xảy ra, agent nên dừng hay thử lại
- Giới hạn ngân sách (token / thời gian) là bao nhiêu

→ Đây là quyết định business, không phải dev. Hiểu loop = quyết định được.

### Developer

Khi build agent từ SDK hoặc tích hợp tool thương mại, loop là **trục chính của hệ thống**. Mọi feature đều gắn vào 1 trong 5 thành phần.

## Tình huống thực tế

**Bug điển hình**: agent đột ngột dừng giữa task quan trọng.

Phân tích: kiểm tra theo 5 thành phần.

1. Input có bị reject không? → log input governance
2. Stream có bị ngắt không? → log connection
3. Tool nào fail? → log tool exec
4. Recovery có trigger không? → log error branch
5. Stop condition nào match? → log stop reason

→ Tìm đúng 1 trong 5 chỗ là biết nguyên nhân.

Không có cấu trúc 5 phần này → debug đoán mò.

## Anti-pattern (cần tránh)

### ❌ Loop kiểu chatbot đơn giản

```
Lặp đi lặp lại:
  Đợi câu hỏi
  Gọi AI
  In câu trả lời
```

Thiếu: stream, permission, recovery, tool điều phối, stop logic.

### ✅ Loop production-grade

```
Lặp khi session chưa xong:
  Bước 1: nhận và làm sạch input
  Bước 2: đọc stream từ AI
    - nếu AI muốn gọi tool:
        kiểm tra quyền → cho phép / từ chối / hỏi user
        nếu cho phép → chạy tool, ghi log
    - nếu là text:
        hiển thị cho user
  Bước 3: nếu context gần đầy → nén
   Bước 4: verify/evaluate nếu task claim xong
   Bước 5: kiểm điều kiện dừng → nếu thoả → thoát
Kết thúc: dọn dẹp + lưu transcript/trace
```

→ Mỗi nhánh có mục đích rõ.

## Điểm chính

- Demo = hỏi-trả-hết. Agent thật = vòng lặp liên tục
- 5 thành phần: tiếp nhận đầu vào · đọc stream · điều phối tool · khôi phục lỗi · điều kiện dừng
- Control plane giữ loop; execution plane chạy file/shell/browser/API
- Khôi phục lỗi là nhánh chính, không phải patch sau
- Hiểu loop giúp tester test đúng chỗ, BA/PM quyết định đúng, dev debug đúng

## Tiếp theo

[Lecture 15 — Lỗi là chuyện thường, không phải ngoại lệ](/lectures/15-error-path-la-main-path)
