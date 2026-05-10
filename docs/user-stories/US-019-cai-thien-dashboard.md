# US-019: Cải thiện Dashboard — Thêm thông tin hữu ích

## User Story
> Là **Admin/Manager**, tôi muốn dashboard hiển thị nhiều thông tin kinh doanh quan trọng hơn để nắm bắt tình hình nhanh chóng mà không cần vào từng trang riêng lẻ.

## Actors
- **Admin / Manager:** xem toàn bộ thông tin tổng quan
- **Staff:** xem thông tin liên quan đến ca làm việc và chấm công

## Acceptance Criteria

- **AC-19.1:** Dashboard hiển thị **6 stat cards** thay vì 4: Nhân viên, Chấm công hôm nay, Sản phẩm, Khách hàng, Số dư quỹ, Gửi hàng đang mở.
  > *Impl hint: Query thêm `CashTransaction` (SUM INCOME - SUM EXPENSE) và `CustomerStorage.count({ where: { status: "OPEN" } })`*

- **AC-19.2:** Số dư quỹ hiển thị định dạng tiền VNĐ (VD: `1.250.000 ₫`), có màu xanh nếu dương, đỏ nếu âm.
  > *Impl hint: `Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })` hoặc `formatCurrency` trong `lib/utils.ts`*

- **AC-19.3:** Section **"Sản phẩm sắp hết hàng"** liệt kê tối đa 5 sản phẩm có `quantity ≤ 10` và `isActive = true`, hiển thị tên, số lượng còn lại, badge cảnh báo.
  > *Impl hint: `prisma.product.findMany({ where: { quantity: { lte: 10 }, isActive: true }, orderBy: { quantity: "asc" }, take: 5 })`*

- **AC-19.4:** Section **"Giao dịch gần nhất"** hiển thị 5 giao dịch sổ quỹ mới nhất với ngày, loại (Thu/Chi), số tiền, mô tả.
  > *Impl hint: `prisma.cashTransaction.findMany({ orderBy: { date: "desc" }, take: 5 })`*

- **AC-19.5:** Section **"Nhân viên chưa chấm công hôm nay"** hiển thị danh sách nhân viên active chưa có bản ghi Attendance cho ngày hiện tại.
  > *Impl hint: LEFT JOIN hoặc lấy danh sách employeeId đã chấm công rồi filter NOT IN*

- **AC-19.6:** Mỗi section có nút/link "Xem tất cả" dẫn đến trang chi tiết tương ứng.

- **AC-19.7:** Dashboard sử dụng `Suspense` + skeleton loading cho từng section riêng biệt để không block toàn trang.

- **AC-19.8:** Tất cả stat cards và sections responsive: 2 cột trên mobile, 3 cột trên tablet, 6 cột trên desktop cho stat cards.

## Business Rules

- **BR-019.1:** Số dư quỹ = SUM(amount của INCOME) - SUM(amount của EXPENSE), tính toàn bộ lịch sử.
- **BR-019.2:** "Sắp hết hàng" được định nghĩa là `quantity ≤ 10`.
- **BR-019.3:** "Nhân viên chưa chấm công" chỉ xét nhân viên có `isActive = true`.
- **BR-019.4:** "Gửi hàng đang mở" là các `CustomerStorage` có `status = "OPEN"`.

## Happy Path
1. Admin đăng nhập, truy cập `/admin`
2. Dashboard load với skeleton trong khi fetch data
3. Hiển thị 6 stat cards với số liệu thực
4. Section "Sản phẩm sắp hết hàng" hiển thị (nếu có sp ≤ 10 qty)
5. Section "Giao dịch gần nhất" hiển thị 5 giao dịch mới nhất
6. Section "Nhân viên chưa chấm công" hiển thị danh sách (nếu có)
7. Click "Xem tất cả" → navigate đúng trang

## Exception Flow
- Không có giao dịch nào → section "Giao dịch gần nhất" hiển thị text "Chưa có giao dịch nào"
- Không có sp sắp hết → section "Sản phẩm sắp hết hàng" hiển thị "Tất cả sản phẩm còn đủ hàng"
- Tất cả nhân viên đã chấm công → section hiển thị "Tất cả nhân viên đã chấm công hôm nay ✓"
- Số dư quỹ âm → hiển thị màu đỏ + icon cảnh báo

## Status: ✅ Verified (Sprint 4)
