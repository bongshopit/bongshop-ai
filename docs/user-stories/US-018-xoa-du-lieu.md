# US-018: Xóa tất cả dữ liệu hệ thống

## User Story
> Là Admin, tôi muốn xóa toàn bộ dữ liệu nghiệp vụ trong hệ thống để reset dữ liệu sạch khi cần thiết (VD: chuyển từ môi trường demo sang sản xuất).

## Actors
- **Admin:** Người dùng có role `ADMIN` — được phép thực hiện xóa tất cả dữ liệu.
- **Manager / Staff:** Không có quyền truy cập tính năng này.

## Acceptance Criteria

- **AC-18.1:** Trang Cài đặt (`/admin/settings`) chỉ hiển thị đầy đủ chức năng xóa dữ liệu khi người dùng có role `ADMIN`. Non-admin bị redirect hoặc thấy thông báo 403.
- **AC-18.2:** Nút "Xóa tất cả dữ liệu" mở dialog xác nhận với cảnh báo rõ ràng về hậu quả không thể hoàn tác.
- **AC-18.3:** Dialog yêu cầu người dùng nhập chính xác chuỗi `XÓA TẤT CẢ` (chữ hoa, không có dấu cách thừa) trước khi nút Xác nhận được kích hoạt.
- **AC-18.4:** Sau khi xác nhận, hệ thống xóa toàn bộ dữ liệu nghiệp vụ (xem BR-018.1) trong một transaction atomic.
- **AC-18.5:** Tài khoản Users và phiên đăng nhập (Sessions) được giữ nguyên — Admin vẫn đăng nhập sau khi xóa.
- **AC-18.6:** Cài đặt tích điểm (LoyaltySettings) được giữ nguyên — chỉ xóa logs/dữ liệu giao dịch.
- **AC-18.7:** Sau khi xóa thành công, hệ thống hiển thị thông báo thành công và redirect về Dashboard.
- **AC-18.8:** Server Action kiểm tra lại role `ADMIN` phía server — không chỉ dựa vào UI.

## Business Rules

- **BR-018.1:** Dữ liệu bị xóa bao gồm (theo thứ tự tránh vi phạm FK):
  1. `LoyaltyLog` (lịch sử tích điểm)
  2. `CustomerStorageItem` + `CustomerStorage` (phiếu gửi hàng)
  3. `OrderItem` + `Order` (đơn hàng)
  4. `Customer` (khách hàng)
  5. `ShiftAssignment` (phân ca)
  6. `Attendance` (chấm công)
  7. `Payroll` (bảng lương)
  8. `Employee` (nhân viên)
  9. `Shift` (ca làm việc)
  10. `StockMovement` (biến động kho)
  11. `Product` (hàng hóa)
  12. `ProductGroup` (nhóm hàng)
  13. `CashTransaction` (giao dịch sổ quỹ)
- **BR-018.2:** Dữ liệu được giữ nguyên: `User`, `Session`, `LoyaltySetting`.
- **BR-018.3:** Chuỗi xác nhận là `XÓA TẤT CẢ` (phân biệt hoa/thường, trim whitespace trước khi so sánh).
- **BR-018.4:** Xóa phải chạy trong Prisma transaction để đảm bảo tính nguyên tử (atomic).
- **BR-018.5:** Mỗi attempt xóa phải được ghi log thời gian, email admin thực hiện (hiện tại: qua session).

## Happy Path
1. Admin đăng nhập, vào `/admin/settings` qua sidebar "Cài đặt".
2. Trang hiển thị khu vực "Vùng nguy hiểm" với nút "Xóa tất cả dữ liệu".
3. Admin click nút → dialog cảnh báo mở, liệt kê rõ những gì sẽ bị xóa.
4. Admin nhập `XÓA TẤT CẢ` vào ô xác nhận → nút "Xác nhận xóa" kích hoạt.
5. Admin click "Xác nhận xóa" → hệ thống xử lý (loading state).
6. Xóa thành công → toast "Đã xóa toàn bộ dữ liệu" → redirect về `/admin`.

## Exception Flow
- **Người dùng không phải ADMIN** truy cập `/admin/settings` → Server Component redirect về `/admin` với thông báo không có quyền.
- **Server Action bị gọi bởi non-ADMIN** → trả về `{ error: "Không có quyền thực hiện thao tác này" }`.
- **Nhập sai chuỗi xác nhận** → toast lỗi, không gửi request.
- **Lỗi database** → transaction rollback, toast lỗi "Xóa dữ liệu thất bại: [chi tiết]".
- **Mất kết nối trong khi xóa** → transaction rollback, dữ liệu nguyên vẹn.

## Ghi chú kỹ thuật (dành cho DEV)
- **Route:** `src/app/(admin)/admin/settings/page.tsx` (Server Component)
- **Action:** `src/actions/data-management.ts` — hàm `deleteAllData()`
- **Validator:** `src/lib/validators/data-management.ts` — `deleteAllDataSchema`
- **Component:** `src/components/shared/delete-all-data-button.tsx` (Client Component)
- **Sidebar:** Thêm "Cài đặt" với icon `Settings` vào `sidebar.tsx` + `mobile-sidebar.tsx`
- **Role check:** `getServerSession(authOptions)` trong cả page và action, kiểm tra `session.user.role === "ADMIN"`
- **Transaction:** `prisma.$transaction([...deleteMany calls])` để đảm bảo atomic

## Status: ✅ Verified (Sprint 4)
