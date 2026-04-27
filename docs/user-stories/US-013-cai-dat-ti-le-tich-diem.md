# US-013: Cài đặt tỉ lệ tích điểm

> **Phụ thuộc:** US-009 (3 nhóm điểm), US-012 (import KiotViet).
> US này đổi tên mục sidebar "Import tích điểm" thành "Tích điểm" và bổ sung
> trang cài đặt tỉ lệ qui đổi điểm cho từng danh mục (Mặc định, Sữa, Tã bỉm).

## User Story

> Là Manager, tôi muốn **cài đặt tỉ lệ qui đổi điểm tích lũy** cho từng danh mục
> sản phẩm (Mặc định, Sữa, Tã bỉm) để linh hoạt điều chỉnh chương trình khuyến mãi
> mà không cần sửa code.

## Actors

- **Manager / Admin:** Xem và chỉnh sửa cài đặt tỉ lệ
- **Staff:** Xem (chỉ đọc)
- **System:** Áp dụng tỉ lệ khi tính điểm import KiotViet và khi đơn hàng COMPLETED

---

## Hai loại tỉ lệ qui đổi

| Loại | Enum | Ví dụ | Dùng cho |
|------|------|-------|---------|
| **Theo tiền** | `AMOUNT` | 100.000 VNĐ = 1 điểm | Danh mục Mặc định |
| **Theo sản phẩm** | `PRODUCT` | 1 sản phẩm = 1 điểm | Sữa, Tã bỉm |

---

## Acceptance Criteria

### AC-13.1 — Sidebar đổi tên thành "Tích điểm"

Item navigation "Import tích điểm" (href `/admin/loyalty/import`) được đổi thành
**"Tích điểm"** (href `/admin/loyalty`) trên cả desktop sidebar và mobile sidebar.

*Impl hint:* Sửa `navItems` trong `sidebar.tsx` và `mobile-sidebar.tsx`.

---

### AC-13.2 — Trang chủ `/admin/loyalty`

Trang `/admin/loyalty` hiển thị:
- Heading **"Tích điểm"**
- Link button **"Import KiotViet"** dẫn sang `/admin/loyalty/import`
- 3 card cài đặt tỉ lệ cho **Mặc định**, **Sữa**, **Tã bỉm**

Mỗi card hiển thị:
- Tên danh mục + màu nhận diện
- Loại tỉ lệ hiện tại (Theo tiền / Theo sản phẩm)
- Thông số hiện tại (amountPerPoint hoặc pointsPerProduct)
- Nút **"Chỉnh sửa"** (chỉ Manager/Admin)

*Impl hint:* Server Component, đọc `prisma.loyaltySetting.findMany()`. Nếu chưa có record → hiển thị giá trị mặc định.

---

### AC-13.3 — Cài đặt tỉ lệ Theo tiền (AMOUNT)

Khi loại = AMOUNT:
- Input **"Số tiền để đạt 1 điểm (VNĐ)"**: số nguyên ≥ 1.000
- Công thức tính: `floor(thành_tiền / amountPerPoint)` điểm

*Impl hint:* Server Action `updateLoyaltySetting(formData)`, validate `amountPerPoint >= 1000`.

---

### AC-13.4 — Cài đặt tỉ lệ Theo sản phẩm (PRODUCT)

Khi loại = PRODUCT:
- Input **"Số điểm trên 1 sản phẩm"**: số thực > 0 (ví dụ: 1, 2, 0.5)
- Công thức tính: `floor(số_lượng × pointsPerProduct)` điểm
- Import KiotViet: đọc cột **Số lượng** (cột 59, `DanhSachChiTietHoaDon.xlsx`)

*Impl hint:* Thêm `COL_QUANTITY = 59` vào route `parse-import`. Nếu `rateType=PRODUCT` → dùng `floor(qty * pointsPerProduct)`.

---

### AC-13.5 — Lưu và áp dụng cài đặt

Sau khi Manager lưu:
- Record `LoyaltySetting` được upsert trong DB (unique per `loyaltyCategory`)
- Import KiotViet lần sau dùng tỉ lệ mới
- Hiển thị toast/thông báo "Đã lưu cài đặt"

*Impl hint:* `prisma.loyaltySetting.upsert({ where: { loyaltyCategory }, update: {...}, create: {...} })`.

---

## Business Rules

- **BR-1301:** Mỗi danh mục có đúng 1 bản ghi cài đặt (`UNIQUE loyaltyCategory`).
- **BR-1302:** `amountPerPoint` ≥ 1.000 VNĐ (tránh tặng điểm quá nhiều).
- **BR-1303:** `pointsPerProduct` > 0 (phải tặng ít nhất một phần điểm).
- **BR-1304:** Chỉ MANAGER và ADMIN được chỉnh sửa cài đặt; STAFF chỉ xem.
- **BR-1305:** Cài đặt mặc định (seed): DEFAULT=AMOUNT/10000, SUA=PRODUCT/1, TA_BIM=PRODUCT/1.
- **BR-1306:** Nếu DB chưa có record → import API fallback về giá trị mặc định.

---

## Happy Path — Đổi tỉ lệ Mặc định từ 10.000đ → 100.000đ/điểm

1. Manager vào `/admin/loyalty`
2. Thấy card "Mặc định" hiển thị "10.000 VNĐ = 1 điểm (Theo tiền)"
3. Click "Chỉnh sửa" → dialog/form mở
4. Đổi amountPerPoint từ `10000` thành `100000`
5. Submit → thông báo "Đã lưu cài đặt"
6. Card cập nhật: "100.000 VNĐ = 1 điểm"
7. Import KiotViet tiếp theo tính điểm Mặc định theo tỉ lệ mới

## Happy Path — Đổi tỉ lệ Sữa sang PRODUCT

1. Manager vào `/admin/loyalty`
2. Click "Chỉnh sửa" ở card "Sữa"
3. Chọn loại: "Theo sản phẩm"
4. Nhập pointsPerProduct = 2
5. Submit → "Đã lưu cài đặt"
6. Import KiotViet: sản phẩm sữa tính theo cột Số lượng × 2

## Exception Flow

- `amountPerPoint < 1000` → lỗi "Số tiền tối thiểu là 1.000 VNĐ"
- `pointsPerProduct <= 0` → lỗi "Số điểm phải lớn hơn 0"
- Không có quyền → lỗi "Không có quyền thực hiện thao tác này"

---

## Status: ✅ Verified (Sprint 3 — loyalty settings hub + rate config)
