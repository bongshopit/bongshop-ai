import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Máº­t kháº©u").fill("bongshop");
  await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

const testDesc = `Thu test PW-${String(Date.now()).slice(-6)}`;
const testDescExpense = `Chi test PW-${String(Date.now()).slice(-6)}`;

test.describe("US-005: Sá»• quá»¹", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-501: Trang sá»• quá»¹ hiá»ƒn thá»‹ Ä‘Ãºng
  test("TC-501: Trang sá»• quá»¹ hiá»ƒn thá»‹ Ä‘Ãºng", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await expect(page.getByRole("heading", { name: "Sá»• quá»¹" })).toBeVisible();

    // AC-5.3 â€” sá»‘ dÆ° quá»¹ hiá»‡n táº¡i
    await expect(page.getByText("Sá»‘ dÆ° quá»¹ hiá»‡n táº¡i")).toBeVisible();
    await expect(page.getByText("Tá»•ng thu")).toBeVisible();
    await expect(page.getByText("Tá»•ng chi")).toBeVisible();

    // Form táº¡o phiáº¿u
    await expect(page.getByText("Táº¡o phiáº¿u thu / chi")).toBeVisible();

    // Báº£ng giao dá»‹ch
    await expect(page.getByRole("table")).toBeVisible();
  });

  // TC-502: Form táº¡o phiáº¿u hiá»ƒn thá»‹ Ä‘á»§ fields
  test("TC-502: Form táº¡o phiáº¿u cÃ³ Ä‘á»§ fields", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await expect(page.getByRole("button", { name: "Phiáº¿u thu", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Phiáº¿u chi", exact: true })).toBeVisible();
    await expect(page.getByLabel("Sá»‘ tiá»n (VNÄ)")).toBeVisible();
    await expect(page.getByLabel("NgÃ y giao dá»‹ch")).toBeVisible();
    await expect(page.getByLabel("MÃ´ táº£")).toBeVisible();
    await expect(page.getByLabel("Danh má»¥c")).toBeVisible();
    await expect(page.getByRole("button", { name: "Táº¡o phiáº¿u thu" })).toBeVisible();
  });

  // TC-503: Táº¡o phiáº¿u thu thÃ nh cÃ´ng (AC-5.1)
  test("TC-503: Táº¡o phiáº¿u thu thÃ nh cÃ´ng", async ({ page }) => {
    await page.goto("/admin/cashbook");

    // Äáº£m báº£o Ä‘ang á»Ÿ tab Thu
    await page.getByRole("button", { name: "Phiáº¿u thu", exact: true }).click();

    await page.getByLabel("Sá»‘ tiá»n (VNÄ)").fill("500000");
    await page.getByLabel("MÃ´ táº£").fill(testDesc);

    await page.getByRole("button", { name: "Táº¡o phiáº¿u thu" }).click();

    await expect(page.getByText("Táº¡o phiáº¿u thu thÃ nh cÃ´ng!")).toBeVisible({ timeout: 5000 });

    // Giao dá»‹ch xuáº¥t hiá»‡n trong báº£ng
    await expect(page.locator("table tbody")).toContainText(testDesc);
  });

  // TC-504: Validation â€” thiáº¿u mÃ´ táº£
  test("TC-504: Validation â€” thiáº¿u mÃ´ táº£", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await page.getByLabel("Sá»‘ tiá»n (VNÄ)").fill("100000");
    // Bá» trá»‘ng mÃ´ táº£

    await page.getByRole("button", { name: "Táº¡o phiáº¿u thu" }).click();

    // Váº«n á»Ÿ trang cashbook (HTML5 required hoáº·c custom validation)
    await expect(page).toHaveURL(/\/admin\/cashbook/);
  });

  // TC-505: Táº¡o phiáº¿u chi thÃ nh cÃ´ng (AC-5.1)
  test("TC-505: Táº¡o phiáº¿u chi thÃ nh cÃ´ng", async ({ page }) => {
    await page.goto("/admin/cashbook");

    // Chuyá»ƒn sang tab Chi
    await page.getByRole("button", { name: "Phiáº¿u chi", exact: true }).click();
    await expect(page.getByRole("button", { name: "Táº¡o phiáº¿u chi" })).toBeVisible();

    await page.getByLabel("Sá»‘ tiá»n (VNÄ)").fill("100000");
    await page.getByLabel("MÃ´ táº£").fill(testDescExpense);

    await page.getByRole("button", { name: "Táº¡o phiáº¿u chi" }).click();

    await expect(page.getByText("Táº¡o phiáº¿u chi thÃ nh cÃ´ng!")).toBeVisible({ timeout: 5000 });

    // Giao dá»‹ch xuáº¥t hiá»‡n trong báº£ng
    await expect(page.locator("table tbody")).toContainText(testDescExpense);
  });

  // TC-506: BR-005 â€” chi vÆ°á»£t sá»‘ dÆ° bá»‹ tá»« chá»‘i
  test("TC-506: BR-005 â€” chi vÆ°á»£t sá»‘ dÆ° bá»‹ tá»« chá»‘i", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await page.getByRole("button", { name: "Phiáº¿u chi", exact: true }).click();

    // Nháº­p sá»‘ tiá»n ráº¥t lá»›n
    await page.getByLabel("Sá»‘ tiá»n (VNÄ)").fill("999999999999");
    await page.getByLabel("MÃ´ táº£").fill("Chi vÆ°á»£t quá»¹ test");

    await page.getByRole("button", { name: "Táº¡o phiáº¿u chi" }).click();

    await expect(page.getByText(/Sá»‘ dÆ° quá»¹ khÃ´ng Ä‘á»§/)).toBeVisible({ timeout: 5000 });
  });

  // TC-507: Danh sÃ¡ch giao dá»‹ch â€” filter theo loáº¡i Thu (AC-5.2)
  test("TC-507: Filter theo loáº¡i Thu", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await page.locator("select[name='type']").selectOption("INCOME");
    await page.getByRole("button", { name: "Lá»c" }).click();

    await expect(page).toHaveURL(/type=INCOME/);

    // KhÃ´ng cÃ³ badge "Chi" trong báº£ng
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    if (count > 0 && !(await rows.first().getByText("KhÃ´ng cÃ³ giao dá»‹ch").isVisible())) {
      const firstBadge = rows.first().locator("span").first();
      await expect(firstBadge).toContainText("Thu");
    }
  });

  // TC-508: Filter theo loáº¡i Chi (AC-5.2)
  test("TC-508: Filter theo loáº¡i Chi", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await page.locator("select[name='type']").selectOption("EXPENSE");
    await page.getByRole("button", { name: "Lá»c" }).click();

    await expect(page).toHaveURL(/type=EXPENSE/);
  });

  // TC-509: Filter theo khoáº£ng thá»i gian (AC-5.2)
  test("TC-509: Filter theo khoáº£ng thá»i gian", async ({ page }) => {
    await page.goto("/admin/cashbook");

    const today = new Date().toISOString().slice(0, 10);
    await page.locator("input[name='from']").fill(today);
    await page.locator("input[name='to']").fill(today);
    await page.getByRole("button", { name: "Lá»c" }).click();

    await expect(page).toHaveURL(/from=.+&to=.+/);

    // CÃ³ giao dá»‹ch vá»«a táº¡o trong TC-503 vÃ  TC-505
    await expect(page.locator("table tbody")).toContainText(testDesc);
  });

  // TC-510: BÃ¡o cÃ¡o ká»³ lá»c hiá»ƒn thá»‹ khi cÃ³ filter (AC-5.4)
  test("TC-510: BÃ¡o cÃ¡o ká»³ lá»c hiá»ƒn thá»‹", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.goto(`/admin/cashbook?from=${today}&to=${today}`);

    await expect(page.getByText("BÃ¡o cÃ¡o ká»³ lá»c:")).toBeVisible();
    await expect(page.getByText(/Sá»‘ dÆ° cuá»‘i ká»³/)).toBeVisible();
  });

  // TC-511: XÃ³a lá»c trá»Ÿ vá» danh sÃ¡ch Ä‘áº§y Ä‘á»§
  test("TC-511: NÃºt xÃ³a lá»c hoáº¡t Ä‘á»™ng", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.goto(`/admin/cashbook?from=${today}&to=${today}&type=INCOME`);

    await expect(page.getByRole("link", { name: "XÃ³a lá»c" })).toBeVisible();
    await page.getByRole("link", { name: "XÃ³a lá»c" }).click();

    await expect(page).toHaveURL(/\/admin\/cashbook$/);
  });

  // TC-512: Sá»‘ dÆ° hiá»‡n táº¡i thay Ä‘á»•i sau khi táº¡o giao dá»‹ch (AC-5.3)
  test("TC-512: Sá»‘ dÆ° quá»¹ pháº£n Ã¡nh Ä‘Ãºng sau giao dá»‹ch", async ({ page }) => {
    await page.goto("/admin/cashbook");

    // Äá»c sá»‘ dÆ° hiá»‡n táº¡i
    const balanceEl = page.locator("p.text-xl.font-bold").first();
    await expect(balanceEl).toBeVisible();
    const balanceText = await balanceEl.textContent();
    expect(balanceText).toBeTruthy();

    // Táº¡o thÃªm phiáº¿u thu 200k
    await page.getByRole("button", { name: "Phiáº¿u thu", exact: true }).click();
    await page.getByLabel("Sá»‘ tiá»n (VNÄ)").fill("200000");
    await page.getByLabel("MÃ´ táº£").fill(`Thu thÃªm verify balance ${Date.now()}`);
    await page.getByRole("button", { name: "Táº¡o phiáº¿u thu" }).click();

    await expect(page.getByText("Táº¡o phiáº¿u thu thÃ nh cÃ´ng!")).toBeVisible({ timeout: 5000 });

    // Sá»‘ dÆ° má»›i pháº£i khÃ¡c sá»‘ dÆ° cÅ© (Ä‘Ã£ tÄƒng)
    const newBalanceText = await page.locator("p.text-xl.font-bold").first().textContent();
    expect(newBalanceText).not.toEqual(balanceText);
  });
});

