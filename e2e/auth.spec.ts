import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("TC-001: Login page hiá»ƒn thá»‹ Ä‘Ãºng", async ({ page }) => {
    await page.goto("/login");

    // Title "BongShop" visible
    await expect(page.locator("h3", { hasText: "BongShop" })).toBeVisible();

    // Description visible
    await expect(
      page.getByText("ÄÄƒng nháº­p há»‡ thá»‘ng quáº£n lÃ½")
    ).toBeVisible();

    // Email & Password fields visible
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Máº­t kháº©u")).toBeVisible();

    // Submit button visible
    await expect(
      page.getByRole("button", { name: "ÄÄƒng nháº­p" })
    ).toBeVisible();
  });

  test("TC-002: Login thÃ nh cÃ´ng vá»›i admin", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("admin@bongshop.vn");
    await page.getByLabel("Máº­t kháº©u").fill("bongshop");
    await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();

    // Wait for redirect to /admin
    await page.waitForURL("**/admin", { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);

    // Dashboard title visible
    await expect(
      page.locator("h1", { hasText: "Dashboard" })
    ).toBeVisible();
  });

  test("TC-003: Login tháº¥t báº¡i vá»›i sai password", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("admin@bongshop.vn");
    await page.getByLabel("Máº­t kháº©u").fill("wrongpassword");
    await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();

    // Error message visible
    await expect(
      page.getByText("Email hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºng")
    ).toBeVisible({ timeout: 10000 });

    // Still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("TC-004: Redirect vá» /login khi chÆ°a Ä‘Äƒng nháº­p", async ({ page }) => {
    await page.goto("/admin");

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });
});

