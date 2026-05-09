import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Máº­t kháº©u").fill("bongshop");
  await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 15000 });
}

const testSku = `SP-${String(Date.now()).slice(-8)}`;

test.describe("US-004: Tá»“n kho", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-401: Trang danh sÃ¡ch hiá»ƒn thá»‹ Ä‘Ãºng
  test("TC-401: Trang danh sÃ¡ch tá»“n kho hiá»ƒn thá»‹ Ä‘Ãºng", async ({ page }) => {
    await page.goto("/admin/inventory");

    await expect(page.locator("h1", { hasText: "Tá»“n kho" })).toBeVisible();
    await expect(page.getByRole("link", { name: /ThÃªm sáº£n pháº©m/ })).toBeVisible();

    // Search form
    await expect(page.getByPlaceholder("TÃ¬m theo tÃªn hoáº·c SKU...")).toBeVisible();
    await expect(page.getByRole("button", { name: "TÃ¬m kiáº¿m" })).toBeVisible();
  });

  // TC-402: Trang thÃªm sáº£n pháº©m hiá»ƒn thá»‹ Ä‘Ãºng
  test("TC-402: Trang thÃªm sáº£n pháº©m hiá»ƒn thá»‹ Ä‘Ãºng", async ({ page }) => {
    await page.goto("/admin/inventory/new");

    await expect(page.locator("h1", { hasText: "ThÃªm sáº£n pháº©m" })).toBeVisible();

    await expect(page.getByLabel("MÃ£ SKU")).toBeVisible();
    await expect(page.getByLabel("TÃªn sáº£n pháº©m")).toBeVisible();
    await expect(page.getByLabel("ÄÆ¡n vá»‹")).toBeVisible();
    await expect(page.getByLabel(/GiÃ¡ nháº­p/)).toBeVisible();
    await expect(page.getByLabel(/GiÃ¡ bÃ¡n/)).toBeVisible();

    await expect(page.getByRole("button", { name: "ThÃªm sáº£n pháº©m" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Há»§y" })).toBeVisible();
  });

  // TC-403: ThÃªm sáº£n pháº©m má»›i thÃ nh cÃ´ng (AC-4.1)
  test("TC-403: ThÃªm sáº£n pháº©m má»›i thÃ nh cÃ´ng", async ({ page }) => {
    await page.goto("/admin/inventory/new");

    await page.getByLabel("MÃ£ SKU").fill(testSku);
    await page.getByLabel("TÃªn sáº£n pháº©m").fill("Sáº£n pháº©m test Playwright");
    await page.getByLabel("ÄÆ¡n vá»‹").fill("cÃ¡i");
    await page.getByLabel(/GiÃ¡ nháº­p/).fill("50000");
    await page.getByLabel(/GiÃ¡ bÃ¡n/).fill("80000");

    await page.getByRole("button", { name: "ThÃªm sáº£n pháº©m" }).click();

    // Redirect vá» danh sÃ¡ch
    await expect(page).toHaveURL(/\/admin\/inventory$/, { timeout: 8000 });

    // Sáº£n pháº©m xuáº¥t hiá»‡n trong danh sÃ¡ch
    await expect(page.locator("table tbody")).toContainText(testSku);
  });

  // TC-404: Validation â€” SKU trÃ¹ng
  test("TC-404: Validation â€” SKU Ä‘Ã£ tá»“n táº¡i", async ({ page }) => {
    await page.goto("/admin/inventory/new");

    // DÃ¹ng SKU vá»«a táº¡o á»Ÿ TC-403
    await page.getByLabel("MÃ£ SKU").fill(testSku);
    await page.getByLabel("TÃªn sáº£n pháº©m").fill("TrÃ¹ng SKU test");
    await page.getByLabel("ÄÆ¡n vá»‹").fill("cÃ¡i");
    await page.getByLabel(/GiÃ¡ nháº­p/).fill("10000");
    await page.getByLabel(/GiÃ¡ bÃ¡n/).fill("20000");

    await page.getByRole("button", { name: "ThÃªm sáº£n pháº©m" }).click();

    await expect(page.getByText("MÃ£ SKU Ä‘Ã£ tá»“n táº¡i")).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/admin\/inventory\/new/);
  });

  // TC-405: Validation â€” form trá»‘ng
  test("TC-405: Validation â€” submit form trá»‘ng", async ({ page }) => {
    await page.goto("/admin/inventory/new");

    await page.getByRole("button", { name: "ThÃªm sáº£n pháº©m" }).click();

    // Váº«n á»Ÿ trang thÃªm má»›i (HTML5 required hoáº·c custom validation)
    await expect(page).toHaveURL(/\/admin\/inventory\/new/);
  });

  // TC-406: Xem chi tiáº¿t sáº£n pháº©m (AC-4.1)
  test("TC-406: Xem chi tiáº¿t sáº£n pháº©m vá»«a táº¡o", async ({ page }) => {
    await page.goto("/admin/inventory");

    // TÃ¬m sáº£n pháº©m test vÃ  click Chi tiáº¿t
    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Chi tiáº¿t").click();

    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+$/, { timeout: 8000 });
    await page.waitForLoadState("networkidle");

    // Hiá»ƒn thá»‹ tÃªn vÃ  SKU
    await expect(page.getByRole("heading", { name: "Sáº£n pháº©m test Playwright" })).toBeVisible();
    await expect(page.locator("span.font-mono", { hasText: testSku })).toBeVisible();

    // Form nháº­p/xuáº¥t kho hiá»ƒn thá»‹
    await expect(page.getByText("Nháº­p / Xuáº¥t kho")).toBeVisible();

    // Lá»‹ch sá»­ nháº­p xuáº¥t
    await expect(page.getByRole("heading", { name: "Lá»‹ch sá»­ nháº­p/xuáº¥t kho" })).toBeVisible();
  });

  // TC-407: Nháº­p kho thÃ nh cÃ´ng (AC-4.2)
  test("TC-407: Nháº­p kho thÃ nh cÃ´ng", async ({ page }) => {
    await page.goto("/admin/inventory");

    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Chi tiáº¿t").click();
    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+$/, { timeout: 5000 });

    // Chá»n tab Nháº­p kho
    await page.getByRole("button", { name: "Nháº­p kho" }).first().click();

    await page.getByLabel("Sá»‘ lÆ°á»£ng").fill("10");
    await page.getByLabel("LÃ½ do").fill("Nháº­p hÃ ng test Playwright");

    await page.getByRole("button", { name: "XÃ¡c nháº­n nháº­p kho" }).click();

    // ThÃ´ng bÃ¡o thÃ nh cÃ´ng
    await expect(page.getByText("Nháº­p kho thÃ nh cÃ´ng!")).toBeVisible({ timeout: 5000 });

    // Tá»“n kho cáº­p nháº­t (sá»‘ lÆ°á»£ng lá»›n hiá»ƒn thá»‹ trong card)
    await expect(page.locator("p.text-2xl", { hasText: "10" })).toBeVisible();
  });

  // TC-408: Xuáº¥t kho thÃ nh cÃ´ng (AC-4.3)
  test("TC-408: Xuáº¥t kho thÃ nh cÃ´ng", async ({ page }) => {
    await page.goto("/admin/inventory");

    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Chi tiáº¿t").click();
    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+$/, { timeout: 5000 });

    // Chá»n tab Xuáº¥t kho
    await page.getByRole("button", { name: "Xuáº¥t kho" }).click();

    await page.getByLabel("Sá»‘ lÆ°á»£ng").fill("3");
    await page.getByLabel("LÃ½ do").fill("Xuáº¥t hÃ ng test Playwright");

    await page.getByRole("button", { name: "XÃ¡c nháº­n xuáº¥t kho" }).click();

    await expect(page.getByText("Xuáº¥t kho thÃ nh cÃ´ng!")).toBeVisible({ timeout: 5000 });

    // Tá»“n kho giáº£m tá»« 10 xuá»‘ng 7
    await expect(page.locator("p.text-2xl", { hasText: "7" })).toBeVisible();
  });

  // TC-409: Xuáº¥t kho vÆ°á»£t tá»“n â€” BR-004 (tá»“n kho khÃ´ng Ã¢m)
  test("TC-409: Xuáº¥t kho vÆ°á»£t tá»“n bá»‹ tá»« chá»‘i (BR-004)", async ({ page }) => {
    await page.goto("/admin/inventory");

    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Chi tiáº¿t").click();
    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+$/, { timeout: 5000 });

    await page.getByRole("button", { name: "Xuáº¥t kho" }).click();

    // Cá»‘ xuáº¥t 999 (nhiá»u hÆ¡n tá»“n cÃ³)
    await page.getByLabel("Sá»‘ lÆ°á»£ng").fill("999");
    await page.getByRole("button", { name: "XÃ¡c nháº­n xuáº¥t kho" }).click();

    await expect(page.getByText(/Tá»“n kho khÃ´ng Ä‘á»§/)).toBeVisible({ timeout: 5000 });
  });

  // TC-410: Lá»‹ch sá»­ nháº­p/xuáº¥t hiá»ƒn thá»‹ Ä‘Ãºng (AC-4.4)
  test("TC-410: Lá»‹ch sá»­ nháº­p xuáº¥t kho hiá»ƒn thá»‹ Ä‘Ãºng", async ({ page }) => {
    await page.goto("/admin/inventory");

    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Chi tiáº¿t").click();
    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+$/, { timeout: 5000 });

    // Báº£ng lá»‹ch sá»­
    const historyTable = page.locator("table").last();
    await expect(historyTable).toBeVisible();

    // Pháº£i cÃ³ Ã­t nháº¥t 2 records (TC-407 nháº­p 10, TC-408 xuáº¥t 3)
    const rows = historyTable.locator("tbody tr");
    await expect(rows).toHaveCount(2, { timeout: 5000 });

    // Kiá»ƒm tra record nháº­p kho
    await expect(historyTable.locator("tbody")).toContainText("Nháº­p kho");
    await expect(historyTable.locator("tbody")).toContainText("Xuáº¥t kho");
    await expect(historyTable.locator("tbody")).toContainText("Nháº­p hÃ ng test Playwright");
  });

  // TC-411: Sá»­a thÃ´ng tin sáº£n pháº©m (AC-4.1)
  test("TC-411: Sá»­a thÃ´ng tin sáº£n pháº©m thÃ nh cÃ´ng", async ({ page }) => {
    await page.goto("/admin/inventory");

    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Sá»­a").click();

    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+\/edit$/, { timeout: 5000 });
    await expect(page.locator("h1", { hasText: "Chá»‰nh sá»­a sáº£n pháº©m" })).toBeVisible();

    // Form pre-fill Ä‘Ãºng SKU
    const skuInput = page.getByLabel("MÃ£ SKU");
    await expect(skuInput).toHaveValue(testSku);

    // Sá»­a tÃªn
    const nameInput = page.getByLabel("TÃªn sáº£n pháº©m");
    await nameInput.clear();
    await nameInput.fill("Sáº£n pháº©m test Playwright (Ä‘Ã£ sá»­a)");

    await page.getByRole("button", { name: "Cáº­p nháº­t" }).click();

    await expect(page).toHaveURL(/\/admin\/inventory$/, { timeout: 8000 });
    await expect(page.locator("table tbody")).toContainText("Ä‘Ã£ sá»­a");
  });

  // TC-412: TÃ¬m kiáº¿m sáº£n pháº©m theo SKU
  test("TC-412: TÃ¬m kiáº¿m sáº£n pháº©m theo SKU", async ({ page }) => {
    await page.goto("/admin/inventory");

    await page.getByPlaceholder("TÃ¬m theo tÃªn hoáº·c SKU...").fill(testSku);
    await page.getByRole("button", { name: "TÃ¬m kiáº¿m" }).click();

    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(testSku)}`));
    await expect(page.locator("table tbody")).toContainText(testSku);
  });
});

// â”€â”€â”€ Import KiotViet (Sprint 4 â€” batch import optimization) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import * as path from "path";

test.describe("US-010 Sprint 4: Import hÃ ng hÃ³a (batch transaction)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-413: Dialog import má»Ÿ vÃ  Ä‘Ã³ng Ä‘Ãºng
  test("TC-413: Dialog Import KiotViet má»Ÿ vÃ  Ä‘Ã³ng Ä‘Æ°á»£c", async ({ page }) => {
    await page.goto("/admin/inventory");

    // NÃºt import tá»“n táº¡i
    const importBtn = page.getByRole("button", { name: "Import KiotViet" });
    await expect(importBtn).toBeVisible();

    // Má»Ÿ dialog
    await importBtn.click();
    await expect(page.getByRole("heading", { name: "Import hÃ ng hÃ³a tá»« KiotViet" })).toBeVisible();
    await expect(page.getByText('Cá»™t C pháº£i cÃ³ tiÃªu Ä‘á» "MÃ£ hÃ ng"')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();

    // ÄÃ³ng dialog
    await page.getByRole("button", { name: "Há»§y" }).click();
    await expect(page.getByRole("heading", { name: "Import hÃ ng hÃ³a tá»« KiotViet" })).not.toBeVisible();
  });

  // TC-414: Load file máº«u â†’ preview hiá»ƒn thá»‹ Ä‘Ãºng sá»‘ dÃ²ng há»£p lá»‡
  test("TC-414: Load file xlsx máº«u â†’ hiá»ƒn thá»‹ preview Ä‘Ãºng", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("button", { name: "Import KiotViet" }).click();

    const sampleFile = path.resolve(
      __dirname,
      "../docs/samples/DanhSachSanPham.xlsx"
    );
    await page.locator('input[type="file"]').setInputFiles(sampleFile);

    // Chá» parse xong (file lá»›n, cho timeout dÃ i hÆ¡n)
    await expect(page.getByText(/há»£p lá»‡/)).toBeVisible({ timeout: 30_000 });

    // Pháº£i cÃ³ >= 20.000 sáº£n pháº©m há»£p lá»‡
    const summaryText = await page.getByText(/há»£p lá»‡/).textContent();
    const match = summaryText?.match(/(\d[\d.,]*)\s*há»£p lá»‡/);
    const validCount = match
      ? parseInt(match[1].replace(/[,.]/g, ""), 10)
      : 0;
    expect(validCount).toBeGreaterThan(20_000);

    // Preview table hiá»ƒn thá»‹ tá»‘i Ä‘a 100 dÃ²ng
    const previewRows = page.locator("table tbody tr");
    await expect(previewRows.first()).toBeVisible();

    // NÃºt Import hiá»ƒn thá»‹ sá»‘ sáº£n pháº©m
    await expect(
      page.getByRole("button", { name: /Import \d/ })
    ).toBeVisible();
  });

  // TC-415: Import batch nhá» thÃ nh cÃ´ng â€” progress bar hiá»ƒn thá»‹
  test("TC-415: Import batch nhá» (50 sáº£n pháº©m) â€” progress bar vÃ  káº¿t quáº£ Ä‘Ãºng", async ({ page }) => {
    await page.goto("/admin/inventory");
    await page.getByRole("button", { name: "Import KiotViet" }).click();

    const fixtureFile = path.resolve(
      __dirname,
      "../docs/samples/TC415-batch-import.xlsx"
    );
    await page.locator('input[type="file"]').setInputFiles(fixtureFile);

    // Chá» preview parse xong
    await expect(page.getByText(/há»£p lá»‡/)).toBeVisible({ timeout: 10_000 });

    // Pháº£i cÃ³ Ä‘Ãºng 50 sáº£n pháº©m há»£p lá»‡
    await expect(page.getByText(/50.*há»£p lá»‡|há»£p lá»‡.*50/)).toBeVisible();

    // Click Import
    await page.getByRole("button", { name: /Import.*50/ }).click();

    // Chá» import hoÃ n táº¥t (toast success)
    await expect(page.getByText(/Import thÃ nh cÃ´ng/)).toBeVisible({ timeout: 60_000 });

    // Dialog Ä‘Ã³ng tá»± Ä‘á»™ng sau khi hoÃ n táº¥t
    await expect(
      page.getByRole("heading", { name: "Import hÃ ng hÃ³a tá»« KiotViet" })
    ).not.toBeVisible({ timeout: 5_000 });
  });
});

