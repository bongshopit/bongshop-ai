# US-001: Qu?n l� nh�n vi�n

## User Story
> L� Admin, t�i mu?n qu?n l� th�ng tin nh�n vi�n (th�m, s?a, xem danh s�ch) d? theo d�i nh�n s? v� c?u h�nh luong.

## Actors
- **Admin:** To�n quy?n qu?n l� (t�i kho?n m?c d?nh: admin@bongshop.vn / bongshop)
- **Nh�n vi�n (Staff):** T�i kho?n t? d?ng t?o khi th�m nh�n vi�n m?i

## Acceptance Criteria
- **AC-1.1:** Xem danh s�ch nh�n vi�n v?i t�m ki?m theo t�n/m� NV
- **AC-1.2:** Th�m nh�n vi�n m?i (m� NV, h? t�n, email, S�T, lo?i luong + m?c luong)
  - *Hint:* T?o d?ng th?i User (role=STAFF) v?i email nh�n vi�n, m?t kh?u m?c d?nh "bongshop"
- **AC-1.3:** S?a th�ng tin nh�n vi�n (k? c? thay d?i lo?i/m?c luong)
- **AC-1.4:** Xem chi ti?t nh�n vi�n
- **AC-1.5:** Luong h? tr? 2 lo?i: **Theo gi?** (hourlyRate � totalHours) v� **Theo th�ng** (monthlySalary c? d?nh)
  - *Hint:* salaryType: HOURLY | MONTHLY tr�n model Employee

## Business Rules
- BR-001: M?i nh�n vi�n c� 1 m� duy nh?t (employee code, max 20 k� t?)
- BR-002: Th�m nh�n vi�n ? t? d?ng t?o User (role=STAFF, password="bongshop")
- BR-003: Admin m?c d?nh: email=admin@bongshop.vn, password=bongshop (kh�ng li�n k?t Employee)
- BR-004: Luong theo gi? ? c?n nh?p hourlyRate; Luong theo th�ng ? c?n nh?p monthlySalary
- BR-005: Tru?ng ph�ng ban, ch?c v?, tr?ng th�i kh�ng s? d?ng trong UI (d� don gi?n h�a)

## Happy Path
1. Admin truy c?p /admin/employees
2. Click "Th�m nh�n vi�n" ? di?n m� NV, h? t�n, email, S�T, ch?n lo?i luong, nh?p m?c luong
3. Submit ? Employee du?c t?o + User STAFF du?c t?o ? redirect v? danh s�ch
4. Nh�n vi�n m?i hi?n trong danh s�ch v?i lo?i luong tuong ?ng

## Exception Flow
- M� NV tr�ng ? b�o l?i "M� nh�n vi�n d� t?n t?i", ? l?i trang create
- Email tr�ng ? b�o l?i "Email d� du?c s? d?ng"
- Thi?u field b?t bu?c ? hi?n field error tuong ?ng

## Status: ✅ Verified (Sprint 3 — optimize)
