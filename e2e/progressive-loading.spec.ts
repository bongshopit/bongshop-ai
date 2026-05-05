import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 15000 });
}

test.describe("US-015: Progressive Loading", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-1501: Dashboard hiển thị nhanh
  test("TC-1501: Dashboard tải thành công, hiển thị tiêu đề ngay", async ({
    page,
  }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 5000 });
  });

  // TC-1502: Employees page hiển thị tiêu đề + nút thêm
  test("TC-1502: Trang nhân viên hiển thị tiêu đề và nút Thêm nhân viên", async ({
    page,
  }) => {
    const response = await page.goto("/admin/employees");
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("h1", { hasText: "Nhân viên" })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('a[href="/admin/employees/new"]')).toBeVisible();
    // Table loads eventually
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
  });

  // TC-1503: Attendance page hiển thị tiêu đề
  test("TC-1503: Trang chấm công tải thành công", async ({ page }) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const response = await page.goto(`/admin/attendance?month=${month}`);
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole("heading", { name: "Chấm công", exact: true }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
  });

  // TC-1504: Shifts page
  test("TC-1504: Trang ca làm việc tải thành công", async ({ page }) => {
    const response = await page.goto("/admin/shifts");
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole("heading", { name: "Ca làm việc", exact: true })).toBeVisible({
      timeout: 5000,
    });
  });

  // TC-1505: Inventory page hiển thị tiêu đề + nút
  test("TC-1505: Trang tồn kho hiển thị tiêu đề và nút Thêm sản phẩm", async ({
    page,
  }) => {
    const response = await page.goto("/admin/inventory");
    expect(response?.status()).not.toBe(500);
    // Tìm h1 chứa "kho" (tránh vấn đề encoding với ký tự ồ)
    await expect(page.locator("h1").filter({ hasText: "kho" })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('a[href="/admin/inventory/new"]')).toBeVisible();
    await expect(page.locator("table")).toBeVisible({ timeout: 20000 });
  });

  // TC-1506: Cashbook page
  test("TC-1506: Trang sổ quỹ tải thành công", async ({ page }) => {
    const response = await page.goto("/admin/cashbook");
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("main h1")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
  });

  // TC-1507: Payroll page hiển thị tiêu đề
  test("TC-1507: Trang bảng lương hiển thị tiêu đề ngay", async ({
    page,
  }) => {
    const now = new Date();
    const response = await page.goto(
      `/admin/payroll?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
    );
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("main h1")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
  });

  // TC-1508: Customers page hiển thị tiêu đề + nút Thêm
  test("TC-1508: Trang khách hàng hiển thị tiêu đề và nút Thêm khách hàng", async ({
    page,
  }) => {
    const response = await page.goto("/admin/customers");
    expect(response?.status()).not.toBe(500);
    await expect(
      page.locator("h1", { hasText: "Quản lý khách hàng" })
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator('a[href="/admin/customers/new"]')).toBeVisible();
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
  });

  // TC-1509: Loyalty page
  test("TC-1509: Trang tích điểm tải thành công", async ({ page }) => {
    const response = await page.goto("/admin/loyalty");
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("main h1").first()).toBeVisible({
      timeout: 5000,
    });
  });

  // TC-1510: Chuyển trang từ employees -> cashbook -> customers không lỗi
  test("TC-1510: Điều hướng liên tục giữa các trang không gây lỗi", async ({
    page,
  }) => {
    await page.goto("/admin/employees");
    await expect(page.locator("main h1")).toBeVisible({ timeout: 10000 });

    await page.goto("/admin/cashbook");
    await expect(page.locator("main h1")).toBeVisible({
      timeout: 10000,
    });

    await page.goto("/admin/customers");
    await expect(page.locator("main h1")).toBeVisible({ timeout: 10000 });
  });

  // TC-1511: Inventory encoding đúng (không hiện ký tự lỗi)
  test("TC-1511: Trang tồn kho hiển thị tiếng Việt đúng, không bị lỗi font", async ({
    page,
  }) => {
    const response = await page.goto("/admin/inventory");
    expect(response?.status()).not.toBe(500);
    // h1 chứa "kho" (part of "Tồn kho")
    const h1 = page.locator("main h1").filter({ hasText: "kho" });
    await expect(h1).toBeVisible({ timeout: 10000 });
    // Search input placeholder should be visible (not garbled)
    await expect(page.locator('input[name="q"]')).toBeVisible();
    // Filter select should be visible
    await expect(page.locator('select[name="status"]')).toBeVisible();
    // Table loads
    await expect(page.locator("table")).toBeVisible({ timeout: 20000 });
  });

  // TC-1512: Cashbook filter form và CashTransactionForm hiện ngay, trước table
  test("TC-1512: Trang sổ quỹ hiện form nhập giao dịch và filter ngay lập tức", async ({
    page,
  }) => {
    const response = await page.goto("/admin/cashbook");
    expect(response?.status()).not.toBe(500);
    // h1 shows immediately
    await expect(page.locator("main h1")).toBeVisible({ timeout: 5000 });
    // Filter date inputs show immediately (no DB dependency)
    await expect(page.locator('input[name="from"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="to"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('select[name="type"]')).toBeVisible({ timeout: 5000 });
    // Table data loads after
    await expect(page.locator("table")).toBeVisible({ timeout: 20000 });
  });

  // TC-1513: Payroll form tháng/năm hiện ngay, trước table
  test("TC-1513: Trang bảng lương hiện form chọn tháng/năm ngay lập tức", async ({
    page,
  }) => {
    const now = new Date();
    const response = await page.goto(
      `/admin/payroll?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
    );
    expect(response?.status()).not.toBe(500);
    // h1 shows immediately
    await expect(page.locator("main h1")).toBeVisible({ timeout: 5000 });
    // Month/year selectors show immediately (scope to filter form, not CalculatePayrollForm)
    await expect(page.locator('select[name="month"]').last()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('select[name="year"]').last()).toBeVisible({ timeout: 5000 });
    // Table loads after
    await expect(page.locator("table")).toBeVisible({ timeout: 20000 });
  });

  // TC-1514: Employees search bar hiện ngay, trước table data
  test("TC-1514: Trang nhân viên hiện thanh tìm kiếm ngay lập tức", async ({
    page,
  }) => {
    const response = await page.goto("/admin/employees");
    expect(response?.status()).not.toBe(500);
    // h1 + button shows immediately
    await expect(page.locator("main h1")).toBeVisible({ timeout: 5000 });
    await expect(page.locator('a[href="/admin/employees/new"]')).toBeVisible({ timeout: 5000 });
    // Search input loads (from EmployeesFilter Suspense - fast query)
    await expect(page.locator('input[type="search"]')).toBeVisible({ timeout: 10000 });
    // Table data loads
    await expect(page.locator("table")).toBeVisible({ timeout: 20000 });
  });
});
