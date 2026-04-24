# US-012: Tích điểm thủ công và import từ báo cáo bán hàng KiotViet

> **Phụ thuộc:** US-009 (3 nhóm điểm), US-010 (ProductGroup.loyaltyCategory).
> US này hiện thực hóa AC-9.4 (điều chỉnh điểm thủ công) và bổ sung luồng import
> từ file **DanhSachChiTietHoaDon.xlsx** xuất từ KiotViet — nguồn dữ liệu bán hàng
> thực tế cuối ngày chưa được xử lý tự động.

## User Story

> Là Manager, tôi muốn **thêm điểm tích lũy cho khách hàng theo 3 danh mục** (Sữa,
> Tã bỉm, Mặc định), bằng cách **thêm thủ công** từng khách hoặc **import file
> tổng kết bán hàng cuối ngày** (DanhSachChiTietHoaDon.xlsx từ KiotViet), để đảm
> bảo khách hàng nhận đủ điểm từ các giao dịch thực tế tại cửa hàng.

## Actors

- **Manager / Admin:** Thêm điểm thủ công, thực hiện import file, xem preview, xác nhận
- **Staff:** Xem điểm (chỉ đọc, không thao tác)
- **System:** Parse file, lookup SKU, tính điểm, ghi LoyaltyLog

---

## Cấu trúc file DanhSachChiTietHoaDon.xlsx

> Phân tích từ file mẫu `docs/samples/DanhSachChiTietHoaDon.xlsx`
> (Sheet: `DanhSachChiTietHoaDon_KV2503202`, tổng 31 dòng)

Mỗi dòng = 1 sản phẩm (order item). Nhiều dòng cùng `Mã hóa đơn` = nhiều sản phẩm trong 1 hóa đơn.

| Index | Tên cột | Dùng để | Ghi chú |
|-------|---------|---------|---------|
| 1 | `Mã hóa đơn` | Dedup + LoyaltyLog sourceRef | e.g. "HD019224" |
| 6 | `Thời gian` | Ngày hóa đơn | Excel serial number → convert to Date |
| 12 | `Tên khách hàng` | Display | Không dùng để match |
| 14 | `Điện thoại` | **Khớp khách hàng** | Lookup `Customer.phone` |
| 49 | `Trạng thái` | **Filter** | Chỉ xử lý `"Hoàn thành"` |
| 51 | `Mã hàng` | **Lookup sản phẩm** | Lookup `Product.sku` → loyaltyCategory |
| 53 | `Tên hàng` | Display trong preview | Không dùng để match |
| 64 | `Thành tiền` | **Tính điểm** | `floor(Thành tiền / 10000)` điểm |

> **Lưu ý quan trọng:** File **không có cột Nhóm hàng**. Danh mục tích điểm được
> xác định bằng cách lookup `Product.sku` → `Product.productGroup.loyaltyCategory`
> trong database BongShop.

---

## Phụ thuộc

| Phụ thuộc | Trạng thái | Mô tả |
|-----------|-----------|-------|
| **US-007** | ✅ Done | Quản lý khách hàng (`Customer.phone`) |
| **US-009** | ✅ Done | Schema 3 nhóm điểm, `LoyaltyLog` model |
| **US-010** | ✅ Done | `Product.sku`, `ProductGroup.loyaltyCategory` |

---

## Acceptance Criteria

### AC-12.1 — Thêm điểm thủ công từ trang chi tiết khách hàng

Trang `/admin/customers/[id]` có nút **"Thêm điểm"** (chỉ hiện với Manager/Admin).
Khi click mở dialog/form với các trường:

- **Danh mục** (required): Mặc định / Sữa / Tã bỉm
- **Số điểm** (required): số nguyên dương ≥ 1
- **Lý do** (required): text ≤ 200 ký tự

Sau khi submit:
- `Customer.loyaltyPoints[Category] += số điểm`
- Tạo `LoyaltyLog`: `type = "EARN"`, `loyaltyCategory`, `points = +số điểm`, `reason`, `createdBy = userId`
- Revalidate trang chi tiết KH

*Impl hint:* Server Action `addLoyaltyPoints(customerId, category, points, reason)`.
Không cho phép giá trị âm — đây là "thêm" thuần túy, không phải điều chỉnh.

---

### AC-12.2 — Điều chỉnh điểm thủ công (ADJUST / EXPIRE)

Trang `/admin/customers/[id]` có nút **"Điều chỉnh điểm"** (Manager/Admin).
Form/dialog với:

- **Danh mục** (required): Mặc định / Sữa / Tã bỉm
- **Loại** (required): `ADJUST` (cộng thêm/trừ bớt) | `EXPIRE` (thu hồi/hết hạn)
- **Số điểm** (required): số nguyên, có thể âm với ADJUST
- **Lý do** (required): text ≤ 200 ký tự

Sau khi submit:
- Nếu kết quả < 0 → lỗi "Không đủ điểm [Danh mục] (hiện có [n] điểm)"
- Ngược lại: `Customer.loyaltyPoints[Category] += delta`
- Tạo `LoyaltyLog`: `type`, `points = delta`, `reason`, `createdBy = userId`

*Impl hint:* Server Action `adjustLoyaltyPoints(customerId, category, delta, type, reason)`.
Dùng Prisma `$transaction` để đảm bảo atomic.

---

### AC-12.3 — Upload file DanhSachChiTietHoaDon.xlsx

Trang `/admin/loyalty/import` có:
- Input upload file `.xlsx`
- Nút "Phân tích file"

Sau khi upload, server parse file và:
1. Filter rows: `Trạng thái = "Hoàn thành"` VÀ `Thành tiền > 0`
2. Với mỗi row: lookup `Product` theo `SKU` → lấy `loyaltyCategory`
   - SKU không tìm thấy → tính vào `DEFAULT`
   - `Product.allowLoyalty = false` → bỏ qua item đó
3. Lookup `Customer` theo `Điện thoại` (normalize: bỏ khoảng trắng, format chuẩn)
   - Không tìm thấy → đánh dấu "Không khớp" trong preview, không tạo điểm
4. Tính điểm: `floor(Thành tiền / 10000)` per item, group by `(phone, loyaltyCategory)`
5. Trả về preview data

*Impl hint:* Route Handler `POST /api/loyalty/parse-import` hoặc Server Action trả về preview.

---

### AC-12.4 — Preview trước khi xác nhận import

Sau khi parse, hiển thị bảng preview:

| Khách hàng | SĐT | Mặc định | Sữa | Tã bỉm | Tổng | Ghi chú |
|-----------|-----|----------|-----|--------|------|---------|
| chị phương | 0834955550 | +5 | +28 | 0 | +33 | ✅ Khớp |
| hoài thương | 0967701425 | 0 | +37 | 0 | +37 | ✅ Khớp |
| KHÁCH LẺ | — | — | — | — | — | ⚠️ Không có SĐT |

Thống kê tổng: `[n] khách khớp`, `[m] khách không tìm thấy`, `[k] hóa đơn`, `[t] điểm tổng`.

Nút **"Xác nhận import"** chỉ active nếu có ít nhất 1 khách khớp.

---

### AC-12.5 — Xác nhận và ghi điểm bulk

Khi Manager bấm "Xác nhận import":
- Dùng Prisma `$transaction` cho tất cả updates
- Với mỗi khách hàng khớp:
  - Cộng điểm vào đúng field tương ứng
  - Tạo `LoyaltyLog` per category có điểm > 0:
    - `type = "EARN"`
    - `loyaltyCategory`
    - `points = tổng điểm category đó`
    - `reason = "Import KiotViet: [tên file] - [danh sách Mã hóa đơn]"` (tối đa 500 ký tự)
    - `createdBy = userId`
- Sau khi xong: hiển thị kết quả "Đã cộng điểm cho [n] khách hàng"
- Revalidate `/admin/customers`

*Impl hint:* Server Action `confirmLoyaltyImport(userId, importData[])`.

---

### AC-12.6 — Ngăn import trùng

Trước khi xác nhận, server kiểm tra các `Mã hóa đơn` từ file đã có trong `LoyaltyLog.reason` chưa.
Nếu phát hiện trùng: hiển thị cảnh báo `"⚠️ [n] hóa đơn đã được import trước đó: HD019224, ..."`.
Manager vẫn có thể override (chọn "Vẫn import") — không block cứng, chỉ cảnh báo.

---

### AC-12.7 — Lịch sử điểm hiển thị trên trang chi tiết KH

Trang `/admin/customers/[id]` hiển thị 10 LoyaltyLog gần nhất:
- Ngày, Danh mục (Mặc định/Sữa/Tã bỉm), Loại (EARN/ADJUST/EXPIRE), Điểm (+/-), Lý do

Các log từ import hiển thị lý do rút gọn: "Import KiotViet: [tên file]".

*Impl hint:* `prisma.loyaltyLog.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' }, take: 10 })`.

---

## Business Rules

- **BR-1201:** Tỷ lệ điểm: `floor(Thành tiền / 10.000 VNĐ)`. Item có Thành tiền < 10.000 → 0 điểm, bỏ qua.
- **BR-1202:** Chỉ xử lý hóa đơn có `Trạng thái = "Hoàn thành"`. Trạng thái khác → bỏ qua.
- **BR-1203:** Lookup SKU trong database BongShop. SKU không tìm thấy → `loyaltyCategory = DEFAULT`.
- **BR-1204:** `Product.allowLoyalty = false` → bỏ qua item đó trong tính điểm.
- **BR-1205:** Lookup khách hàng theo SĐT (sau khi normalize). Không tìm thấy → bỏ qua, không tạo KH mới.
- **BR-1206:** Hóa đơn không có SĐT (khách lẻ) → bỏ qua.
- **BR-1207:** Điểm thủ công "thêm" (AC-12.1): chỉ nhập số dương ≥ 1; không được trừ điểm theo flow này.
- **BR-1208:** Điểm mỗi nhóm không được phép < 0 sau bất kỳ thao tác nào.
- **BR-1209:** Mọi thay đổi điểm (thủ công + import) đều ghi `LoyaltyLog` với đủ: `loyaltyCategory`, `type`, `points`, `reason`, `createdBy`.
- **BR-1210:** Chỉ MANAGER và ADMIN mới được thêm/điều chỉnh/import điểm; STAFF chỉ xem.
- **BR-1211:** Import trùng hóa đơn → cảnh báo nhưng không block cứng (Manager tự quyết).
- **BR-1212:** Chuẩn hóa SĐT khi lookup: xóa khoảng trắng, xóa dấu `+84` đầu nếu có.

---

## Schema thay đổi

### Không thay đổi schema (chỉ bổ sung business logic)

Schema hiện tại đã đủ:
```prisma
// Customer đã có 3 fields điểm (US-009):
loyaltyPointsDefault  Int  @default(0)
loyaltyPointsSua      Int  @default(0)
loyaltyPointsTaBim    Int  @default(0)

// LoyaltyLog đã có đủ fields cần thiết (US-009):
model LoyaltyLog {
  id              String
  customerId      String
  loyaltyCategory String   // "DEFAULT" | "SUA" | "TA_BIM"
  type            String   // "EARN" | "ADJUST" | "EXPIRE" | "REDEEM"
  points          Int      // dương = cộng, âm = trừ
  reason          String?  // Bắt buộc với ADJUST/EXPIRE; chứa source info với import
  createdBy       String
  createdAt       DateTime
}
```

> ⚠️ **Lưu ý cho DEV:** `LoyaltyLog.reason` sẽ được dùng để lưu thông tin source
> import (tên file + Mã hóa đơn). Trường này trong schema hiện tại là `String?` —
> cần đảm bảo không null với EARN từ import. Nếu cần track dedup tốt hơn, có thể
> thêm field `sourceRef String?` vào `LoyaltyLog`.

---

## Happy Path — Thêm điểm thủ công

1. Manager vào `/admin/customers/[id]` → click "Thêm điểm"
2. Chọn: Danh mục = Sữa, Số điểm = 30, Lý do = "Bù điểm cho đơn tháng 3"
3. System: `loyaltyPointsSua += 30`, tạo LoyaltyLog (type=EARN, category=SUA)
4. Card điểm cập nhật: Sữa: [+30] điểm

## Happy Path — Import file cuối ngày

1. Manager vào `/admin/loyalty/import` → chọn file `DanhSachChiTietHoaDon.xlsx`
2. Click "Phân tích file"
3. System parse: 30 dòng → 28 hóa đơn "Hoàn thành" → 3 khách hàng khớp SĐT, 1 không tìm thấy
4. Hiển thị preview bảng 3 khách:
   - chị phương (0834955550): Mặc định +5 điểm
   - hoài thương (0967701425): Sữa +37 điểm
   - HOA LÂM (0944241678): Mặc định +20 điểm
5. Manager bấm "Xác nhận import"
6. System cộng điểm, tạo 4 LoyaltyLog entries (1 per khách-category có điểm)
7. Thông báo: "Đã cộng điểm cho 3 khách hàng"

---

## Exception Flow

| Tình huống | Xử lý |
|-----------|-------|
| File không phải xlsx | "Chỉ hỗ trợ file .xlsx" |
| File > 5MB | "File quá lớn (tối đa 5MB)" |
| Không có dòng "Hoàn thành" | "Không có hóa đơn hoàn thành trong file" |
| Tất cả khách đều không tìm thấy | "Không khớp được khách hàng nào — kiểm tra SĐT" |
| Thêm điểm thủ công: số điểm ≤ 0 | "Số điểm phải lớn hơn 0" |
| ADJUST trừ quá số dư | "Không đủ điểm [Danh mục] (hiện có [n] điểm)" |
| STAFF thao tác | 403 Forbidden |
| Import trùng hóa đơn | Cảnh báo, cho override |

---

## Trang mới cần tạo

| Đường dẫn | Mô tả |
|----------|-------|
| `/admin/loyalty/import` | Trang upload + preview + confirm import |

## Components mới cần tạo

| Component | Mô tả |
|-----------|-------|
| `AddLoyaltyPointsDialog` | Dialog thêm điểm thủ công (AC-12.1) |
| `AdjustLoyaltyPointsDialog` | Dialog điều chỉnh/trừ điểm (AC-12.2) |
| `LoyaltyImportPreview` | Bảng preview kết quả parse file (AC-12.4) |
| `LoyaltyLogTable` | Bảng lịch sử 10 log gần nhất (AC-12.7) |

## Actions mới cần tạo

| Action | Mô tả |
|--------|-------|
| `addLoyaltyPoints(customerId, category, points, reason, userId)` | AC-12.1 |
| `adjustLoyaltyPoints(customerId, category, delta, type, reason, userId)` | AC-12.2 |
| `parseLoyaltyImportFile(fileBuffer)` → preview data | AC-12.3 |
| `confirmLoyaltyImport(userId, importData[])` | AC-12.5 |

---

## Test Cases (dành cho QA)

| TC | Mô tả | Expected |
|----|-------|----------|
| TC-1201 | Upload DanhSachChiTietHoaDon.xlsx hợp lệ → preview | Bảng preview hiện đúng số khách, điểm |
| TC-1202 | Xác nhận import → kiểm tra DB | Customer.loyaltyPoints tăng đúng |
| TC-1203 | Import lại cùng file → cảnh báo trùng hóa đơn | Warning banner hiện, vẫn có thể override |
| TC-1204 | Upload file có SKU không tồn tại trong DB | Tính vào DEFAULT |
| TC-1205 | Upload file có SĐT không tồn tại | Không khớp, không tạo điểm |
| TC-1206 | Thêm điểm thủ công: Sữa +30 cho KH A | loyaltyPointsSua += 30, LoyaltyLog tạo |
| TC-1207 | Thêm điểm thủ công: nhập số âm | Lỗi validation |
| TC-1208 | ADJUST trừ quá số dư | Lỗi "Không đủ điểm" |
| TC-1209 | STAFF cố gắng thêm điểm | 403 / nút không hiển thị |
| TC-1210 | Lịch sử điểm hiện sau khi import | 10 log gần nhất đúng category/type |

---

## Status: ✅ Verified (Sprint 2 — tích điểm thủ công + import KiotViet)
