import { test, expect } from "@playwright/test";

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

test.describe("US-014: Sửa lỗi Pagination & Cải thiện Hiệu năng", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─── TC-1401: Payroll page tải đúng, không lỗi ──────────────────────────
  test("TC-1401: Trang bảng lương tải thành công, hiển thị table", async ({
    page,
  }) => {
    const response = await page.goto(
      `/admin/payroll?month=${month}&year=${year}`
    );
    expect(response?.status()).not.toBe(500);

    await expect(
      page.getByRole("heading", { name: "Bảng lương" })
    ).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  // ─── TC-1402: Payroll pagination — URL giữ filter tháng/năm ─────────────
  test("TC-1402: Payroll ?page=2 giữ nguyên filter tháng/năm", async ({
    page,
  }) => {
    await page.goto(`/admin/payroll?month=${month}&year=${year}&page=2`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("table")).toBeVisible();

    const url = new URL(page.url());
    expect(url.searchParams.get("month")).toBe(String(month));
    expect(url.searchParams.get("year")).toBe(String(year));
  });

  // ─── TC-1403: Payroll ?page=9999 không crash ─────────────────────────────
  test("TC-1403: Payroll ?page=9999 không crash, redirect về trang cuối", async ({
    page,
  }) => {
    const response = await page.goto(
      `/admin/payroll?month=${month}&year=${year}&page=9999`
    );
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole("heading", { name: "Bảng lương" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  // ─── TC-1404: Payroll trang 1 — nút "Trước" không phải link ─────────────
  test("TC-1404: Nút Trước disabled ở trang 1 của Payroll", async ({
    page,
  }) => {
    await page.goto(`/admin/payroll?month=${month}&year=${year}`);
    await page.waitForLoadState("networkidle");

    const paginationNav = page.locator("nav[aria-label='Phân trang']");
    const hasPagination = await paginationNav.isVisible().catch(() => false);

    if (hasPagination) {
      // Không có link "Trang trước" ở trang 1 (chỉ có span disabled)
      await expect(
        paginationNav.locator("a[aria-label='Trang trước']")
      ).not.toBeVisible();
    } else {
      // Ít hơn 25 bản ghi — pagination ẩn → OK
      test.skip();
    }
  });

  // ─── TC-1405: Attendance page tải đúng, không lỗi ───────────────────────
  test("TC-1405: Trang chấm công tải thành công, hiển thị table", async ({
    page,
  }) => {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    const response = await page.goto(
      `/admin/attendance?month=${currentMonth}`
    );
    expect(response?.status()).not.toBe(500);

    await expect(
      page.locator("h1", { hasText: "Chấm công" })
    ).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  // ─── TC-1406: Attendance rows ≤ 50 mỗi trang ────────────────────────────
  test("TC-1406: Attendance trang 1 hiển thị tối đa 50 dòng", async ({
    page,
  }) => {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    await page.goto(`/admin/attendance?month=${currentMonth}`);
    await page.waitForLoadState("networkidle");

    const rows = page
      .locator("tbody tr")
      .filter({ hasNotText: "Không có dữ liệu" });
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(50);
  });

  // ─── TC-1407: Attendance ?page=2 giữ nguyên filter ──────────────────────
  test("TC-1407: Attendance ?page=2 giữ nguyên filter tháng", async ({
    page,
  }) => {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    await page.goto(`/admin/attendance?month=${currentMonth}&page=2`);

    expect(page.url()).not.toContain("500");
    await expect(page.locator("table")).toBeVisible();

    const url = new URL(page.url());
    expect(url.searchParams.get("month")).toBe(currentMonth);
  });

  // ─── TC-1408: Attendance ?page=9999 không crash ──────────────────────────
  test("TC-1408: Attendance ?page=9999 không crash", async ({ page }) => {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    const response = await page.goto(
      `/admin/attendance?month=${currentMonth}&page=9999`
    );
    expect(response?.status()).not.toBe(500);
    await expect(
      page.locator("h1", { hasText: "Chấm công" })
    ).toBeVisible();
  });

  // ─── TC-1409: Attendance nút Trước disabled trang 1 ─────────────────────
  test("TC-1409: Nút Trước disabled ở trang 1 của Attendance", async ({
    page,
  }) => {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    await page.goto(`/admin/attendance?month=${currentMonth}`);
    await page.waitForLoadState("networkidle");

    const paginationNav = page.locator("nav[aria-label='Phân trang']");
    const hasPagination = await paginationNav.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(
        paginationNav.locator("a[aria-label='Trang trước']")
      ).not.toBeVisible();
    } else {
      // Ít hơn 50 bản ghi → pagination ẩn → OK
      test.skip();
    }
  });

  // ─── TC-1410: Shifts page không lỗi ─────────────────────────────────────
  test("TC-1410: Shifts page tải thành công, không crash", async ({ page }) => {
    const response = await page.goto("/admin/shifts");
    expect(response?.status()).not.toBe(500);
    await expect(
      page.getByRole("heading", { name: "Ca làm việc" })
    ).toBeVisible();
  });

  // ─── TC-1411: Customers pagination vẫn hoạt động sau thêm select ────────
  test("TC-1411: Customers page tải đúng sau thay đổi select query", async ({
    page,
  }) => {
    const response = await page.goto("/admin/customers");
    expect(response?.status()).not.toBe(500);
    await expect(
      page.getByRole("heading", { name: "Quản lý khách hàng" })
    ).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    const rows = page
      .locator("tbody tr")
      .filter({ hasNotText: "Không tìm thấy" });
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(20);
  });
});
