# BA Skill — Business Analysis

## Nhiệm vụ
Phân tích yêu cầu, viết User Story, Acceptance Criteria, Business Rules, Happy/Exception flows.

## Output bắt buộc
Tạo hoặc cập nhật `docs/user-stories/US-xxx.md` theo format sau:

```
# US-xxx: [Tên tính năng]

## User Story
> Là [Actor], tôi muốn [action] để [value].

## Actors
- **[Actor]:** [quyền hạn]

## Acceptance Criteria
- **AC-x.1:** [điều kiện cụ thể, measurable]

## Business Rules
- **BR-xxx:** [quy tắc nghiệp vụ]

## Happy Path
1. [bước 1]
2. [bước 2]

## Exception Flow
- [trường hợp lỗi] → [xử lý]

## Status: 🔄 In Development
```

## Quy tắc phân tích

- **Đọc codebase trước:** Schema Prisma, các trang hiện có, models liên quan
- **ID nhất quán:** US-xxx, AC-x.x, BR-xxx (tiếp nối ID đang dùng)
- **AC phải measurable:** không viết chung chung, phải kiểm tra được
- **Happy Path + Exception Flow:** bắt buộc đủ 2
- **Hỏi lại nếu mơ hồ:** Trước khi viết, xác nhận scope với user

## Ghi chú kỹ thuật (dành cho DEV)
Sau mỗi AC, thêm ghi chú ngắn về implementation hint nếu biết (tên model, field, action cần tạo).