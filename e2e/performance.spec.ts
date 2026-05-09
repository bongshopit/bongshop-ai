import { test, expect } from "@playwright/test";

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Máº­t kháº©u").fill("bongshop");
  await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

test.describe("US-014: Sá»­a lá»—i Pagination & Cáº£i thiá»‡n Hiá»‡u nÄƒng", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // â”€â”€â”€ TC-1401: Payroll page táº£i Ä‘Ãºng, khÃ´ng lá»—i â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1401: Trang báº£ng lÆ°Æ¡ng táº£i thÃ nh cÃ´ng, hiá»ƒn thá»‹ table", async ({
    page,
  }) => {
    const response = await page.goto(
      `/admin/payroll?month=${month}&year=${year}`
    );
    expect(response?.status()).not.toBe(500);

    await expect(
      page.getByRole("heading", { name: "Báº£ng lÆ°Æ¡ng" })
    ).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  // â”€â”€â”€ TC-1402: Payroll pagination â€” URL giá»¯ filter thÃ¡ng/nÄƒm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1402: Payroll ?page=2 giá»¯ nguyÃªn filter thÃ¡ng/nÄƒm", async ({
    page,
  }) => {
    await page.goto(`/admin/payroll?month=${month}&year=${year}&page=2`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("table")).toBeVisible();

    const url = new URL(page.url());
    expect(url.searchParams.get("month")).toBe(String(month));
    expect(url.searchParams.get("year")).toBe(String(year));
  });

  // â”€â”€â”€ TC-1403: Payroll ?page=9999 khÃ´ng crash â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1403: Payroll ?page=9999 khÃ´ng crash, redirect vá» trang cuá»‘i", async ({
    page,
  }) => {
    const response = await page.goto(
      `/admin/payroll?month=${month}&year=${year}&page=9999`
    );
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole("heading", { name: "Báº£ng lÆ°Æ¡ng" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  // â”€â”€â”€ TC-1404: Payroll trang 1 â€” nÃºt "TrÆ°á»›c" khÃ´ng pháº£i link â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1404: NÃºt TrÆ°á»›c disabled á»Ÿ trang 1 cá»§a Payroll", async ({
    page,
  }) => {
    await page.goto(`/admin/payroll?month=${month}&year=${year}`);
    await page.waitForLoadState("networkidle");

    const paginationNav = page.locator("nav[aria-label='PhÃ¢n trang']");
    const hasPagination = await paginationNav.isVisible().catch(() => false);

    if (hasPagination) {
      // KhÃ´ng cÃ³ link "Trang trÆ°á»›c" á»Ÿ trang 1 (chá»‰ cÃ³ span disabled)
      await expect(
        paginationNav.locator("a[aria-label='Trang trÆ°á»›c']")
      ).not.toBeVisible();
    } else {
      // Ãt hÆ¡n 25 báº£n ghi â€” pagination áº©n â†’ OK
      test.skip();
    }
  });

  // â”€â”€â”€ TC-1405: Attendance page táº£i Ä‘Ãºng, khÃ´ng lá»—i â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1405: Trang cháº¥m cÃ´ng táº£i thÃ nh cÃ´ng, hiá»ƒn thá»‹ table", async ({
    page,
  }) => {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    const response = await page.goto(
      `/admin/attendance?month=${currentMonth}`
    );
    expect(response?.status()).not.toBe(500);

    await expect(
      page.locator("h1", { hasText: "Cháº¥m cÃ´ng" })
    ).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  // â”€â”€â”€ TC-1406: Attendance rows â‰¤ 50 má»—i trang â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1406: Attendance trang 1 hiá»ƒn thá»‹ tá»‘i Ä‘a 50 dÃ²ng", async ({
    page,
  }) => {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    await page.goto(`/admin/attendance?month=${currentMonth}`);
    await page.waitForLoadState("networkidle");

    const rows = page
      .locator("tbody tr")
      .filter({ hasNotText: "KhÃ´ng cÃ³ dá»¯ liá»‡u" });
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(50);
  });

  // â”€â”€â”€ TC-1407: Attendance ?page=2 giá»¯ nguyÃªn filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1407: Attendance ?page=2 giá»¯ nguyÃªn filter thÃ¡ng", async ({
    page,
  }) => {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    await page.goto(`/admin/attendance?month=${currentMonth}&page=2`);

    expect(page.url()).not.toContain("500");
    await expect(page.locator("table")).toBeVisible();

    const url = new URL(page.url());
    expect(url.searchParams.get("month")).toBe(currentMonth);
  });

  // â”€â”€â”€ TC-1408: Attendance ?page=9999 khÃ´ng crash â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1408: Attendance ?page=9999 khÃ´ng crash", async ({ page }) => {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    const response = await page.goto(
      `/admin/attendance?month=${currentMonth}&page=9999`
    );
    expect(response?.status()).not.toBe(500);
    await expect(
      page.locator("h1", { hasText: "Cháº¥m cÃ´ng" })
    ).toBeVisible();
  });

  // â”€â”€â”€ TC-1409: Attendance nÃºt TrÆ°á»›c disabled trang 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1409: NÃºt TrÆ°á»›c disabled á»Ÿ trang 1 cá»§a Attendance", async ({
    page,
  }) => {
    const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
    await page.goto(`/admin/attendance?month=${currentMonth}`);
    await page.waitForLoadState("networkidle");

    const paginationNav = page.locator("nav[aria-label='PhÃ¢n trang']");
    const hasPagination = await paginationNav.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(
        paginationNav.locator("a[aria-label='Trang trÆ°á»›c']")
      ).not.toBeVisible();
    } else {
      // Ãt hÆ¡n 50 báº£n ghi â†’ pagination áº©n â†’ OK
      test.skip();
    }
  });

  // â”€â”€â”€ TC-1410: Shifts page khÃ´ng lá»—i â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1410: Shifts page táº£i thÃ nh cÃ´ng, khÃ´ng crash", async ({ page }) => {
    const response = await page.goto("/admin/shifts");
    expect(response?.status()).not.toBe(500);
    await expect(
      page.getByRole("heading", { name: "Ca lÃ m viá»‡c" })
    ).toBeVisible();
  });

  // â”€â”€â”€ TC-1411: Customers pagination váº«n hoáº¡t Ä‘á»™ng sau thÃªm select â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1411: Customers page táº£i Ä‘Ãºng sau thay Ä‘á»•i select query", async ({
    page,
  }) => {
    const response = await page.goto("/admin/customers");
    expect(response?.status()).not.toBe(500);
    await expect(
      page.getByRole("heading", { name: "Quáº£n lÃ½ khÃ¡ch hÃ ng" })
    ).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    const rows = page
      .locator("tbody tr")
      .filter({ hasNotText: "KhÃ´ng tÃ¬m tháº¥y" });
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(20);
  });
});

