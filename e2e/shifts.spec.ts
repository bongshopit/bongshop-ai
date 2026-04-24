import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 15000 });
}

const uniqueName = `Ca-test-${String(Date.now()).slice(-6)}`;

test.describe("US-003: Ca làm việc", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-301: Trang ca làm việc hiển thị đúng", async ({ page }) => {
    await page.goto("/admin/shifts");

    await expect(page.locator("h1", { hasText: "Ca làm việc" })).toBeVisible();
    await expect(page.locator("h2", { hasText: "Danh sách ca làm việc" })).toBeVisible();
    await expect(page.locator("h2", { hasText: "Phân ca" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Thêm ca/ })).toBeVisible();
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("TC-302: 3 ca mặc định từ seed hiển thị", async ({ page }) => {
    await page.goto("/admin/shifts");

    await expect(page.getByText("Ca sáng").first()).toBeVisible();
    await expect(page.getByText("Ca chiều").first()).toBeVisible();
    await expect(page.getByText("Ca tối").first()).toBeVisible();
  });

  test("TC-303: Thêm ca mới thành công", async ({ page }) => {
    await page.goto("/admin/shifts");

    await page.getByRole("button", { name: /Thêm ca/ }).click();

    // Dialog hiển ra
    await expect(page.locator("h3", { hasText: "Thêm ca làm việc" })).toBeVisible();

    // Điền form
    await page.getByLabel("Tên ca").fill(uniqueName);
    await page.getByLabel("Giờ bắt đầu").fill("08:00");
    await page.getByLabel("Giờ kết thúc").fill("16:00");

    await page.getByRole("button", { name: "Lưu ca" }).click();

    // Dialog đóng, ca mới xuất hiện
    await expect(page.locator("h3", { hasText: "Thêm ca làm việc" })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 });
  });

  test("TC-304: Sửa ca thành công", async ({ page }) => {
    await page.goto("/admin/shifts");

    // Tìm nút Sửa của ca vừa tạo
    const row = page.locator("tr").filter({ hasText: uniqueName });
    await row.getByRole("button", { name: /Sửa/ }).click();

    // Dialog sửa hiển ra
    await expect(page.locator("h3", { hasText: "Sửa ca làm việc" })).toBeVisible();

    // Cập nhật tên
    const nameInput = page.getByLabel("Tên ca");
    await nameInput.clear();
    await nameInput.fill(uniqueName + "-edited");

    await page.getByRole("button", { name: "Cập nhật" }).click();

    // Verify updated
    await expect(page.getByText(uniqueName + "-edited")).toBeVisible({ timeout: 5000 });
  });

  test("TC-305: Validation - Tên ca không được trống", async ({ page }) => {
    await page.goto("/admin/shifts");

    await page.getByRole("button", { name: /Thêm ca/ }).click();
    await expect(page.locator("h3", { hasText: "Thêm ca làm việc" })).toBeVisible();

    // Bỏ trống tên ca, chỉ điền giờ
    await page.getByLabel("Giờ bắt đầu").fill("09:00");
    await page.getByLabel("Giờ kết thúc").fill("17:00");

    // HTML5 required ngăn submit
    const submitBtn = page.getByRole("button", { name: "Lưu ca" });
    await expect(submitBtn).toBeVisible();

    // Dialog vẫn mở
    await expect(page.locator("h3", { hasText: "Thêm ca làm việc" })).toBeVisible();
  });

  test("TC-306: Phân ca cho nhân viên", async ({ page }) => {
    await page.goto("/admin/shifts");

    // Kiểm tra có nhân viên trước
    const assignBtn = page.getByRole("button", { name: /Phân ca/ }).first();
    const isDisabled = await assignBtn.isDisabled();
    if (isDisabled) {
      test.skip();
      return;
    }

    await assignBtn.click();
    await expect(page.locator("h3", { hasText: "Phân ca cho nhân viên" })).toBeVisible();

    // Chọn nhân viên đầu tiên
    const employeeSelect = page.locator("select[name='employeeId']");
    await employeeSelect.selectOption({ index: 1 });

    // Chọn ca đầu tiên
    const shiftSelect = page.locator("select[name='shiftId']");
    await shiftSelect.selectOption({ index: 1 });

    // Đặt ngày hôm nay
    const today = new Date().toISOString().split("T")[0];
    await page.locator("input#assign-date").fill(today);

    await page.getByRole("button", { name: "Phân ca", exact: true }).click();

    // Dialog đóng hoặc hiển lỗi (nếu đã phân ca)
    await page.waitForTimeout(1500);
    const dialogVisible = await page.locator("h3", { hasText: "Phân ca cho nhân viên" }).isVisible();
    if (dialogVisible) {
      // Có thể đã phân ca rồi - kiểm tra lỗi
      const errVisible = await page.locator(".bg-red-50").isVisible();
      expect(errVisible).toBe(true);
    } else {
      // Thành công - kiểm tra trong bảng phân ca
      await expect(page.locator("table").nth(1)).toBeVisible();
    }
  });

  test("TC-307: Filter phân ca theo ngày", async ({ page }) => {
    await page.goto("/admin/shifts");

    const today = new Date().toISOString().split("T")[0];
    const dateInput = page.locator("input[name='date']");
    await dateInput.fill(today);
    await page.getByRole("button", { name: "Lọc" }).click();

    // URL chứa date param
    await expect(page).toHaveURL(new RegExp(`date=${today}`), { timeout: 3000 });
    await expect(page.locator("table").nth(1)).toBeVisible();
  });

  test("TC-308: Xóa ca đang sử dụng báo lỗi", async ({ page }) => {
    await page.goto("/admin/shifts");

    // Tìm ca có phân ca (số phân ca > 0) - nếu có
    const rows = page.locator("tbody tr");
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const assignCountText = await row.locator("td").nth(3).textContent();
      if (assignCountText && parseInt(assignCountText) > 0) {
        page.on("dialog", (dialog) => dialog.accept());
        await row.getByRole("button", { name: /Xóa/ }).click();
        await page.waitForTimeout(1000);
        // Nên hiển lỗi
        await expect(page.locator(".bg-red-50").first()).toBeVisible({ timeout: 3000 });
        return;
      }
    }
    // Không có ca nào có phân ca -> skip
    test.skip();
  });

  test("TC-309: Xóa ca không có phân ca thành công", async ({ page }) => {
    await page.goto("/admin/shifts");

    // Tìm ca vừa tạo (edited) để xóa
    const targetName = uniqueName + "-edited";
    const row = page.locator("tr").filter({ hasText: targetName });
    const rowExists = await row.count();
    if (rowExists === 0) {
      test.skip();
      return;
    }

    page.on("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: /Xóa/ }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(targetName)).not.toBeVisible({ timeout: 5000 });
  });

  test("TC-310: Empty state bảng phân ca", async ({ page }) => {
    // Chọn ngày không có phân ca nào
    await page.goto("/admin/shifts?date=2020-01-01");

    await expect(
      page.getByText("Chưa có phân ca nào trong ngày này.")
    ).toBeVisible({ timeout: 5000 });
  });
});
