# US-017: Cải thiện Responsive Design — Hỗ trợ Web, Máy tính bảng, Điện thoại

## User Story
> Là **admin/nhân viên**, tôi muốn sử dụng hệ thống quản lý BongShop trên mọi thiết bị (máy tính, máy tính bảng, điện thoại) để thao tác linh hoạt mà không bị vỡ layout hoặc tràn nội dung.

## Actors
- **Admin / Manager:** toàn quyền thao tác trên mọi thiết bị
- **Nhân viên:** check-in/check-out, xem thông tin cá nhân trên điện thoại

## Breakpoints mục tiêu
| Thiết bị | Chiều rộng |
|---------|-----------|
| Điện thoại (sm) | < 640px |
| Máy tính bảng (md) | 640px – 1024px |
| Máy tính (lg+) | > 1024px |

## Acceptance Criteria

### AC-17.1: Layout chính không bị tràn
- **Điện thoại:** Main content padding giảm xuống `12px` (hiện tại `24px` quá lớn)
- **Tablet+:** Padding `16px` trên sm, `24px` trên md trở lên
- Không xuất hiện horizontal scrollbar ở cấp layout chính

### AC-17.2: Page header (tiêu đề + nút hành động) wrap trên màn hình nhỏ
- Các header có cấu trúc `[Tiêu đề | Nút/Button]` phải tự wrap thành 2 dòng khi không đủ chỗ
- Áp dụng cho: Employees, Customers, Loyalty, Inventory (nếu có)
- Nút hành động không bị ẩn hoặc bị đè lên tiêu đề

### AC-17.3: Bảng dữ liệu có thể cuộn ngang trên điện thoại
- Tất cả bảng dữ liệu có nhiều cột (>= 5 cột) phải có `min-width` đảm bảo không wrap nội dung
- Wrapper `overflow-x-auto` đã có → bảng phải có `min-w-[640px]` hoặc lớn hơn tùy số cột
- Người dùng có thể vuốt ngang để xem toàn bộ dữ liệu

### AC-17.4: Summary cards (payroll, cashbook) stack theo cột trên điện thoại
- Payroll summary grid: 3 cột → `1 cột` trên mobile, `3 cột` trên sm+
- Cashbook summary grid: 3 cột → `1 cột` trên mobile, `3 cột` trên md+

### AC-17.5: Form filter wrap trên điện thoại
- Filter forms (Payroll tháng/năm) sử dụng `flex-wrap` thay vì `flex` cứng 1 hàng
- Các input không bị tràn ra ngoài viewport

### AC-17.6: Sidebar mobile hoạt động đúng
- Hamburger button hiện trên mobile (`md:hidden`) ✅ (đã có)
- Desktop sidebar ẩn trên mobile ✅ (đã có)
- _Không cần thay đổi — đã đúng_

### AC-17.7: Trang đăng nhập hiển thị tốt trên điện thoại
- Card login đã có `max-w-md px-4` ✅
- _Không cần thay đổi_

## Business Rules
- **BR-017:** Không phá vỡ layout/chức năng hiện có khi thêm responsive classes
- **BR-018:** Tailwind breakpoints phải nhất quán: `sm:` (640px), `md:` (768px), `lg:` (1024px)
- **BR-019:** Không dùng media query custom — chỉ dùng Tailwind utility classes

## Happy Path
1. Người dùng mở ứng dụng trên điện thoại (375px wide)
2. Header có hamburger menu → bấm để mở sidebar
3. Sidebar overlay xuất hiện → điều hướng đến trang Nhân viên
4. Trang Nhân viên: tiêu đề "Quản lý nhân viên" và nút "Thêm nhân viên" nằm trên 2 dòng
5. Bảng dữ liệu hiển thị 2-3 cột đầu → vuốt ngang xem thêm
6. Pagination hiển thị đúng dưới bảng
7. Trên tablet (768px): sidebar cố định hiện, layout 2 cột hoạt động

## Exception Flow
- Nếu nội dung bảng quá rộng → `overflow-x-auto` ngăn tràn ra layout
- Nếu tiêu đề quá dài → CSS `truncate` hoặc wrap tự nhiên, không overflow

## Phạm vi Implementation (DEV)

### Files cần sửa:
1. `src/app/(admin)/layout.tsx` — Main padding
2. `src/app/(admin)/admin/employees/page.tsx` — Header flex-wrap, table min-width
3. `src/app/(admin)/admin/customers/page.tsx` — Header flex-wrap, table min-width
4. `src/app/(admin)/admin/loyalty/page.tsx` — Header flex-wrap
5. `src/app/(admin)/admin/inventory/page.tsx` — Table min-width
6. `src/app/(admin)/admin/payroll/page.tsx` — Summary grid cols, filter flex-wrap
7. `src/app/(admin)/admin/cashbook/page.tsx` — Summary grid cols
8. `src/app/(admin)/admin/attendance/page.tsx` — Table min-width

### Không cần sửa:
- `sidebar.tsx` / `mobile-sidebar.tsx` — đã đúng
- `login/page.tsx` — đã đúng  
- `pagination.tsx` — đã có `flex-col sm:flex-row`
- `attendance-checkin-panel.tsx` — đã có `flex-col sm:flex-row`

## Status: ✅ Verified (Sprint 4)
