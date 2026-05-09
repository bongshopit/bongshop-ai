import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Máº­t kháº©u").fill("bongshop");
  await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

const ts = Date.now().toString().slice(-8);
const testName = `KH-${ts}`;
const testPhone = `09${ts.padStart(8, "0")}`.slice(0, 10);

test.describe("US-007: Quáº£n lÃ½ khÃ¡ch hÃ ng", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-701: Trang danh sÃ¡ch khÃ¡ch hÃ ng hiá»ƒn thá»‹ Ä‘Ãºng", async ({ page }) => {
    await page.goto("/admin/customers");

    await expect(page.locator("h1", { hasText: "Quáº£n lÃ½ khÃ¡ch hÃ ng" })).toBeVisible();
    await expect(page.getByRole("link", { name: /ThÃªm khÃ¡ch hÃ ng/ })).toBeVisible();
    await expect(page.getByPlaceholder("TÃ¬m theo tÃªn hoáº·c SÄT...")).toBeVisible();

    // Báº£ng pháº£i hiá»ƒn thá»‹ (dÃ¹ rá»—ng hoáº·c cÃ³ dá»¯ liá»‡u)
    await expect(page.locator("table")).toBeVisible();
  });

  test("TC-702: ThÃªm khÃ¡ch hÃ ng má»›i thÃ nh cÃ´ng", async ({ page }) => {
    await page.goto("/admin/customers/new");

    await expect(page.locator("h1", { hasText: "ThÃªm khÃ¡ch hÃ ng" })).toBeVisible();

    await page.getByLabel("TÃªn khÃ¡ch hÃ ng").fill(testName);
    await page.getByLabel("Sá»‘ Ä‘iá»‡n thoáº¡i").fill(testPhone);
    await page.getByLabel("Email").fill(`kh${ts}@test.com`);
    await page.getByLabel("Äá»‹a chá»‰").fill("123 ÄÆ°á»ng Test, TP.HCM");

    await page.getByRole("button", { name: "LÆ°u" }).click();

    // Redirect vá» danh sÃ¡ch
    await page.waitForURL("**/admin/customers", { timeout: 10000 });

    // KhÃ¡ch hÃ ng má»›i xuáº¥t hiá»‡n trong danh sÃ¡ch
    await expect(page.locator("table tbody")).toContainText(testName);
  });

  test("TC-703: Validate required field TÃªn", async ({ page }) => {
    await page.goto("/admin/customers/new");

    // Bá» trá»‘ng tÃªn, chá»‰ nháº­p SÄT
    await page.getByLabel("Sá»‘ Ä‘iá»‡n thoáº¡i").fill("0901234560");
    await page.getByRole("button", { name: "LÆ°u" }).click();

    await expect(page.locator("text=TÃªn khÃ´ng Ä‘Æ°á»£c trá»‘ng")).toBeVisible();
  });

  test("TC-704: Validate SÄT sai Ä‘á»‹nh dáº¡ng", async ({ page }) => {
    await page.goto("/admin/customers/new");

    await page.getByLabel("TÃªn khÃ¡ch hÃ ng").fill("Test Validation");
    await page.getByLabel("Sá»‘ Ä‘iá»‡n thoáº¡i").fill("123"); // quÃ¡ ngáº¯n

    await page.getByRole("button", { name: "LÆ°u" }).click();

    await expect(page.locator("text=SÄT khÃ´ng há»£p lá»‡ (10-11 chá»¯ sá»‘)")).toBeVisible();
  });

  test("TC-705: TÃ¬m kiáº¿m khÃ¡ch hÃ ng theo tÃªn", async ({ page }) => {
    await page.goto("/admin/customers");

    const searchInput = page.getByPlaceholder("TÃ¬m theo tÃªn hoáº·c SÄT...");
    await searchInput.fill(testName);

    await expect(page).toHaveURL(/q=KH-/, { timeout: 5000 });
    await expect(page.locator("table tbody")).toContainText(testName);
  });

  test("TC-706: Xem chi tiáº¿t khÃ¡ch hÃ ng", async ({ page }) => {
    await page.goto("/admin/customers");

    // Click "Xem" cho khÃ¡ch hÃ ng vá»«a táº¡o
    const row = page.locator("table tbody tr", { hasText: testName });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Xem" }).click();

    await page.waitForURL("**/admin/customers/**", { timeout: 8000 });

    // Trang chi tiáº¿t hiá»ƒn thá»‹ tÃªn KH
    await expect(page.locator("h1", { hasText: testName })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sá»­a thÃ´ng tin/ })).toBeVisible();

    // Báº£ng Ä‘Æ¡n hÃ ng hiá»ƒn thá»‹
    await expect(
      page.locator("text=Lá»‹ch sá»­ Ä‘Æ¡n hÃ ng").or(page.locator("text=ChÆ°a cÃ³ Ä‘Æ¡n hÃ ng nÃ o")).first()
    ).toBeVisible();
  });

  test("TC-707: Sá»­a thÃ´ng tin khÃ¡ch hÃ ng thÃ nh cÃ´ng", async ({ page }) => {
    await page.goto("/admin/customers");

    const row = page.locator("table tbody tr", { hasText: testName });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Sá»­a" }).click();

    await page.waitForURL("**/edit", { timeout: 8000 });
    await expect(page.locator("h1", { hasText: "Sá»­a thÃ´ng tin" })).toBeVisible();

    // Cáº­p nháº­t Ä‘á»‹a chá»‰
    const addressField = page.getByLabel("Äá»‹a chá»‰");
    await addressField.clear();
    await addressField.fill("456 ÄÆ°á»ng Updated, TP.HCM");

    await page.getByRole("button", { name: "LÆ°u" }).click();

    // Redirect vá» danh sÃ¡ch
    await page.waitForURL("**/admin/customers", { timeout: 10000 });
    await expect(page.locator("table tbody")).toContainText(testName);
  });

  // TC-708: Tá»•ng sá»‘ khÃ¡ch hÃ ng hiá»ƒn thá»‹ trÃªn trang danh sÃ¡ch
  test("TC-708: Tá»•ng sá»‘ khÃ¡ch hÃ ng hiá»ƒn thá»‹", async ({ page }) => {
    await page.goto("/admin/customers");
    // Tá»•ng khÃ¡ch pháº£i hiá»ƒn thá»‹ (sá»‘ â‰¥ 0)
    await expect(page.locator("text=/Tá»•ng khÃ¡ch/")).toBeVisible();
    // Pháº£i cÃ³ sá»‘ kÃ¨m theo
    const totalText = await page.locator("text=/Tá»•ng khÃ¡ch/").textContent();
    expect(totalText).toMatch(/\d/);
  });

  // TC-709: Pagination trang 2 khÃ´ng cÃ³ "undefined" trong URL
  test("TC-709: Pagination khÃ´ng sinh URL chá»©a 'undefined'", async ({ page }) => {
    await page.goto("/admin/customers");
    // Chá»‰ kiá»ƒm tra Ä‘Æ°á»£c náº¿u cÃ³ Ä‘á»§ data Ä‘á»ƒ hiá»‡n pagination
    // Kiá»ƒm tra báº±ng search: khÃ´ng set q â†’ URL pháº£i khÃ´ng cÃ³ "undefined"
    await page.goto("/admin/customers?page=1");
    const url = page.url();
    expect(url).not.toContain("undefined");

    // Náº¿u cÃ³ pagination, click sang trang 2 vÃ  kiá»ƒm tra URL
    const nextBtn = page.locator("nav[aria-label='PhÃ¢n trang'] a", { hasText: "2" }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForURL(/page=2/, { timeout: 5000 });
      expect(page.url()).not.toContain("undefined");
    }
  });

  // TC-710: Duplicate check báº±ng tÃªn (khÃ´ng cÃ³ SÄT)
  test("TC-710: ThÃªm KH khÃ´ng SÄT trÃ¹ng tÃªn â†’ bÃ¡o lá»—i", async ({ page }) => {
    const noPhoneName = `NoPhone-${ts}`;

    // Táº¡o KH Ä‘áº§u tiÃªn khÃ´ng cÃ³ SÄT
    await page.goto("/admin/customers/new");
    await page.getByLabel("TÃªn khÃ¡ch hÃ ng").fill(noPhoneName);
    await page.getByRole("button", { name: "LÆ°u" }).click();
    await page.waitForURL("**/admin/customers", { timeout: 10000 });

    // ThÃªm KH thá»© 2 cÃ¹ng tÃªn, khÃ´ng SÄT â†’ pháº£i bÃ¡o lá»—i
    await page.goto("/admin/customers/new");
    await page.getByLabel("TÃªn khÃ¡ch hÃ ng").fill(noPhoneName);
    await page.getByRole("button", { name: "LÆ°u" }).click();

    await expect(
      page.locator("text=KhÃ¡ch hÃ ng vá»›i tÃªn nÃ y Ä‘Ã£ tá»“n táº¡i")
    ).toBeVisible({ timeout: 5000 });
  });

  test("TC-711: XÃ³a táº¥t cáº£ khÃ¡ch hÃ ng â€” confirmation nháº­p XÃ“A", async ({ page }) => {
    await page.goto("/admin/customers");

    // NÃºt "XÃ³a táº¥t cáº£" hiá»ƒn thá»‹ trÃªn header
    const deleteAllBtn = page.getByRole("button", { name: /XÃ³a táº¥t cáº£/ });
    await expect(deleteAllBtn).toBeVisible();

    // Click â†’ dialog má»Ÿ
    await deleteAllBtn.click();
    await expect(page.getByRole("heading", { name: "XÃ³a táº¥t cáº£ khÃ¡ch hÃ ng", exact: true })).toBeVisible();

    // NÃºt submit trong dialog bá»‹ disabled khi chÆ°a nháº­p
    const submitBtn = page.locator("form").getByRole("button", { name: "XÃ³a táº¥t cáº£", exact: true });
    await expect(submitBtn).toBeDisabled();

    // Nháº­p sai â†’ váº«n disabled
    await page.getByPlaceholder("XÃ“A").fill("xoa");
    await expect(submitBtn).toBeDisabled();

    // Nháº­p Ä‘Ãºng â†’ enabled
    await page.getByPlaceholder("XÃ“A").fill("XÃ“A");
    await expect(submitBtn).toBeEnabled();

    // Há»§y â†’ dialog Ä‘Ã³ng, khÃ´ng xÃ³a
    await page.getByRole("button", { name: "Há»§y" }).click();
    await expect(page.getByRole("heading", { name: "XÃ³a táº¥t cáº£ khÃ¡ch hÃ ng", exact: true })).not.toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });
});

test.describe("US-016: Gá»­i hÃ ng khÃ¡ch hÃ ng", () => {
  test.describe.configure({ mode: "serial" });

  const storageTs = Date.now().toString().slice(-8);
  const storagePhone = `08${storageTs.padStart(8, "0")}`.slice(0, 10);
  const storageName = `StorageKH-${storageTs}`;
  let customerUrl = "";

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-1601: Setup - Táº¡o KH vÃ  kiá»ƒm tra section Gá»­i hÃ ng", async ({ page }) => {
    // Táº¡o KH má»›i
    await page.goto("/admin/customers/new");
    await page.getByLabel("TÃªn khÃ¡ch hÃ ng").fill(storageName);
    await page.getByLabel("Sá»‘ Ä‘iá»‡n thoáº¡i").fill(storagePhone);
    await page.getByRole("button", { name: "LÆ°u" }).click();
    await page.waitForURL("**/admin/customers", { timeout: 10000 });

    // VÃ o trang chi tiáº¿t
    const row = page.locator("table tbody tr", { hasText: storageName });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Xem" }).click();
    await page.waitForURL("**/admin/customers/**", { timeout: 8000 });

    customerUrl = page.url();

    // Section "Gá»­i hÃ ng" pháº£i hiá»ƒn thá»‹
    await expect(page.getByRole("heading", { name: "Gá»­i hÃ ng", exact: true })).toBeVisible();
    // NÃºt táº¡o phiáº¿u pháº£i hiá»ƒn thá»‹ vá»›i ADMIN
    await expect(page.getByRole("button", { name: /Táº¡o phiáº¿u gá»­i hÃ ng/ })).toBeVisible();
  });

  test("TC-1602: Táº¡o phiáº¿u gá»­i hÃ ng vá»›i 2 sáº£n pháº©m â†’ phiáº¿u OPEN xuáº¥t hiá»‡n", async ({ page }) => {
    await page.goto(customerUrl);

    await page.getByRole("button", { name: /Táº¡o phiáº¿u gá»­i hÃ ng/ }).click();
    await expect(page.getByRole("heading", { name: "Táº¡o phiáº¿u gá»­i hÃ ng", exact: true })).toBeVisible();

    // Nháº­p ghi chÃº
    await page.getByPlaceholder("VD: KhÃ¡ch Ä‘Ã£ thanh toÃ¡n, chá» mang vá»").fill("Test phiáº¿u e2e");

    // Nháº­p sáº£n pháº©m Ä‘áº§u tiÃªn
    const nameInputs = page.getByPlaceholder("TÃªn hÃ ng *");
    await nameInputs.first().fill("Ão thun tráº¯ng");

    // ThÃªm dÃ²ng thá»© 2
    await page.getByText("ThÃªm dÃ²ng").click();
    await nameInputs.nth(1).fill("Quáº§n jean xanh");

    // Submit
    await page.getByRole("button", { name: "Táº¡o phiáº¿u", exact: true }).click();

    // Toast success
    await expect(
      page.locator("[data-sonner-toast]", { hasText: /ÄÃ£ táº¡o phiáº¿u gá»­i hÃ ng/ })
    ).toBeVisible({ timeout: 10000 });

    // Phiáº¿u OPEN xuáº¥t hiá»‡n
    await expect(page.locator("text=Äang gá»­i")).toBeVisible({ timeout: 5000 });
  });

  test("TC-1604: Láº¥y hÃ ng má»™t pháº§n â†’ cÃ²n láº¡i giáº£m, phiáº¿u váº«n OPEN", async ({ page }) => {
    await page.goto(customerUrl);

    // Click "Láº¥y hÃ ng" cho sáº£n pháº©m Ä‘áº§u tiÃªn
    const takeBtn = page.getByRole("button", { name: "Láº¥y hÃ ng" }).first();
    await expect(takeBtn).toBeVisible({ timeout: 5000 });
    await takeBtn.click();

    await expect(page.getByRole("heading", { name: "Ghi nháº­n láº¥y hÃ ng", exact: true })).toBeVisible();
    // Nháº­p qty = 1 (láº¥y má»™t pháº§n)
    const qtyInput = page.locator("input[type='number']").last();
    await qtyInput.fill("1");
    await page.getByRole("button", { name: "XÃ¡c nháº­n" }).click();

    await expect(
      page.locator("[data-sonner-toast]", { hasText: /ÄÃ£ ghi nháº­n láº¥y hÃ ng/ })
    ).toBeVisible({ timeout: 10000 });

    // Phiáº¿u váº«n OPEN (vÃ¬ cÃ²n sáº£n pháº©m khÃ¡c)
    await expect(page.locator("text=Äang gá»­i")).toBeVisible();
  });

  test("TC-1605: ÄÃ³ng phiáº¿u thá»§ cÃ´ng â†’ tráº¡ng thÃ¡i HoÃ n táº¥t", async ({ page }) => {
    await page.goto(customerUrl);

    // ÄÃ³ng phiáº¿u
    const closeBtn = page.getByRole("button", { name: "ÄÃ³ng phiáº¿u" }).first();
    await expect(closeBtn).toBeVisible({ timeout: 5000 });
    await closeBtn.click();

    // Toast success vÃ  tráº¡ng thÃ¡i CLOSED
    await expect(
      page.locator("[data-sonner-toast]", { hasText: /ÄÃ£ Ä‘Ã³ng phiáº¿u/ })
    ).toBeVisible({ timeout: 10000 });

    // Badge "HoÃ n táº¥t" xuáº¥t hiá»‡n
    await expect(page.locator("text=HoÃ n táº¥t").first()).toBeVisible({ timeout: 5000 });
  });

  test("TC-1603: Láº¥y háº¿t hÃ ng â†’ phiáº¿u tá»± Ä‘á»™ng CLOSED", async ({ page }) => {
    await page.goto(customerUrl);

    // Táº¡o phiáº¿u má»›i vá»›i 1 sáº£n pháº©m, sá»‘ lÆ°á»£ng 1
    await page.getByRole("button", { name: /Táº¡o phiáº¿u gá»­i hÃ ng/ }).click();
    const nameInputs = page.getByPlaceholder("TÃªn hÃ ng *");
    await nameInputs.first().fill("Sáº£n pháº©m láº¥y háº¿t");
    // Äáº·t SL = 1
    const qtyInputs = page.getByPlaceholder("SL");
    await qtyInputs.first().fill("1");
    await page.getByRole("button", { name: "Táº¡o phiáº¿u", exact: true }).click();
    await expect(
      page.locator("[data-sonner-toast]", { hasText: /ÄÃ£ táº¡o phiáº¿u/ })
    ).toBeVisible({ timeout: 10000 });

    // Láº¥y háº¿t (qty = 1 = toÃ n bá»™)
    const takeBtns = page.getByRole("button", { name: "Láº¥y hÃ ng" });
    await expect(takeBtns.first()).toBeVisible({ timeout: 5000 });
    await takeBtns.first().click();

    await expect(page.getByRole("heading", { name: "Ghi nháº­n láº¥y hÃ ng", exact: true })).toBeVisible();
    // Sá»‘ lÆ°á»£ng Ä‘Ã£ pre-fill = cÃ²n láº¡i = 1 â†’ khÃ´ng cáº§n sá»­a
    await page.getByRole("button", { name: "XÃ¡c nháº­n" }).click();

    await expect(
      page.locator("[data-sonner-toast]", { hasText: /ÄÃ£ ghi nháº­n láº¥y hÃ ng/ })
    ).toBeVisible({ timeout: 10000 });

    // Phiáº¿u pháº£i tá»± CLOSED (badge HoÃ n táº¥t xuáº¥t hiá»‡n)
    await expect(page.locator("text=HoÃ n táº¥t").first()).toBeVisible({ timeout: 8000 });
  });

  test("TC-1606: XÃ³a táº¥t cáº£ phiáº¿u gá»­i hÃ ng â€” confirmation nháº­p XÃ“A", async ({ page }) => {
    await page.goto(customerUrl);

    // NÃºt "XÃ³a táº¥t cáº£" pháº£i hiá»ƒn thá»‹ (cÃ³ phiáº¿u tá»« TC-1602/TC-1603)
    const deleteAllBtn = page.getByRole("button", { name: /XÃ³a táº¥t cáº£/ });
    await expect(deleteAllBtn).toBeVisible({ timeout: 5000 });

    // Click â†’ dialog má»Ÿ
    await deleteAllBtn.click();
    await expect(page.getByRole("heading", { name: "XÃ³a táº¥t cáº£ phiáº¿u gá»­i hÃ ng", exact: true })).toBeVisible();

    // NÃºt "XÃ³a táº¥t cáº£" trong dialog bá»‹ disabled khi chÆ°a nháº­p
    const submitBtn = page.locator("form").getByRole("button", { name: "XÃ³a táº¥t cáº£", exact: true });
    await expect(submitBtn).toBeDisabled();

    // Nháº­p sai â†’ váº«n disabled
    await page.getByPlaceholder("XÃ“A").fill("xoa");
    await expect(submitBtn).toBeDisabled();

    // Nháº­p Ä‘Ãºng â†’ enabled
    await page.getByPlaceholder("XÃ“A").fill("XÃ“A");
    await expect(submitBtn).toBeEnabled();

    // Submit
    await submitBtn.click();

    // Toast thÃ nh cÃ´ng
    await expect(
      page.locator("[data-sonner-toast]", { hasText: /ÄÃ£ xÃ³a toÃ n bá»™ phiáº¿u gá»­i hÃ ng/ })
    ).toBeVisible({ timeout: 10000 });

    // KhÃ´ng cÃ²n phiáº¿u nÃ o
    await expect(page.getByText("ChÆ°a cÃ³ phiáº¿u gá»­i hÃ ng nÃ o")).toBeVisible({ timeout: 5000 });

    // NÃºt "XÃ³a táº¥t cáº£" biáº¿n máº¥t (khÃ´ng cÃ²n phiáº¿u)
    await expect(deleteAllBtn).not.toBeVisible();
  });
});

