# US-010: Quản lý hàng hóa

> **Ghi chú phân tích:** US này được viết dựa trên phân tích file thực tế `DanhSachSanPham.xlsx`
> (xuất từ KiotViet ngày 07/04/2026, sheet: `DanhSachSanPham_KV07042026-1054`).
> File có **21.474 sản phẩm**, **62 cột**, SKU là unique key (0 duplicate).
> 21.348/21.474 sản phẩm có tích điểm (= 1). 19.416 sản phẩm có thuộc tính biến thể.

## User Story
> Là Manager, tôi muốn quản lý danh sách hàng hóa (xem, thêm, sửa, import từ KiotViet) với phân nhóm hàng có gán nhóm tích điểm để dễ dàng quản lý kho và hỗ trợ hệ thống tích điểm khách hàng.

## Actors
- **Manager:** Xem, thêm, sửa hàng hóa; import từ xlsx; cấu hình nhóm tích điểm cho nhóm hàng
- **Admin:** Đầy đủ quyền như Manager
- **Staff:** Xem danh sách hàng hóa (chỉ đọc)

---

## Cấu trúc file KiotViet thực tế

File xlsx KiotViet xuất ra **62 cột** theo thứ tự cố định. Chỉ import các cột sau:

| Index | Tên cột | Map to | Ghi chú |
|-------|---------|--------|---------|
| 0 | `Loại hàng` | — | Bỏ qua (luôn "Hàng hóa") |
| 1 | `Nhóm hàng(3 Cấp)` | `ProductGroup.name` | Tạo mới nếu chưa có |
| 2 | `Mã hàng` | `Product.sku` | **Bắt buộc**, unique → upsert |
| 3 | `Mã vạch` | `Product.barcode` | Tùy chọn; rỗng → null |
| 4 | `Tên hàng` | `Product.name` | **Bắt buộc** |
| 5 | `Thương hiệu` | `Product.brand` | Tùy chọn |
| 6 | `Giá bán` | `Product.sellPrice` | Số thực ≥ 0 |
| 7 | `Giá vốn` | `Product.costPrice` | Số thực ≥ 0 |
| 8 | `Tồn kho` | `Product.quantity` | Số nguyên ≥ 0 |
| 9–12 | KH đặt, Dự kiến hết hàng, Tồn min/max | — | Bỏ qua |
| 13 | `ĐVT` | `Product.unit` | Tùy chọn, mặc định "cái" |
| 14–17 | Mã ĐVT, Quy đổi, Thuộc tính, Mã HH LQ | — | Bỏ qua trong MVP* |
| 18 | `Hình ảnh (url1,url2...)` | `Product.imageUrl` | Lấy URL đầu tiên (split ",") |
| 19 | Quản lý lô | — | Bỏ qua |
| 20 | Trọng lượng | — | Bỏ qua |
| 21 | `Tích điểm` | `Product.allowLoyalty` | 1 = true, 0 = false |
| 22 | `Đang kinh doanh` | `Product.isActive` | 1 = true, 0 = false |
| 23 | Được bán trực tiếp | — | Bỏ qua (luôn 1) |
| 24 | `Mô tả` | `Product.description` | Tùy chọn |
| 25–27 | Mẫu ghi chú, Vị trí, Hàng thành phần | — | Bỏ qua |
| 28–60 | Lô 1–11, Hạn sử dụng, Tồn lô | — | Bỏ qua |
| 61 | Thời gian tạo | — | Bỏ qua (DB dùng `now()`) |

> ⚠️ **MVP note — Thuộc tính/Biến thể (index 16):** 19.416/21.474 sản phẩm có thuộc tính dạng `VỊ:Phô mai cheddar`. Trong MVP, mỗi dòng import là 1 sản phẩm độc lập, không xử lý quan hệ cha-con. Field `description` có thể dùng để lưu thuộc tính nếu cần.

---

## Nhóm hàng và Nhóm tích điểm

### Nhóm hàng thực tế trong file (19 nhóm)

| Nhóm hàng | Số SP | Nhóm tích điểm (auto-detect) |
|-----------|-------|-------------------------------|
| QUẦN ÁO TRẺ EM | 12.963 | DEFAULT |
| MINKY | 1.993 | DEFAULT |
| Nhóm hàng hãng việt nam | 1.646 | DEFAULT |
| đồ dùng cho bé | 1.022 | DEFAULT |
| Phụ Kiện | 894 | DEFAULT |
| Đồ ăn dặm + bánh + kẹo | 627 | DEFAULT |
| ĂN DẶM | 447 | DEFAULT |
| **BỈM TẢ** | **335** | **TA_BIM** |
| sản phẩm ngoài da + sữa tắm | 277 | DEFAULT |
| **SỮA NƯỚC(sữa bột pha sẵn)** | **271** | **SUA** |
| bình sữa+ty sữa+nứơu gặm | 249 | DEFAULT |
| thực phẩm chức năng | 152 | DEFAULT |
| đồ chơi | 141 | DEFAULT |
| **SỮA BỘT** | **121** | **SUA** |
| ĐỒ BƠI | 96 | DEFAULT |
| MÁY MÓC , THIẾT BỊ | 95 | DEFAULT |
| ĐỒ DÙNG CỦA MẸ | 80 | DEFAULT |
| **SỮA** | **53** | **SUA** |
| ĐỒNG GIÁ | 12 | DEFAULT |

### Quy tắc auto-detect nhóm tích điểm khi import

Map **chính xác tên nhóm** (case-insensitive, sau khi trim):

| Tên nhóm hàng (exact match) | Nhóm tích điểm |
|------------------------------|----------------|
| `BỈM TẢ` | `TA_BIM` |
| `SỮA` | `SUA` |
| `SỮA BỘT` | `SUA` |
| `SỮA NƯỚC(sữa bột pha sẵn)` | `SUA` |
| *(tất cả còn lại)* | `DEFAULT` |

> Manager có thể thay đổi `loyaltyCategory` của nhóm hàng bất kỳ lúc nào sau import.

---

## Schema thay đổi

### Model mới: ProductGroup
```prisma
model ProductGroup {
  id              String    @id @default(cuid())
  name            String    @unique
  loyaltyCategory String    @default("DEFAULT") // "DEFAULT" | "SUA" | "TA_BIM"
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  products        Product[]

  @@map("product_groups")
}
```

### Model Product (bổ sung fields)
```prisma
model Product {
  // ... fields hiện có (sku, name, description, unit, quantity, costPrice, sellPrice, isActive) ...
  productGroupId  String?   // THÊM MỚI — FK đến ProductGroup
  brand           String?   // THÊM MỚI — Thương hiệu
  imageUrl        String?   // THÊM MỚI — URL ảnh đầu tiên
  barcode         String?   // THÊM MỚI — Mã vạch (null nếu không có)
  allowLoyalty    Boolean   @default(true) // THÊM MỚI — Có tích điểm không

  productGroup    ProductGroup? @relation(fields: [productGroupId], references: [id])
}
```

### Model Customer — thay đổi tên field (xem BR-1012)
```prisma
model Customer {
  // ... fields hiện có ...
  // loyaltyPoints (cũ) → RENAME thành loyaltyPointsDefault
  loyaltyPointsDefault  Int  @default(0) // đổi tên từ loyaltyPoints
  loyaltyPointsSua      Int  @default(0) // THÊM MỚI
  loyaltyPointsTaBim    Int  @default(0) // THÊM MỚI
}
```

> ⚠️ **Migration:** `loyaltyPoints` đã tồn tại trong DB → DEV cần `prisma migrate dev` với rename column, không phải chỉ `db push`.

---

## Acceptance Criteria

### AC-10.1 — Danh sách hàng hóa
Trang `/admin/inventory` hiển thị bảng sản phẩm với các cột: Tên, Mã SKU, Nhóm hàng, Giá bán, Tồn kho, Tích điểm, Trạng thái. Hỗ trợ tìm kiếm theo tên hoặc SKU (`?q=`).
- *Impl hint:* Server Component, `prisma.product.findMany` include `productGroup`. Filter OR `name`/`sku` khi có `q`.

### AC-10.2 — Thêm/sửa sản phẩm
Form gồm: Tên (bắt buộc), SKU (bắt buộc, unique), Nhóm hàng (dropdown từ DB), Giá bán, Giá vốn, Tồn kho, ĐVT, Thương hiệu, Mô tả, Tích điểm (checkbox), Đang kinh doanh (checkbox). Sau khi lưu, redirect về danh sách.
- *Impl hint:* Server Actions `createProduct`, `updateProduct`. Validator `productCreateSchema` / `productUpdateSchema`. Nhóm hàng dropdown từ `prisma.productGroup.findMany`.

### AC-10.3 — Quản lý nhóm hàng
Trang `/admin/inventory/groups` hoặc panel quản lý nhóm hàng:
- Danh sách nhóm hàng kèm `loyaltyCategory` (hiển thị: "Mặc định" / "Sữa" / "Tã bỉm")
- Manager có thể thay đổi `loyaltyCategory` của từng nhóm
- *Impl hint:* Server Action `updateProductGroup(id, { loyaltyCategory })`.

### AC-10.4 — Upload và parse file xlsx KiotViet
Dialog import: chọn file `.xlsx`, parse client-side bằng SheetJS, detect header bằng `"Mã hàng"` ở cột index 2. Preview 20 dòng đầu, hiển thị tổng số.
- Validate: file phải `.xlsx`, ≤ 10MB, ≤ 20.000 dòng
- *Impl hint:* Tương tự `CustomerImportDialog`. Detect header = `row.findIndex(c => String(c).trim() === "Mã hàng") === 2`.

### AC-10.5 — Validation từng dòng trước import
Sau parse, phân loại:
- ✅ **valid**: SKU và Tên có giá trị
- ❌ **error**: SKU trống hoặc Tên trống

### AC-10.6 — Thực hiện import (Upsert)
Gửi valid rows lên Server Action `importProducts`. Server dùng **upsert theo SKU**:
- SKU chưa có → tạo mới
- SKU đã có → cập nhật (tên, giá, nhóm, ...)
- Nhóm hàng: tìm hoặc tạo `ProductGroup` theo tên; auto-detect `loyaltyCategory`
- Trả về `{ created: number, updated: number, skipped: number }`
- *Impl hint:* `prisma.$transaction` hoặc `upsert` per row trong batch. Xử lý song song bằng `Promise.all` nhóm batch 100.

### AC-10.7 — Kết quả import
Toast: `"Đã tạo [created] sản phẩm mới, cập nhật [updated] sản phẩm. Bỏ qua [skipped] dòng lỗi."`.

---

## Business Rules

- **BR-1001:** SKU là unique key. Khi import, nếu SKU đã tồn tại → update; nếu chưa có → insert.
- **BR-1002:** Tên sản phẩm và Mã hàng (SKU) là bắt buộc khi tạo hoặc import. Dòng thiếu → `error`, không import.
- **BR-1003:** Barcode rỗng hoặc empty string → lưu `null` (không lưu chuỗi rỗng).
- **BR-1004:** Giá bán, Giá vốn phải ≥ 0; không hợp lệ → mặc định 0.
- **BR-1005:** Tồn kho phải là số nguyên ≥ 0; không hợp lệ → mặc định 0.
- **BR-1006:** Nhóm hàng từ KiotViet: nếu chưa tồn tại trong DB → tạo mới với `loyaltyCategory` theo bảng auto-detect (BR-1007).
- **BR-1007:** Auto-detect `loyaltyCategory` theo tên nhóm (exact match, case-insensitive): `BỈM TẢ` → `TA_BIM`; `SỮA` / `SỮA BỘT` / `SỮA NƯỚC(sữa bột pha sẵn)` → `SUA`; còn lại → `DEFAULT`.
- **BR-1008:** Cột `Tích điểm` (index 21): 1 → `allowLoyalty = true`; 0 hoặc trống → `allowLoyalty = false`.
- **BR-1009:** Cột `Đang kinh doanh` (index 22): 1 → `isActive = true`; 0 → `isActive = false`.
- **BR-1010:** Cột `Hình ảnh` (index 18): nếu có nhiều URL ngăn cách bằng ",", chỉ lấy URL đầu tiên.
- **BR-1011:** Chỉ MANAGER và ADMIN mới import sản phẩm; STAFF chỉ xem.
- **BR-1012:** `Customer.loyaltyPoints` (US-008) được đổi tên thành `Customer.loyaltyPointsDefault`. Điểm import từ KiotViet vẫn vào `loyaltyPointsDefault`. Đây là breaking change cần migration.

---

## Happy Path — Import sản phẩm

1. Manager vào `/admin/inventory`
2. Nhấn "Nhập từ KiotViet" → Dialog mở
3. Chọn `DanhSachSanPham.xlsx` (21.474 dòng)
4. Hệ thống parse, hiển thị preview 20 dòng đầu, tổng 21.474 hợp lệ
5. Nhấn "Import 21.474 sản phẩm"
6. Server: tạo mới + upsert → Toast: `"Đã tạo 21.474 sản phẩm mới, cập nhật 0. Bỏ qua 0 lỗi."`
7. Danh sách reload

## Happy Path — Sửa nhóm tích điểm

1. Manager vào trang Nhóm hàng
2. Nhấn sửa nhóm `sản phẩm ngoài da + sữa tắm` → đổi `loyaltyCategory` từ `DEFAULT` → `SUA`
3. Lưu → tất cả sản phẩm thuộc nhóm này sẽ tích điểm vào nhóm `SUA`

---

## Exception Flow

- File không phải `.xlsx` → "Chỉ chấp nhận file .xlsx"
- File > 10MB → "File quá lớn (tối đa 10MB)"
- File > 20.000 dòng → "File chứa quá nhiều dòng (tối đa 20.000)"
- Không tìm thấy cột `"Mã hàng"` ở index 2 → "Không nhận diện được định dạng KiotViet"
- Toàn bộ dòng đều lỗi → Nút import disabled
- Lỗi server → Toast đỏ

---

## Test Cases

| ID | Mô tả | Loại |
|----|-------|------|
| TC-1001 | Danh sách sản phẩm hiển thị với cột Nhóm hàng | Display |
| TC-1002 | Tìm kiếm theo SKU → kết quả đúng | Search |
| TC-1003 | Thêm sản phẩm mới → xuất hiện trong danh sách | CRUD |
| TC-1004 | Sửa nhóm hàng của sản phẩm | CRUD |
| TC-1005 | Nút import hiển thị với MANAGER/ADMIN | Access |
| TC-1006 | Upload DanhSachSanPham.xlsx → detect 21.474 dòng | Import |
| TC-1007 | File thiếu cột "Mã hàng" → lỗi định dạng | Import |
| TC-1008 | Dòng SKU trống → đánh dấu error | Validation |
| TC-1009 | Import lần 2 cùng file → update, không tạo mới | Upsert |
| TC-1010 | Nhóm hàng mới tự động tạo với loyaltyCategory đúng | Auto-create |
| TC-1011 | `BỈM TẢ` → loyaltyCategory = TA_BIM | Mapping |
| TC-1012 | `SỮA BỘT` → loyaltyCategory = SUA | Mapping |
| TC-1013 | `QUẦN ÁO TRẺ EM` → loyaltyCategory = DEFAULT | Mapping |
| TC-1014 | Manager đổi loyaltyCategory nhóm → lưu đúng | Config |

---

## Ghi chú kỹ thuật (dành cho DEV)

### Files cần tạo/sửa

| File | Hành động |
|------|-----------|
| `prisma/schema.prisma` | Thêm `ProductGroup`; bổ sung fields cho `Product`; rename `Customer.loyaltyPoints` → `loyaltyPointsDefault` + thêm `loyaltyPointsSua`, `loyaltyPointsTaBim` |
| `prisma/migrations/` | Tạo migration script (rename column, thêm fields) |
| `src/lib/validators/inventory.ts` | Thêm `productImportRowSchema`, `productGroupUpdateSchema` |
| `src/actions/inventory.ts` | Thêm `importProducts`, `updateProductGroup` |
| `src/components/shared/product-import-dialog.tsx` | Tạo mới — tương tự `CustomerImportDialog` |
| `src/app/(admin)/admin/inventory/page.tsx` | Cập nhật — thêm cột Nhóm hàng, nút import |
| `src/app/(admin)/admin/inventory/groups/page.tsx` | Tạo mới — trang quản lý nhóm hàng |

### Thứ tự migration (quan trọng)

```
1. Tạo bảng product_groups
2. Thêm productGroupId, brand, imageUrl, barcode, allowLoyalty vào products
3. Rename customers.loyaltyPoints → customers.loyaltyPointsDefault
4. Thêm loyaltyPointsSua, loyaltyPointsTaBim vào customers
5. Cập nhật LoyaltyLog schema (xem US-009)
```

### Auto-detect loyaltyCategory

```typescript
const SUA_GROUPS = new Set(['SỮA', 'SỮA BỘT', 'SỮA NƯỚC(SỮA BỘT PHA SẴN)']);
const TA_BIM_GROUPS = new Set(['BỈM TẢ']);

function detectLoyaltyCategory(groupName: string): 'DEFAULT' | 'SUA' | 'TA_BIM' {
  const normalized = groupName.trim().toUpperCase();
  if (TA_BIM_GROUPS.has(normalized)) return 'TA_BIM';
  if (SUA_GROUPS.has(normalized)) return 'SUA';
  return 'DEFAULT';
}
```

### Parse imageUrl

```typescript
function parseFirstImageUrl(rawValue: string): string | null {
  const val = String(rawValue || '').trim();
  if (!val) return null;
  return val.split(',')[0].trim() || null;
}
```

### Import upsert batch

```typescript
// Batch upsert theo SKU, 100 record/batch
for (const batch of chunks(validRows, 100)) {
  await Promise.all(batch.map(row =>
    prisma.product.upsert({
      where: { sku: row.sku },
      update: { name: row.name, sellPrice: row.sellPrice, ... },
      create: { sku: row.sku, name: row.name, ... },
    })
  ));
}
```

---

## Amendment — Sprint 3: Batch Import không giới hạn số dòng

**Vấn đề:** File KiotViet thực tế có 21.474 sản phẩm > hard limit 20.000 → lỗi "File có quá nhiều dòng".

**Thay đổi:**
- Xóa client-side limit 20.001 rows trong `product-import-dialog.tsx`
- Client chia `validRows` thành chunks 500 rows, gọi `importProducts` tuần tự per-batch
- UI hiển thị tiến trình: `Đang import... (batch X/Y)` khi có nhiều hơn 1 batch
- Server action: giảm per-call limit từ 20.000 → 1.000 rows (safety buffer phù hợp với chunk 500)

**Kết quả:** Hỗ trợ import file không giới hạn số dòng, không quá tải DB.

---

## Status: ✅ Verified (Sprint 2 — ProductGroup + import KiotViet + nhóm hàng page + 12 tests PASSED)
> Sprint 3 amendment: batch import không giới hạn số dòng (chunk 500 rows/call)
