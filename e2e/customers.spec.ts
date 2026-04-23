import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

const ts = Date.now().toString().slice(-8);
const testName = `KH-${ts}`;
const testPhone = `09${ts.padStart(8, "0")}`.slice(0, 10);

test.describe("US-007: Quản lý khách hàng", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-701: Trang danh sách khách hàng hiển thị đúng", async ({ page }) => {
    await page.goto("/admin/customers");

    await expect(page.locator("h1", { hasText: "Quản lý khách hàng" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Thêm khách hàng/ })).toBeVisible();
    await expect(page.getByPlaceholder("Tìm theo tên hoặc SĐT...")).toBeVisible();

    // Bảng phải hiển thị (dù rỗng hoặc có dữ liệu)
    await expect(page.locator("table")).toBeVisible();
  });

  test("TC-702: Thêm khách hàng mới thành công", async ({ page }) => {
    await page.goto("/admin/customers/new");

    await expect(page.locator("h1", { hasText: "Thêm khách hàng" })).toBeVisible();

    await page.getByLabel("Tên khách hàng").fill(testName);
    await page.getByLabel("Số điện thoại").fill(testPhone);
    await page.getByLabel("Email").fill(`kh${ts}@test.com`);
    await page.getByLabel("Địa chỉ").fill("123 Đường Test, TP.HCM");

    await page.getByRole("button", { name: "Lưu" }).click();

    // Redirect về danh sách
    await page.waitForURL("**/admin/customers", { timeout: 10000 });

    // Khách hàng mới xuất hiện trong danh sách
    await expect(page.locator("table tbody")).toContainText(testName);
  });

  test("TC-703: Validate required field Tên", async ({ page }) => {
    await page.goto("/admin/customers/new");

    // Bỏ trống tên, chỉ nhập SĐT
    await page.getByLabel("Số điện thoại").fill("0901234560");
    await page.getByRole("button", { name: "Lưu" }).click();

    await expect(page.locator("text=Tên không được trống")).toBeVisible();
  });

  test("TC-704: Validate SĐT sai định dạng", async ({ page }) => {
    await page.goto("/admin/customers/new");

    await page.getByLabel("Tên khách hàng").fill("Test Validation");
    await page.getByLabel("Số điện thoại").fill("123"); // quá ngắn

    await page.getByRole("button", { name: "Lưu" }).click();

    await expect(page.locator("text=SĐT không hợp lệ (10-11 chữ số)")).toBeVisible();
  });

  test("TC-705: Tìm kiếm khách hàng theo tên", async ({ page }) => {
    await page.goto("/admin/customers");

    const searchInput = page.getByPlaceholder("Tìm theo tên hoặc SĐT...");
    await searchInput.fill(testName);

    await expect(page).toHaveURL(/q=KH-/, { timeout: 5000 });
    await expect(page.locator("table tbody")).toContainText(testName);
  });

  test("TC-706: Xem chi tiết khách hàng", async ({ page }) => {
    await page.goto("/admin/customers");

    // Click "Xem" cho khách hàng vừa tạo
    const row = page.locator("table tbody tr", { hasText: testName });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Xem" }).click();

    await page.waitForURL("**/admin/customers/**", { timeout: 8000 });

    // Trang chi tiết hiển thị tên KH
    await expect(page.locator("h1", { hasText: testName })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sửa thông tin/ })).toBeVisible();

    // Bảng đơn hàng hiển thị
    await expect(
      page.locator("text=Lịch sử đơn hàng").or(page.locator("text=Chưa có đơn hàng nào")).first()
    ).toBeVisible();
  });

  test("TC-707: Sửa thông tin khách hàng thành công", async ({ page }) => {
    await page.goto("/admin/customers");

    const row = page.locator("table tbody tr", { hasText: testName });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Sửa" }).click();

    await page.waitForURL("**/edit", { timeout: 8000 });
    await expect(page.locator("h1", { hasText: "Sửa thông tin" })).toBeVisible();

    // Cập nhật địa chỉ
    const addressField = page.getByLabel("Địa chỉ");
    await addressField.clear();
    await addressField.fill("456 Đường Updated, TP.HCM");

    await page.getByRole("button", { name: "Lưu" }).click();

    // Redirect về danh sách
    await page.waitForURL("**/admin/customers", { timeout: 10000 });
    await expect(page.locator("table tbody")).toContainText(testName);
  });
});
