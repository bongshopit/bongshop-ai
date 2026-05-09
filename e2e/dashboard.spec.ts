import { test, expect } from "@playwright/test";

// Helper: login trÆ°á»›c má»—i test
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Máº­t kháº©u").fill("bongshop");
  await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-005: Dashboard hiá»ƒn thá»‹ 4 stat cards", async ({ page }) => {
    await expect(
      page.locator("h1", { hasText: "Dashboard" })
    ).toBeVisible();

    // 4 stat cards (dÃ¹ng heading h3 Ä‘á»ƒ trÃ¡nh trÃ¹ng vá»›i sidebar links)
    const statCards = page.locator("main");
    await expect(statCards.getByRole("heading", { name: "NhÃ¢n viÃªn" })).toBeVisible();
    await expect(statCards.getByText("Cháº¥m cÃ´ng hÃ´m nay")).toBeVisible();
    await expect(statCards.getByRole("heading", { name: "Sáº£n pháº©m" })).toBeVisible();
    await expect(statCards.getByRole("heading", { name: "KhÃ¡ch hÃ ng" })).toBeVisible();
  });

  test("TC-006: Sidebar navigation hoáº¡t Ä‘á»™ng", async ({ page }) => {
    // Check sidebar links exist
    const sidebarLinks = [
      { text: "NhÃ¢n viÃªn", url: "/admin/employees" },
      { text: "Cháº¥m cÃ´ng", url: "/admin/attendance" },
      { text: "Ca lÃ m viá»‡c", url: "/admin/shifts" },
      { text: "Tá»“n kho", url: "/admin/inventory" },
      { text: "Sá»• quá»¹", url: "/admin/cashbook" },
      { text: "LÆ°Æ¡ng", url: "/admin/payroll" },
      { text: "KhÃ¡ch hÃ ng", url: "/admin/customers" },
    ];

    for (const link of sidebarLinks) {
      const sidebarLink = page.locator("aside a", { hasText: link.text });
      await expect(sidebarLink).toBeVisible();
    }

    // Click "NhÃ¢n viÃªn" and verify navigation
    await page.locator("aside a", { hasText: "NhÃ¢n viÃªn" }).click();
    await expect(page).toHaveURL(/\/admin\/employees/);
    await expect(
      page.locator("h1", { hasText: "Quáº£n lÃ½ nhÃ¢n viÃªn" })
    ).toBeVisible();
  });
});

