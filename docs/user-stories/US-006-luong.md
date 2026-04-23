# US-006: Lương

## User Story
> Là Manager, tôi muốn tính lương nhân viên dựa trên chấm công để trả lương chính xác và minh bạch.

## Actors
- **Manager / Admin:** Tính lương, xem bảng lương, xác nhận, đánh dấu đã trả

## Acceptance Criteria

- **AC-6.1:** Tính lương tự động cho nhân viên theo tháng/năm: tổng giờ làm lấy từ bảng `Attendance`, nhân với `hourlyRate` của nhân viên, cộng phụ cấp, trừ khấu trừ
  - _Hint: `calculatePayroll` action, aggregate `totalHours` từ Attendance theo employeeId + tháng/năm_
- **AC-6.2:** Xem bảng lương tổng hợp tháng: danh sách nhân viên, giờ làm, lương gross, lương net, trạng thái (DRAFT/CONFIRMED/PAID)
  - _Hint: `prisma.payroll.findMany` với include employee, filter month/year_
- **AC-6.3:** Xác nhận phiếu lương (DRAFT → CONFIRMED) và đánh dấu đã trả (CONFIRMED → PAID)
  - _Hint: `confirmPayroll`, `markPaid` actions, update `status` field_
- **AC-6.4:** Xem chi tiết phiếu lương từng nhân viên: giờ làm, đơn giá, phụ cấp, khấu trừ, gross, net
  - _Hint: trang `/admin/payroll/[id]`_

## Business Rules
- **BR-008:** Lương gross = (totalHours × hourlyRate)
- **BR-009:** Lương net = gross + allowance - deduction
- **BR-010:** Một nhân viên chỉ có 1 phiếu lương cho mỗi tháng/năm (unique constraint đã có)
- **BR-011:** Phiếu đã PAID không được tính lại (chỉ xem)

## Happy Path
1. Manager truy cập `/admin/payroll`
2. Chọn tháng/năm, click "Tính lương"
3. Hệ thống tổng hợp giờ làm từ Attendance, tạo/cập nhật bảng lương (status DRAFT)
4. Manager xem bảng lương, kiểm tra từng phiếu
5. Click "Xác nhận" → status chuyển CONFIRMED
6. Click "Đã trả" → status chuyển PAID

## Exception Flows
- Nhân viên không có chấm công trong tháng → totalHours = 0, vẫn tạo phiếu DRAFT
- Phiếu đã PAID → không cho tính lại, hiển thị thông báo
- Tháng/năm không hợp lệ → lỗi validation

## Status: ✅ Verified
