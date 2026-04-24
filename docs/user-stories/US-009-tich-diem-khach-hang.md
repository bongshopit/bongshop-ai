# US-009: Tích điểm khách hàng theo nhóm hàng hóa

> **Revision 2** — Cập nhật sau US-010 (hàng hóa + nhóm hàng). Hệ thống có **3 nhóm tích điểm riêng biệt**.
> `Customer.loyaltyPoints` (US-008) được đổi tên → `Customer.loyaltyPointsDefault`.
> Field `loyaltyPointsDefault` lưu điểm nhóm "Mặc định" (bao gồm điểm import từ KiotViet).

## User Story
> Là Manager, tôi muốn hệ thống tự động tích điểm khách hàng theo **3 nhóm** (Mặc định, Sữa, Tã bỉm) dựa trên nhóm hàng sản phẩm trong đơn, và cho phép xem/điều chỉnh điểm từng nhóm để quản lý chương trình khuyến mãi riêng biệt.

## Actors
- **Manager:** Xem điểm 3 nhóm, điều chỉnh điểm thủ công, xem lịch sử
- **Admin:** Đầy đủ quyền như Manager
- **Staff:** Xem điểm khách hàng (chỉ đọc)
- **System:** Tự động cộng điểm đúng nhóm khi đơn hàng COMPLETED

---

## 3 Nhóm tích điểm

| Nhóm | Enum | Mô tả | Ví dụ nhóm hàng |
|------|------|-------|----------------|
| **Mặc định** | `DEFAULT` | Tất cả SP không thuộc 2 nhóm kia | QUẦN ÁO TRẺ EM, ĂN DẶM, v.v. |
| **Sữa** | `SUA` | Sản phẩm sữa dinh dưỡng | SỮA, SỮA BỘT, SỮA NƯỚC |
| **Tã bỉm** | `TA_BIM` | Sản phẩm tã bỉm | BỈM TẢ |

> Nhóm tích điểm xác định qua `ProductGroup.loyaltyCategory` (cấu hình trong US-010).
> Điểm import KiotViet (US-008) → vào nhóm **Mặc định** (`loyaltyPointsDefault`).

---

## Phụ thuộc

| Phụ thuộc | Trạng thái | Mô tả |
|-----------|-----------|-------|
| **US-007** | ✅ Done | Quản lý khách hàng |
| **US-008** | 🔄 Amendment | Import KiotViet — `loyaltyPointsDefault` (đổi tên từ `loyaltyPoints`) |
| **US-010** | 📋 Planned | Quản lý hàng hóa — `ProductGroup.loyaltyCategory` |

---

## Acceptance Criteria

### AC-9.1 — Hiển thị điểm 3 nhóm trên danh sách khách hàng
Trang `/admin/customers` hiển thị cột **"Tổng điểm"** = `loyaltyPointsDefault + loyaltyPointsSua + loyaltyPointsTaBim`. Hover vào ô điểm → tooltip breakdown 3 nhóm.
- *Impl hint:* Select cả 3 fields từ `prisma.customer.findMany`. Tính tổng tại client.

### AC-9.2 — Card điểm 3 nhóm trên trang chi tiết khách hàng
Trang `/admin/customers/[id]` có card "Điểm tích lũy":
- Mặc định: `[n]` điểm
- Sữa: `[n]` điểm
- Tã bỉm: `[n]` điểm
- **Tổng: `[n]` điểm**
- Danh sách 10 sự kiện điểm gần nhất từ `LoyaltyLog` (ngày, nhóm, loại, điểm +/-, lý do)
- *Impl hint:* `prisma.loyaltyLog.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' }, take: 10 })`.

### AC-9.3 — Tự động cộng điểm đúng nhóm khi đơn COMPLETED
Khi đơn hàng chuyển sang `COMPLETED`, với mỗi `OrderItem`:
1. Lấy `product.productGroup.loyaltyCategory` (DEFAULT nếu chưa có nhóm)
2. Bỏ qua nếu `product.allowLoyalty = false`
3. Tính `floor(item.totalPrice / 10000)` điểm → cộng vào đúng nhóm
4. Tạo `LoyaltyLog` (1 entry per nhóm có điểm > 0, type = `EARN`)
- *Impl hint:* Dùng Prisma `$transaction`, group items by `loyaltyCategory`.

### AC-9.4 — Điều chỉnh điểm thủ công (Manager/Admin)
Form từ trang chi tiết KH: Nhóm (Mặc định / Sữa / Tã bỉm), Loại (EARN / ADJUST / EXPIRE), Số điểm, Lý do (bắt buộc ≤ 200 ký tự). Cập nhật đúng field, tạo `LoyaltyLog`.
- *Impl hint:* `adjustLoyaltyPoints(customerId, category: 'DEFAULT'|'SUA'|'TA_BIM', delta, type, reason)`.

### AC-9.5 — Lịch sử điểm hiển thị đúng nhóm
Mỗi log entry hiển thị nhãn nhóm: "Mặc định" / "Sữa" / "Tã bỉm", kèm loại EARN/ADJUST/EXPIRE và số điểm +/-.

---

## Business Rules

- **BR-901:** Tỷ lệ: 1 điểm / 10.000 VNĐ `OrderItem.totalPrice`. Floor. Tính riêng theo từng nhóm.
- **BR-902:** Chỉ cộng điểm khi đơn hàng chuyển sang `COMPLETED`.
- **BR-903:** Điểm mỗi nhóm không được phép < 0.
- **BR-904:** Mọi thay đổi điểm ghi vào `LoyaltyLog` với `loyaltyCategory` tương ứng.
- **BR-905:** `Product.allowLoyalty = false` → sản phẩm đó không tích điểm dù nhóm hàng có category nào.
- **BR-906:** Sản phẩm không có `productGroupId` → tính vào nhóm `DEFAULT`.
- **BR-907:** Điểm import từ KiotViet (US-008, cột "Tổng điểm") → `loyaltyPointsDefault`. Không tạo `LoyaltyLog` cho import.
- **BR-908:** Chỉ MANAGER và ADMIN được điều chỉnh điểm thủ công; STAFF chỉ xem.
- **BR-909:** Lý do điều chỉnh thủ công là bắt buộc, tối đa 200 ký tự.

---

## Happy Path — Tự động cộng điểm đa nhóm

1. Manager xác nhận đơn `#ORD-001` → COMPLETED
2. Đơn 3 sản phẩm:
   - Sữa Enfamama 285k (nhóm SỮA → SUA, allowLoyalty=true) → **28 điểm SUA**
   - Tã Bobby 150k (nhóm BỈM TẢ → TA_BIM, allowLoyalty=true) → **15 điểm TA_BIM**
   - Áo trẻ em 80k (nhóm QUẦN ÁO → DEFAULT, allowLoyalty=true) → **8 điểm DEFAULT**
3. Cập nhật: `loyaltyPointsSua += 28`, `loyaltyPointsTaBim += 15`, `loyaltyPointsDefault += 8`
4. Tạo 3 `LoyaltyLog` entries (1 per nhóm có điểm > 0)
5. Trang KH: Mặc định: 8 | Sữa: 28 | Tã bỉm: 15 | **Tổng: 51**

## Happy Path — Điều chỉnh thủ công

1. Manager vào `/admin/customers/[id]` → "Điều chỉnh điểm"
2. Nhóm = Sữa, Loại = ADJUST, Số điểm = 50, Lý do = "Bù điểm tháng 3"
3. `loyaltyPointsSua += 50`, tạo LoyaltyLog category=SUA, type=ADJUST

## Exception Flow

- Trừ điểm quá số dư nhóm → "Không đủ điểm nhóm [Sữa] (hiện có [n] điểm)"
- Lý do trống → "Lý do điều chỉnh là bắt buộc"
- STAFF cố gắng điều chỉnh → 403
- Sản phẩm chưa gán nhóm → tính vào DEFAULT

---

## Schema thay đổi

### Model Customer
```prisma
model Customer {
  // ... fields hiện có ...
  // RENAME: loyaltyPoints → loyaltyPointsDefault
  loyaltyPointsDefault  Int  @default(0) // Nhóm Mặc định (kế thừa từ loyaltyPoints US-008)
  loyaltyPointsSua      Int  @default(0) // Nhóm Sữa — THÊM MỚI
  loyaltyPointsTaBim    Int  @default(0) // Nhóm Tã bỉm — THÊM MỚI

  loyaltyLogs   LoyaltyLog[]
}
```

### Model mới: LoyaltyLog
```prisma
model LoyaltyLog {
  id              String   @id @default(cuid())
  customerId      String
  loyaltyCategory String   @default("DEFAULT") // "DEFAULT" | "SUA" | "TA_BIM" — THÊM MỚI
  type            String   // "EARN" | "ADJUST" | "EXPIRE"
  delta           Int      // dương = cộng, âm = trừ
  balance         Int      // số dư nhóm đó sau khi thay đổi
  reason          String?  // bắt buộc với ADJUST/EXPIRE
  orderId         String?  // liên kết đơn hàng nếu type = EARN
  createdBy       String?  // userId người thực hiện (null nếu auto)
  createdAt       DateTime @default(now())

  customer        Customer @relation(fields: [customerId], references: [id])

  @@map("loyalty_logs")
}
```

---

## Test Cases

| ID | Mô tả | Loại |
|----|-------|------|
| TC-901 | Cột "Tổng điểm" = tổng 3 nhóm trên danh sách KH | Display |
| TC-902 | Tooltip hiển thị breakdown 3 nhóm điểm | Display |
| TC-903 | Đơn COMPLETED → cộng đúng điểm từng nhóm | Auto Earn |
| TC-904 | SP `allowLoyalty=false` → không tính điểm | BR-905 |
| TC-905 | SP không có nhóm → tính vào DEFAULT | BR-906 |
| TC-906 | Đơn CANCELLED → không cộng điểm | BR-902 |
| TC-907 | LoyaltyLog tạo đúng category và delta | Logging |
| TC-908 | Điều chỉnh +50 nhóm SUA → loyaltyPointsSua tăng | Manual |
| TC-909 | Trừ quá số dư nhóm → báo lỗi | Validation |
| TC-910 | Lý do trống khi điều chỉnh → báo lỗi | Validation |
| TC-911 | STAFF không thấy nút điều chỉnh | Access |
| TC-912 | Lịch sử log hiển thị đúng nhóm mỗi sự kiện | Display |

---

## Ghi chú kỹ thuật (dành cho DEV)

### Files cần tạo/sửa

| File | Hành động |
|------|-----------|
| `prisma/schema.prisma` | Thêm model `LoyaltyLog`; rename `loyaltyPoints` → `loyaltyPointsDefault`; thêm `loyaltyPointsSua`, `loyaltyPointsTaBim` |
| `prisma/migrations/` | Migration script rename column + thêm 2 cột mới |
| `src/actions/loyalty.ts` | Tạo mới — `adjustLoyaltyPoints(customerId, category, delta, type, reason)`, `earnPointsFromOrder(orderId)` |
| `src/lib/validators/loyalty.ts` | Zod: `loyaltyAdjustSchema` (category, type, amount, reason) |
| `src/app/(admin)/admin/customers/page.tsx` | Thêm cột Tổng điểm |
| `src/app/(admin)/admin/customers/[id]/page.tsx` | Card điểm 3 nhóm + lịch sử LoyaltyLog |
| `src/components/shared/loyalty-adjust-form.tsx` | Form điều chỉnh điểm (có dropdown nhóm) |

### Atomic transaction mẫu

```typescript
async function earnPointsFromOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { include: { productGroup: true } } } }, },
  });
  const grouped = { DEFAULT: 0, SUA: 0, TA_BIM: 0 };
  for (const item of order.items) {
    if (!item.product.allowLoyalty) continue;
    const cat = (item.product.productGroup?.loyaltyCategory ?? 'DEFAULT') as keyof typeof grouped;
    grouped[cat] += Math.floor(Number(item.totalPrice) / 10000);
  }
  await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.update({
      where: { id: order.customerId },
      data: {
        loyaltyPointsDefault: { increment: grouped.DEFAULT },
        loyaltyPointsSua: { increment: grouped.SUA },
        loyaltyPointsTaBim: { increment: grouped.TA_BIM },
      },
    });
    const logs = (['DEFAULT', 'SUA', 'TA_BIM'] as const)
      .filter(cat => grouped[cat] > 0)
      .map(cat => ({
        customerId: order.customerId,
        loyaltyCategory: cat,
        type: 'EARN',
        delta: grouped[cat],
        balance: cat === 'DEFAULT' ? customer.loyaltyPointsDefault
               : cat === 'SUA' ? customer.loyaltyPointsSua
               : customer.loyaltyPointsTaBim,
        orderId: order.id,
      }));
    if (logs.length > 0) await tx.loyaltyLog.createMany({ data: logs });
  });
}

---

## Status: ✅ Verified (Sprint 2 — hiển thị 3 nhóm điểm trên danh sách và chi tiết KH, 7 tests PASSED)
