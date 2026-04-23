# US-007: Quản lý khách hàng

## User Story
> Là Staff/Manager, tôi muốn quản lý thông tin khách hàng (thêm, sửa, tìm kiếm, xem lịch sử mua hàng) để chăm sóc khách hàng và theo dõi doanh thu hiệu quả.

## Actors
- **Staff:** Tạo, xem và tìm kiếm khách hàng
- **Manager:** Tạo, sửa, xem và tìm kiếm khách hàng

## Acceptance Criteria

- **AC-7.1:** Danh sách khách hàng hiển thị đầy đủ các cột: Tên, SĐT, Email, Địa chỉ, Số đơn hàng, Tổng chi tiêu, Ngày tạo.
  - *Impl hint:* `prisma.customer.findMany` with `_count.orders` + aggregate `orders.totalAmount`
- **AC-7.2:** Tìm kiếm khách hàng theo tên hoặc SĐT qua query param `?q=` (case-insensitive, OR condition).
  - *Impl hint:* `Prisma.CustomerWhereInput` OR filter trên `name` và `phone`
- **AC-7.3:** Thêm khách hàng mới với form gồm: Tên (bắt buộc), SĐT (tùy chọn, định dạng 10-11 số), Email (tùy chọn, format email), Địa chỉ (tùy chọn), Ghi chú (tùy chọn). Sau khi tạo, redirect về danh sách.
  - *Impl hint:* `createCustomer` server action, validator `customerCreateSchema`
- **AC-7.4:** Sửa thông tin khách hàng. SĐT nếu nhập phải unique (không trùng với KH khác).
  - *Impl hint:* `updateCustomer(id, formData)`, kiểm tra phone unique exclude current id
- **AC-7.5:** Xem trang chi tiết khách hàng hiển thị thông tin đầy đủ và danh sách 10 đơn hàng gần nhất (mã đơn, ngày, tổng tiền, trạng thái).
  - *Impl hint:* `prisma.customer.findUnique` include `orders` orderBy createdAt desc, take 10

## Business Rules

- **BR-701:** Tên khách hàng không được để trống, tối đa 100 ký tự.
- **BR-702:** SĐT (nếu nhập) phải có định dạng 10-11 chữ số và là duy nhất trong hệ thống.
- **BR-703:** Email (nếu nhập) phải đúng định dạng email hợp lệ.
- **BR-704:** Không xóa cứng khách hàng đã có đơn hàng — chỉ cho phép xóa KH chưa có đơn.
- **BR-705:** Tổng chi tiêu = tổng `totalAmount` của các đơn hàng có status `COMPLETED`.

## Happy Path — Thêm khách hàng

1. Staff/Manager truy cập `/admin/customers`
2. Nhấn nút "Thêm khách hàng"
3. Điền form: Tên, SĐT, Email, Địa chỉ, Ghi chú
4. Nhấn "Lưu" → Server Action validate → tạo record Customer mới
5. Redirect về `/admin/customers`, khách hàng mới xuất hiện đầu danh sách

## Happy Path — Tìm kiếm

1. Staff nhập tên hoặc SĐT vào ô tìm kiếm
2. URL cập nhật `?q=<keyword>`, trang re-render (Server Component)
3. Danh sách lọc hiển thị các KH khớp

## Exception Flow

- Tên bỏ trống → hiển thị lỗi "Tên không được trống" ngay dưới field
- SĐT không đúng định dạng → "SĐT không hợp lệ (10-11 chữ số)"
- SĐT đã tồn tại → lỗi tổng: "Số điện thoại đã được đăng ký"
- Email sai định dạng → "Email không hợp lệ"
- Khách hàng không tồn tại (truy cập `/admin/customers/invalid-id`) → `not-found.tsx`

## Test Cases

| ID | Mô tả | Loại |
|----|-------|------|
| TC-701 | Trang danh sách hiển thị đúng heading, nút Thêm | Happy |
| TC-702 | Thêm khách hàng mới thành công | Happy |
| TC-703 | Validate required field Tên | Validation |
| TC-704 | Validate SĐT sai định dạng | Validation |
| TC-705 | Tìm kiếm theo tên/SĐT | Happy |
| TC-706 | Xem chi tiết khách hàng | Happy |
| TC-707 | Sửa thông tin khách hàng thành công | Happy |

## Status: ✅ Verified (Sprint 2)
