# US-005: Sổ quỹ

## User Story
> Là Manager, tôi muốn ghi nhận thu/chi nội bộ để kiểm soát tài chính của cửa hàng.

## Actors
- **Manager:** Tạo phiếu thu/chi, xem báo cáo, kiểm tra số dư
- **Admin:** Toàn quyền như Manager

## Acceptance Criteria

- **AC-5.1:** Tạo phiếu thu (INCOME) hoặc phiếu chi (EXPENSE) với đầy đủ: loại, số tiền, mô tả, danh mục, ngày giao dịch
  - _Hint: `createTransaction` server action, model `CashTransaction`_
- **AC-5.2:** Xem danh sách giao dịch có thể lọc theo khoảng thời gian (từ ngày — đến ngày) và loại (thu/chi/tất cả)
  - _Hint: query param `from`, `to`, `type` → Prisma `where` filter_
- **AC-5.3:** Hiển thị số dư quỹ hiện tại = Tổng INCOME - Tổng EXPENSE
  - _Hint: `prisma.cashTransaction.aggregate` với `_sum.amount` nhóm theo type_
- **AC-5.4:** Trang báo cáo tổng kết thu/chi trong kỳ: tổng thu, tổng chi, số dư cuối kỳ
  - _Hint: aggregate theo `type` với `where date` trong khoảng lọc_

## Business Rules
- **BR-005:** Phiếu chi chỉ được tạo khi số dư quỹ hiện tại >= số tiền chi (tồn quỹ không âm)
- **BR-006:** Số tiền phải > 0
- **BR-007:** Ngày giao dịch không được ở tương lai

## Happy Path
1. Manager truy cập `/admin/cashbook`
2. Xem số dư quỹ hiện tại và danh sách giao dịch gần nhất
3. Click "Tạo phiếu thu" / "Tạo phiếu chi"
4. Nhập: loại, số tiền, mô tả, danh mục, ngày
5. Hệ thống validate (BR-005, BR-006, BR-007)
6. Lưu giao dịch → cập nhật số dư → redirect về danh sách
7. Manager lọc danh sách theo khoảng thời gian → xem báo cáo tổng kết

## Exception Flows
- Phiếu chi vượt số dư → hiển thị lỗi "Số dư quỹ không đủ (hiện có: X VNĐ)"
- Số tiền <= 0 → lỗi validation "Số tiền phải > 0"
- Ngày tương lai → lỗi validation "Ngày giao dịch không được ở tương lai"
- Thiếu mô tả → lỗi "Mô tả không được trống"

## Status: ✅ Verified
