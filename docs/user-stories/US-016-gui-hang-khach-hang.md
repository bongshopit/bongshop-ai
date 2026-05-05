# US-016: Gửi hàng khách hàng (Customer Storage)

## User Story
> Là Manager/Admin, tôi muốn theo dõi hàng hóa khách hàng gửi lại cửa hàng sau khi mua để quản lý việc khách lấy dần từng sản phẩm mà không thất lạc.

## Actors
- **Manager / Admin:** Toàn quyền tạo phiếu gửi, ghi nhận lấy hàng, đóng phiếu
- **Staff:** Xem phiếu gửi hàng (chỉ đọc)

---

## Bối cảnh nghiệp vụ
Khách mua hàng nhưng không muốn mang về ngay (hàng nhiều, chờ xe, v.v.).  
Shop giữ hộ, khách tới lấy dần. Cần ghi nhận: ai gửi gì, còn bao nhiêu, đã lấy bao nhiêu.

---

## Acceptance Criteria

### AC-16.1 — Phiếu gửi hàng trên trang chi tiết KH
Trang `/admin/customers/[id]` hiển thị section **Gửi hàng** với:
- Danh sách các phiếu gửi OPEN (đang còn hàng)
- Danh sách các phiếu gửi CLOSED (đã lấy hết / đã đóng)
- Nút "Tạo phiếu gửi hàng" (Manager/Admin only)

### AC-16.2 — Tạo phiếu gửi hàng mới
Khi click "Tạo phiếu gửi hàng", mở dialog với:
- Ghi chú phiếu (tùy chọn)
- Danh sách sản phẩm gửi: Tên hàng (free text), Số lượng (≥1)
- Có thể thêm nhiều dòng sản phẩm
- Bắt buộc ít nhất 1 sản phẩm
- Submit → tạo phiếu + reload trang

### AC-16.3 — Hiển thị chi tiết phiếu
Mỗi phiếu OPEN hiển thị:
- Ngày tạo
- Ghi chú phiếu (nếu có)
- Bảng sản phẩm: Tên | Gửi | Đã lấy | Còn lại
- Badge "Đang gửi" (OPEN) / "Hoàn tất" (CLOSED)

### AC-16.4 — Ghi nhận lấy hàng
Với mỗi item còn hàng (còn lại > 0):
- Nút "Lấy hàng" → mở dialog nhập số lượng lấy (1 ≤ qty ≤ còn lại)
- Submit → cập nhật `takenQty`, nếu tất cả items đã lấy đủ → tự động CLOSE phiếu

### AC-16.5 — Đóng phiếu thủ công
Manager/Admin có thể đóng phiếu OPEN bất kỳ lúc nào (kể cả còn hàng chưa lấy).

---

## Business Rules

- **BR-1601:** Phiếu gửi hàng thuộc về 1 khách hàng cụ thể
- **BR-1602:** Mỗi phiếu có ít nhất 1 sản phẩm; tên sản phẩm là text tự do (không bắt buộc liên kết kho)
- **BR-1603:** `takenQty` không được vượt quá `quantity` (gửi ban đầu)
- **BR-1604:** Khi tất cả items có `takenQty = quantity` → tự động status = "CLOSED"
- **BR-1605:** Phiếu CLOSED không thể ghi nhận thêm lấy hàng
- **BR-1606:** Chỉ MANAGER / ADMIN mới tạo và ghi nhận lấy hàng; STAFF chỉ xem

---

## Happy Path — Tạo phiếu + Lấy hàng

1. Manager mở trang chi tiết khách hàng
2. Click "Tạo phiếu gửi hàng"
3. Nhập ghi chú (tùy chọn) + danh sách sản phẩm
4. Submit → phiếu OPEN xuất hiện trong danh sách
5. Khách tới lấy 1 sản phẩm → Manager click "Lấy hàng" → nhập qty → confirm
6. Item cập nhật `takenQty`, phiếu vẫn OPEN nếu còn hàng khác
7. Khi tất cả items `takenQty = quantity` → phiếu tự động CLOSED

## Exception Flow

- Nhập qty lấy > còn lại → validation error, không cho submit
- Gửi phiếu không có sản phẩm → validation error
- Sản phẩm không có tên → validation error

---

## Technical Notes (cho DEV)

### Schema cần thêm

```prisma
model CustomerStorage {
  id         String   @id @default(cuid())
  customerId String
  note       String?
  status     String   @default("OPEN") // "OPEN" | "CLOSED"
  createdBy  String   // userId
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  customer   Customer             @relation(...)
  items      CustomerStorageItem[]

  @@index([customerId])
  @@index([status])
  @@map("customer_storages")
}

model CustomerStorageItem {
  id          String   @id @default(cuid())
  storageId   String
  productName String   // snapshot tên hàng
  quantity    Int      // số lượng gửi
  takenQty    Int      @default(0)
  note        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  storage     CustomerStorage @relation(...)

  @@map("customer_storage_items")
}
```

### Files cần tạo / sửa
| File | Thay đổi |
|---|---|
| `prisma/schema.prisma` | Thêm 2 model mới |
| `src/lib/validators/customer.ts` | Thêm storage schemas |
| `src/actions/customer.ts` | Thêm `createCustomerStorage`, `takeStorageItem`, `closeCustomerStorage` |
| `src/components/shared/customer-storage-panel.tsx` | Component mới |
| `src/app/(admin)/admin/customers/[id]/page.tsx` | Thêm panel gửi hàng |

---

## Test Cases

| TC | Mô tả | Kỳ vọng |
|---|---|---|
| TC-1601 | Trang chi tiết KH có section Gửi hàng | Section visible |
| TC-1602 | Tạo phiếu gửi hàng với 2 sản phẩm | Phiếu OPEN xuất hiện |
| TC-1603 | Ghi nhận lấy hết → phiếu tự CLOSED | Status = Hoàn tất |
| TC-1604 | Lấy 1 phần → phiếu vẫn OPEN | Còn lại giảm đúng |
| TC-1605 | Đóng phiếu thủ công | Phiếu CLOSED |

---

## Status: ✅ Verified
