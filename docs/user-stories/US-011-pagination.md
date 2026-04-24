# US-011: Phân trang (Pagination) cho các bảng dữ liệu

> **Ghi chú phân tích:** Cross-cutting feature — áp dụng cho tất cả trang danh sách có dữ liệu lớn.
> Hiện trạng: tất cả `findMany` **không có `take`/`skip`** → nguy cơ load toàn bộ dữ liệu.
> Nghiêm trọng nhất: Inventory (21.474 SP sau US-010), Customers (2.587+ KH), Sổ quỹ (tăng theo thời gian).

## User Story
> Là Staff/Manager, tôi muốn các bảng danh sách hiển thị theo trang (mỗi trang 20 dòng) để trang tải nhanh và tôi có thể điều hướng dễ dàng qua các trang.

## Actors
- **Staff/Manager/Admin:** Sử dụng pagination trên tất cả trang danh sách

---

## Phạm vi áp dụng

| Module | Route | Lý do cần pagination | Ưu tiên |
|--------|-------|----------------------|---------|
| **Tồn kho** | `/admin/inventory` | 21.474 SP sau US-010 | 🔴 Critical |
| **Khách hàng** | `/admin/customers` | 2.587+ KH, tăng qua import | 🔴 Critical |
| **Sổ quỹ** | `/admin/cashbook` | Giao dịch tăng theo năm | 🟡 High |
| **Nhân viên** | `/admin/employees` | Quy mô nhỏ hơn, nhưng nhất quán UX | 🟢 Medium |
| Chấm công | `/admin/attendance` | Đã filter theo tháng → **Không cần** | ⬜ Skip |
| Ca làm việc | `/admin/shifts` | Đã filter theo ngày → **Không cần** | ⬜ Skip |
| Lương | `/admin/payroll` | Đã filter theo tháng/năm → **Không cần** | ⬜ Skip |

---

## Acceptance Criteria

### AC-11.1 — Số dòng mỗi trang
Mỗi trang danh sách hiển thị tối đa **20 dòng**. Trang cuối có thể ít hơn 20.
- *Impl hint:* `prisma.model.findMany({ take: 20, skip: (page - 1) * 20 })`.

### AC-11.2 — Số trang và thông tin tổng
Dưới bảng hiển thị: `"Hiển thị [from]-[to] / [total] kết quả"` và dãy nút phân trang.
- *Impl hint:* Dùng `prisma.model.count({ where })` song song với `findMany`. `from = (page-1)*20 + 1`, `to = min(page*20, total)`.

### AC-11.3 — Điều hướng qua URL query param
Trang hiện tại được lưu trong URL `?page=2`. Khi nhấn nút phân trang → URL cập nhật, Server Component re-render. Không cần JavaScript client-side.
- *Impl hint:* `<Link href={`?page=${p}&q=${q}`}>`. Giữ nguyên các query param khác (q, status, ...).

### AC-11.4 — Nút điều hướng pagination
Thanh pagination gồm:
- Nút **"Trước"** (disabled ở trang 1)
- Số trang: hiển thị tối đa 5 số, dùng `...` khi nhiều hơn (VD: `1 2 3 ... 10`)
- Nút **"Sau"** (disabled ở trang cuối)
- Trang hiện tại được highlight

### AC-11.5 — Filter/Search reset về trang 1
Khi người dùng thay đổi bộ lọc hoặc từ khóa tìm kiếm, kết quả trả về trang 1 (không giữ `?page=X` cũ).
- *Impl hint:* Form submit GET không bao gồm hidden `page`. Hoặc reset `page` về 1 trong form action.

### AC-11.6 — URL sai/vượt quá tổng trang → tự điều chỉnh
Nếu `?page=999` nhưng chỉ có 5 trang → hiển thị trang cuối. `?page=0` hoặc âm → trang 1.
- *Impl hint:* `const validPage = Math.max(1, Math.min(page, totalPages))`.

### AC-11.7 — Không có kết quả
Khi bảng không có dữ liệu (0 kết quả) → hiển thị thông báo, ẩn thanh pagination.

---

## Business Rules

- **BR-1101:** Kích thước trang cố định: **20 dòng/trang** cho tất cả module. Không có tùy chọn thay đổi size.
- **BR-1102:** Query DB phải dùng `take` + `skip` — **cấm** `findMany` không có giới hạn cho các route trong phạm vi.
- **BR-1103:** `count` query phải dùng **cùng `where` filter** với `findMany` để tổng số đúng khi có search/filter.
- **BR-1104:** Trang `?page` là số nguyên dương. Giá trị không hợp lệ → parse về 1.
- **BR-1105:** Pagination component là **Server Component** (dùng `<Link>`), không dùng `useState` hay JS client.
- **BR-1106:** `Promise.all([findMany(...), count(...)])` — chạy song song, không chạy tuần tự.

---

## Happy Path

1. Manager vào `/admin/inventory` (21.474 SP)
2. Server load trang 1: `findMany({ take: 20, skip: 0 })` + `count()` → 1073 trang
3. Hiển thị: "Hiển thị 1-20 / 21.474 kết quả"
4. Manager nhấn trang 2 → URL: `?page=2` → load `skip: 20`
5. Manager tìm kiếm "sữa" → URL: `?q=sữa&page=1` → 53 kết quả → 3 trang

## Exception Flow

- `?page=abc` → parse thất bại → mặc định page 1
- `?page=0` hoặc âm → page 1
- `?page=9999` vượt tổng trang → trang cuối
- 0 kết quả → ẩn pagination, hiển thị "Không tìm thấy"

---

## Test Cases

| ID | Mô tả | Module | Loại |
|----|-------|--------|------|
| TC-1101 | Trang 1 inventory hiển thị đúng 20 dòng | Inventory | Happy |
| TC-1102 | Nhấn trang 2 → URL cập nhật `?page=2`, load đúng | Inventory | Navigation |
| TC-1103 | Tìm kiếm "sữa" → kết quả về trang 1 | Inventory | Filter |
| TC-1104 | "Hiển thị 1-20 / [total] kết quả" đúng | Inventory | Display |
| TC-1105 | `?page=9999` → hiển thị trang cuối | Inventory | Edge case |
| TC-1106 | Nút "Trước" disabled ở trang 1 | Customers | UI |
| TC-1107 | Nút "Sau" disabled ở trang cuối | Customers | UI |
| TC-1108 | Khách hàng trang 2 hiển thị đúng | Customers | Happy |
| TC-1109 | Sổ quỹ + filter type="INCOME" → pagination đúng | Cashbook | Filter+Paging |
| TC-1110 | Nhân viên filter department → pagination reset page=1 | Employees | Filter |

---

## Ghi chú kỹ thuật (dành cho DEV)

### Component dùng chung: `<Pagination />`

```tsx
// src/components/shared/pagination.tsx — Server Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;        // e.g. "/admin/inventory"
  searchParams: Record<string, string | undefined>; // các param hiện có (q, status, ...)
}
```

Logic nút trang (tối đa 5 số + ellipsis):
```
Ví dụ 1073 trang, đang ở trang 5:
[Trước] [1] [...] [4] [5] [6] [...] [1073] [Sau]
```

### Pattern chuẩn cho mỗi page

```typescript
// SearchParams phải thêm page
interface SearchParams {
  q?: string;
  page?: string;
  // ... các filter hiện có
}

// getXxx phải trả về { data, total }
async function getProducts(params: SearchParams) {
  const PAGE_SIZE = 20;
  const page = Math.max(1, parseInt(params.page ?? '1') || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const where = buildWhere(params); // filter logic

  const [data, total] = await Promise.all([
    prisma.product.findMany({ where, take: PAGE_SIZE, skip, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}
```

### Files cần sửa

| File | Hành động |
|------|-----------|
| `src/components/shared/pagination.tsx` | Tạo mới — Server Component dùng chung |
| `src/app/(admin)/admin/inventory/page.tsx` | Thêm page param, dùng `<Pagination />` |
| `src/app/(admin)/admin/customers/page.tsx` | Thêm page param, dùng `<Pagination />` |
| `src/app/(admin)/admin/cashbook/page.tsx` | Thêm page param, dùng `<Pagination />` |
| `src/app/(admin)/admin/employees/page.tsx` | Thêm page param, dùng `<Pagination />` |

### Thứ tự triển khai (ưu tiên)

1. Tạo component `Pagination` dùng chung
2. Inventory (critical — 21k SP)
3. Customers (critical — 2.5k+ KH)
4. Cashbook (high)
5. Employees (medium)

---

## Status: ✅ Verified (Sprint 1)
