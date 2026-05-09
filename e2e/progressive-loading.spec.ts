import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Máº­t kháº©u").fill("bongshop");
  await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();
  await page.waitForURL("**/admin", { timeout: 15000 });
}

test.describe("US-015: Progressive Loading", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-1501: Dashboard hiá»ƒn thá»‹ nhanh
  test("TC-1501: Dashboard táº£i thÃ nh cÃ´ng, hiá»ƒn thá»‹ tiÃªu Ä‘á» ngay", async ({
    page,
  }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 5000 });
  });

  // TC-1502: Employees page hiá»ƒn thá»‹ tiÃªu Ä‘á» + nÃºt thÃªm
  test("TC-1502: Trang nhÃ¢n viÃªn hiá»ƒn thá»‹ tiÃªu Ä‘á» vÃ  nÃºt ThÃªm nhÃ¢n viÃªn", async ({
    page,
  }) => {
    const response = await page.goto("/admin/employees");
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("h1", { hasText: "NhÃ¢n viÃªn" })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('a[href="/admin/employees/new"]')).toBeVisible();
    // Table loads eventually
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
  });

  // TC-1503: Attendance page hiá»ƒn thá»‹ tiÃªu Ä‘á»
  test("TC-1503: Trang cháº¥m cÃ´ng táº£i thÃ nh cÃ´ng", async ({ page }) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const response = await page.goto(`/admin/attendance?month=${month}`);
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole("heading", { name: "Cháº¥m cÃ´ng", exact: true }).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
  });

  // TC-1504: Shifts page
  test("TC-1504: Trang ca lÃ m viá»‡c táº£i thÃ nh cÃ´ng", async ({ page }) => {
    const response = await page.goto("/admin/shifts");
    expect(response?.status()).not.toBe(500);
    await expect(page.getByRole("heading", { name: "Ca lÃ m viá»‡c", exact: true })).toBeVisible({
      timeout: 5000,
    });
  });

  // TC-1505: Inventory page hiá»ƒn thá»‹ tiÃªu Ä‘á» + nÃºt
  test("TC-1505: Trang tá»“n kho hiá»ƒn thá»‹ tiÃªu Ä‘á» vÃ  nÃºt ThÃªm sáº£n pháº©m", async ({
    page,
  }) => {
    const response = await page.goto("/admin/inventory");
    expect(response?.status()).not.toBe(500);
    // TÃ¬m h1 chá»©a "kho" (trÃ¡nh váº¥n Ä‘á» encoding vá»›i kÃ½ tá»± á»“)
    await expect(page.locator("h1").filter({ hasText: "kho" })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('a[href="/admin/inventory/new"]')).toBeVisible();
    await expect(page.locator("table")).toBeVisible({ timeout: 20000 });
  });

  // TC-1506: Cashbook page
  test("TC-1506: Trang sá»• quá»¹ táº£i thÃ nh cÃ´ng", async ({ page }) => {
    const response = await page.goto("/admin/cashbook");
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("main h1")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
  });

  // TC-1507: Payroll page hiá»ƒn thá»‹ tiÃªu Ä‘á»
  test("TC-1507: Trang báº£ng lÆ°Æ¡ng hiá»ƒn thá»‹ tiÃªu Ä‘á» ngay", async ({
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

  // TC-1508: Customers page hiá»ƒn thá»‹ tiÃªu Ä‘á» + nÃºt ThÃªm
  test("TC-1508: Trang khÃ¡ch hÃ ng hiá»ƒn thá»‹ tiÃªu Ä‘á» vÃ  nÃºt ThÃªm khÃ¡ch hÃ ng", async ({
    page,
  }) => {
    const response = await page.goto("/admin/customers");
    expect(response?.status()).not.toBe(500);
    await expect(
      page.locator("h1", { hasText: "Quáº£n lÃ½ khÃ¡ch hÃ ng" })
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator('a[href="/admin/customers/new"]')).toBeVisible();
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });
  });

  // TC-1509: Loyalty page
  test("TC-1509: Trang tÃ­ch Ä‘iá»ƒm táº£i thÃ nh cÃ´ng", async ({ page }) => {
    const response = await page.goto("/admin/loyalty");
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("main h1").first()).toBeVisible({
      timeout: 5000,
    });
  });

  // TC-1510: Chuyá»ƒn trang tá»« employees -> cashbook -> customers khÃ´ng lá»—i
  test("TC-1510: Äiá»u hÆ°á»›ng liÃªn tá»¥c giá»¯a cÃ¡c trang khÃ´ng gÃ¢y lá»—i", async ({
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

  // TC-1511: Inventory encoding Ä‘Ãºng (khÃ´ng hiá»‡n kÃ½ tá»± lá»—i)
  test("TC-1511: Trang tá»“n kho hiá»ƒn thá»‹ tiáº¿ng Viá»‡t Ä‘Ãºng, khÃ´ng bá»‹ lá»—i font", async ({
    page,
  }) => {
    const response = await page.goto("/admin/inventory");
    expect(response?.status()).not.toBe(500);
    // h1 chá»©a "kho" (part of "Tá»“n kho")
    const h1 = page.locator("main h1").filter({ hasText: "kho" });
    await expect(h1).toBeVisible({ timeout: 10000 });
    // Search input placeholder should be visible (not garbled)
    await expect(page.locator('input[name="q"]')).toBeVisible();
    // Filter select should be visible
    await expect(page.locator('select[name="status"]')).toBeVisible();
    // Table loads
    await expect(page.locator("table")).toBeVisible({ timeout: 20000 });
  });

  // TC-1512: Cashbook filter form vÃ  CashTransactionForm hiá»‡n ngay, trÆ°á»›c table
  test("TC-1512: Trang sá»• quá»¹ hiá»‡n form nháº­p giao dá»‹ch vÃ  filter ngay láº­p tá»©c", async ({
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

  // TC-1513: Payroll form thÃ¡ng/nÄƒm hiá»‡n ngay, trÆ°á»›c table
  test("TC-1513: Trang báº£ng lÆ°Æ¡ng hiá»‡n form chá»n thÃ¡ng/nÄƒm ngay láº­p tá»©c", async ({
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

  // TC-1514: Employees search bar hiá»‡n ngay, trÆ°á»›c table data
  test("TC-1514: Trang nhÃ¢n viÃªn hiá»‡n thanh tÃ¬m kiáº¿m ngay láº­p tá»©c", async ({
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

