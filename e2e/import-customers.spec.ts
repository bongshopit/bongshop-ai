import { test, expect } from "@playwright/test";
import * as XLSX from "xlsx";
import * as path from "path";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 30000 });
}

/**
 * Tạo buffer xlsx giả lập định dạng KiotViet với các dòng tuỳ chỉnh.
 */
function createKiotVietXlsx(
  dataRows: (string | number)[][]
): { name: string; mimeType: string; buffer: Buffer } {
  const header = [
    "Loại khách",
    "Chi nhánh tạo",
    "Mã khách hàng",
    "Tên khách hàng",
    "Điện thoại",
    "Địa chỉ",
    "Khu vực giao hàng",
    "Phường/Xã",
    "Công ty",
    "Mã số thuế",
    "Số CMND/CCCD",
    "Ngày sinh",
    "Giới tính",
    "Email",
    "Facebook",
    "Nhóm khách hàng",
    "Ghi chú",
    "Điểm hiện tại",
    "Tổng điểm",
    "Người tạo",
    "Ngày tạo",
    "Ngày giao dịch cuối",
    "Nợ cần thu hiện tại",
    "Tổng bán",
    "Tổng bán trừ trả hàng",
    "Trạng thái",
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

/** Tạo xlsx không có cột "Tên khách hàng" (sai định dạng) */
function createInvalidFormatXlsx(): { name: string; mimeType: string; buffer: Buffer } {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Mã", "Tên", "SĐT"],
    ["001", "Nguyễn A", "0901234567"],
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

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("US-008: Nhập khách hàng từ KiotViet xlsx", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // TC-801: Nút "Nhập từ KiotViet" hiển thị với ADMIN
  test("TC-801: Nút Nhập từ KiotViet hiển thị với ADMIN", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(
      page.getByRole("button", { name: /Nhập từ KiotViet/ })
    ).toBeVisible();
  });

  // TC-802: STAFF không thấy nút import (cần staff account — skip do chưa có seed)
  test.skip("TC-802: Nút Nhập từ KiotViet ẩn với STAFF (cần staff credentials)", async () => {
    // Yêu cầu thêm STAFF user vào seed trước khi enable test này
  });

  // TC-803: Upload file thực từ KiotViet → detect đúng tổng dòng
  test("TC-803: Upload file KiotViet thực → detect đúng số dòng", async ({ page }) => {
    await page.goto("/admin/customers");

    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();
    await expect(page.locator("text=Nhập khách hàng từ KiotViet")).toBeVisible();

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(REAL_FILE);

    // Đợi summary xuất hiện với tổng 2587 dòng
    await expect(page.locator("text=/Tổng dòng.*2587/")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("text=/Hợp lệ/")).toBeVisible();

    // Nút import phải active
    await expect(
      page.getByRole("button", { name: /Import/ })
    ).not.toBeDisabled();

    // Đóng dialog
    await page.getByRole("button", { name: "Hủy" }).click();
    await expect(
      page.locator("text=Nhập khách hàng từ KiotViet")
    ).not.toBeVisible();
  });

  // TC-804: Preview hiển thị đúng các cột: Tên, SĐT, Địa chỉ, Ngày sinh, Giới tính
  test("TC-804: Preview hiển thị đúng các cột từ file KiotViet", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();

    const input = page.locator('input[type="file"]');
    await input.setInputFiles(REAL_FILE);

    await expect(page.locator("text=/Tổng dòng.*2587/")).toBeVisible({
      timeout: 15000,
    });

    // Scope locator vào bên trong dialog (div.fixed) tránh nhầm bảng danh sách KH
    const dialog = page.locator("div.fixed").filter({
      hasText: "Nhập khách hàng từ KiotViet",
    });
    const table = dialog.locator("table");
    const ths = table.locator("thead th");

    // Preview table có 7 cột: #, Trạng thái, Tên KH, SĐT, Địa chỉ, Ngày sinh, Giới tính
    await expect(ths).toHaveCount(7);

    // Dòng đầu phải có dữ liệu tên (không trống)
    const firstRow = table.locator("tbody tr").first();
    await expect(firstRow).not.toContainText("trống");

    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC-805: Ngày sinh convert đúng từ Excel serial → Date (format YYYY-MM-DD)
  test("TC-805: Ngày sinh từ Excel serial hiển thị đúng YYYY-MM-DD", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);
    const testPhone = `0911${ts.slice(0, 6)}`;

    // Serial 45889 → 2025-08-12
    const file = createKiotVietXlsx([
      ["Cá nhân", "CN", "KH001", `Test ${ts}`, testPhone, "Địa chỉ test", "", "", "", "", "", 45889, "Nữ", "", "", "", "", 0, 0, "Test", 46000, 46000, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tổng dòng.*1/")).toBeVisible({ timeout: 10000 });

    // Ngày sinh phải hiển thị dạng YYYY-MM-DD (không phải số serial)
    const dialog805 = page.locator("div.fixed").filter({ hasText: "Nhập khách hàng từ KiotViet" });
    const table = dialog805.locator("table");
    const dobCell = table.locator("tbody tr").first().locator("td").nth(5);
    const dobText = await dobCell.innerText();
    // Phải khớp format YYYY-MM-DD
    expect(dobText).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC-806: Upload file không phải xlsx → hiển thị lỗi
  test("TC-806: Upload file không phải xlsx → báo lỗi", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();

    const csvFile = {
      name: "data.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("Tên,SĐT\nNguyễn A,0901234567"),
    };
    await page.locator('input[type="file"]').setInputFiles(csvFile);

    await expect(
      page.locator("text=Chỉ chấp nhận file .xlsx")
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC-807: Upload file > 10MB → báo lỗi (skip — khó tạo file >10MB trong test)
  test.skip("TC-807: Upload file > 10MB → báo lỗi", async () => {
    // Cần tạo file buffer > 10MB — bỏ qua trong môi trường CI
  });

  // TC-808: File không có cột "Tên khách hàng" → báo định dạng không hợp lệ
  test("TC-808: File sai định dạng KiotViet → báo lỗi", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();

    const invalidFile = createInvalidFormatXlsx();
    await page.locator('input[type="file"]').setInputFiles(invalidFile);

    await expect(
      page.locator("text=Không nhận diện được định dạng KiotViet")
    ).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC-809: Dòng có Tên trống → đánh dấu error
  test("TC-809: Dòng có Tên trống → đánh dấu error (màu đỏ)", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);

    const file = createKiotVietXlsx([
      // Dòng 1: hợp lệ
      ["Cá nhân", "CN", "KH001", `Valid ${ts}`, `0922${ts.slice(0,6)}`, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
      // Dòng 2: tên trống
      ["Cá nhân", "CN", "KH002", "", `0933${ts.slice(0,6)}`, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tổng dòng.*2/")).toBeVisible({ timeout: 10000 });

    // Phải hiển thị 1 dòng lỗi
    await expect(page.locator("text=/❌ Lỗi.*1/")).toBeVisible();

    // Dòng có lỗi phải có class bg-red-50
    const dialog809 = page.locator("div.fixed").filter({ hasText: "Nhập khách hàng từ KiotViet" });
    const table = dialog809.locator("table");
    const rows = table.locator("tbody tr");
    const errorRow = rows.nth(1); // dòng 2 (index 1)
    await expect(errorRow).toHaveClass(/bg-red-50/);

    // Nút import chỉ import 1 dòng hợp lệ
    await expect(page.getByRole("button", { name: /Import 1 khách hàng/ })).toBeVisible();

    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC-810: Dòng SĐT 9 chữ số → đánh dấu error
  test("TC-810: Dòng SĐT sai định dạng → đánh dấu error", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);

    const file = createKiotVietXlsx([
      // SĐT chỉ 9 chữ số (sai)
      ["Cá nhân", "CN", "KH001", `BadPhone ${ts}`, "090123456", "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tổng dòng.*1/")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=/❌ Lỗi.*1/")).toBeVisible();

    // Nút import disabled (0 dòng hợp lệ)
    await expect(
      page.getByRole("button", { name: /Import 0/ })
    ).toBeDisabled();

    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC-811: 2 dòng cùng SĐT trong file → dòng 2 đánh dấu duplicate_in_file
  test("TC-811: Hai dòng cùng SĐT trong file → dòng 2 trùng lặp", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);
    const dupPhone = `0944${ts.slice(0, 6)}`;

    const file = createKiotVietXlsx([
      ["Cá nhân", "CN", "KH001", `KH First ${ts}`, dupPhone, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
      ["Cá nhân", "CN", "KH002", `KH Second ${ts}`, dupPhone, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tổng dòng.*2/")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=/⚠️ Trùng SĐT trong file.*1/")).toBeVisible();

    // Dòng 2 phải có class bg-yellow-50
    const dialog811 = page.locator("div.fixed").filter({ hasText: "Nhập khách hàng từ KiotViet" });
    const table = dialog811.locator("table");
    const dupRow = table.locator("tbody tr").nth(1);
    await expect(dupRow).toHaveClass(/bg-yellow-50/);

    // Chỉ 1 dòng hợp lệ để import
    await expect(
      page.getByRole("button", { name: /Import 1 khách hàng/ })
    ).toBeVisible();

    await page.getByRole("button", { name: "Hủy" }).click();
  });

  // TC-812 + TC-813: Import thành công → toast đúng số liệu, danh sách reload
  test("TC-813: Import thành công → toast đúng, danh sách reload", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);
    const phone1 = `0955${ts.slice(0, 6)}`;
    const phone2 = `0966${ts.slice(0, 6)}`;
    const name1 = `Import Test A ${ts}`;
    const name2 = `Import Test B ${ts}`;

    const file = createKiotVietXlsx([
      ["Cá nhân", "CN", "KH001", name1, phone1, "123 Đường Test", "", "", "", "", "", 45889, "Nam", "", "", "", "Ghi chú test", 0, 0, "", 0, 0, 0, 0, 0, 1],
      ["Cá nhân", "CN", "KH002", name2, phone2, "", "", "", "", "", "", "", "Nữ", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tổng dòng.*2/")).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /Import 2 khách hàng/ })
    ).toBeEnabled();

    await page.getByRole("button", { name: /Import 2 khách hàng/ }).click();

    // Toast thành công phải xuất hiện
    await expect(
      page.locator("[data-sonner-toast]", {
        hasText: /Đã nhập.*khách hàng thành công/,
      })
    ).toBeVisible({ timeout: 15000 });

    // Dialog đóng
    await expect(
      page.locator("text=Nhập khách hàng từ KiotViet")
    ).not.toBeVisible({ timeout: 5000 });

    // Khách hàng mới xuất hiện trong danh sách
    await expect(page.locator("table tbody")).toContainText(name1, {
      timeout: 10000,
    });
    await expect(page.locator("table tbody")).toContainText(name2);
  });

  // TC-812: SĐT đã có trong DB → bỏ qua, không lỗi, tính vào skipped
  test("TC-812: SĐT trùng với DB → bỏ qua, toast báo skipped", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);
    const phone = `0977${ts.slice(0, 6)}`;
    const nameFirst = `Dup DB First ${ts}`;
    const nameDup = `Dup DB Second ${ts}`;

    // Import lần 1 để tạo bản ghi gốc
    const file1 = createKiotVietXlsx([
      ["Cá nhân", "CN", "KH001", nameFirst, phone, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file1);
    await expect(page.locator("text=/Tổng dòng.*1/")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Import 1 khách hàng/ }).click();
    await expect(
      page.locator("[data-sonner-toast]", { hasText: /Đã nhập 1 khách hàng/ })
    ).toBeVisible({ timeout: 15000 });

    // Import lần 2 — cùng SĐT → phải bị skip
    const file2 = createKiotVietXlsx([
      ["Cá nhân", "CN", "KH001", nameDup, phone, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file2);
    await expect(page.locator("text=/Tổng dòng.*1/")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Import 1 khách hàng/ }).click();

    // Toast phải báo 0 imported, 1 skipped
    await expect(
      page.locator("[data-sonner-toast]", {
        hasText: /Đã nhập 0 khách hàng thành công\. Bỏ qua 1 do trùng SĐT/,
      })
    ).toBeVisible({ timeout: 15000 });
  });

  // TC-814: Giới tính "Nam"/"Nữ" lưu đúng; giá trị khác → null (kiểm qua preview)
  test("TC-814: Giới tính Nam/Nữ hiển thị đúng trong preview", async ({ page }) => {
    const ts = Date.now().toString().slice(-8);

    const file = createKiotVietXlsx([
      ["Cá nhân", "CN", "KH001", `Nam Test ${ts}`, `0988${ts.slice(0,6)}`, "", "", "", "", "", "", "", "Nam", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
      ["Cá nhân", "CN", "KH002", `Nu Test ${ts}`, `0999${ts.slice(0,6)}`, "", "", "", "", "", "", "", "Nữ", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
      ["Cá nhân", "CN", "KH003", `Other Test ${ts}`, `0911${ts.slice(0,6)}`, "", "", "", "", "", "", "", "", "", "", "", "", 0, 0, "", 0, 0, 0, 0, 0, 1],
    ]);

    await page.goto("/admin/customers");
    await page.getByRole("button", { name: /Nhập từ KiotViet/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);

    await expect(page.locator("text=/Tổng dòng.*3/")).toBeVisible({ timeout: 10000 });

    const dialog814 = page.locator("div.fixed").filter({ hasText: "Nhập khách hàng từ KiotViet" });
    const table = dialog814.locator("table");
    const rows = table.locator("tbody tr");

    // Dòng 1: "Nam"
    await expect(rows.nth(0).locator("td").nth(6)).toContainText("Nam");
    // Dòng 2: "Nữ"
    await expect(rows.nth(1).locator("td").nth(6)).toContainText("Nữ");
    // Dòng 3: trống → "—"
    await expect(rows.nth(2).locator("td").nth(6)).toContainText("—");

    await page.getByRole("button", { name: "Hủy" }).click();
  });
});
