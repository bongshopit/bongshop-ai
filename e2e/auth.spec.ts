import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("TC-001: Login page hiển thị đúng", async ({ page }) => {
    await page.goto("/login");

    // Title "BongShop" visible
    await expect(page.locator("h3", { hasText: "BongShop" })).toBeVisible();

    // Description visible
    await expect(
      page.getByText("Đăng nhập hệ thống quản lý")
    ).toBeVisible();

    // Email & Password fields visible
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mật khẩu")).toBeVisible();

    // Submit button visible
    await expect(
      page.getByRole("button", { name: "Đăng nhập" })
    ).toBeVisible();
  });

  test("TC-002: Login thành công với admin", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("admin@bongshop.vn");
    await page.getByLabel("Mật khẩu").fill("admin123");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    // Wait for redirect to /admin
    await page.waitForURL("**/admin", { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);

    // Dashboard title visible
    await expect(
      page.locator("h1", { hasText: "Dashboard" })
    ).toBeVisible();
  });

  test("TC-003: Login thất bại với sai password", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("admin@bongshop.vn");
    await page.getByLabel("Mật khẩu").fill("wrongpassword");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    // Error message visible
    await expect(
      page.getByText("Email hoặc mật khẩu không đúng")
    ).toBeVisible({ timeout: 10000 });

    // Still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("TC-004: Redirect về /login khi chưa đăng nhập", async ({ page }) => {
    await page.goto("/admin");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});
