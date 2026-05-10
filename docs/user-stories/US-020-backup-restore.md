# US-020: Backup & Restore Dữ liệu Hệ thống

## User Story
> Là **Admin**, tôi muốn backup toàn bộ dữ liệu nghiệp vụ ra file JSON và restore lại từ file đó để bảo vệ dữ liệu và phục hồi khi cần thiết.

## Actors
- **Admin:** Người dùng có role `ADMIN` — quyền duy nhất được backup/restore.
- **Manager / Staff:** Không có quyền truy cập chức năng này.

## Acceptance Criteria

- **AC-20.1:** Trang Cài đặt (`/admin/settings`) hiển thị section "Backup & Restore" với 2 action: Tải backup và Upload restore.
  > *Impl hint: Client Component `BackupRestorePanel`. Route Handler `GET /api/backup` (download), `POST /api/backup` (restore)*

- **AC-20.2:** Nút "Tải Backup" gửi `GET /api/backup` → trả về file `bongshop-backup-YYYY-MM-DD.json` chứa toàn bộ dữ liệu nghiệp vụ dưới dạng JSON.
  > *Không backup: `User`, `Session` (bảo mật)*

- **AC-20.3:** File backup có cấu trúc `{ version, exportedAt, data: { loyaltySettings, productGroups, products, shifts, employees, ... } }`.

- **AC-20.4:** Khi nhấn "Restore từ backup", mở dialog yêu cầu chọn file `.json`, hiển thị metadata (exportedAt, số bản ghi mỗi bảng), yêu cầu người dùng nhập `RESTORE` để xác nhận.
  > *Impl hint: Đọc file với `FileReader` hoặc `file.text()` trước khi submit*

- **AC-20.5:** Sau khi xác nhận restore: xóa toàn bộ dữ liệu nghiệp vụ hiện có, insert lại từ file backup theo thứ tự đảm bảo FK constraint.

- **AC-20.6:** `Employee` được restore với `userId = null` để tránh vi phạm FK với bảng `User` (không được restore).

- **AC-20.7:** `LoyaltySetting` được restore bằng `upsert` (theo `loyaltyCategory`) để không bị lỗi unique constraint.

- **AC-20.8:** Route Handler `GET /api/backup` và `POST /api/backup` kiểm tra session + role `ADMIN` phía server — trả về 401 nếu không hợp lệ.

- **AC-20.9:** File backup tối đa **50MB**. Route Handler từ chối file vượt quá giới hạn này.

- **AC-20.10:** Sau khi restore thành công, trang redirect về `/admin` với thông báo thành công.

## Business Rules

- **BR-020.1:** Dữ liệu được backup (theo FK order): `LoyaltySetting`, `ProductGroup`, `Product`, `Shift`, `Employee`, `ShiftAssignment`, `Attendance`, `Payroll`, `PayrollAdjustment`, `Customer`, `Order`, `OrderItem`, `LoyaltyLog`, `CustomerStorage`, `CustomerStorageItem`, `CashTransaction`.
- **BR-020.2:** Dữ liệu KHÔNG được backup: `User`, `Session`.
- **BR-020.3:** Restore xóa theo thứ tự ngược lại (tránh FK), sau đó insert theo thứ tự thuận.
- **BR-020.4:** Chuỗi xác nhận restore là `RESTORE` (chữ hoa).
- **BR-020.5:** Restore chạy trong Prisma transaction với timeout 60 giây.
- **BR-020.6:** Version trong file backup phải là `"1"` — bản khác trả về lỗi.

## Happy Path
1. Admin vào `/admin/settings`, thấy section "Backup & Restore".
2. Click "Tải Backup" → browser download `bongshop-backup-2026-05-10.json`.
3. Sau này, click "Restore từ backup" → dialog mở.
4. Chọn file `.json` → dialog hiển thị metadata preview.
5. Nhập `RESTORE` → nút "Xác nhận Restore" kích hoạt.
6. Click xác nhận → loading state → restore hoàn tất → redirect `/admin`.

## Exception Flow
- **File không phải JSON hợp lệ** → toast lỗi "File backup không hợp lệ".
- **Version không khớp** → toast lỗi "File backup không tương thích (version khác)".
- **File quá lớn (>50MB)** → Route Handler trả về 413, toast lỗi.
- **Non-ADMIN gọi API** → 401 Unauthorized.
- **Lỗi DB trong transaction** → rollback, toast lỗi chi tiết.

## Status: ✅ Verified (Sprint 4)
