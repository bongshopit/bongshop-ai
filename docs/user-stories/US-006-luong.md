# US-006: Lương

## User Story
> Là Manager, tôi muốn tính lương (net) cho từng nhân viên hoặc toàn bộ nhân viên theo tháng để trả lương chính xác và minh bạch, không cần phân biệt gross/net.

## Actors
- **Manager / Admin:** Tính lương, xem bảng lương, xác nhận, đánh dấu đã trả

## Acceptance Criteria

- **AC-6.1:** Tính lương tự động cho tất cả nhân viên đang active theo tháng/năm: tổng giờ làm lấy từ bảng `Attendance`, nhân với `hourlyRate`, cộng phụ cấp, trừ khấu trừ → hiển thị duy nhất "Lương" (không tách gross/net)
  - _Hint: `calculatePayroll` action, aggregate `totalHours`, lưu kết quả vào `netSalary`, không hiển thị `grossSalary` ra UI_
- **AC-6.1b:** Tính lương cho **từng nhân viên** riêng lẻ: form "Tính lương" có dropdown chọn nhân viên (mặc định "Tất cả nhân viên"); khi chọn 1 nhân viên cụ thể, chỉ tính lại phiếu của người đó
  - _Hint: `calculatePayroll` nhận thêm optional `employeeId`, filter `prisma.employee.findMany` khi có_
- **AC-6.2:** Xem bảng lương tổng hợp tháng: danh sách nhân viên, giờ làm, **Lương** (netSalary), trạng thái (DRAFT/CONFIRMED/PAID) — không hiển thị cột Gross
  - _Hint: bỏ cột Gross trong table, đổi nhãn "Net" → "Lương"_
- **AC-6.3:** Xác nhận phiếu lương (DRAFT → CONFIRMED) và đánh dấu đã trả (CONFIRMED → PAID)
  - _Hint: `confirmPayroll`, `markPaid` actions, update `status` field_
- **AC-6.4:** Xem chi tiết phiếu lương: giờ làm, đơn giá, lương cơ bản, danh sách các khoản điều chỉnh, **Lương** — không dùng thuật ngữ "gross/net"
  - _Hint: trang `/admin/payroll/[id]`, hiển thị `PayrollAdjustment[]` theo từng dòng_
- **AC-6.5:** Thêm khoản điều chỉnh vào phiếu DRAFT: nhập tên khoản, số tiền, loại (Cộng/Trừ). Hệ thống tự tính lại Lương sau mỗi thay đổi
  - _Hint: `addPayrollAdjustment(payrollId, formData)`, model `PayrollAdjustment`_
- **AC-6.6:** Xóa khoản điều chỉnh khỏi phiếu DRAFT. Hệ thống tính lại Lương
  - _Hint: `deletePayrollAdjustment(adjustmentId)`, cascade delete, recalculate `netSalary`_
- **AC-6.7:** Thêm nhiều khoản điều chỉnh cùng lúc: form hỗ trợ nhiều dòng staging (mỗi dòng: tên khoản, số tiền, loại). Nhấn "Thêm dòng" để thêm dòng mới; nhấn "×" để xóa dòng chưa lưu; nhấn "Lưu N khoản" để lưu tất cả dòng hợp lệ trong một lần submit
  - _Hint: `addPayrollAdjustmentBatch(payrollId, items[])`, `payrollAdjustmentBatchSchema`, component dùng controlled state `rows[]`_

## Business Rules
- **BR-008:** Lương cơ bản = (totalHours × hourlyRate) hoặc monthlySalary (nhân viên MONTHLY)
- **BR-009:** Lương = Lương cơ bản + Σ(khoản Cộng) - Σ(khoản Trừ)
- **BR-010:** Một nhân viên chỉ có 1 phiếu lương cho mỗi tháng/năm (unique constraint đã có)
- **BR-011:** Phiếu đã PAID không được tính lại (chỉ xem)
- **BR-012:** Không hiển thị khái niệm "gross" ra giao diện người dùng
- **BR-013:** Mỗi khoản điều chỉnh có: tên khoản (text), số tiền (> 0), loại (Cộng hoặc Trừ)
- **BR-014:** Chỉ được thêm/xóa khoản điều chỉnh khi phiếu ở trạng thái DRAFT
- **BR-015:** Khi submit batch, phải có ít nhất 1 dòng hợp lệ (label không rỗng và số tiền > 0)

## Happy Path
1. Manager truy cập `/admin/payroll`
2. Chọn tháng/năm và nhân viên, nhấn "Tính lương"
3. Hệ thống tổng hợp giờ làm từ Attendance, tạo/cập nhật phiếu (status DRAFT)
4. Manager vào Chi tiết phiếu lương, thêm khoản điều chỉnh (ví dụ: "Thưởng KPI" Cộng 500,000đ; "Phạt đi muộn" Trừ 100,000đ)
5. Hệ thống tự tính lại Lương sau mỗi khoản thêm/xóa
6. Manager nhấn "Xác nhận" → CONFIRMED; "Đã trả" → PAID

## Exception Flows
- Nhân viên không có chấm công trong tháng → totalHours = 0, vẫn tạo phiếu DRAFT
- Phiếu đã PAID → không cho tính lại, không cho thêm/xóa khoản điều chỉnh
- Tháng/năm không hợp lệ → lỗi validation
- employeeId không tồn tại hoặc không active → không tạo phiếu nào (count = 0)
- Số tiền khoản điều chỉnh <= 0 → lỗi validation

## Status: ✅ Verified (Sprint 8 — fix blank detail page: thẻ `<a>` bypass router cache + loading.tsx cho [id] route)
