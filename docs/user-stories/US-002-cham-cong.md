# US-002: Chấm công

## User Story
> Là Staff, tôi muốn check-in/check-out mỗi ngày để ghi nhận giờ làm việc.
> Là Manager/Admin, tôi muốn xem bảng chấm công toàn bộ nhân viên theo ngày/tháng.

## Acceptance Criteria
- **AC-2.1:** Staff check-in → tạo bản ghi với `checkIn = now()`, `date = today`
- **AC-2.2:** Staff check-out → ghi `checkOut = now()`, tự động tính `totalHours`
- **AC-2.3:** Manager xem bảng chấm công có filter theo ngày, tháng, nhân viên
- **AC-2.4:** `totalHours = (checkOut - checkIn)` tính bằng giờ, làm tròn 2 chữ số
- **AC-2.5:** Mỗi nhân viên chỉ có 1 bản ghi chấm công mỗi ngày

## Business Rules
- **BR-002:** Không thể check-in nếu đã check-in hôm nay mà chưa check-out
- **BR-008:** Không thể check-out nếu chưa check-in hôm nay
- **BR-009:** Manager/Admin có thể xem và chỉnh sửa bản ghi chấm công

## Status: ✅ Completed (Sprint 1)
