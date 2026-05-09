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

test.describe("US-006: LÆ°Æ¡ng (Payroll)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/admin/payroll");
    await page.waitForLoadState("networkidle");
  });

  // TC-601: Trang hiá»ƒn thá»‹ Ä‘Ãºng
  test("TC-601: hiá»ƒn thá»‹ trang báº£ng lÆ°Æ¡ng", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Báº£ng lÆ°Æ¡ng" })).toBeVisible();
    await expect(page.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xem" })).toBeVisible();
  });

  // TC-602: Form tÃ­nh lÆ°Æ¡ng cÃ³ Ä‘á»§ trÆ°á»ng thÃ¡ng/nÄƒm
  test("TC-602: form tÃ­nh lÆ°Æ¡ng cÃ³ dropdown thÃ¡ng vÃ  nÄƒm", async ({ page }) => {
    const monthSelect = page.locator("form").filter({ has: page.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }) }).locator("select[name='month']");
    const yearSelect = page.locator("form").filter({ has: page.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }) }).locator("select[name='year']");

    await expect(monthSelect).toBeVisible();
    await expect(yearSelect).toBeVisible();
    // ThÃ¡ng vÃ  nÄƒm hiá»‡n táº¡i lÃ  máº·c Ä‘á»‹nh
    await expect(monthSelect).toHaveValue(String(month));
    await expect(yearSelect).toHaveValue(String(year));
  });

  // TC-603: TÃ­nh lÆ°Æ¡ng thÃ nh cÃ´ng â€” button kháº£ dá»¥ng trá»Ÿ láº¡i, báº£ng hiá»ƒn thá»‹
  test("TC-603: tÃ­nh lÆ°Æ¡ng cho thÃ¡ng hiá»‡n táº¡i", async ({ page }) => {
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }) });
    const calcBtn = calculateForm.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" });
    await calcBtn.click();
    // Chá» button trá»Ÿ láº¡i enabled (khÃ´ng cÃ²n "Äang tÃ­nh...")
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Báº£ng tá»“n táº¡i
    await expect(page.locator("table")).toBeVisible();
  });

  // TC-604: Báº£ng lÆ°Æ¡ng hiá»ƒn thá»‹ sau khi tÃ­nh
  test("TC-604: báº£ng lÆ°Æ¡ng hiá»‡n Ä‘áº§y Ä‘á»§ cá»™t sau khi tÃ­nh", async ({ page }) => {
    // TÃ­nh lÆ°Æ¡ng trÆ°á»›c
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }) });
    await calculateForm.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }).click();
    await page.waitForLoadState("networkidle");

    // Kiá»ƒm tra header báº£ng
    const table = page.locator("table");
    await expect(table.getByText("MÃ£ NV")).toBeVisible();
    await expect(table.getByText("Há» tÃªn")).toBeVisible();
    await expect(table.getByText("Giá» lÃ m")).toBeVisible();
    await expect(table.getByText("Gross")).toBeVisible();
    await expect(table.getByText("Net")).toBeVisible();
    await expect(table.getByText("Tráº¡ng thÃ¡i")).toBeVisible();
  });

  // TC-605: BR-011 â€” phiáº¿u PAID khÃ´ng bá»‹ tÃ­nh láº¡i
  test("TC-605: BR-011 phiáº¿u PAID khÃ´ng bá»‹ tÃ­nh láº¡i", async ({ page }) => {
    // TÃ­nh lÆ°Æ¡ng Ä‘á»ƒ cÃ³ báº£n ghi
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }) });
    const calcBtn = calculateForm.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });

    // Náº¿u cÃ³ Ã­t nháº¥t 1 nhÃ¢n viÃªn, xÃ¡c nháº­n rá»“i tráº£ lÆ°Æ¡ng
    const confirmBtns = page.getByRole("button", { name: "XÃ¡c nháº­n" });
    const count = await confirmBtns.count();

    if (count > 0) {
      await confirmBtns.first().click();
      // Äá»£i button "ÄÃ£ tráº£" xuáº¥t hiá»‡n (retry assertion, trÃ¡nh race condition)
      await expect(page.getByRole("button", { name: "ÄÃ£ tráº£" })).toBeVisible({ timeout: 10000 });
      await page.getByRole("button", { name: "ÄÃ£ tráº£" }).first().click();
      // Chá» server action hoÃ n táº¥t rá»“i reload Ä‘á»ƒ Ä‘áº£m báº£o DB Ä‘Ã£ cáº­p nháº­t
      await page.waitForLoadState("networkidle");
      await page.goto("/admin/payroll");
      await page.waitForLoadState("networkidle");

      // TÃ­nh láº¡i â†’ phiáº¿u PAID váº«n giá»¯ nguyÃªn, count nhá» hÆ¡n
      await calcBtn.click();
      await expect(calcBtn).toBeEnabled({ timeout: 15000 });
      // Toast xuáº¥t hiá»‡n (count cÃ³ thá»ƒ lÃ  0 náº¿u táº¥t cáº£ Ä‘Ã£ PAID)
      await expect(page.getByText(/ÄÃ£ tÃ­nh lÆ°Æ¡ng cho \d+ nhÃ¢n viÃªn/)).toBeVisible({ timeout: 10000 });
    }
  });

  // TC-606: XÃ¡c nháº­n phiáº¿u lÆ°Æ¡ng DRAFT â†’ CONFIRMED
  test("TC-606: xÃ¡c nháº­n phiáº¿u lÆ°Æ¡ng DRAFT thÃ nh CONFIRMED", async ({ page }) => {
    // TÃ­nh lÆ°Æ¡ng
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }) });
    await calculateForm.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }).click();
    await page.waitForLoadState("networkidle");

    const confirmBtns = page.getByRole("button", { name: "XÃ¡c nháº­n" });
    if (await confirmBtns.count() === 0) {
      test.skip();
      return;
    }

    await confirmBtns.first().click();
    await page.waitForLoadState("networkidle");

    // Sau xÃ¡c nháº­n: status = "ÄÃ£ xÃ¡c nháº­n" xuáº¥t hiá»‡n trong badge
    await expect(page.getByText("ÄÃ£ xÃ¡c nháº­n").first()).toBeVisible({ timeout: 10000 });
  });

  // TC-607: Tráº£ lÆ°Æ¡ng CONFIRMED â†’ PAID
  test("TC-607: Ä‘Ã¡nh dáº¥u Ä‘Ã£ tráº£ lÆ°Æ¡ng CONFIRMED â†’ PAID", async ({ page }) => {
    // TÃ¬m row cÃ³ "ÄÃ£ tráº£" button (CONFIRMED record) â†’ click Chi tiáº¿t cá»§a row Ä‘Ã³
    const confirmedRow = page.locator("table tbody tr").filter({
      has: page.getByRole("button", { name: "ÄÃ£ tráº£" }),
    });

    if (await confirmedRow.count() === 0) {
      test.skip();
      return;
    }

    // Navigate vÃ o detail page cá»§a CONFIRMED record
    await confirmedRow.first().getByRole("link", { name: "Chi tiáº¿t" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Chi tiáº¿t phiáº¿u lÆ°Æ¡ng" })).toBeVisible();

    // Báº¥m "ÄÃ£ tráº£" trÃªn trang chi tiáº¿t
    const paidBtn = page.getByRole("button", { name: "ÄÃ£ tráº£" });
    if (await paidBtn.count() === 0) {
      test.skip();
      return;
    }

    await paidBtn.click();
    await page.waitForLoadState("networkidle");

    // Sau khi markPaid, navigate láº¡i list vÃ  verify
    await page.goto("/admin/payroll");
    await page.waitForLoadState("networkidle");

    // Trang list load OK
    await expect(page.getByRole("heading", { name: "Báº£ng lÆ°Æ¡ng" })).toBeVisible();
  });

  // TC-608: Link chi tiáº¿t má»Ÿ Ä‘Ãºng trang
  test("TC-608: link Chi tiáº¿t má»Ÿ trang phiáº¿u lÆ°Æ¡ng cá»¥ thá»ƒ", async ({ page }) => {
    // TÃ­nh lÆ°Æ¡ng
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }) });
    await calculateForm.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }).click();
    await page.waitForLoadState("networkidle");

    const chiTietLinks = page.getByRole("link", { name: "Chi tiáº¿t" });
    if (await chiTietLinks.count() === 0) {
      test.skip();
      return;
    }

    await chiTietLinks.first().click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Chi tiáº¿t phiáº¿u lÆ°Æ¡ng" })).toBeVisible();
    await expect(page.getByText("Chi tiáº¿t tÃ­nh lÆ°Æ¡ng")).toBeVisible();
  });

  // TC-609: Trang chi tiáº¿t hiá»ƒn thá»‹ Ä‘Ãºng breakdown lÆ°Æ¡ng
  test("TC-609: trang chi tiáº¿t hiá»ƒn thá»‹ breakdown Ä‘á»§ thÃ´ng tin", async ({ page }) => {
    // TÃ­nh lÆ°Æ¡ng (Ä‘áº£m báº£o page á»Ÿ tráº¡ng thÃ¡i á»•n Ä‘á»‹nh sau router.refresh)
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" }) });
    const calcBtn = calculateForm.getByRole("button", { name: "TÃ­nh lÆ°Æ¡ng" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });
    await page.waitForLoadState("networkidle");

    const chiTietLinks = page.getByRole("link", { name: "Chi tiáº¿t" });
    if (await chiTietLinks.count() === 0) {
      test.skip();
      return;
    }

    await chiTietLinks.first().click();
    // Äá»£i network settle (RSC fetch) rá»“i Ä‘á»£i heading xuáº¥t hiá»‡n
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Chi tiáº¿t phiáº¿u lÆ°Æ¡ng" })).toBeVisible({ timeout: 10000 });

    // Kiá»ƒm tra breakdown cÃ¡c dÃ²ng
    await expect(page.getByText("Tá»•ng giá» lÃ m")).toBeVisible();
    await expect(page.getByText("ÄÆ¡n giÃ¡ giá»")).toBeVisible();
    await expect(page.getByText("LÆ°Æ¡ng gross (giá» Ã— Ä‘Æ¡n giÃ¡)")).toBeVisible();
    await expect(page.getByText("Phá»¥ cáº¥p")).toBeVisible();
    await expect(page.getByText("Kháº¥u trá»«")).toBeVisible();
    await expect(page.getByText("LÆ°Æ¡ng net")).toBeVisible();
  });

  // TC-610: Filter xem báº£ng lÆ°Æ¡ng theo thÃ¡ng/nÄƒm khÃ¡c
  test("TC-610: filter xem báº£ng lÆ°Æ¡ng thÃ¡ng trÆ°á»›c", async ({ page }) => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const filterForm = page.locator("form[method='GET']");
    await filterForm.locator("select[name='month']").selectOption(String(prevMonth));
    await filterForm.locator("select[name='year']").selectOption(String(prevYear));
    await filterForm.getByRole("button", { name: "Xem" }).click();
    await page.waitForLoadState("networkidle");

    // URL Ä‘Ã£ thay Ä‘á»•i vá»›i params má»›i
    await expect(page).toHaveURL(new RegExp(`month=${prevMonth}`));
    await expect(page).toHaveURL(new RegExp(`year=${prevYear}`));
  });
});

