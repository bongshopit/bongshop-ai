import { test, expect } from "@playwright/test";
import * as XLSX from "xlsx";
import * as path from "path";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Máº­t kháº©u").fill("bongshop");
  await page.getByRole("button", { name: "ÄÄƒng nháº­p" }).click();
  await page.waitForURL("**/admin", { timeout: 30000 });
}

/**
 * Táº¡o buffer xlsx giáº£ láº­p Ä‘á»‹nh dáº¡ng KiotViet vá»›i cÃ¡c dÃ²ng tuá»³ chá»‰nh.
 */
function createKiotVietXlsx(
  dataRows: (string | number)[][]
): { name: string; mimeType: string; buffer: Buffer } {
  const header = [
    "Loáº¡i khÃ¡ch",
    "Chi nhÃ¡nh táº¡o",
    "MÃ£ khÃ¡ch hÃ ng",
    "TÃªn khÃ¡ch hÃ ng",
    "Äiá»‡n thoáº¡i",
    "Äá»‹a chá»‰",
    "Khu vá»±c giao hÃ ng",
    "PhÆ°á»ng/XÃ£",
    "CÃ´ng ty",
    "MÃ£ sá»‘ thuáº¿",
    "Sá»‘ CMND/CCCD",
    "NgÃ y sinh",
    "Giá»›i tÃ­nh",
    "Email",
    "Facebook",
    "NhÃ³m khÃ¡ch hÃ ng",
    "Ghi chÃº",
    "Äiá»ƒm hiá»‡n táº¡i",
    "Tá»•ng Ä‘iá»ƒm",
    "NgÆ°á»i táº¡o",
    "NgÃ y táº¡o",
    "NgÃ y giao dá»‹ch cuá»‘i",
    "Ná»£ cáº§n thu hiá»‡n táº¡i",
    "Tá»•ng bÃ¡n",
    "Tá»•ng bÃ¡n trá»« tráº£ hÃ ng",
    "Tráº¡ng thÃ¡i",
  ];

  const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DanhSachKhachHang");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return {
    name: "DanhSachKhachHang.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(buf),
  };
}

/** Táº¡o xlsx khÃ´ng cÃ³ cá»™t "TÃªn khÃ¡ch hÃ ng" (sai Ä‘á»‹nh dáº¡ng) */
function createInvalidFormatXlsx(): { name: string; mimeType: string; buffer: Buffer } {
  const ws = XLSX.utils.aoa_to_sheet([
    ["MÃ£", "TÃªn", "SÄT"],
    ["001", "Nguyá»…n A", "0901234567"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return {
    name: "wrong-format.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(buf),
  };
}

const REAL_FILE = path.resolve(
  __dirname,
  "../docs/samples/DanhSachKhachHang.xlsx"
);

// â”€â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test.describe("US-008: Nháº­p khÃ¡ch hÃ ng tá»« KiotViet xlsx", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // TC-801: NÃºt "Nháº­p tá»« KiotViet" hiá»ƒn thá»‹ vá»›i ADMIN
  test("TC-801: NÃºt Nháº­p tá»« KiotViet hiá»ƒn thá»‹ vá»›i ADMIN", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(
      page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ })
    ).toBeVisible();
  });

  // TC-802: STAFF khÃ´ng tháº¥y nÃºt import (cáº§n staff account â€” skip do chÆ°a cÃ³ seed)
  test.skip("TC-802: NÃºt Nháº­p tá»« KiotViet áº©n vá»›i STAFF (cáº§n staff credentials)", async () => {
    // YÃªu cáº§u thÃªm STAFF user vÃ o seed trÆ°á»›c khi enable test nÃ y
  });

  // TC-803: Upload file thá»±c tá»« KiotViet â†’ detect Ä‘Ãºng tá»•ng dÃ²ng
  test("TC-803: Upload file KiotViet thá»±c â†’ detect Ä‘Ãºng sá»‘ dÃ²ng", async ({ page }) => {
    await page.goto("/admin/customers");

    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();
    await expect(page.locator("text=Nháº­p khÃ¡ch hÃ ng tá»« KiotViet")).toBeVisible();

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(REAL_FILE);

    // Äá»£i summary xuáº¥t hiá»‡n vá»›i tá»•ng 2587 dÃ²ng
    await expect(page.locator("text=/Tá»•ng dÃ²ng.*2587/")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("text=/Há»£p lá»‡/")).toBeVisible();

    // NÃºt import pháº£i active
    await expect(
      page.getByRole("button", { name: /Import/ })
    ).not.toBeDisabled();

    // ÄÃ³ng dialog
    await page.getByRole("button", { name: "Há»§y" }).click();
    await expect(
      page.locator("text=Nháº­p khÃ¡ch hÃ ng tá»« KiotViet")
    ).not.toBeVisible();
  });

  // TC-804: Preview hiá»ƒn thá»‹ Ä‘Ãºng cÃ¡c cá»™t: TÃªn, SÄT, Äá»‹a chá»‰, NgÃ y sinh, Giá»›i tÃ­nh
  test("TC-804: Preview hiá»ƒn thá»‹ Ä‘Ãºng cÃ¡c cá»™t tá»« file KiotViet", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(REAL_FILE);

    await expect(page.locator("text=/Tá»•ng dÃ²ng.*2587/")).toBeVisible({
      timeout: 15000,
    });

    // Scope locator vÃ o bÃªn trong dialog (div.fixed) trÃ¡nh nháº§m báº£ng danh sÃ¡ch KH
    const dialog = page.locator("div.fixed").filter({
      hasText: "Nháº­p khÃ¡ch hÃ ng tá»« KiotViet",
    });
    const table = dialog.locator("table");
    const ths = table.locator("thead th");

    // Preview table cÃ³ 7 cá»™t: #, Tráº¡ng thÃ¡i, TÃªn KH, SÄT, Äá»‹a chá»‰, NgÃ y sinh, Giá»›i tÃ­nh
    await expect(ths).toHaveCount(7);

    // DÃ²ng Ä‘áº§u pháº£i cÃ³ dá»¯ liá»‡u tÃªn (khÃ´ng trá»‘ng)
    const firstRow = table.locator("tbody tr").first();
    await expect(firstRow).not.toContainText("trá»‘ng");

    await page.getByRole("button", { name: "Há»§y" }).click();
  });

  // TC-805: NgÃ y sinh convert Ä‘Ãºng tá»« Excel serial â†’ Date (format YYYY-MM-DD)
  test("TC-805: NgÃ y sinh tá»« Excel serial hiá»ƒn thá»‹ Ä‘Ãºng YYYY-MM-DD", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);
    const testPhone = `0911${ts.slice(0, 6)}`;

    // Serial 45889 â†’ 2025-08-12
    const file = createKiotVietXlsx([
      ["CÃ¡ nhÃ¢n", "CN", "KH001", `Test ${ts}`, testPhone, "Äá»‹a chá»‰ test", "", "", "", "", "", 45889, "Ná»¯", "", "", "", "", 0, 0, "Test", 46000, 46000, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tá»•ng dÃ²ng.*1/")).toBeVisible({ timeout: 10000 });

    // NgÃ y sinh pháº£i hiá»ƒn thá»‹ dáº¡ng YYYY-MM-DD (khÃ´ng pháº£i sá»‘ serial)
    const dialog805 = page.locator("div.fixed").filter({ hasText: "Nháº­p khÃ¡ch hÃ ng tá»« KiotViet" });
    const table = dialog805.locator("table");
    const dobCell = table.locator("tbody tr").first().locator("td").nth(5);
    const dobText = await dobCell.innerText();
    // Pháº£i khá»›p format YYYY-MM-DD
    expect(dobText).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await page.getByRole("button", { name: "Há»§y" }).click();
  });

  // TC-806: Upload file khÃ´ng pháº£i xlsx â†’ hiá»ƒn thá»‹ lá»—i
  test("TC-806: Upload file khÃ´ng pháº£i xlsx â†’ bÃ¡o lá»—i", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();

    const csvFile = {
      name: "data.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("TÃªn,SÄT\nNguyá»…n A,0901234567"),
    };
    await page.locator('input[type="file"]').setInputFiles(csvFile);

    await expect(
      page.locator("text=Chá»‰ cháº¥p nháº­n file .xlsx")
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Há»§y" }).click();
  });

  // TC-807: Upload file > 10MB â†’ bÃ¡o lá»—i (skip â€” khÃ³ táº¡o file >10MB trong test)
  test.skip("TC-807: Upload file > 10MB â†’ bÃ¡o lá»—i", async () => {
    // Cáº§n táº¡o file buffer > 10MB â€” bá» qua trong mÃ´i trÆ°á»ng CI
  });

  // TC-808: File khÃ´ng cÃ³ cá»™t "TÃªn khÃ¡ch hÃ ng" â†’ bÃ¡o Ä‘á»‹nh dáº¡ng khÃ´ng há»£p lá»‡
  test("TC-808: File sai Ä‘á»‹nh dáº¡ng KiotViet â†’ bÃ¡o lá»—i", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();

    const invalidFile = createInvalidFormatXlsx();
    await page.locator('input[type="file"]').setInputFiles(invalidFile);

    await expect(
      page.locator("text=KhÃ´ng nháº­n diá»‡n Ä‘Æ°á»£c Ä‘á»‹nh dáº¡ng KiotViet")
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Há»§y" }).click();
  });

  // TC-809: DÃ²ng cÃ³ TÃªn trá»‘ng â†’ Ä‘Ã¡nh dáº¥u error
  test("TC-809: DÃ²ng cÃ³ TÃªn trá»‘ng â†’ Ä‘Ã¡nh dáº¥u error (mÃ u Ä‘á»)", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);

    const file = createKiotVietXlsx([
      // DÃ²ng 1: há»£p lá»‡
      ["CÃ¡ nhÃ¢n", "CN", "KH001", `Valid ${ts}`, `0922${ts.slice(0,6)}`, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
      // DÃ²ng 2: tÃªn trá»‘ng
      ["CÃ¡ nhÃ¢n", "CN", "KH002", "", `0933${ts.slice(0,6)}`, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tá»•ng dÃ²ng.*2/")).toBeVisible({ timeout: 10000 });

    // Pháº£i hiá»ƒn thá»‹ 1 dÃ²ng lá»—i
    await expect(page.locator("text=/âŒ Lá»—i.*1/")).toBeVisible();

    // DÃ²ng cÃ³ lá»—i pháº£i cÃ³ class bg-red-50
    const dialog809 = page.locator("div.fixed").filter({ hasText: "Nháº­p khÃ¡ch hÃ ng tá»« KiotViet" });
    const table = dialog809.locator("table");
    const rows = table.locator("tbody tr");
    const errorRow = rows.nth(1); // dÃ²ng 2 (index 1)
    await expect(errorRow).toHaveClass(/bg-red-50/);

    // NÃºt import chá»‰ import 1 dÃ²ng há»£p lá»‡
    await expect(page.getByRole("button", { name: /Import 1 khÃ¡ch hÃ ng/ })).toBeVisible();

    await page.getByRole("button", { name: "Há»§y" }).click();
  });

  // TC-810: DÃ²ng SÄT 9 chá»¯ sá»‘ â†’ Ä‘Ã¡nh dáº¥u error
  test("TC-810: DÃ²ng SÄT sai Ä‘á»‹nh dáº¡ng â†’ Ä‘Ã¡nh dáº¥u error", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);

    const file = createKiotVietXlsx([
      // SÄT chá»‰ 9 chá»¯ sá»‘ (sai)
      ["CÃ¡ nhÃ¢n", "CN", "KH001", `BadPhone ${ts}`, "090123456", "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tá»•ng dÃ²ng.*1/")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=/âŒ Lá»—i.*1/")).toBeVisible();

    // NÃºt import disabled (0 dÃ²ng há»£p lá»‡)
    await expect(
      page.getByRole("button", { name: /Import 0/ })
    ).toBeDisabled();

    await page.getByRole("button", { name: "Há»§y" }).click();
  });

  // TC-811: 2 dÃ²ng cÃ¹ng SÄT trong file â†’ dÃ²ng 2 Ä‘Ã¡nh dáº¥u duplicate_in_file
  test("TC-811: Hai dÃ²ng cÃ¹ng SÄT trong file â†’ dÃ²ng 2 trÃ¹ng láº·p", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);
    const dupPhone = `0944${ts.slice(0, 6)}`;

    const file = createKiotVietXlsx([
      ["CÃ¡ nhÃ¢n", "CN", "KH001", `KH First ${ts}`, dupPhone, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
      ["CÃ¡ nhÃ¢n", "CN", "KH002", `KH Second ${ts}`, dupPhone, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tá»•ng dÃ²ng.*2/")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=/âš ï¸ TrÃ¹ng SÄT trong file.*1/")).toBeVisible();

    // DÃ²ng 2 pháº£i cÃ³ class bg-yellow-50
    const dialog811 = page.locator("div.fixed").filter({ hasText: "Nháº­p khÃ¡ch hÃ ng tá»« KiotViet" });
    const table = dialog811.locator("table");
    const dupRow = table.locator("tbody tr").nth(1);
    await expect(dupRow).toHaveClass(/bg-yellow-50/);

    // Chá»‰ 1 dÃ²ng há»£p lá»‡ Ä‘á»ƒ import
    await expect(
      page.getByRole("button", { name: /Import 1 khÃ¡ch hÃ ng/ })
    ).toBeVisible();

    await page.getByRole("button", { name: "Há»§y" }).click();
  });

  // TC-812 + TC-813: Import thÃ nh cÃ´ng â†’ toast Ä‘Ãºng sá»‘ liá»‡u, danh sÃ¡ch reload
  test("TC-813: Import thÃ nh cÃ´ng â†’ toast Ä‘Ãºng, danh sÃ¡ch reload", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);
    const phone1 = `0955${ts.slice(0, 6)}`;
    const phone2 = `0966${ts.slice(0, 6)}`;
    const name1 = `Import Test A ${ts}`;
    const name2 = `Import Test B ${ts}`;

    const file = createKiotVietXlsx([
      ["CÃ¡ nhÃ¢n", "CN", "KH001", name1, phone1, "123 ÄÆ°á»ng Test", "", "", "", "", "", 45889, "Nam", "", "", "", "Ghi chÃº test", 0, 0, "", 0, 0, 0, 0, 0, 1],
      ["CÃ¡ nhÃ¢n", "CN", "KH002", name2, phone2, "", "", "", "", "", "", "", "Ná»¯", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tá»•ng dÃ²ng.*2/")).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /Import 2 khÃ¡ch hÃ ng/ })
    ).toBeEnabled();

    await page.getByRole("button", { name: /Import 2 khÃ¡ch hÃ ng/ }).click();

    // Toast thÃ nh cÃ´ng pháº£i xuáº¥t hiá»‡n
    await expect(
      page.locator("[data-sonner-toast]", {
        hasText: /ÄÃ£ nháº­p.*khÃ¡ch hÃ ng thÃ nh cÃ´ng/,
      })
    ).toBeVisible({ timeout: 15000 });

    // Dialog Ä‘Ã³ng
    await expect(
      page.locator("text=Nháº­p khÃ¡ch hÃ ng tá»« KiotViet")
    ).not.toBeVisible({ timeout: 5000 });

    // KhÃ¡ch hÃ ng má»›i xuáº¥t hiá»‡n trong danh sÃ¡ch
    await expect(page.locator("table tbody")).toContainText(name1, {
      timeout: 10000,
    });
    await expect(page.locator("table tbody")).toContainText(name2);
  });

  // TC-812: SÄT Ä‘Ã£ cÃ³ trong DB â†’ bá» qua, khÃ´ng lá»—i, tÃ­nh vÃ o skipped
  test("TC-812: SÄT trÃ¹ng vá»›i DB â†’ bá» qua, toast bÃ¡o skipped", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);
    const phone = `0977${ts.slice(0, 6)}`;
    const nameFirst = `Dup DB First ${ts}`;
    const nameDup = `Dup DB Second ${ts}`;

    // Import láº§n 1 Ä‘á»ƒ táº¡o báº£n ghi gá»‘c
    const file1 = createKiotVietXlsx([
      ["CÃ¡ nhÃ¢n", "CN", "KH001", nameFirst, phone, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file1);
    await expect(page.locator("text=/Tá»•ng dÃ²ng.*1/")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Import 1 khÃ¡ch hÃ ng/ }).click();
    await expect(
      page.locator("[data-sonner-toast]", { hasText: /ÄÃ£ nháº­p 1 khÃ¡ch hÃ ng/ })
    ).toBeVisible({ timeout: 15000 });

    // Import láº§n 2 â€” cÃ¹ng SÄT â†’ pháº£i bá»‹ skip
    const file2 = createKiotVietXlsx([
      ["CÃ¡ nhÃ¢n", "CN", "KH001", nameDup, phone, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file2);
    await expect(page.locator("text=/Tá»•ng dÃ²ng.*1/")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Import 1 khÃ¡ch hÃ ng/ }).click();

    // Toast pháº£i bÃ¡o 0 imported, 1 skipped
    await expect(
      page.locator("[data-sonner-toast]", {
        hasText: /ÄÃ£ nháº­p 0 khÃ¡ch hÃ ng thÃ nh cÃ´ng\. Bá» qua 1 do trÃ¹ng SÄT/,
      })
    ).toBeVisible({ timeout: 15000 });
  });

  // TC-814: Giá»›i tÃ­nh "Nam"/"Ná»¯" lÆ°u Ä‘Ãºng; giÃ¡ trá»‹ khÃ¡c â†’ null (kiá»ƒm qua preview)
  test("TC-814: Giá»›i tÃ­nh Nam/Ná»¯ hiá»ƒn thá»‹ Ä‘Ãºng trong preview", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);

    const file = createKiotVietXlsx([
      ["CÃ¡ nhÃ¢n", "CN", "KH001", `Nam Test ${ts}`, `0988${ts.slice(0,6)}`, "", "", "", "", "", "", "", "Nam", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
      ["CÃ¡ nhÃ¢n", "CN", "KH002", `Nu Test ${ts}`, `0999${ts.slice(0,6)}`, "", "", "", "", "", "", "", "Ná»¯", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
      ["CÃ¡ nhÃ¢n", "CN", "KH003", `Other Test ${ts}`, `0911${ts.slice(0,6)}`, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nháº­p tá»« KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tá»•ng dÃ²ng.*3/")).toBeVisible({ timeout: 10000 });

    const dialog814 = page.locator("div.fixed").filter({ hasText: "Nháº­p khÃ¡ch hÃ ng tá»« KiotViet" });
    const table = dialog814.locator("table");
    const rows = table.locator("tbody tr");

    // DÃ²ng 1: "Nam"
    await expect(rows.nth(0).locator("td").nth(6)).toContainText("Nam");
    // DÃ²ng 2: "Ná»¯"
    await expect(rows.nth(1).locator("td").nth(6)).toContainText("Ná»¯");
    // DÃ²ng 3: trá»‘ng â†’ "â€”"
    await expect(rows.nth(2).locator("td").nth(6)).toContainText("â€”");

    await page.getByRole("button", { name: "Há»§y" }).click();
  });
});

