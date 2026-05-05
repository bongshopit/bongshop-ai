# US-015: Cải thiện trải nghiệm tải trang với Progressive Loading

## User Story
> Là **Admin BongShop**, tôi muốn **thấy khung giao diện trang hiện ra ngay khi chuyển tab/tính năng**, với phần dữ liệu tải sau và hiển thị loading indicator, để **cảm giác app chạy nhanh, mượt mà và chuyên nghiệp hơn**.

## Actors
- **Admin:** Toàn quyền truy cập, sử dụng sidebar navigation để chuyển giữa các module.

## Acceptance Criteria

- **AC-15.1:** Khi admin click vào bất kỳ mục nào trong sidebar (Nhân viên, Chấm công, Ca làm việc, Tồn kho, Sổ quỹ, Lương, Khách hàng, Tích điểm), tiêu đề trang và các nút hành động (Thêm, Import,...) hiển thị ngay lập tức mà không cần chờ dữ liệu.
  - *Hint: Tách page component thành phần shell (sync) và phần dữ liệu (async server component), wrap dữ liệu bằng `<Suspense>`.*

- **AC-15.2:** Thanh lọc / tìm kiếm (nếu có) hiển thị ngay cùng với khung trang.
  - *Hint: Filter components là client components đã hoạt động client-side, không cần chờ data.*

- **AC-15.3:** Phần bảng dữ liệu (table) hiển thị skeleton animation trong khi chờ server fetch data.
  - *Hint: Dùng `<Suspense fallback={<TableSkeleton ... />}>` bao quanh async data component.*

- **AC-15.4:** Skeleton phải có cùng layout tương tự bảng thực tế (cùng số cột, đủ chiều cao) để tránh layout shift lớn khi dữ liệu xuất hiện.
  - *Hint: Tạo shared `TableSkeleton` component với props `columns` và `rows`.*

- **AC-15.5:** Áp dụng cho tất cả 9 màn hình: Dashboard, Employees, Attendance, Shifts, Inventory, Cashbook, Payroll, Customers, Loyalty.

- **AC-15.6:** Dashboard hiển thị skeleton cho từng stat card riêng lẻ thay vì block toàn bộ trang.

## Business Rules

- **BR-015:** Shell của trang (tiêu đề + action buttons + filter bar) phải render đồng bộ (không await database).
- **BR-016:** Data fetching được đặt trong inner async Server Component, bọc bởi `<Suspense>`.
- **BR-017:** Shared `TableSkeleton` component phải tái sử dụng được cho tất cả module, nhận props `columns: number` và `rows: number`.
- **BR-018:** Không thay đổi logic nghiệp vụ (queries, actions) — chỉ tái cấu trúc cách render.
- **BR-019:** `loading.tsx` vẫn giữ nguyên như là fallback cho full-page navigation (SSR, hard reload).

## Happy Path
1. Admin đang ở trang Nhân viên, click "Khách hàng" trong sidebar.
2. Ngay lập tức: tiêu đề "Khách hàng", nút "Thêm", thanh tìm kiếm hiển thị.
3. Phần bảng dữ liệu hiển thị skeleton (animated rows).
4. ~200-500ms sau: dữ liệu khách hàng load xong, skeleton được thay bằng bảng thực.

## Exception Flow
- Nếu server query lỗi → `error.tsx` của module đó catch và hiển thị thông báo lỗi.
- Nếu không có dữ liệu → bảng rỗng với thông báo "Không có dữ liệu".

## Files cần tạo/sửa (DEV Guide)

| File | Hành động |
|------|----------|
| `src/components/shared/table-skeleton.tsx` | Tạo mới — shared skeleton component |
| `src/app/(admin)/admin/page.tsx` | Refactor: tách stats vào async component |
| `src/app/(admin)/admin/employees/page.tsx` | Refactor: tách table vào async component |
| `src/app/(admin)/admin/attendance/page.tsx` | Refactor: tách table vào async component |
| `src/app/(admin)/admin/shifts/page.tsx` | Refactor: tách shifts data vào async component |
| `src/app/(admin)/admin/inventory/page.tsx` | Refactor: tách table vào async component |
| `src/app/(admin)/admin/cashbook/page.tsx` | Refactor: tách transactions vào async component |
| `src/app/(admin)/admin/payroll/page.tsx` | Refactor: tách table vào async component |
| `src/app/(admin)/admin/customers/page.tsx` | Refactor: tách table vào async component |
| `src/app/(admin)/admin/loyalty/page.tsx` | Refactor: tách logs/settings vào async component |

## Status: ✅ Verified (Sprint 2 — fix encoding + refined shell/filter separation)

---

## Sprint 2 Amendment — Refined Shell Requirements

### Vấn đề phát hiện
Sau khi deploy Sprint 1, phát hiện 2 nhóm lỗi:
1. **Encoding broken**: Trang `inventory`, `cashbook`, `payroll` hiển thị ký tự lỗi (double-encoded UTF-8) thay vì tiếng Việt — toàn bộ text trong JSX bị sai.
2. **Shell chưa đủ "tĩnh"**: Filter form (ô tìm kiếm, select phòng ban) đang nằm trong `<Suspense>` cùng với table, nên cũng bị skeleton. User muốn filter form hiện ngay lập tức.

### AC bổ sung

- **AC-15.7:** Tất cả text tiếng Việt trong JSX phải hiển thị đúng — không có ký tự `Ã`, `á»`, `â€"`, v.v. (double-encoded).
- **AC-15.8:** Filter form / search bar hiển thị ngay cùng với h1 và action buttons, **trước** khi table data load.
  - *Exception: dropdown option phụ thuộc DB (danh sách phòng ban, nhân viên) có thể có Suspense riêng nhỏ.*
- **AC-15.9:** Chỉ phần `<tbody>` (table rows) mới được bọc bởi `<Suspense fallback={<TableSkeleton />}>`.

### Pattern chuẩn (Sprint 2)

```tsx
// Page component (sync) — hiển thị ngay lập tức:
export default function ModulePage({ searchParams }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1>Tiêu đề module</h1>          {/* immediate */}
        <Button>Thêm</Button>              {/* immediate */}
      </div>
      <form method="GET">                  {/* immediate — filter form không cần DB */}
        {/* filter inputs */}
      </form>
      <Suspense fallback={<TableSkeleton columns={N} rows={10} />}>
        <ModuleTableData searchParams={searchParams} />  {/* async — chỉ table rows */}
      </Suspense>
    </div>
  );
}
```

### Files thay đổi Sprint 2

| File | Thay đổi |
|------|---------|
| `src/app/(admin)/admin/inventory/page.tsx` | Fix encoding toàn bộ file |
| `src/app/(admin)/admin/cashbook/page.tsx` | Fix encoding + tách filter form ra ngoài Suspense |
| `src/app/(admin)/admin/payroll/page.tsx` | Fix encoding + tách calculate form + selector ra ngoài Suspense |
| `src/app/(admin)/admin/employees/page.tsx` | Tách EmployeesFilter (Suspense riêng) và EmployeesTable (Suspense riêng) |
| `src/app/(admin)/admin/attendance/page.tsx` | Tách static filter (date/month) ra ngoài Suspense |
