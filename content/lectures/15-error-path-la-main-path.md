---
title: "Lecture 15 — Lỗi là chuyện thường, không phải ngoại lệ"
description: "Agent dài hạn luôn gặp lỗi. Cần khôi phục, giới hạn thử lại, chặn vòng lặp ngay từ lúc thiết kế."
order: 15
duration: "9 phút đọc"
tags: [error, recovery, resilience]
---

## Quan niệm cũ vs đúng

**Quan niệm cũ** (theo lối lập trình thông thường):
- Đường đi chính: thành công
- Đường lỗi: ngoại lệ, xử lý sau

**Quan niệm đúng cho AI Agent dài hạn**:
- Đường lỗi **là** đường chính
- Lỗi không phải ngoại lệ — là **thời tiết bình thường**, luôn có

Lý do: agent chạy hàng giờ qua nhiều bước, gọi nhiều tool bên ngoài (mạng, database, browser), context tăng dần, AI sinh ra output không phải lúc nào cũng nhất quán. Xác suất gặp lỗi cộng dồn rất cao.

## 5 lỗi quen thuộc của agent

### 1. Quá tải ngữ cảnh (Context đầy)

**Triệu chứng**: AI báo lỗi "vượt giới hạn ngữ cảnh", không nhận thêm message.

**Khắc phục**:
- Trigger nén context ngay lập tức (compact)
- **Phòng trước**: dành buffer dự phòng (ví dụ giữ trống 20% cho summary)
- Theo dõi kích thước context — nén **trước** khi đầy, không đợi báo lỗi

### 2. Bị cắt giữa câu trả lời

**Triệu chứng**: AI trả lời thiếu nửa câu, output bị cắt cụt.

**Khắc phục**:
- **Yêu cầu viết tiếp** từ chỗ bị cắt (continue)
- KHÔNG hỏi user "viết lại từ đầu" — tốn token + chậm
- Nếu là code: kiểm tra cú pháp, phát hiện thiếu → request viết tiếp

### 3. Bị ngắt giữa khi đang chạy tool

**Triệu chứng**: User bấm Ctrl+C giữa lúc tool đang chạy, hoặc tool bị timeout.

**Khắc phục**:
- Ghi nhận trạng thái tool bị gián đoạn vào lịch sử (không để AI giả vờ tool đã chạy xong)
- Cập nhật ledger: tool X bị ngắt ở bước Y
- Lần sau AI thấy rõ trạng thái, không hallucinate

### 4. Hook lặp vô tận

**Triệu chứng**: Session đứng yên, đốt token liên tục, không kết thúc.

Nguyên nhân: hook tự động kích hoạt tool khác → tool đó lại kích hoạt hook khác → vòng tròn.

**Khắc phục**:
- **Chặn lặp**: nếu cùng một tool gọi cùng input quá N lần → block
- Đếm số lần thực thi hook trong session: vượt ngưỡng → dừng
- Phát hiện pattern lặp → kill session với lý do rõ ràng

### 5. Nén context bị lỗi

**Triệu chứng**: Sau khi nén context, vẫn báo đầy → lỗi cascade.

**Khắc phục**:
- Có phương án dự phòng: nén không xong → cắt thẳng N message cũ nhất, giữ N message mới
- Ưu tiên "khôi phục thở được" trước, chất lượng tính sau
- Đừng để user kẹt trong trạng thái lỗi mà không có cách thoát

## 5 nguyên tắc thiết kế khôi phục lỗi

### 1. Thiết kế từ đầu, không vá sau

**SAI**:
- Build đường thành công → ship → user gặp lỗi → mới vá
- "Để retry sau" → không bao giờ làm

**ĐÚNG**:
- Thiết kế loop với nhánh lỗi là **first-class** ngay từ design
- Mỗi bước có quy trình khôi phục được định nghĩa
- Test đường lỗi **trước** đường thành công

### 2. Viết tiếp (continue) tốt hơn tóm tắt lại (recap)

Sau khi bị cắt, ưu tiên "viết tiếp" thay vì "tóm tắt rồi viết lại". Vì sao?

- **Continue**: AI giữ ngữ cảnh, tự nhiên viết tiếp
- **Recap**: AI bị buộc tóm tắt → mất chi tiết → user phải hỏi lại

> Engineering politeness thật sự là không để người dùng kẹt trong trạng thái lỗi.

### 3. Ngắt mạch (Circuit Breaker)

Học từ ngành điện: cầu chì tự ngắt khi quá tải.

3 trạng thái:
- **Đóng (Closed)**: bình thường, cho phép gọi tool
- **Mở (Open)**: lỗi liên tục > N lần → từ chối mọi call, trả về lỗi cached
- **Nửa mở (Half-open)**: sau khoảng thời gian T, thử 1 call. Pass → đóng lại. Fail → mở tiếp

Áp dụng cho:
- Gọi API bên ngoài bị rate limit
- Tool fail liên tục
- Hook trigger lặp lại

### 4. Giới hạn số lần thử lại

Mọi cơ chế retry phải có **hạn**:

| Loại lỗi | Thử lại tối đa | Thời gian chờ giữa các lần |
|----------|---------------|---------------------------|
| Lỗi mạng | 3 | 1s, 2s, 4s (tăng dần) |
| API rate limit | 5 | Theo header Retry-After |
| Tool timeout | 2 | 5s, 10s |
| Hook fail | 1 | Không retry, ghi log + giảm cấp |

→ Không có giới hạn = vòng lặp vô tận khi service down.

### 5. Chặn vòng lặp lặp lại (Anti-loop guard)

Phát hiện và phá pattern lặp:

```
Trong 1 session:
- Cùng tool + cùng input lặp > 3 lần trong N giây → kích hoạt chặn
- Cùng error message lặp > 5 lần → báo lên user
- Hook nối nhau sâu > 5 cấp → block + cảnh báo
```

## Pattern triển khai

### Hook kiểm tra trước khi gọi tool

Thêm vô `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "*", "hooks": [
          { "type": "command", "command": "scripts/check-loop.sh" }
      ]}
    ]
  }
}
```

Script `check-loop.sh` ghi log mỗi tool call. Nếu cùng tool+input gọi quá 3 lần → block và in lý do.

→ Hệ thống tự bảo vệ, không cần dev nhớ.

### Memory rule cứng

`CLAUDE.md`:

```markdown
## Xử lý lỗi

- Nếu tool fail 3 lần liên tiếp, DỪNG và báo user.
  KHÔNG retry vô hạn.
- Nếu context gần đầy, yêu cầu nén TRƯỚC khi báo lỗi token.
- Nếu bị ngắt giữa task, ghi trạng thái dang dở vô plan file
  trước khi yêu cầu bước tiếp.
```

## Anti-pattern (cần tránh)

### ❌ Khôi phục im lặng

```
AI: [tool fail] [thử cách khác im lặng] [eventually success]
```

User không biết gì đã xảy ra. Lần sau bug y hệt.

### ✅ Khôi phục minh bạch

```
AI: Tool X fail với lỗi "không tìm thấy file". 
    Lý do có thể là đường dẫn sai vì Y. 
    Thử cách khác: Z.
    Xong.
```

Dài dòng hơn nhưng debug được.

### ❌ Retry vô hạn

```
Lặp mãi:
  thử tool
  nếu fail thì lặp tiếp
```

### ✅ Retry có giới hạn + báo lên

```
Lặp tối đa N lần:
  thử tool
  nếu fail tạm thời → đợi rồi thử lại
  nếu fail nghiêm trọng → báo user, dừng
Nếu hết N lần vẫn fail → báo user "đã thử N lần", dừng
```

## Ai cần biết?

### Tester

Khi viết test cho AI workflow, **test đường lỗi quan trọng hơn đường thành công**:
- Mô phỏng tool fail → agent có dừng đúng không?
- Mô phỏng context gần đầy → nén có trigger không?
- Bấm Ctrl+C giữa chừng → trạng thái có rõ không?

### BA & PM

Quyết định business về xử lý lỗi:
- Khi nào dừng agent? (sau N lần fail, hay sau X phút?)
- Lỗi nào auto-recover, lỗi nào báo user?
- Khi nào escalate cho team?

### Developer

Implement các pattern: circuit breaker, retry limit, anti-loop guard, recovery branch trong code.

## Điểm chính

- Lỗi với agent dài hạn = thời tiết bình thường, không phải ngoại lệ
- 5 lỗi quen: context đầy · bị cắt câu trả lời · bị ngắt giữa tool · hook lặp · nén fail
- Thiết kế đường lỗi từ **lúc design**, không vá sau
- "Viết tiếp" tốt hơn "tóm tắt lại" khi khôi phục
- Ngắt mạch + giới hạn retry + chặn vòng lặp = bộ ba bắt buộc
- Khôi phục minh bạch, không im lặng

## Tiếp theo

[Lecture 16 — Biến công cụ thành quy trình của cả team](/lectures/16-team-adoption-institution)
