import { test, expect, type Page } from "@playwright/test";
import path from "path";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Máº­t kháº©u").fill("bongshop");
  await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

// Customer dÃ¹ng Ä‘á»ƒ test thá»§ cÃ´ng â€” cáº§n tá»“n táº¡i hoáº·c Ä‘Æ°á»£c táº¡o trÆ°á»›c
// TC sáº½ navigate Ä‘áº¿n trang danh sÃ¡ch vÃ  láº¥y KH Ä‘áº§u tiÃªn
async function getFirstCustomerId(page: Page): Promise<string | null> {
  await page.goto("/admin/customers");
  const firstLink = page.locator("table tbody tr a[href*='/admin/customers/']").first();
  const count = await firstLink.count();
  if (count === 0) return null;
  const href = await firstLink.getAttribute("href");
  return href?.split("/admin/customers/")[1]?.split("/")[0] ?? null;
}

test.describe("US-012: TÃ­ch Ä‘iá»ƒm thá»§ cÃ´ng vÃ  import KiotViet", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // â”€â”€â”€ TC-1201: Sidebar cÃ³ link TÃ­ch Ä‘iá»ƒm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1201: Sidebar hiá»ƒn thá»‹ link TÃ­ch Ä‘iá»ƒm", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.locator("nav a", { hasText: "TÃ­ch Ä‘iá»ƒm" })
    ).toBeVisible();
  });

  // â”€â”€â”€ TC-1202: Trang import hiá»ƒn thá»‹ Ä‘Ãºng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1202: Trang /admin/loyalty/import hiá»ƒn thá»‹ Ä‘Ãºng", async ({ page }) => {
    await page.goto("/admin/loyalty/import");

    await expect(
      page.locator("h1", { hasText: "Import tÃ­ch Ä‘iá»ƒm tá»« KiotViet" })
    ).toBeVisible();

    // HÆ°á»›ng dáº«n hiá»ƒn thá»‹
    await expect(page.getByText("Danh sÃ¡ch chi tiáº¿t hÃ³a Ä‘Æ¡n")).toBeVisible();

    // Input file vÃ  nÃºt phÃ¢n tÃ­ch
    await expect(page.locator("input[type='file']")).toBeAttached();
    await expect(
      page.getByRole("button", { name: "PhÃ¢n tÃ­ch file" })
    ).toBeVisible();
  });

  // â”€â”€â”€ TC-1203: Upload file xlsx há»£p lá»‡ â†’ preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1203: Upload DanhSachChiTietHoaDon.xlsx â†’ hiá»ƒn thá»‹ preview", async ({
    page,
  }) => {
    await page.goto("/admin/loyalty/import");

    const filePath = path.join(
      process.cwd(),
      "docs",
      "samples",
      "DanhSachChiTietHoaDon.xlsx"
    );

    // Upload file
    await page.locator("input[type='file']").setInputFiles(filePath);
    await expect(
      page.getByText("âœ“ DanhSachChiTietHoaDon.xlsx")
    ).toBeVisible();

    // PhÃ¢n tÃ­ch file
    await page.getByRole("button", { name: "PhÃ¢n tÃ­ch file" }).click();

    // Chá» stats cards hiá»ƒn thá»‹
    await expect(page.locator("div", { hasText: "HÃ³a Ä‘Æ¡n" }).first()).toBeVisible({ timeout: 15000 });

    // Báº£ng preview hiá»‡n vá»›i Ã­t nháº¥t 1 row
    const tableRows = page.locator("table tbody tr");
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
  });

  // â”€â”€â”€ TC-1204: NÃºt xÃ¡c nháº­n chá»‰ active khi cÃ³ khÃ¡ch khá»›p â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1204: NÃºt xÃ¡c nháº­n import hiá»ƒn thá»‹ sá»‘ khÃ¡ch khá»›p", async ({
    page,
  }) => {
    await page.goto("/admin/loyalty/import");

    const filePath = path.join(
      process.cwd(),
      "docs",
      "samples",
      "DanhSachChiTietHoaDon.xlsx"
    );
    await page.locator("input[type='file']").setInputFiles(filePath);
    await page.getByRole("button", { name: "PhÃ¢n tÃ­ch file" }).click();
    await expect(page.getByText("KhÃ¡ch khá»›p")).toBeVisible({ timeout: 15000 });

    // NÃºt xÃ¡c nháº­n pháº£i hiá»ƒn thá»‹
    const confirmBtn = page.getByRole("button", { name: /XÃ¡c nháº­n import/ });
    await expect(confirmBtn).toBeVisible();
  });

  // â”€â”€â”€ TC-1205: Trang chi tiáº¿t KH cÃ³ nÃºt ThÃªm Ä‘iá»ƒm (Manager/Admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1205: Trang chi tiáº¿t KH hiá»ƒn thá»‹ nÃºt ThÃªm Ä‘iá»ƒm vÃ  Äiá»u chá»‰nh Ä‘iá»ƒm", async ({
    page,
  }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "KhÃ´ng cÃ³ khÃ¡ch hÃ ng nÃ o trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);

    await expect(
      page.getByRole("button", { name: "ThÃªm Ä‘iá»ƒm" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Äiá»u chá»‰nh Ä‘iá»ƒm" })
    ).toBeVisible();
  });

  // â”€â”€â”€ TC-1206: ThÃªm Ä‘iá»ƒm thá»§ cÃ´ng thÃ nh cÃ´ng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1206: ThÃªm Ä‘iá»ƒm thá»§ cÃ´ng cho khÃ¡ch hÃ ng", async ({ page }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "KhÃ´ng cÃ³ khÃ¡ch hÃ ng nÃ o trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);

    // Láº¥y tá»•ng Ä‘iá»ƒm hiá»‡n táº¡i tá»« card "Tá»•ng Ä‘iá»ƒm"
    const totalPointsLocator = page
      .locator("div", { hasText: "Tá»•ng Ä‘iá»ƒm" })
      .locator("span.text-xl")
      .first();
    const pointsText = await totalPointsLocator.textContent();
    const currentTotal = parseInt(pointsText ?? "0", 10);

    // Má»Ÿ dialog thÃªm Ä‘iá»ƒm
    await page.getByRole("button", { name: "ThÃªm Ä‘iá»ƒm" }).click();

    // Dialog hiá»ƒn thá»‹
    await expect(page.getByText("ThÃªm Ä‘iá»ƒm tÃ­ch lÅ©y")).toBeVisible();

    // Äiá»n form
    await page.selectOption("select[name='category']", "SUA");
    await page.fill("input[name='points']", "10");
    await page.fill("input[name='reason']", "Test TC-1206 tÃ­ch Ä‘iá»ƒm Sá»¯a");

    // Submit
    await page.getByRole("button", { name: "ThÃªm Ä‘iá»ƒm" }).last().click();

    // Dialog Ä‘Ã³ng
    await expect(page.getByText("ThÃªm Ä‘iá»ƒm tÃ­ch lÅ©y")).not.toBeVisible({
      timeout: 10000,
    });

    // Tá»•ng Ä‘iá»ƒm tÄƒng thÃªm 10
    await expect(
      page.locator("div", { hasText: "Tá»•ng Ä‘iá»ƒm" }).locator("span.text-xl").first()
    ).toContainText(String(currentTotal + 10), { timeout: 10000 });
  });

  // â”€â”€â”€ TC-1207: ThÃªm Ä‘iá»ƒm vá»›i sá»‘ Ã¢m â†’ validation error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1207: ThÃªm Ä‘iá»ƒm vá»›i sá»‘ Ã¢m â†’ validation error", async ({ page }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "KhÃ´ng cÃ³ khÃ¡ch hÃ ng nÃ o trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);
    await page.getByRole("button", { name: "ThÃªm Ä‘iá»ƒm" }).click();
    await expect(page.getByText("ThÃªm Ä‘iá»ƒm tÃ­ch lÅ©y")).toBeVisible();

    await page.selectOption("select[name='category']", "DEFAULT");
    await page.fill("input[name='points']", "-5");
    await page.fill("input[name='reason']", "Test Ã¢m");
    await page.getByRole("button", { name: "ThÃªm Ä‘iá»ƒm" }).last().click();

    // Pháº£i hiá»‡n lá»—i validation
    await expect(
      page.getByText("Sá»‘ Ä‘iá»ƒm pháº£i lá»›n hÆ¡n 0")
    ).toBeVisible({ timeout: 5000 });
  });

  // â”€â”€â”€ TC-1208: Äiá»u chá»‰nh Ä‘iá»ƒm thá»§ cÃ´ng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1208: Äiá»u chá»‰nh Ä‘iá»ƒm thá»§ cÃ´ng (ADJUST)", async ({ page }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "KhÃ´ng cÃ³ khÃ¡ch hÃ ng nÃ o trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);

    await page.getByRole("button", { name: "Äiá»u chá»‰nh Ä‘iá»ƒm" }).click();
    await expect(page.getByText("Äiá»u chá»‰nh Ä‘iá»ƒm tÃ­ch lÅ©y")).toBeVisible();

    await page.selectOption("select[name='category']", "DEFAULT");
    await page.selectOption("select[name='type']", "ADJUST");
    await page.fill("input[name='delta']", "5");
    await page.fill("input[name='reason']", "Test TC-1208 ADJUST");
    await page.getByRole("button", { name: "XÃ¡c nháº­n" }).click();

    // Dialog Ä‘Ã³ng
    await expect(page.getByText("Äiá»u chá»‰nh Ä‘iá»ƒm tÃ­ch lÅ©y")).not.toBeVisible({
      timeout: 10000,
    });
  });

  // â”€â”€â”€ TC-1209: Lá»‹ch sá»­ Ä‘iá»ƒm hiá»ƒn thá»‹ sau khi thÃªm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1209: Lá»‹ch sá»­ tÃ­ch Ä‘iá»ƒm hiá»ƒn thá»‹ trÃªn trang chi tiáº¿t KH", async ({
    page,
  }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "KhÃ´ng cÃ³ khÃ¡ch hÃ ng nÃ o trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);

    // Heading lá»‹ch sá»­
    await expect(
      page.getByText("Lá»‹ch sá»­ tÃ­ch Ä‘iá»ƒm (10 gáº§n nháº¥t)")
    ).toBeVisible();

    // Báº£ng lá»‹ch sá»­ pháº£i tá»“n táº¡i (cÃ³ thá»ƒ rá»—ng hoáº·c cÃ³ dá»¯ liá»‡u)
    // Sau TC-1206 vÃ  TC-1208 Ä‘Ã£ táº¡o log â†’ pháº£i cÃ³ Ã­t nháº¥t 1 dÃ²ng
    const logRows = page.locator("table").filter({ hasText: "Danh má»¥c" }).locator("tbody tr");
    const count = await logRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // â”€â”€â”€ TC-1210: Äiá»u chá»‰nh trá»« quÃ¡ sá»‘ dÆ° â†’ lá»—i â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1210: ADJUST trá»« quÃ¡ sá»‘ dÆ° â†’ lá»—i KhÃ´ng Ä‘á»§ Ä‘iá»ƒm", async ({
    page,
  }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "KhÃ´ng cÃ³ khÃ¡ch hÃ ng nÃ o trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);
    await page.getByRole("button", { name: "Äiá»u chá»‰nh Ä‘iá»ƒm" }).click();
    await expect(page.getByText("Äiá»u chá»‰nh Ä‘iá»ƒm tÃ­ch lÅ©y")).toBeVisible();

    await page.selectOption("select[name='category']", "TA_BIM");
    await page.selectOption("select[name='type']", "ADJUST");
    await page.fill("input[name='delta']", "-999999");
    await page.fill("input[name='reason']", "Test TC-1210 trá»« quÃ¡");
    await page.getByRole("button", { name: "XÃ¡c nháº­n" }).click();

    // Pháº£i hiá»‡n lá»—i
    await expect(
      page.getByText(/KhÃ´ng Ä‘á»§ Ä‘iá»ƒm/)
    ).toBeVisible({ timeout: 5000 });
  });

  // â”€â”€â”€ TC-1211 (US-013): Trang /admin/loyalty hiá»ƒn thá»‹ Ä‘Ãºng â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1211: Trang /admin/loyalty hiá»ƒn thá»‹ heading vÃ  3 card cÃ i Ä‘áº·t", async ({
    page,
  }) => {
    await page.goto("/admin/loyalty");

    await expect(page.locator("h1", { hasText: "TÃ­ch Ä‘iá»ƒm" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Import KiotViet" })).toBeVisible();

    // 3 card danh má»¥c â€” dÃ¹ng locator chÃ­nh xÃ¡c trÃ¡nh strict mode violation
    await expect(page.locator("p", { hasText: "Máº·c Ä‘á»‹nh" }).first()).toBeVisible();
    await expect(page.locator("p", { hasText: "Sá»¯a" }).first()).toBeVisible();
    await expect(page.locator("p", { hasText: "TÃ£ bá»‰m" }).first()).toBeVisible();

    // CÃ³ Ã­t nháº¥t 3 nÃºt Chá»‰nh sá»­a
    const editButtons = page.getByRole("button", { name: "Chá»‰nh sá»­a" });
    await expect(editButtons.first()).toBeVisible();
    expect(await editButtons.count()).toBeGreaterThanOrEqual(3);
  });

  // â”€â”€â”€ TC-1212 (US-013): CÃ i Ä‘áº·t tá»‰ lá»‡ Máº·c Ä‘á»‹nh (Theo tiá»n) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1212: Chá»‰nh sá»­a tá»‰ lá»‡ Máº·c Ä‘á»‹nh â†’ Theo tiá»n 50.000 VNÄ", async ({
    page,
  }) => {
    await page.goto("/admin/loyalty");

    // Click nÃºt Chá»‰nh sá»­a Ä‘áº§u tiÃªn (Máº·c Ä‘á»‹nh)
    await page.getByRole("button", { name: "Chá»‰nh sá»­a" }).first().click();

    // Dialog hiá»ƒn thá»‹
    await expect(page.getByText("CÃ i Ä‘áº·t tá»‰ lá»‡ â€” Máº·c Ä‘á»‹nh")).toBeVisible();

    // Chá»n Theo tiá»n, Ä‘áº·t 50000
    await page.locator("input[name='rateType'][value='AMOUNT']").check();
    await page.locator("input[name='amountPerPoint']").fill("50000");
    await page.getByRole("button", { name: "LÆ°u cÃ i Ä‘áº·t" }).click();

    // Dialog Ä‘Ã³ng vÃ  success message hiá»‡n
    await expect(page.getByText("CÃ i Ä‘áº·t tá»‰ lá»‡ â€” Máº·c Ä‘á»‹nh")).not.toBeVisible({ timeout: 8000 });
    await expect(page.getByText("ÄÃ£ lÆ°u cÃ i Ä‘áº·t").first()).toBeVisible({ timeout: 8000 });

    // Reload Ä‘á»ƒ xÃ¡c nháº­n dá»¯ liá»‡u Ä‘Ã£ Ä‘Æ°á»£c lÆ°u vÃ o DB
    await page.reload();
    await expect(page.getByText(/50\.000 VNÄ = 1 Ä‘iá»ƒm/)).toBeVisible({ timeout: 8000 });

    // Reset láº¡i 10000
    await page.getByRole("button", { name: "Chá»‰nh sá»­a" }).first().click();
    await page.locator("input[name='rateType'][value='AMOUNT']").check();
    await page.locator("input[name='amountPerPoint']").fill("10000");
    await page.getByRole("button", { name: "LÆ°u cÃ i Ä‘áº·t" }).click();
    await expect(page.getByText("CÃ i Ä‘áº·t tá»‰ lá»‡ â€” Máº·c Ä‘á»‹nh")).not.toBeVisible({ timeout: 8000 });
  });

  // â”€â”€â”€ TC-1213 (US-013): CÃ i Ä‘áº·t tá»‰ lá»‡ Sá»¯a â†’ Theo sáº£n pháº©m 2 Ä‘iá»ƒm â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1213: Chá»‰nh sá»­a tá»‰ lá»‡ Sá»¯a â†’ Theo sáº£n pháº©m 2 Ä‘iá»ƒm", async ({
    page,
  }) => {
    await page.goto("/admin/loyalty");

    // NÃºt Chá»‰nh sá»­a thá»© 2 (Sá»¯a)
    await page.getByRole("button", { name: "Chá»‰nh sá»­a" }).nth(1).click();

    await expect(page.getByText("CÃ i Ä‘áº·t tá»‰ lá»‡ â€” Sá»¯a")).toBeVisible();

    await page.locator("input[name='rateType'][value='PRODUCT']").check();
    await page.locator("input[name='pointsPerProduct']").fill("2");
    await page.getByRole("button", { name: "LÆ°u cÃ i Ä‘áº·t" }).click();

    // Dialog Ä‘Ã³ng vÃ  success message hiá»‡n
    await expect(page.getByText("CÃ i Ä‘áº·t tá»‰ lá»‡ â€” Sá»¯a")).not.toBeVisible({ timeout: 8000 });
    await expect(page.getByText("ÄÃ£ lÆ°u cÃ i Ä‘áº·t").first()).toBeVisible({ timeout: 8000 });

    // Reload Ä‘á»ƒ xÃ¡c nháº­n dá»¯ liá»‡u Ä‘Ã£ lÆ°u
    await page.reload();
    await expect(page.getByText(/1 sáº£n pháº©m = 2 Ä‘iá»ƒm/)).toBeVisible({ timeout: 8000 });

    // Reset láº¡i 1 Ä‘iá»ƒm
    await page.getByRole("button", { name: "Chá»‰nh sá»­a" }).nth(1).click();
    await page.locator("input[name='rateType'][value='PRODUCT']").check();
    await page.locator("input[name='pointsPerProduct']").fill("1");
    await page.getByRole("button", { name: "LÆ°u cÃ i Ä‘áº·t" }).click();
    await expect(page.getByText("CÃ i Ä‘áº·t tá»‰ lá»‡ â€” Sá»¯a")).not.toBeVisible({ timeout: 8000 });
  });

  // â”€â”€â”€ TC-1214 (US-013): Validation amountPerPoint < 1000 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1214: amountPerPoint < 1000 â†’ validation error", async ({
    page,
  }) => {
    await page.goto("/admin/loyalty");

    await page.getByRole("button", { name: "Chá»‰nh sá»­a" }).first().click();
    await expect(page.getByText("CÃ i Ä‘áº·t tá»‰ lá»‡ â€” Máº·c Ä‘á»‹nh")).toBeVisible();

    await page.locator("input[name='rateType'][value='AMOUNT']").check();
    // Input has min=1000, but we bypass HTML validation with JS
    await page.locator("input[name='amountPerPoint']").fill("100");
    // Remove min attribute to bypass HTML5 validation and test server-side
    await page.locator("input[name='amountPerPoint']").evaluate(
      (el: HTMLInputElement) => { el.min = ""; el.removeAttribute("min"); }
    );
    await page.getByRole("button", { name: "LÆ°u cÃ i Ä‘áº·t" }).click();

    await expect(
      page.getByText("Sá»‘ tiá»n tá»‘i thiá»ƒu lÃ  1.000 VNÄ")
    ).toBeVisible({ timeout: 8000 });

    // ÄÃ³ng dialog
    await page.getByRole("button", { name: "Há»§y" }).click();
  });

  // â”€â”€â”€ TC-1215 (US-013): NÃºt Import KiotViet dáº«n tá»›i trang import â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  test("TC-1215: NÃºt Import KiotViet dáº«n tá»›i /admin/loyalty/import", async ({
    page,
  }) => {
    await page.goto("/admin/loyalty");
    await page.getByRole("link", { name: "Import KiotViet" }).click();
    await expect(page).toHaveURL(/\/admin\/loyalty\/import/, { timeout: 8000 });
    await expect(
      page.locator("h1", { hasText: "Import tÃ­ch Ä‘iá»ƒm tá»« KiotViet" })
    ).toBeVisible();

    // Back link dáº«n vá» /admin/loyalty
    await page.getByText("Quay láº¡i TÃ­ch Ä‘iá»ƒm").click();
    await expect(page).toHaveURL(/\/admin\/loyalty$/, { timeout: 8000 });
  });
});

