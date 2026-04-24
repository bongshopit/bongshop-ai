# US-008: Nhập khách hàng từ file KiotViet (.xlsx)

> **Ghi chú phân tích:** US này được viết dựa trên phân tích file thực tế `DanhSachKhachHang.xlsx`
> (xuất từ KiotViet ngày 25/03/2026, **2587 khách hàng**, sheet: `DanhSachKhachHang_KV25032026-09`).

## User Story
> Là Manager, tôi muốn nhập danh sách khách hàng từ file Excel xuất từ KiotViet để di chuyển dữ liệu nhanh chóng mà không cần nhập tay từng khách hàng.

## Actors
- **Manager:** Có quyền thực hiện nhập khách hàng hàng loạt từ file xlsx
- **Admin:** Có đầy đủ quyền như Manager

---

## Cấu trúc file KiotViet thực tế

File xlsx KiotViet xuất ra **26 cột** theo thứ tự cố định:

| Index | Tên cột | Ví dụ | Ghi chú |
|-------|---------|-------|---------|
| 0 | `Loại khách` | "Cá nhân" | Luôn "Cá nhân" — bỏ qua |
| 1 | `Chi nhánh tạo` | "Chi nhánh trung tâm" | Bỏ qua |
| 2 | `Mã khách hàng` | "KH002587" | Bỏ qua (không lưu vào DB) |
| 3 | `Tên khách hàng` | "thanh giang" | → `name` **(bắt buộc)** |
| 4 | `Điện thoại` | "0832363277" | → `phone` (88% KH có) |
| 5 | `Địa chỉ` | "Lô 7 căn 4 Phan Thị Ràng" | → `address` (26% KH có, 1 field đơn) |
| 6 | `Khu vực giao hàng` | "" | Luôn trống — bỏ qua |
| 7 | `Phường/Xã` | "" | Luôn trống trong thực tế — bỏ qua |
| 8 | `Công ty` | "" | Luôn trống — bỏ qua |
| 9 | `Mã số thuế` | "" | Bỏ qua |
| 10 | `Số CMND/CCCD` | "" | Bỏ qua |
| 11 | `Ngày sinh` | 45889 (Excel serial) | → `dateOfBirth` (cần convert, xem BR-811) |
| 12 | `Giới tính` | "Nam" / "Nữ" / "" | → `gender` |
| 13 | `Email` | "" | → `email` (0% KH có trong thực tế) |
| 14 | `Facebook` | "" | Luôn trống — bỏ qua |
| 15 | `Nhóm khách hàng` | "" | Bỏ qua |
| 16 | `Ghi chú` | "" | → `note` |
| 17 | `Điểm hiện tại` | 2 | Bỏ qua (điểm còn lại sau đổi, không cần thiết) |
| 18 | `Tổng điểm` | 2 | → `loyaltyPointsDefault` (tổng điểm tích lũy, xem BR-814; *đổi tên từ `loyaltyPoints` sau US-010*) |
| 19 | `Người tạo` | "Chị Huyền" | Bỏ qua |
| 20 | `Ngày tạo` | 46105.69... (Excel serial) | Bỏ qua (DB dùng `now()`) |
| 21 | `Ngày giao dịch cuối` | 46105 | Bỏ qua |
| 22 | `Nợ cần thu hiện tại` | 0 | Bỏ qua |
| 23 | `Tổng bán` | 249000 | Bỏ qua |
| 24 | `Tổng bán trừ trả hàng` | 249000 | Bỏ qua |
| 25 | `Trạng thái` | 1 | Luôn 1 — bỏ qua |

**Mapping tóm tắt (chỉ các cột được import):**

| Cột KiotViet | Index | Trường Customer | Ghi chú |
|---|---|---|---|
| `Tên khách hàng` | 3 | `name` | Bắt buộc |
| `Điện thoại` | 4 | `phone` | Tùy chọn, format 10-11 số |
| `Địa chỉ` | 5 | `address` | Tùy chọn, **1 field đơn** (không ghép) |
| `Ngày sinh` | 11 | `dateOfBirth` | Tùy chọn, Excel serial → Date ISO |
| `Giới tính` | 12 | `gender` | Tùy chọn, "Nam"/"Nữ" hoặc null |
| `Email` | 13 | `email` | Tùy chọn (thực tế 0% có) |
| `Ghi chú` | 16 | `note` | Tùy chọn |
| `Tổng điểm` | 18 | `loyaltyPointsDefault` | Tùy chọn, số nguyên ≥ 0, mặc định 0 (*đổi tên từ `loyaltyPoints` — xem BR-1012 US-010*) |

> ⚠️ **Không có** cột `Quận/Huyện` hoặc `Tỉnh/Thành phố` trong file KiotViet.
> `Địa chỉ` (index 5) là một field đơn chứa toàn bộ địa chỉ, không cần ghép.

---

## Schema thay đổi

Model `Customer` cần thêm 2 field mới để lưu dữ liệu từ KiotViet:

```prisma
model Customer {
  // ... các field hiện có ...
  dateOfBirth  DateTime? // thêm mới — từ cột "Ngày sinh"
  gender       String?   // thêm mới — "Nam" | "Nữ" | null
  loyaltyPointsDefault Int @default(0) // thêm mới — từ cột "Tổng điểm" (tên cuối sau US-010)
}
```

---

## Acceptance Criteria

### AC-8.1 — Nút nhập file trên trang danh sách khách hàng
Trang `/admin/customers` hiển thị nút **"Nhập từ KiotViet"** bên cạnh nút "Thêm khách hàng". Chỉ hiển thị với role MANAGER hoặc ADMIN (STAFF không thấy).
- *Impl hint:* Đọc `session.user.role` tại Server Component, render có điều kiện. Nút mở `CustomerImportDialog`.

### AC-8.2 — Upload và parse file xlsx
Người dùng chọn file `.xlsx`. Hệ thống:
1. Validate file (loại, kích thước) ngay khi chọn
2. Parse client-side bằng SheetJS
3. Detect header row bằng cách tìm cột có text `"Tên khách hàng"`
4. Hiển thị preview **tối đa 20 dòng đầu** và tổng số dòng phát hiện

- *Impl hint:* `FileReader` + `XLSX.read(buffer, { type: 'array' })` + `sheet_to_json(ws, { header: 1, defval: '' })`. Detect header bằng `row.findIndex(c => String(c).trim() === 'Tên khách hàng')`.

### AC-8.3 — Validation từng dòng trước khi import
Sau khi parse, validate từng dòng và phân loại:
- ✅ **Hợp lệ** (`valid`): Đủ điều kiện import
- ⚠️ **Trùng SĐT trong file** (`duplicate_in_file`): Giữ dòng đầu tiên, các dòng sau bị skip
- ❌ **Lỗi** (`error`): Tên trống, SĐT sai định dạng, Email sai định dạng — hiển thị lý do lỗi

Preview hiển thị icon trạng thái + lý do lỗi. Nút import chỉ active khi có ít nhất 1 dòng `valid`.

- *Impl hint:* Validate bằng Zod `customerImportRowSchema`. Highlight row màu đỏ (error) / vàng (duplicate).

### AC-8.4 — Thực hiện import
Người dùng nhấn **"Import [n] khách hàng"**. Hệ thống:
1. Gửi mảng JSON chỉ các dòng `valid` lên Server Action `importCustomers`
2. Server dùng `prisma.customer.createMany({ skipDuplicates: true })` — bỏ qua dòng trùng SĐT với DB
3. Trả về `{ imported: number, skipped: number }`

- *Impl hint:* `importCustomers(rows: CustomerImportRow[])` trong `src/actions/customer.ts`. Validate lại server-side trước khi insert. Trường `dateOfBirth` gửi dưới dạng ISO string, parse về `Date` tại server.

### AC-8.5 — Kết quả import
Sau import, hiển thị toast `sonner`:
- Thành công: `"Đã nhập [imported] khách hàng thành công. Bỏ qua [skipped] do trùng SĐT."`
- Lỗi server: `"Có lỗi xảy ra, vui lòng thử lại."`

Dialog đóng, danh sách reload (revalidatePath).

### AC-8.7 — Import điểm tích lũy từ KiotViet
Cột `Tổng điểm` (index 18) được import vào `loyaltyPointsDefault` (đổi tên từ `loyaltyPoints` sau US-010):
- Giá trị số nguyên ≥ 0 → lưu nguyên
- Giá trị trống, null, âm, hoặc không phải số → mặc định `0`
- Điểm này là snapshot từ KiotViet; hệ thống tích điểm nội bộ sẽ kế thừa giá trị này
- *Impl hint:* `Math.max(0, Math.floor(Number(row[18]) || 0))` tại parse step. Thêm `loyaltyPointsDefault: number` vào `customerImportRowSchema` (Zod `z.number().int().min(0)`). Thêm field `loyaltyPointsDefault Int @default(0)` vào Prisma schema (xem US-010 BR-1012 về migration rename).

### AC-8.6 — Giới hạn file
- Chỉ chấp nhận `.xlsx` (MIME: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- Kích thước tối đa: **10MB**
- Số dòng dữ liệu tối đa: **5000 dòng** (file thực tế 2587 dòng)
- *Impl hint:* `file.size <= 10 * 1024 * 1024`, `dataRows.length <= 5000`.

---

## Business Rules

- **BR-801:** Chỉ MANAGER và ADMIN mới được nhập khách hàng hàng loạt; STAFF không thấy nút "Nhập từ KiotViet".
- **BR-802:** Chỉ chấp nhận file `.xlsx`; không hỗ trợ `.xls` hoặc `.csv`.
- **BR-803:** File tối đa 10MB và 5000 dòng dữ liệu.
- **BR-804:** Cột `Tên khách hàng` phải tồn tại trong header; nếu không tìm thấy → báo lỗi định dạng không hợp lệ.
- **BR-805:** Dòng có `Tên khách hàng` trống → đánh dấu `error`, không import.
- **BR-806:** `Điện thoại` (nếu có) phải đúng định dạng 10-11 chữ số. Dòng sai format → đánh dấu `error`.
- **BR-807:** `Email` (nếu có) phải đúng định dạng email. Dòng sai format → đánh dấu `error`.
- **BR-808:** `Địa chỉ` là field đơn từ cột index 5; **không ghép** với `Phường/Xã` (luôn trống trong thực tế).
- **BR-809:** Trong file nếu có 2+ dòng cùng SĐT → giữ dòng đầu (`valid`), các dòng sau → `duplicate_in_file`.
- **BR-810:** Trong DB nếu SĐT đã tồn tại → bỏ qua (`skipDuplicates`). Không gây lỗi, chỉ tính vào `skipped`.
- **BR-811:** `Ngày sinh` trong KiotViet là **Excel serial number** (số nguyên/thập phân). Công thức convert: `new Date((serial - 25569) * 86400 * 1000)`. Nếu giá trị trống hoặc không hợp lệ → `dateOfBirth = null`.
- **BR-812:** `Giới tính` nhận 2 giá trị: `"Nam"` hoặc `"Nữ"`. Giá trị khác (trống, null) → `gender = null`.
- **BR-813:** Parse hoàn toàn **client-side**; chỉ gửi JSON data đã parse lên server (không upload file raw).
- **BR-814:** `Tổng điểm` (index 18) là số nguyên ≥ 0. Giá trị âm → 0; giá trị trống/null/không phải số → 0. Không validate lỗi dòng vì điểm là thông tin phụ trợ.

---

## Happy Path

1. Manager truy cập `/admin/customers`
2. Nhấn **"Nhập từ KiotViet"** → Dialog mở
3. Nhấn **"Chọn file"** → Chọn `DanhSachKhachHang.xlsx`
4. Hệ thống parse file → detect 26 cột KiotViet → hiển thị preview 20/2587 dòng
5. Validation: 2580 dòng `valid`, 7 dòng `error` (SĐT sai) *(ví dụ)*
6. Nhấn **"Import 2580 khách hàng"**
7. Server Action: `createMany` → 2550 inserted, 30 skipped (đã có trong DB)
8. Toast: `"Đã nhập 2550 khách hàng thành công. Bỏ qua 30 do trùng SĐT."`
9. Dialog đóng, danh sách reload

---

## Exception Flow

- File không phải `.xlsx` → `"Chỉ chấp nhận file .xlsx"`
- File > 10MB → `"File quá lớn (tối đa 10MB)"`
- File > 5000 dòng → `"File chứa quá nhiều dòng (tối đa 5000)"`
- Không tìm thấy cột `"Tên khách hàng"` → `"Không nhận diện được định dạng KiotViet. Vui lòng kiểm tra lại file."`
- Toàn bộ dòng đều lỗi → Nút import disabled + `"Không có dòng nào hợp lệ để import"`
- Lỗi server → Toast đỏ: `"Có lỗi xảy ra, vui lòng thử lại."`

---

## Test Cases

| ID | Mô tả | Loại |
|----|-------|------|
| TC-801 | Nút "Nhập từ KiotViet" hiển thị với MANAGER | Access Control |
| TC-802 | Nút "Nhập từ KiotViet" ẩn với STAFF | Access Control |
| TC-803 | Upload `DanhSachKhachHang.xlsx` → detect đúng 2587 dòng | Happy |
| TC-804 | Preview hiển thị đúng: Tên, SĐT, Địa chỉ, Ngày sinh, Giới tính | Happy |
| TC-805 | Ngày sinh convert đúng từ Excel serial → Date | Mapping |
| TC-806 | Upload file không phải xlsx → báo lỗi ngay | Validation |
| TC-807 | Upload file > 10MB → báo lỗi | Validation |
| TC-808 | File thiếu cột "Tên khách hàng" → báo định dạng không hợp lệ | Validation |
| TC-809 | Dòng có Tên trống → đánh dấu `error` | Validation |
| TC-810 | Dòng SĐT 9 chữ số → đánh dấu `error` | Validation |
| TC-811 | 2 dòng cùng SĐT trong file → dòng 2 đánh dấu `duplicate_in_file` | Dedup |
| TC-812 | SĐT đã có trong DB → bỏ qua, không lỗi, tính vào `skipped` | Dedup |
| TC-813 | Import thành công → toast đúng số liệu, danh sách reload | Happy |
| TC-814 | Giới tính "Nam"/"Nữ" lưu đúng; giá trị khác → null | Mapping |
| TC-815 | "Tổng điểm" > 0 → lưu đúng vào loyaltyPointsDefault; trống → 0 | Mapping |

---

## Ghi chú kỹ thuật (dành cho DEV)

### Thư viện (đã cài)
```bash
npm install xlsx  # đã cài trong dự án
```

### Schema thay đổi — Prisma
```prisma
model Customer {
  id          String    @id @default(cuid())
  name        String
  phone       String?   @unique
  email       String?
  address     String?
  note        String?
  dateOfBirth DateTime? // THÊM MỚI
  gender        String?   // THÊM MỚI: "Nam" | "Nữ" | null
  loyaltyPointsDefault Int @default(0) // THÊM MỚI — từ "Tổng điểm" KiotViet (tên cuối sau US-010)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  orders      Order[]
  @@map("customers")
}
```
→ Cần chạy `prisma db push` hoặc `prisma migrate dev`.

### Files cần tạo/sửa

| File | Hành động |
|------|-----------|
| `prisma/schema.prisma` | Thêm `dateOfBirth`, `gender` vào model `Customer` |
| `src/components/shared/customer-import-dialog.tsx` | Tạo mới — Client Component |
| `src/actions/customer.ts` | Thêm action `importCustomers` |
| `src/lib/validators/customer.ts` | Thêm `customerImportRowSchema` |
| `src/app/(admin)/admin/customers/page.tsx` | Thêm nút + dialog import |
| `prisma/schema.prisma` | Thêm `loyaltyPoints Int @default(0)` vào model `Customer` |
| `src/lib/validators/customer.ts` | Thêm `loyaltyPoints: z.number().int().min(0).default(0)` vào `customerImportRowSchema` |
| `src/components/shared/customer-import-dialog.tsx` | Parse cột index 18 → `loyaltyPoints` |

### Types

```typescript
// Dòng dữ liệu thô sau khi parse từ xlsx (trước validate)
type RawKiotVietRow = {
  rowIndex: number;      // dòng trong file (1-based, bỏ header)
  name: string;          // cột index 3
  phone: string;         // cột index 4
  address: string;       // cột index 5
  dateOfBirthSerial: number | string; // cột index 11 (Excel serial)
  gender: string;        // cột index 12
  email: string;         // cột index 13
  note: string;          // cột index 16
};

// Dòng sau validate, gửi lên server
type CustomerImportRow = {
  name: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;  // ISO string "YYYY-MM-DD" hoặc undefined
  gender?: string;       // "Nam" | "Nữ" | undefined
  email?: string;
  note?: string;
  loyaltyPointsDefault: number; // số nguyên >= 0, mặc định 0 (đổi tên từ loyaltyPoints sau US-010)
};

// Kết quả validate từng dòng (dùng ở preview UI)
type ImportRowStatus = 'valid' | 'error' | 'duplicate_in_file';

type ImportRowResult = RawKiotVietRow & {
  status: ImportRowStatus;
  errors: string[];
  parsed?: CustomerImportRow; // chỉ có khi status === 'valid'
};
```

### Excel serial → Date conversion
```typescript
function excelSerialToDate(serial: number): Date | null {
  if (!serial || isNaN(serial)) return null;
  // Excel epoch bắt đầu từ 1900-01-01 (serial = 1)
  // JavaScript epoch từ 1970-01-01
  // Offset: 25569 ngày
  const date = new Date((serial - 25569) * 86400 * 1000);
  return isNaN(date.getTime()) ? null : date;
}
```

## Status: ✅ Verified (Sprint 2 — Amendment loyaltyPointsDefault hoàn tất)

