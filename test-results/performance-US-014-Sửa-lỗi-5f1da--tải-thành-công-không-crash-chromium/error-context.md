# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.spec.ts >> US-014: Sửa lỗi Pagination & Cải thiện Hiệu năng >> TC-1410: Shifts page tải thành công, không crash
- Location: e2e\performance.spec.ts:163:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Ca làm việc' })
Expected: visible
Error: strict mode violation: getByRole('heading', { name: 'Ca làm việc' }) resolved to 2 elements:
    1) <h1 class="text-2xl font-bold text-gray-900 mb-6">Ca làm việc</h1> aka getByRole('heading', { name: 'Ca làm việc', exact: true })
    2) <h2 class="font-semibold text-gray-900">Danh sách ca làm việc</h2> aka getByRole('heading', { name: 'Danh sách ca làm việc' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Ca làm việc' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - heading "BongShop" [level=1] [ref=e6]
          - generic [ref=e7]: Admin
        - navigation [ref=e8]:
          - link "Dashboard" [ref=e9] [cursor=pointer]:
            - /url: /admin
            - img [ref=e10]
            - text: Dashboard
          - link "Nhân viên" [ref=e15] [cursor=pointer]:
            - /url: /admin/employees
            - img [ref=e16]
            - text: Nhân viên
          - link "Chấm công" [ref=e21] [cursor=pointer]:
            - /url: /admin/attendance
            - img [ref=e22]
            - text: Chấm công
          - link "Ca làm việc" [ref=e25] [cursor=pointer]:
            - /url: /admin/shifts
            - img [ref=e26]
            - text: Ca làm việc
          - link "Tồn kho" [ref=e28] [cursor=pointer]:
            - /url: /admin/inventory
            - img [ref=e29]
            - text: Tồn kho
          - link "Sổ quỹ" [ref=e33] [cursor=pointer]:
            - /url: /admin/cashbook
            - img [ref=e34]
            - text: Sổ quỹ
          - link "Lương" [ref=e38] [cursor=pointer]:
            - /url: /admin/payroll
            - img [ref=e39]
            - text: Lương
          - link "Khách hàng" [ref=e42] [cursor=pointer]:
            - /url: /admin/customers
            - img [ref=e43]
            - text: Khách hàng
          - link "Tích điểm" [ref=e47] [cursor=pointer]:
            - /url: /admin/loyalty
            - img [ref=e48]
            - text: Tích điểm
    - generic [ref=e50]:
      - banner [ref=e51]:
        - button "U" [ref=e52] [cursor=pointer]:
          - generic [ref=e54]: U
      - main [ref=e55]:
        - generic [ref=e56]:
          - heading "Ca làm việc" [level=1] [ref=e57]
          - generic [ref=e58]:
            - generic [ref=e59]:
              - generic [ref=e60]:
                - heading "Danh sách ca làm việc" [level=2] [ref=e61]
                - button "+ Thêm ca" [ref=e62] [cursor=pointer]
              - table [ref=e64]:
                - rowgroup [ref=e65]:
                  - row "Tên ca Giờ bắt đầu Giờ kết thúc Số phân ca" [ref=e66]:
                    - columnheader "Tên ca" [ref=e67]
                    - columnheader "Giờ bắt đầu" [ref=e68]
                    - columnheader "Giờ kết thúc" [ref=e69]
                    - columnheader "Số phân ca" [ref=e70]
                    - columnheader [ref=e71]
                - rowgroup [ref=e72]:
                  - row "Ca chiều 14:00 22:00 0 Sửa ca Ca chiều Xóa ca Ca chiều" [ref=e73]:
                    - cell "Ca chiều" [ref=e74]
                    - cell "14:00" [ref=e75]
                    - cell "22:00" [ref=e76]
                    - cell "0" [ref=e77]
                    - cell "Sửa ca Ca chiều Xóa ca Ca chiều" [ref=e78]:
                      - generic [ref=e79]:
                        - button "Sửa ca Ca chiều" [ref=e80] [cursor=pointer]: Sửa
                        - button "Xóa ca Ca chiều" [ref=e81] [cursor=pointer]: Xóa
                  - row "Ca sáng 06:00 14:00 0 Sửa ca Ca sáng Xóa ca Ca sáng" [ref=e82]:
                    - cell "Ca sáng" [ref=e83]
                    - cell "06:00" [ref=e84]
                    - cell "14:00" [ref=e85]
                    - cell "0" [ref=e86]
                    - cell "Sửa ca Ca sáng Xóa ca Ca sáng" [ref=e87]:
                      - generic [ref=e88]:
                        - button "Sửa ca Ca sáng" [ref=e89] [cursor=pointer]: Sửa
                        - button "Xóa ca Ca sáng" [ref=e90] [cursor=pointer]: Xóa
                  - row "Ca tối 22:00 06:00 0 Sửa ca Ca tối Xóa ca Ca tối" [ref=e91]:
                    - cell "Ca tối" [ref=e92]
                    - cell "22:00" [ref=e93]
                    - cell "06:00" [ref=e94]
                    - cell "0" [ref=e95]
                    - cell "Sửa ca Ca tối Xóa ca Ca tối" [ref=e96]:
                      - generic [ref=e97]:
                        - button "Sửa ca Ca tối" [ref=e98] [cursor=pointer]: Sửa
                        - button "Xóa ca Ca tối" [ref=e99] [cursor=pointer]: Xóa
              - generic [ref=e100]: "Tổng: 3 ca"
            - generic [ref=e101]:
              - generic [ref=e102]:
                - heading "Phân ca" [level=2] [ref=e103]
                - button "+ Phân ca" [ref=e104] [cursor=pointer]
              - generic [ref=e105]:
                - generic [ref=e106]:
                  - generic [ref=e107]: Ngày
                  - textbox [ref=e108]: 2026-05-04
                - button "Lọc" [ref=e110] [cursor=pointer]
              - table [ref=e112]:
                - rowgroup [ref=e113]:
                  - row "Ngày Mã NV Họ tên Ca làm việc Giờ" [ref=e114]:
                    - columnheader "Ngày" [ref=e115]
                    - columnheader "Mã NV" [ref=e116]
                    - columnheader "Họ tên" [ref=e117]
                    - columnheader "Ca làm việc" [ref=e118]
                    - columnheader "Giờ" [ref=e119]
                    - columnheader [ref=e120]
                - rowgroup [ref=e121]:
                  - row "Chưa có phân ca nào trong ngày này." [ref=e122]:
                    - cell "Chưa có phân ca nào trong ngày này." [ref=e123]
              - generic [ref=e124]: "Tổng: 0 phân ca"
  - region "Notifications alt+T"
  - alert [ref=e125]
```

# Test source

```ts
  68  |     await page.waitForLoadState("networkidle");
  69  | 
  70  |     const paginationNav = page.locator("nav[aria-label='Phân trang']");
  71  |     const hasPagination = await paginationNav.isVisible().catch(() => false);
  72  | 
  73  |     if (hasPagination) {
  74  |       // Không có link "Trang trước" ở trang 1 (chỉ có span disabled)
  75  |       await expect(
  76  |         paginationNav.locator("a[aria-label='Trang trước']")
  77  |       ).not.toBeVisible();
  78  |     } else {
  79  |       // Ít hơn 25 bản ghi — pagination ẩn → OK
  80  |       test.skip();
  81  |     }
  82  |   });
  83  | 
  84  |   // ─── TC-1405: Attendance page tải đúng, không lỗi ───────────────────────
  85  |   test("TC-1405: Trang chấm công tải thành công, hiển thị table", async ({
  86  |     page,
  87  |   }) => {
  88  |     const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
  89  |     const response = await page.goto(
  90  |       `/admin/attendance?month=${currentMonth}`
  91  |     );
  92  |     expect(response?.status()).not.toBe(500);
  93  | 
  94  |     await expect(
  95  |       page.locator("h1", { hasText: "Chấm công" })
  96  |     ).toBeVisible();
  97  |     await expect(page.locator("table")).toBeVisible();
  98  |   });
  99  | 
  100 |   // ─── TC-1406: Attendance rows ≤ 50 mỗi trang ────────────────────────────
  101 |   test("TC-1406: Attendance trang 1 hiển thị tối đa 50 dòng", async ({
  102 |     page,
  103 |   }) => {
  104 |     const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
  105 |     await page.goto(`/admin/attendance?month=${currentMonth}`);
  106 |     await page.waitForLoadState("networkidle");
  107 | 
  108 |     const rows = page
  109 |       .locator("tbody tr")
  110 |       .filter({ hasNotText: "Không có dữ liệu" });
  111 |     const count = await rows.count();
  112 |     expect(count).toBeLessThanOrEqual(50);
  113 |   });
  114 | 
  115 |   // ─── TC-1407: Attendance ?page=2 giữ nguyên filter ──────────────────────
  116 |   test("TC-1407: Attendance ?page=2 giữ nguyên filter tháng", async ({
  117 |     page,
  118 |   }) => {
  119 |     const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
  120 |     await page.goto(`/admin/attendance?month=${currentMonth}&page=2`);
  121 | 
  122 |     expect(page.url()).not.toContain("500");
  123 |     await expect(page.locator("table")).toBeVisible();
  124 | 
  125 |     const url = new URL(page.url());
  126 |     expect(url.searchParams.get("month")).toBe(currentMonth);
  127 |   });
  128 | 
  129 |   // ─── TC-1408: Attendance ?page=9999 không crash ──────────────────────────
  130 |   test("TC-1408: Attendance ?page=9999 không crash", async ({ page }) => {
  131 |     const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
  132 |     const response = await page.goto(
  133 |       `/admin/attendance?month=${currentMonth}&page=9999`
  134 |     );
  135 |     expect(response?.status()).not.toBe(500);
  136 |     await expect(
  137 |       page.locator("h1", { hasText: "Chấm công" })
  138 |     ).toBeVisible();
  139 |   });
  140 | 
  141 |   // ─── TC-1409: Attendance nút Trước disabled trang 1 ─────────────────────
  142 |   test("TC-1409: Nút Trước disabled ở trang 1 của Attendance", async ({
  143 |     page,
  144 |   }) => {
  145 |     const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
  146 |     await page.goto(`/admin/attendance?month=${currentMonth}`);
  147 |     await page.waitForLoadState("networkidle");
  148 | 
  149 |     const paginationNav = page.locator("nav[aria-label='Phân trang']");
  150 |     const hasPagination = await paginationNav.isVisible().catch(() => false);
  151 | 
  152 |     if (hasPagination) {
  153 |       await expect(
  154 |         paginationNav.locator("a[aria-label='Trang trước']")
  155 |       ).not.toBeVisible();
  156 |     } else {
  157 |       // Ít hơn 50 bản ghi → pagination ẩn → OK
  158 |       test.skip();
  159 |     }
  160 |   });
  161 | 
  162 |   // ─── TC-1410: Shifts page không lỗi ─────────────────────────────────────
  163 |   test("TC-1410: Shifts page tải thành công, không crash", async ({ page }) => {
  164 |     const response = await page.goto("/admin/shifts");
  165 |     expect(response?.status()).not.toBe(500);
  166 |     await expect(
  167 |       page.getByRole("heading", { name: "Ca làm việc" })
> 168 |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  169 |   });
  170 | 
  171 |   // ─── TC-1411: Customers pagination vẫn hoạt động sau thêm select ────────
  172 |   test("TC-1411: Customers page tải đúng sau thay đổi select query", async ({
  173 |     page,
  174 |   }) => {
  175 |     const response = await page.goto("/admin/customers");
  176 |     expect(response?.status()).not.toBe(500);
  177 |     await expect(
  178 |       page.getByRole("heading", { name: "Quản lý khách hàng" })
  179 |     ).toBeVisible();
  180 |     await expect(page.locator("table")).toBeVisible();
  181 | 
  182 |     const rows = page
  183 |       .locator("tbody tr")
  184 |       .filter({ hasNotText: "Không tìm thấy" });
  185 |     const count = await rows.count();
  186 |     expect(count).toBeLessThanOrEqual(20);
  187 |   });
  188 | });
  189 | 
```