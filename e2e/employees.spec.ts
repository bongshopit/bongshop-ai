import { test, expect } from "@playwright/test";

// Helper: login
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

// Unique code to avoid conflict across test runs (max 20 chars per validator)
const testCode = `NV-${String(Date.now()).slice(-8)}`;

test.describe("US-001: Quản lý nhân viên", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-101: Trang danh sách nhân viên hiển thị đúng", async ({ page }) => {
    await page.goto("/admin/employees");

    // Tiêu đề trang
    await expect(
      page.locator("h1", { hasText: "Quản lý nhân viên" })
    ).toBeVisible();

    // Nút thêm nhân viên
    await expect(
      page.getByRole("link", { name: /Thêm nhân viên/ })
    ).toBeVisible();

    // Thanh tìm kiếm
    await expect(
      page.getByPlaceholder("Tìm theo tên, mã NV...")
    ).toBeVisible();

    // Có ít nhất 1 nhân viên từ seed (NV001, NV002)
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("TC-102: Search nhân viên theo tên", async ({ page }) => {
    await page.goto("/admin/employees");

    const searchInput = page.getByPlaceholder("Tìm theo tên, mã NV...");
    await searchInput.fill("Admin");

    // URL cập nhật với query
    await expect(page).toHaveURL(/q=Admin/);

    // Kết quả tìm kiếm chứa "Admin"
    await expect(page.locator("table tbody")).toContainText("Admin");
  });

  test("TC-103: Search nhân viên theo mã NV", async ({ page }) => {
    await page.goto("/admin/employees");

    await page.getByPlaceholder("Tìm theo tên, mã NV...").fill("NV001");
    await expect(page).toHaveURL(/q=NV001/);
    await expect(page.locator("table tbody")).toContainText("NV001");
  });

  test("TC-104: Filter theo trạng thái — chỉ hiện đang làm", async ({
    page,
  }) => {
    await page.goto("/admin/employees");

    await page.getByLabel("Lọc theo trạng thái").selectOption("active");
    await expect(page).toHaveURL(/status=active/);

    // Tất cả rows phải có badge "Đang làm"
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText("Đang làm");
      }
    }
  });

  test("TC-105: Trang thêm nhân viên hiển thị đúng", async ({ page }) => {
    await page.goto("/admin/employees/new");

    await expect(
      page.locator("h1", { hasText: "Thêm nhân viên mới" })
    ).toBeVisible();

    // Tất cả các fields có mặt
    await expect(page.getByLabel("Mã nhân viên")).toBeVisible();
    await expect(page.getByLabel(/^Họ/)).toBeVisible();
    await expect(page.getByLabel(/^Tên/)).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Số điện thoại")).toBeVisible();
    await expect(page.getByLabel("Phòng ban")).toBeVisible();
    await expect(page.getByLabel("Chức vụ")).toBeVisible();
    await expect(page.getByLabel(/Lương giờ/)).toBeVisible();

    // Nút submit và hủy
    await expect(
      page.getByRole("button", { name: "Tạo nhân viên" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Hủy" })).toBeVisible();
  });

  test("TC-106: Validation — tạo nhân viên thiếu field bắt buộc", async ({
    page,
  }) => {
    await page.goto("/admin/employees/new");

    // Submit form trống
    await page.getByRole("button", { name: "Tạo nhân viên" }).click();

    // Form không submit (HTML5 validation hoặc custom)
    await expect(page).toHaveURL(/\/admin\/employees\/new/);
  });

  test("TC-107: Tạo nhân viên mới thành công", async ({ page }) => {
    await page.goto("/admin/employees/new");

    await page.getByLabel("Mã nhân viên").fill(testCode);
    await page.getByLabel(/^Họ/).fill("Trần");
    await page.getByLabel(/^Tên/).fill("Văn Test");
    await page.getByLabel("Email").fill(`${testCode}@bongshop.vn`);
    await page.getByLabel("Số điện thoại").fill("0912345678");
    await page.getByLabel("Phòng ban").fill("Kinh doanh");
    await page.getByLabel("Chức vụ").fill("Nhân viên test");
    await page.getByLabel(/Lương giờ/).fill("30000");

    await page.getByRole("button", { name: "Tạo nhân viên" }).click();

    // Redirect về danh sách
    await expect(page).toHaveURL(/\/admin\/employees$/, { timeout: 5000 });

    // Nhân viên mới xuất hiện trong danh sách
    await expect(page.locator("table tbody")).toContainText(testCode);
  });

  test("TC-108: Validation — mã NV trùng", async ({ page }) => {
    await page.goto("/admin/employees/new");

    // Dùng mã đã tồn tại
    await page.getByLabel("Mã nhân viên").fill("NV001");
    await page.getByLabel(/^Họ/).fill("Test");
    await page.getByLabel(/^Tên/).fill("Duplicate");
    await page.getByLabel("Email").fill("duplicate@bongshop.vn");
    await page.getByLabel("Số điện thoại").fill("0900000099");
    await page.getByLabel("Phòng ban").fill("Test");
    await page.getByLabel("Chức vụ").fill("Test");
    await page.getByLabel(/Lương giờ/).fill("10000");

    await page.getByRole("button", { name: "Tạo nhân viên" }).click();

    // Hiển thị lỗi trùng mã
    await expect(page.getByText("Mã nhân viên đã tồn tại")).toBeVisible({
      timeout: 5000,
    });
    // Vẫn ở trang create
    await expect(page).toHaveURL(/\/admin\/employees\/new/);
  });

  test("TC-109: Xem chi tiết nhân viên", async ({ page }) => {
    await page.goto("/admin/employees");

    // Click "Xem" nhân viên đầu tiên
    await page.locator("table tbody tr").first().getByText("Xem").click();

    // URL chuyển đến /admin/employees/[id]
    await expect(page).toHaveURL(/\/admin\/employees\/[a-z0-9]+$/);

    // Trang hiển thị thông tin
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sửa" })).toBeVisible();
  });

  test("TC-110: Sửa thông tin nhân viên thành công", async ({ page }) => {
    await page.goto("/admin/employees");

    // Click "Sửa" nhân viên đầu tiên
    await page.locator("table tbody tr").first().getByText("Sửa").click();

    // URL chuyển đến /admin/employees/[id]/edit
    await expect(page).toHaveURL(/\/admin\/employees\/[a-z0-9]+\/edit/);

    // Form được pre-fill
    const codeInput = page.getByLabel("Mã nhân viên");
    const currentCode = await codeInput.inputValue();
    expect(currentCode.length).toBeGreaterThan(0);

    // Sửa chức vụ
    const positionInput = page.getByLabel("Chức vụ");
    await positionInput.clear();
    await positionInput.fill("Chức vụ đã cập nhật");

    await page.getByRole("button", { name: "Cập nhật" }).click();

    // Redirect về danh sách
    await expect(page).toHaveURL(/\/admin\/employees$/, { timeout: 5000 });
  });

  test("TC-111: Link quay lại hoạt động đúng", async ({ page }) => {
    await page.goto("/admin/employees/new");
    await page.getByRole("link", { name: "Quay lại danh sách" }).click();
    await expect(page).toHaveURL(/\/admin\/employees$/);
  });

  test("TC-112: Edge case — search không tìm thấy kết quả", async ({
    page,
  }) => {
    await page.goto("/admin/employees");

    await page
      .getByPlaceholder("Tìm theo tên, mã NV...")
      .fill("XXXXXXXXXNONEXISTENT");

    await expect(
      page.getByText("Không tìm thấy nhân viên nào")
    ).toBeVisible({ timeout: 3000 });
  });

  test("TC-113: EC — phone validation — SĐT không hợp lệ", async ({
    page,
  }) => {
    await page.goto("/admin/employees/new");

    await page.getByLabel("Mã nhân viên").fill(`NV-PHONE-${Date.now()}`);
    await page.getByLabel(/^Họ/).fill("Test");
    await page.getByLabel(/^Tên/).fill("Phone");
    await page.getByLabel("Email").fill("phone@test.vn");
    await page.getByLabel("Số điện thoại").fill("123"); // quá ngắn
    await page.getByLabel("Phòng ban").fill("Test");
    await page.getByLabel("Chức vụ").fill("Test");
    await page.getByLabel(/Lương giờ/).fill("10000");

    await page.getByRole("button", { name: "Tạo nhân viên" }).click();

    await expect(page.getByText(/SĐT không hợp lệ/)).toBeVisible({
      timeout: 3000,
    });
  });
});
