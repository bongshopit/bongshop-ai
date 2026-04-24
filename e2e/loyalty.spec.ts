import { test, expect, type Page } from "@playwright/test";
import path from "path";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

// Customer dùng để test thủ công — cần tồn tại hoặc được tạo trước
// TC sẽ navigate đến trang danh sách và lấy KH đầu tiên
async function getFirstCustomerId(page: Page): Promise<string | null> {
  await page.goto("/admin/customers");
  const firstLink = page.locator("table tbody tr a[href*='/admin/customers/']").first();
  const count = await firstLink.count();
  if (count === 0) return null;
  const href = await firstLink.getAttribute("href");
  return href?.split("/admin/customers/")[1]?.split("/")[0] ?? null;
}

test.describe("US-012: Tích điểm thủ công và import KiotViet", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─── TC-1201: Sidebar có link Import tích điểm ────────────────────────────
  test("TC-1201: Sidebar hiển thị link Import tích điểm", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.locator("nav a", { hasText: "Import tích điểm" })
    ).toBeVisible();
  });

  // ─── TC-1202: Trang import hiển thị đúng ─────────────────────────────────
  test("TC-1202: Trang /admin/loyalty/import hiển thị đúng", async ({ page }) => {
    await page.goto("/admin/loyalty/import");

    await expect(
      page.locator("h1", { hasText: "Import tích điểm từ KiotViet" })
    ).toBeVisible();

    // Hướng dẫn hiển thị
    await expect(page.getByText("Danh sách chi tiết hóa đơn")).toBeVisible();

    // Input file và nút phân tích
    await expect(page.locator("input[type='file']")).toBeAttached();
    await expect(
      page.getByRole("button", { name: "Phân tích file" })
    ).toBeVisible();
  });

  // ─── TC-1203: Upload file xlsx hợp lệ → preview ──────────────────────────
  test("TC-1203: Upload DanhSachChiTietHoaDon.xlsx → hiển thị preview", async ({
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
      page.getByText("✓ DanhSachChiTietHoaDon.xlsx")
    ).toBeVisible();

    // Phân tích file
    await page.getByRole("button", { name: "Phân tích file" }).click();

    // Chờ stats cards hiển thị
    await expect(page.locator("div", { hasText: "Hóa đơn" }).first()).toBeVisible({ timeout: 15000 });

    // Bảng preview hiện với ít nhất 1 row
    const tableRows = page.locator("table tbody tr");
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
  });

  // ─── TC-1204: Nút xác nhận chỉ active khi có khách khớp ─────────────────
  test("TC-1204: Nút xác nhận import hiển thị số khách khớp", async ({
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
    await page.getByRole("button", { name: "Phân tích file" }).click();
    await expect(page.getByText("Khách khớp")).toBeVisible({ timeout: 15000 });

    // Nút xác nhận phải hiển thị
    const confirmBtn = page.getByRole("button", { name: /Xác nhận import/ });
    await expect(confirmBtn).toBeVisible();
  });

  // ─── TC-1205: Trang chi tiết KH có nút Thêm điểm (Manager/Admin) ─────────
  test("TC-1205: Trang chi tiết KH hiển thị nút Thêm điểm và Điều chỉnh điểm", async ({
    page,
  }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "Không có khách hàng nào trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);

    await expect(
      page.getByRole("button", { name: "Thêm điểm" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Điều chỉnh điểm" })
    ).toBeVisible();
  });

  // ─── TC-1206: Thêm điểm thủ công thành công ──────────────────────────────
  test("TC-1206: Thêm điểm thủ công cho khách hàng", async ({ page }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "Không có khách hàng nào trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);

    // Lấy tổng điểm hiện tại từ card "Tổng điểm"
    const totalPointsLocator = page
      .locator("div", { hasText: "Tổng điểm" })
      .locator("span.text-xl")
      .first();
    const pointsText = await totalPointsLocator.textContent();
    const currentTotal = parseInt(pointsText ?? "0", 10);

    // Mở dialog thêm điểm
    await page.getByRole("button", { name: "Thêm điểm" }).click();

    // Dialog hiển thị
    await expect(page.getByText("Thêm điểm tích lũy")).toBeVisible();

    // Điền form
    await page.selectOption("select[name='category']", "SUA");
    await page.fill("input[name='points']", "10");
    await page.fill("input[name='reason']", "Test TC-1206 tích điểm Sữa");

    // Submit
    await page.getByRole("button", { name: "Thêm điểm" }).last().click();

    // Dialog đóng
    await expect(page.getByText("Thêm điểm tích lũy")).not.toBeVisible({
      timeout: 10000,
    });

    // Tổng điểm tăng thêm 10
    await expect(
      page.locator("div", { hasText: "Tổng điểm" }).locator("span.text-xl").first()
    ).toContainText(String(currentTotal + 10), { timeout: 10000 });
  });

  // ─── TC-1207: Thêm điểm với số âm → validation error ────────────────────
  test("TC-1207: Thêm điểm với số âm → validation error", async ({ page }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "Không có khách hàng nào trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);
    await page.getByRole("button", { name: "Thêm điểm" }).click();
    await expect(page.getByText("Thêm điểm tích lũy")).toBeVisible();

    await page.selectOption("select[name='category']", "DEFAULT");
    await page.fill("input[name='points']", "-5");
    await page.fill("input[name='reason']", "Test âm");
    await page.getByRole("button", { name: "Thêm điểm" }).last().click();

    // Phải hiện lỗi validation
    await expect(
      page.getByText("Số điểm phải lớn hơn 0")
    ).toBeVisible({ timeout: 5000 });
  });

  // ─── TC-1208: Điều chỉnh điểm thủ công ──────────────────────────────────
  test("TC-1208: Điều chỉnh điểm thủ công (ADJUST)", async ({ page }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "Không có khách hàng nào trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);

    await page.getByRole("button", { name: "Điều chỉnh điểm" }).click();
    await expect(page.getByText("Điều chỉnh điểm tích lũy")).toBeVisible();

    await page.selectOption("select[name='category']", "DEFAULT");
    await page.selectOption("select[name='type']", "ADJUST");
    await page.fill("input[name='delta']", "5");
    await page.fill("input[name='reason']", "Test TC-1208 ADJUST");
    await page.getByRole("button", { name: "Xác nhận" }).click();

    // Dialog đóng
    await expect(page.getByText("Điều chỉnh điểm tích lũy")).not.toBeVisible({
      timeout: 10000,
    });
  });

  // ─── TC-1209: Lịch sử điểm hiển thị sau khi thêm ────────────────────────
  test("TC-1209: Lịch sử tích điểm hiển thị trên trang chi tiết KH", async ({
    page,
  }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "Không có khách hàng nào trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);

    // Heading lịch sử
    await expect(
      page.getByText("Lịch sử tích điểm (10 gần nhất)")
    ).toBeVisible();

    // Bảng lịch sử phải tồn tại (có thể rỗng hoặc có dữ liệu)
    // Sau TC-1206 và TC-1208 đã tạo log → phải có ít nhất 1 dòng
    const logRows = page.locator("table").filter({ hasText: "Danh mục" }).locator("tbody tr");
    const count = await logRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ─── TC-1210: Điều chỉnh trừ quá số dư → lỗi ────────────────────────────
  test("TC-1210: ADJUST trừ quá số dư → lỗi Không đủ điểm", async ({
    page,
  }) => {
    const customerId = await getFirstCustomerId(page);
    if (!customerId) {
      test.skip(true, "Không có khách hàng nào trong DB");
      return;
    }

    await page.goto(`/admin/customers/${customerId}`);
    await page.getByRole("button", { name: "Điều chỉnh điểm" }).click();
    await expect(page.getByText("Điều chỉnh điểm tích lũy")).toBeVisible();

    await page.selectOption("select[name='category']", "TA_BIM");
    await page.selectOption("select[name='type']", "ADJUST");
    await page.fill("input[name='delta']", "-999999");
    await page.fill("input[name='reason']", "Test TC-1210 trừ quá");
    await page.getByRole("button", { name: "Xác nhận" }).click();

    // Phải hiện lỗi
    await expect(
      page.getByText(/Không đủ điểm/)
    ).toBeVisible({ timeout: 5000 });
  });
});
