import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

const testDesc = `Thu test PW-${String(Date.now()).slice(-6)}`;
const testDescExpense = `Chi test PW-${String(Date.now()).slice(-6)}`;

test.describe("US-005: Sổ quỹ", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-501: Trang sổ quỹ hiển thị đúng
  test("TC-501: Trang sổ quỹ hiển thị đúng", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await expect(page.getByRole("heading", { name: "Sổ quỹ" })).toBeVisible();

    // AC-5.3 — số dư quỹ hiện tại
    await expect(page.getByText("Số dư quỹ hiện tại")).toBeVisible();
    await expect(page.getByText("Tổng thu")).toBeVisible();
    await expect(page.getByText("Tổng chi")).toBeVisible();

    // Form tạo phiếu
    await expect(page.getByText("Tạo phiếu thu / chi")).toBeVisible();

    // Bảng giao dịch
    await expect(page.getByRole("table")).toBeVisible();
  });

  // TC-502: Form tạo phiếu hiển thị đủ fields
  test("TC-502: Form tạo phiếu có đủ fields", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await expect(page.getByRole("button", { name: "Phiếu thu", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Phiếu chi", exact: true })).toBeVisible();
    await expect(page.getByLabel("Số tiền (VNĐ)")).toBeVisible();
    await expect(page.getByLabel("Ngày giao dịch")).toBeVisible();
    await expect(page.getByLabel("Mô tả")).toBeVisible();
    await expect(page.getByLabel("Danh mục")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tạo phiếu thu" })).toBeVisible();
  });

  // TC-503: Tạo phiếu thu thành công (AC-5.1)
  test("TC-503: Tạo phiếu thu thành công", async ({ page }) => {
    await page.goto("/admin/cashbook");

    // Đảm bảo đang ở tab Thu
    await page.getByRole("button", { name: "Phiếu thu", exact: true }).click();

    await page.getByLabel("Số tiền (VNĐ)").fill("500000");
    await page.getByLabel("Mô tả").fill(testDesc);

    await page.getByRole("button", { name: "Tạo phiếu thu" }).click();

    await expect(page.getByText("Tạo phiếu thu thành công!")).toBeVisible({ timeout: 5000 });

    // Giao dịch xuất hiện trong bảng
    await expect(page.locator("table tbody")).toContainText(testDesc);
  });

  // TC-504: Validation — thiếu mô tả
  test("TC-504: Validation — thiếu mô tả", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await page.getByLabel("Số tiền (VNĐ)").fill("100000");
    // Bỏ trống mô tả

    await page.getByRole("button", { name: "Tạo phiếu thu" }).click();

    // Vẫn ở trang cashbook (HTML5 required hoặc custom validation)
    await expect(page).toHaveURL(/\/admin\/cashbook/);
  });

  // TC-505: Tạo phiếu chi thành công (AC-5.1)
  test("TC-505: Tạo phiếu chi thành công", async ({ page }) => {
    await page.goto("/admin/cashbook");

    // Chuyển sang tab Chi
    await page.getByRole("button", { name: "Phiếu chi", exact: true }).click();
    await expect(page.getByRole("button", { name: "Tạo phiếu chi" })).toBeVisible();

    await page.getByLabel("Số tiền (VNĐ)").fill("100000");
    await page.getByLabel("Mô tả").fill(testDescExpense);

    await page.getByRole("button", { name: "Tạo phiếu chi" }).click();

    await expect(page.getByText("Tạo phiếu chi thành công!")).toBeVisible({ timeout: 5000 });

    // Giao dịch xuất hiện trong bảng
    await expect(page.locator("table tbody")).toContainText(testDescExpense);
  });

  // TC-506: BR-005 — chi vượt số dư bị từ chối
  test("TC-506: BR-005 — chi vượt số dư bị từ chối", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await page.getByRole("button", { name: "Phiếu chi", exact: true }).click();

    // Nhập số tiền rất lớn
    await page.getByLabel("Số tiền (VNĐ)").fill("999999999999");
    await page.getByLabel("Mô tả").fill("Chi vượt quỹ test");

    await page.getByRole("button", { name: "Tạo phiếu chi" }).click();

    await expect(page.getByText(/Số dư quỹ không đủ/)).toBeVisible({ timeout: 5000 });
  });

  // TC-507: Danh sách giao dịch — filter theo loại Thu (AC-5.2)
  test("TC-507: Filter theo loại Thu", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await page.locator("select[name='type']").selectOption("INCOME");
    await page.getByRole("button", { name: "Lọc" }).click();

    await expect(page).toHaveURL(/type=INCOME/);

    // Không có badge "Chi" trong bảng
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    if (count > 0 && !(await rows.first().getByText("Không có giao dịch").isVisible())) {
      const firstBadge = rows.first().locator("span").first();
      await expect(firstBadge).toContainText("Thu");
    }
  });

  // TC-508: Filter theo loại Chi (AC-5.2)
  test("TC-508: Filter theo loại Chi", async ({ page }) => {
    await page.goto("/admin/cashbook");

    await page.locator("select[name='type']").selectOption("EXPENSE");
    await page.getByRole("button", { name: "Lọc" }).click();

    await expect(page).toHaveURL(/type=EXPENSE/);
  });

  // TC-509: Filter theo khoảng thời gian (AC-5.2)
  test("TC-509: Filter theo khoảng thời gian", async ({ page }) => {
    await page.goto("/admin/cashbook");

    const today = new Date().toISOString().slice(0, 10);
    await page.locator("input[name='from']").fill(today);
    await page.locator("input[name='to']").fill(today);
    await page.getByRole("button", { name: "Lọc" }).click();

    await expect(page).toHaveURL(/from=.+&to=.+/);

    // Có giao dịch vừa tạo trong TC-503 và TC-505
    await expect(page.locator("table tbody")).toContainText(testDesc);
  });

  // TC-510: Báo cáo kỳ lọc hiển thị khi có filter (AC-5.4)
  test("TC-510: Báo cáo kỳ lọc hiển thị", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.goto(`/admin/cashbook?from=${today}&to=${today}`);

    await expect(page.getByText("Báo cáo kỳ lọc:")).toBeVisible();
    await expect(page.getByText(/Số dư cuối kỳ/)).toBeVisible();
  });

  // TC-511: Xóa lọc trở về danh sách đầy đủ
  test("TC-511: Nút xóa lọc hoạt động", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.goto(`/admin/cashbook?from=${today}&to=${today}&type=INCOME`);

    await expect(page.getByRole("link", { name: "Xóa lọc" })).toBeVisible();
    await page.getByRole("link", { name: "Xóa lọc" }).click();

    await expect(page).toHaveURL(/\/admin\/cashbook$/);
  });

  // TC-512: Số dư hiện tại thay đổi sau khi tạo giao dịch (AC-5.3)
  test("TC-512: Số dư quỹ phản ánh đúng sau giao dịch", async ({ page }) => {
    await page.goto("/admin/cashbook");

    // Đọc số dư hiện tại
    const balanceEl = page.locator("p.text-xl.font-bold").first();
    await expect(balanceEl).toBeVisible();
    const balanceText = await balanceEl.textContent();
    expect(balanceText).toBeTruthy();

    // Tạo thêm phiếu thu 200k
    await page.getByRole("button", { name: "Phiếu thu", exact: true }).click();
    await page.getByLabel("Số tiền (VNĐ)").fill("200000");
    await page.getByLabel("Mô tả").fill(`Thu thêm verify balance ${Date.now()}`);
    await page.getByRole("button", { name: "Tạo phiếu thu" }).click();

    await expect(page.getByText("Tạo phiếu thu thành công!")).toBeVisible({ timeout: 5000 });

    // Số dư mới phải khác số dư cũ (đã tăng)
    const newBalanceText = await page.locator("p.text-xl.font-bold").first().textContent();
    expect(newBalanceText).not.toEqual(balanceText);
  });
});
