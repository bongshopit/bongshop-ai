import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Máº­t kháº©u").fill("bongshop");
  await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

test.describe("US-011: Pagination â€” PhÃ¢n trang báº£ng dá»¯ liá»‡u", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // â”€â”€â”€ TC-1101: Trang Inventory hiá»ƒn thá»‹ Ä‘Ãºng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1101: Trang tá»“n kho hiá»ƒn thá»‹ Ä‘Ãºng, Ä‘áº¿m rows â‰¤ 20", async ({ page }) => {
    await page.goto("/admin/inventory");

    await expect(page.locator("h1", { hasText: "Tá»“n kho" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Sá»‘ rows data trong tbody khÃ´ng vÆ°á»£t quÃ¡ 20
    const rows = page.locator("tbody tr").filter({ hasNotText: "KhÃ´ng tÃ¬m tháº¥y" });
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(20);
  });

  // â”€â”€â”€ TC-1102: Navigation ?page=2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1102: URL ?page=2 load Ä‘Ãºng trang 2", async ({ page }) => {
    await page.goto("/admin/inventory?page=2");

    await expect(page.locator("h1", { hasText: "Tá»“n kho" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Náº¿u cÃ³ pagination, trang 2 pháº£i Ä‘Æ°á»£c highlight
    const paginationNav = page.locator("nav[aria-label='PhÃ¢n trang']");
    const hasPagination = await paginationNav.isVisible();
    if (hasPagination) {
      // Sá»‘ trang 2 Ä‘Æ°á»£c highlight (aria-current="page")
      await expect(paginationNav.locator("[aria-current='page']")).toHaveText("2");
    }
  });

  // â”€â”€â”€ TC-1103: Filter reset vá» page 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1103: Submit filter â†’ URL khÃ´ng giá»¯ page cÅ©", async ({ page }) => {
    await page.goto("/admin/inventory?page=3");

    // Submit form tÃ¬m kiáº¿m â†’ tráº£ vá» trang 1
    await page.fill("input[name='q']", "test-search-reset");
    await page.click("button[type='submit']");

    await page.waitForURL("**/admin/inventory**");
    const url = new URL(page.url());
    // Sau khi search, page khÃ´ng pháº£i 3
    expect(url.searchParams.get("page")).not.toBe("3");
    expect(url.searchParams.get("q")).toBe("test-search-reset");
  });

  // â”€â”€â”€ TC-1104: Hiá»ƒn thá»‹ "X-Y / Z káº¿t quáº£" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1104: Pagination hiá»ƒn thá»‹ thÃ´ng tin tá»•ng káº¿t quáº£ khi > 20 báº£n ghi", async ({
    page,
  }) => {
    await page.goto("/admin/inventory");
    await expect(page.locator("table")).toBeVisible();

    const rows = page.locator("tbody tr").filter({ hasNotText: "KhÃ´ng tÃ¬m tháº¥y" });
    const count = await rows.count();

    const paginationNav = page.locator("nav[aria-label='PhÃ¢n trang']");
    const hasPagination = await paginationNav.isVisible();

    if (count === 20 || hasPagination) {
      // Pháº£i cÃ³ text dáº¡ng "Hiá»ƒn thá»‹ Xâ€“Y / Z káº¿t quáº£"
      await expect(page.locator("text=/Hiá»ƒn thá»‹/")).toBeVisible();
      await expect(page.locator("text=/káº¿t quáº£/")).toBeVisible();
    } else {
      // Ãt hÆ¡n 20 báº£n ghi â†’ khÃ´ng cÃ³ pagination
      await expect(paginationNav).not.toBeVisible();
    }
  });

  // â”€â”€â”€ TC-1105: ?page=9999 â†’ trang cuá»‘i â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1105: ?page=9999 khÃ´ng crash, hiá»ƒn thá»‹ Ä‘Ãºng", async ({ page }) => {
    const response = await page.goto("/admin/inventory?page=9999");
    // KhÃ´ng 500
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("h1", { hasText: "Tá»“n kho" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  // â”€â”€â”€ TC-1106: NÃºt "TrÆ°á»›c" disabled á»Ÿ trang 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1106: NÃºt TrÆ°á»›c disabled á»Ÿ trang 1 cá»§a Customers", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(page.locator("table")).toBeVisible();

    const paginationNav = page.locator("nav[aria-label='PhÃ¢n trang']");
    const hasPagination = await paginationNav.isVisible();

    if (hasPagination) {
      // NÃºt trÆ°á»›c á»Ÿ trang 1 lÃ  span (khÃ´ng pháº£i link) â†’ khÃ´ng thá»ƒ click
      const prevBtn = paginationNav.locator("span").filter({ hasText: "" }).first();
      // KhÃ´ng cÃ³ link "Trang trÆ°á»›c" (chá»‰ cÃ³ span disabled)
      await expect(paginationNav.locator("a[aria-label='Trang trÆ°á»›c']")).not.toBeVisible();
    } else {
      test.skip();
    }
  });

  // â”€â”€â”€ TC-1107: NÃºt "Sau" disabled á»Ÿ trang cuá»‘i â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1107: NÃºt Sau disabled á»Ÿ trang cuá»‘i cá»§a Customers", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(page.locator("table")).toBeVisible();

    const paginationNav = page.locator("nav[aria-label='PhÃ¢n trang']");
    const hasPagination = await paginationNav.isVisible();

    if (!hasPagination) {
      test.skip();
      return;
    }

    // Láº¥y tá»•ng trang tá»« text "Hiá»ƒn thá»‹ Xâ€“Y / Z káº¿t quáº£"
    const infoText = await page.locator("text=/káº¿t quáº£/").textContent();
    if (!infoText) {
      test.skip();
      return;
    }
    const match = infoText.match(/\/\s*([\d.]+)\s*káº¿t quáº£/);
    if (!match) {
      test.skip();
      return;
    }
    const total = parseInt(match[1].replace(/\./g, ""));
    const totalPages = Math.ceil(total / 20);

    await page.goto(`/admin/customers?page=${totalPages}`);
    await expect(paginationNav).toBeVisible();
    // á»ž trang cuá»‘i, nÃºt Sau lÃ  span (disabled)
    await expect(paginationNav.locator("a[aria-label='Trang sau']")).not.toBeVisible();
  });

  // â”€â”€â”€ TC-1108: Customers trang 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1108: Customers ?page=2 hiá»ƒn thá»‹ Ä‘Ãºng khi cÃ³ Ä‘á»§ dá»¯ liá»‡u", async ({ page }) => {
    await page.goto("/admin/customers?page=2");
    await expect(page.locator("h1", { hasText: "Quáº£n lÃ½ khÃ¡ch hÃ ng" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    const paginationNav = page.locator("nav[aria-label='PhÃ¢n trang']");
    const hasPagination = await paginationNav.isVisible();
    if (hasPagination) {
      await expect(paginationNav.locator("[aria-current='page']")).toHaveText("2");
    }
  });

  // â”€â”€â”€ TC-1109: Cashbook + filter type â†’ pagination Ä‘Ãºng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1109: Cashbook filter type=INCOME â†’ pagination giá»¯ filter param", async ({
    page,
  }) => {
    await page.goto("/admin/cashbook?type=INCOME&page=1");
    await expect(page.locator("h1", { hasText: "Sá»• quá»¹" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    const paginationNav = page.locator("nav[aria-label='PhÃ¢n trang']");
    const hasPagination = await paginationNav.isVisible();
    if (hasPagination) {
      // Khi nháº¥n trang 2, URL pháº£i giá»¯ type=INCOME
      const page2Link = paginationNav.locator("a").filter({ hasText: "2" }).first();
      const href = await page2Link.getAttribute("href");
      expect(href).toContain("type=INCOME");
      expect(href).toContain("page=2");
    }
  });

  // â”€â”€â”€ TC-1110: Employees filter â†’ pagination reset page=1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1110: Employees filter department â†’ URL khÃ´ng giá»¯ page cÅ©", async ({ page }) => {
    await page.goto("/admin/employees?page=5");

    // TÃ¬m vÃ  submit filter department
    const select = page.locator("select[name='department']");
    const hasSelect = await select.isVisible();
    if (hasSelect) {
      await select.selectOption({ index: 0 }); // all
      // Click submit náº¿u cÃ³
      const submitBtn = page.locator("button[type='submit']").first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForURL("**/admin/employees**");
        const url = new URL(page.url());
        expect(url.searchParams.get("page")).not.toBe("5");
      }
    }

    // Báº¥t ká»ƒ filter, trang pháº£i render
    await expect(page.locator("h1", { hasText: "Quáº£n lÃ½ nhÃ¢n viÃªn" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  // â”€â”€â”€ Edge case: page=invalid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1111: ?page=abc khÃ´ng crash, render trang 1", async ({ page }) => {
    const res = await page.goto("/admin/inventory?page=abc");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("table")).toBeVisible();
  });

  // â”€â”€â”€ Edge case: page=0 â†’ trang 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1112: ?page=0 render trang 1", async ({ page }) => {
    const res = await page.goto("/admin/customers?page=0");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("h1", { hasText: "Quáº£n lÃ½ khÃ¡ch hÃ ng" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });
});

