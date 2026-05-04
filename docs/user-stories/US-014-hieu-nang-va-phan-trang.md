# US-014: Sửa lỗi Pagination & Cải thiện Hiệu năng Webapp

> **Ghi chú phân tích:** Audit thực hiện ngày 04/05/2026.
> Kết hợp 2 vấn đề liên quan chặt chẽ: một số trang chưa có pagination dẫn đến tải toàn bộ dữ liệu → chậm; ngoài ra thiếu DB index và có N+1 query pattern trong payroll.

## User Story
> Là Staff/Manager, tôi muốn mọi trang danh sách hiển thị đúng phân trang và hệ thống phản hồi nhanh để tôi có thể làm việc hiệu quả mà không phải chờ đợi.

## Actors
- **Staff/Manager/Admin:** Sử dụng tất cả trang danh sách trong admin panel

---

## Hiện trạng & Vấn đề phát hiện

### 1. Pagination — Trạng thái từng trang

| Trang | Route | Trạng thái | Vấn đề |
|-------|-------|-----------|--------|
| **Customers** | `/admin/customers` | ✅ Đúng | Có `take`/`skip`, có component `<Pagination>` |
| **Employees** | `/admin/employees` | ✅ Đúng | Có `take`/`skip`, có component `<Pagination>` |
| **Inventory** | `/admin/inventory` | ✅ Đúng | Có `take`/`skip`, có component `<Pagination>` |
| **Cashbook** | `/admin/cashbook` | ✅ Đúng | Có `take`/`skip`, có component `<Pagination>` |
| **Payroll** | `/admin/payroll` | ❌ Thiếu | `findMany` không có `take`/`skip` → load hết 100+ bản ghi/tháng |
| **Attendance** | `/admin/attendance` | ❌ Thiếu | `findMany` không có `take`/`skip` → load hết ~2.500 bản ghi/tháng |
| **Shifts** | `/admin/shifts` | ⚠️ Một phần | Danh sách ca ổn, nhưng `shiftAssignment` unbounded |
| **Loyalty** | `/admin/loyalty` | N/A | Trang cài đặt, không có danh sách, không cần pagination |

### 2. Vấn đề hiệu năng — Chi tiết

| # | Vấn đề | Mức độ | File liên quan |
|---|--------|--------|----------------|
| P1 | Thiếu DB index trên các trường filter/sort thường dùng | 🔴 Critical | `prisma/schema.prisma` |
| P2 | Payroll calculation dùng sequential await trong for-loop (N+1) | 🔴 Critical | `src/actions/payroll.ts` |
| P3 | Attendance page load toàn bộ bản ghi không pagination | 🔴 Critical | `src/app/(admin)/admin/attendance/page.tsx` |
| P4 | Payroll page load toàn bộ bản ghi không pagination | 🔴 Critical | `src/app/(admin)/admin/payroll/page.tsx` |
| P5 | Cashbook: `getSummary()` và `getTotalBalance()` gọi 2 `groupBy` riêng biệt | 🟡 High | `src/app/(admin)/admin/cashbook/page.tsx` |
| P6 | Customers query không có `select` → fetch thừa fields | 🟡 Medium | `src/app/(admin)/admin/customers/page.tsx` |

---

## Acceptance Criteria

### AC-14.1 — Pagination cho trang Payroll
Trang `/admin/payroll` hiển thị tối đa **25 bản ghi/trang**. Có component `<Pagination>` bên dưới bảng.
- URL param: `?page=N` (mặc định page 1)
- Hiển thị: `"Hiển thị [from]-[to] / [total] kết quả"`
- Filter tháng/năm không bị mất khi chuyển trang
- *Impl hint:* `prisma.payroll.findMany({ where, take: 25, skip: (page-1)*25, include: { employee: ... } })` + `prisma.payroll.count({ where })` chạy song song `Promise.all`.

### AC-14.2 — Pagination cho trang Attendance
Trang `/admin/attendance` hiển thị tối đa **50 bản ghi/trang** (mật độ cao, 50 phù hợp hơn 20).
- URL param: `?page=N` (mặc định page 1)
- Hiển thị: `"Hiển thị [from]-[to] / [total] kết quả"`
- Filter tháng/nhân viên không bị mất khi chuyển trang
- *Impl hint:* Tương tự AC-14.1 với `take: 50`.

### AC-14.3 — Giới hạn Shift Assignments
Trang `/admin/shifts` chỉ load shift assignments của **ngày hiện tại** (đã có filter date). Không cần pagination UI vì dữ liệu ≤ số nhân viên (~100 rows max/ngày). Cần thêm `take: 200` guard để tránh load unbounded nếu data nhiều bất thường.
- *Impl hint:* `prisma.shiftAssignment.findMany({ where: { date }, take: 200 })`.

### AC-14.4 — Database Indexes
Các index sau phải được thêm vào Prisma schema và migrate:

| Model | Fields cần index | Lý do |
|-------|-----------------|-------|
| `Employee` | `isActive` | Filter trong mọi query lấy nhân viên |
| `Employee` | `department` | Filter/groupBy department |
| `Product` | `isActive` | Filter trong inventory |
| `CashTransaction` | `date` | Range filter (from–to) trong sổ quỹ |
| `CashTransaction` | `type` | Filter INCOME/EXPENSE |
| `Customer` | `email` | Search query |
| `Order` | `status` | Filter status=COMPLETED trong trang khách hàng |
| `Attendance` | `date` | Key filter trong mọi query chấm công |
| `LoyaltyLog` | `createdAt` | Sort trong log tích điểm |
| `Shift` | `isActive` | Filter trong queries |
| `Payroll` | `[month, year]` | Composite filter tháng/năm |
| `Attendance` | `[employeeId, date]` | Composite filter chấm công theo nhân viên + ngày |

- *Impl hint:* `@@index([isActive])`, `@@index([month, year])`, v.v. Sau khi sửa schema: `npx prisma migrate dev --name add-performance-indexes`.

### AC-14.5 — Sửa N+1 trong Payroll Calculation
Hàm `calculatePayroll` trong `src/actions/payroll.ts` không được dùng sequential await trong for-loop.
- Thay bằng `Promise.all(employees.map(emp => calculateForEmployee(emp)))` để chạy song song.
- Hoặc dùng một query `aggregate` bằng raw SQL/groupBy để gom tất cả nhân viên.
- *Impl hint:* Bọc logic tính lương từng nhân viên thành async function, dùng `Promise.all()` để chạy đồng thời.

### AC-14.6 — Thêm `select` cho Customers query
Query lấy danh sách customers phải dùng explicit `select` thay vì fetch toàn bộ model.
- Chỉ lấy các fields hiển thị trên bảng: `id, name, phone, email, address, loyaltyPointsDefault, loyaltyPointsSua, loyaltyPointsTaBim, createdAt`
- *Impl hint:* Thêm `select: { id: true, name: true, ... }` vào query trong `customers/page.tsx`.

---

## Business Rules

- **BR-1401:** Page size cố định: Payroll = 25/trang, Attendance = 50/trang. Không thay đổi.
- **BR-1402:** Cấm dùng sequential await trong for-loop cho các tác vụ độc lập → phải dùng `Promise.all`.
- **BR-1403:** Mọi `findMany` không có filter thời gian/pagination phải có hard-limit `take` để tránh load toàn bộ bảng.
- **BR-1404:** DB index phải được thêm qua Prisma migration, không alter bảng thủ công.
- **BR-1405:** Pagination component hiện tại (`src/components/shared/pagination.tsx`) tái sử dụng được, không tạo mới.
- **BR-1406:** Khi thêm pagination vào trang Payroll/Attendance, các filter hiện có (tháng, năm, nhân viên) phải được giữ nguyên trong URL khi chuyển trang.

---

## Happy Path

### Luồng Payroll có Pagination
1. Manager vào `/admin/payroll?month=5&year=2026`
2. Server load: `findMany({ where: { month:5, year:2026 }, take:25, skip:0 })` + `count()` → song song
3. Hiển thị bảng 25 dòng, thanh pagination: "Hiển thị 1-25 / 87 kết quả"
4. Manager nhấn trang 2 → URL: `?month=5&year=2026&page=2` → load `skip:25`
5. Filter không bị mất

### Luồng Attendance có Pagination
1. Manager vào `/admin/attendance?month=5&year=2026`
2. Server load: `findMany({ where: { date: inMonth }, take:50, skip:0 })` + `count()`
3. Hiển thị "Hiển thị 1-50 / 2.436 kết quả" (thay vì load 2.436 records)
4. Manager chuyển trang → URL cập nhật, giữ filter

### Luồng Payroll Calculation nhanh hơn
1. Manager bấm "Tính lương tháng 5/2026" cho 100 nhân viên
2. System chạy `Promise.all(100 tasks)` thay vì 200 sequential queries
3. Thời gian: ~2-3s thay vì ~20s trước đây

---

## Exception Flow

- `?page=abc` → parse thất bại → mặc định page 1
- `?page=0` hoặc âm → page 1
- `?page=9999` vượt tổng trang → trang cuối
- 0 kết quả sau filter → ẩn pagination, hiển thị "Không tìm thấy kết quả"
- Migration index thất bại → rollback, kiểm tra constraint conflict

---

## Test Cases

| ID | Mô tả | Module | Loại |
|----|-------|--------|------|
| TC-1401 | Payroll trang 1 hiển thị đúng 25 dòng | Payroll | Happy |
| TC-1402 | Nhấn trang 2 payroll → URL có `?page=2`, filter tháng/năm không mất | Payroll | Navigation |
| TC-1403 | Attendance trang 1 hiển thị đúng 50 dòng | Attendance | Happy |
| TC-1404 | Nhấn trang 2 attendance → URL cập nhật, filter không mất | Attendance | Navigation |
| TC-1405 | Shifts page không gây error khi có nhiều assignment | Shifts | Edge case |
| TC-1406 | Tính lương 50+ nhân viên hoàn thành trong < 10s | Payroll | Performance |
| TC-1407 | Nút "Trước" disabled ở trang 1 (Payroll/Attendance) | UI | Edge case |
| TC-1408 | `?page=9999` payroll → hiển thị trang cuối | Payroll | Edge case |
| TC-1409 | 0 kết quả → ẩn pagination, hiển thị "Không tìm thấy" | Both | Edge case |

---

## Phạm vi & Ưu tiên

### 🔴 P0 — Làm ngay (ảnh hưởng trực tiếp đến hiệu năng)
1. Thêm DB indexes (AC-14.4) — tác động lớn nhất, ít rủi ro nhất
2. Pagination cho Attendance (AC-14.2) — 2.500+ records/tháng
3. Pagination cho Payroll (AC-14.1) — unbounded load

### 🟡 P1 — Làm tiếp
4. Sửa N+1 trong Payroll calculation (AC-14.5)
5. Guard `take:200` cho Shifts (AC-14.3)

### 🟢 P2 — Nice-to-have
6. Thêm `select` cho Customers query (AC-14.6)

---

## Status: ✅ Verified (Sprint 3)
