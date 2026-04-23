import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

const testSku = `SP-${String(Date.now()).slice(-8)}`;

test.describe("US-004: Tồn kho", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-401: Trang danh sách hiển thị đúng
  test("TC-401: Trang danh sách tồn kho hiển thị đúng", async ({ page }) => {
    await page.goto("/admin/inventory");

    await expect(page.locator("h1", { hasText: "Tồn kho" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Thêm sản phẩm/ })).toBeVisible();

    // Search form
    await expect(page.getByPlaceholder("Tìm theo tên hoặc SKU...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tìm kiếm" })).toBeVisible();
  });

  // TC-402: Trang thêm sản phẩm hiển thị đúng
  test("TC-402: Trang thêm sản phẩm hiển thị đúng", async ({ page }) => {
    await page.goto("/admin/inventory/new");

    await expect(page.locator("h1", { hasText: "Thêm sản phẩm" })).toBeVisible();

    await expect(page.getByLabel("Mã SKU")).toBeVisible();
    await expect(page.getByLabel("Tên sản phẩm")).toBeVisible();
    await expect(page.getByLabel("Đơn vị")).toBeVisible();
    await expect(page.getByLabel(/Giá nhập/)).toBeVisible();
    await expect(page.getByLabel(/Giá bán/)).toBeVisible();

    await expect(page.getByRole("button", { name: "Thêm sản phẩm" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Hủy" })).toBeVisible();
  });

  // TC-403: Thêm sản phẩm mới thành công (AC-4.1)
  test("TC-403: Thêm sản phẩm mới thành công", async ({ page }) => {
    await page.goto("/admin/inventory/new");

    await page.getByLabel("Mã SKU").fill(testSku);
    await page.getByLabel("Tên sản phẩm").fill("Sản phẩm test Playwright");
    await page.getByLabel("Đơn vị").fill("cái");
    await page.getByLabel(/Giá nhập/).fill("50000");
    await page.getByLabel(/Giá bán/).fill("80000");

    await page.getByRole("button", { name: "Thêm sản phẩm" }).click();

    // Redirect về danh sách
    await expect(page).toHaveURL(/\/admin\/inventory$/, { timeout: 8000 });

    // Sản phẩm xuất hiện trong danh sách
    await expect(page.locator("table tbody")).toContainText(testSku);
  });

  // TC-404: Validation — SKU trùng
  test("TC-404: Validation — SKU đã tồn tại", async ({ page }) => {
    await page.goto("/admin/inventory/new");

    // Dùng SKU vừa tạo ở TC-403
    await page.getByLabel("Mã SKU").fill(testSku);
    await page.getByLabel("Tên sản phẩm").fill("Trùng SKU test");
    await page.getByLabel("Đơn vị").fill("cái");
    await page.getByLabel(/Giá nhập/).fill("10000");
    await page.getByLabel(/Giá bán/).fill("20000");

    await page.getByRole("button", { name: "Thêm sản phẩm" }).click();

    await expect(page.getByText("Mã SKU đã tồn tại")).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/admin\/inventory\/new/);
  });

  // TC-405: Validation — form trống
  test("TC-405: Validation — submit form trống", async ({ page }) => {
    await page.goto("/admin/inventory/new");

    await page.getByRole("button", { name: "Thêm sản phẩm" }).click();

    // Vẫn ở trang thêm mới (HTML5 required hoặc custom validation)
    await expect(page).toHaveURL(/\/admin\/inventory\/new/);
  });

  // TC-406: Xem chi tiết sản phẩm (AC-4.1)
  test("TC-406: Xem chi tiết sản phẩm vừa tạo", async ({ page }) => {
    await page.goto("/admin/inventory");

    // Tìm sản phẩm test và click Chi tiết
    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Chi tiết").click();

    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+$/, { timeout: 8000 });
    await page.waitForLoadState("networkidle");

    // Hiển thị tên và SKU
    await expect(page.getByRole("heading", { name: "Sản phẩm test Playwright" })).toBeVisible();
    await expect(page.locator("span.font-mono", { hasText: testSku })).toBeVisible();

    // Form nhập/xuất kho hiển thị
    await expect(page.getByText("Nhập / Xuất kho")).toBeVisible();

    // Lịch sử nhập xuất
    await expect(page.getByRole("heading", { name: "Lịch sử nhập/xuất kho" })).toBeVisible();
  });

  // TC-407: Nhập kho thành công (AC-4.2)
  test("TC-407: Nhập kho thành công", async ({ page }) => {
    await page.goto("/admin/inventory");

    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Chi tiết").click();
    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+$/, { timeout: 5000 });

    // Chọn tab Nhập kho
    await page.getByRole("button", { name: "Nhập kho" }).first().click();

    await page.getByLabel("Số lượng").fill("10");
    await page.getByLabel("Lý do").fill("Nhập hàng test Playwright");

    await page.getByRole("button", { name: "Xác nhận nhập kho" }).click();

    // Thông báo thành công
    await expect(page.getByText("Nhập kho thành công!")).toBeVisible({ timeout: 5000 });

    // Tồn kho cập nhật (số lượng lớn hiển thị trong card)
    await expect(page.locator("p.text-2xl", { hasText: "10" })).toBeVisible();
  });

  // TC-408: Xuất kho thành công (AC-4.3)
  test("TC-408: Xuất kho thành công", async ({ page }) => {
    await page.goto("/admin/inventory");

    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Chi tiết").click();
    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+$/, { timeout: 5000 });

    // Chọn tab Xuất kho
    await page.getByRole("button", { name: "Xuất kho" }).click();

    await page.getByLabel("Số lượng").fill("3");
    await page.getByLabel("Lý do").fill("Xuất hàng test Playwright");

    await page.getByRole("button", { name: "Xác nhận xuất kho" }).click();

    await expect(page.getByText("Xuất kho thành công!")).toBeVisible({ timeout: 5000 });

    // Tồn kho giảm từ 10 xuống 7
    await expect(page.locator("p.text-2xl", { hasText: "7" })).toBeVisible();
  });

  // TC-409: Xuất kho vượt tồn — BR-004 (tồn kho không âm)
  test("TC-409: Xuất kho vượt tồn bị từ chối (BR-004)", async ({ page }) => {
    await page.goto("/admin/inventory");

    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Chi tiết").click();
    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+$/, { timeout: 5000 });

    await page.getByRole("button", { name: "Xuất kho" }).click();

    // Cố xuất 999 (nhiều hơn tồn có)
    await page.getByLabel("Số lượng").fill("999");
    await page.getByRole("button", { name: "Xác nhận xuất kho" }).click();

    await expect(page.getByText(/Tồn kho không đủ/)).toBeVisible({ timeout: 5000 });
  });

  // TC-410: Lịch sử nhập/xuất hiển thị đúng (AC-4.4)
  test("TC-410: Lịch sử nhập xuất kho hiển thị đúng", async ({ page }) => {
    await page.goto("/admin/inventory");

    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Chi tiết").click();
    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+$/, { timeout: 5000 });

    // Bảng lịch sử
    const historyTable = page.locator("table").last();
    await expect(historyTable).toBeVisible();

    // Phải có ít nhất 2 records (TC-407 nhập 10, TC-408 xuất 3)
    const rows = historyTable.locator("tbody tr");
    await expect(rows).toHaveCount(2, { timeout: 5000 });

    // Kiểm tra record nhập kho
    await expect(historyTable.locator("tbody")).toContainText("Nhập kho");
    await expect(historyTable.locator("tbody")).toContainText("Xuất kho");
    await expect(historyTable.locator("tbody")).toContainText("Nhập hàng test Playwright");
  });

  // TC-411: Sửa thông tin sản phẩm (AC-4.1)
  test("TC-411: Sửa thông tin sản phẩm thành công", async ({ page }) => {
    await page.goto("/admin/inventory");

    const row = page.locator("table tbody tr", { hasText: testSku });
    await row.getByText("Sửa").click();

    await expect(page).toHaveURL(/\/admin\/inventory\/[a-z0-9]+\/edit$/, { timeout: 5000 });
    await expect(page.locator("h1", { hasText: "Chỉnh sửa sản phẩm" })).toBeVisible();

    // Form pre-fill đúng SKU
    const skuInput = page.getByLabel("Mã SKU");
    await expect(skuInput).toHaveValue(testSku);

    // Sửa tên
    const nameInput = page.getByLabel("Tên sản phẩm");
    await nameInput.clear();
    await nameInput.fill("Sản phẩm test Playwright (đã sửa)");

    await page.getByRole("button", { name: "Cập nhật" }).click();

    await expect(page).toHaveURL(/\/admin\/inventory$/, { timeout: 8000 });
    await expect(page.locator("table tbody")).toContainText("đã sửa");
  });

  // TC-412: Tìm kiếm sản phẩm theo SKU
  test("TC-412: Tìm kiếm sản phẩm theo SKU", async ({ page }) => {
    await page.goto("/admin/inventory");

    await page.getByPlaceholder("Tìm theo tên hoặc SKU...").fill(testSku);
    await page.getByRole("button", { name: "Tìm kiếm" }).click();

    await expect(page).toHaveURL(new RegExp(`q=${encodeURIComponent(testSku)}`));
    await expect(page.locator("table tbody")).toContainText(testSku);
  });
});
