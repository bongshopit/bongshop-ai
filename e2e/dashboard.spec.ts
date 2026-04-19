import { test, expect } from "@playwright/test";

// Helper: login trước mỗi test
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-005: Dashboard hiển thị 4 stat cards", async ({ page }) => {
    await expect(
      page.locator("h1", { hasText: "Dashboard" })
    ).toBeVisible();

    // 4 stat cards (dùng heading h3 để tránh trùng với sidebar links)
    const statCards = page.locator("main");
    await expect(statCards.getByRole("heading", { name: "Nhân viên" })).toBeVisible();
    await expect(statCards.getByText("Chấm công hôm nay")).toBeVisible();
    await expect(statCards.getByRole("heading", { name: "Sản phẩm" })).toBeVisible();
    await expect(statCards.getByRole("heading", { name: "Khách hàng" })).toBeVisible();
  });

  test("TC-006: Sidebar navigation hoạt động", async ({ page }) => {
    // Check sidebar links exist
    const sidebarLinks = [
      { text: "Nhân viên", url: "/admin/employees" },
      { text: "Chấm công", url: "/admin/attendance" },
      { text: "Ca làm việc", url: "/admin/shifts" },
      { text: "Tồn kho", url: "/admin/inventory" },
      { text: "Sổ quỹ", url: "/admin/cashbook" },
      { text: "Lương", url: "/admin/payroll" },
      { text: "Khách hàng", url: "/admin/customers" },
    ];

    for (const link of sidebarLinks) {
      const sidebarLink = page.locator("aside a", { hasText: link.text });
      await expect(sidebarLink).toBeVisible();
    }

    // Click "Nhân viên" and verify navigation
    await page.locator("aside a", { hasText: "Nhân viên" }).click();
    await expect(page).toHaveURL(/\/admin\/employees/);
    await expect(
      page.locator("h1", { hasText: "Quản lý nhân viên" })
    ).toBeVisible();
  });
});
