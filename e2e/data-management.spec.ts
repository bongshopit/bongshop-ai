import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#email").fill("admin@bongshop.vn");
  await page.locator("#password").fill("bongshop");
  await page.locator("button[type='submit']").click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

test.describe("US-018: Xóa tất cả dữ liệu hệ thống", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("TC-1801: Sidebar có link Cài đặt dẫn đến /admin/settings", async ({
    page,
  }) => {
    await page.goto("/admin");
    const settingsLink = page.getByRole("link", { name: "Cài đặt" }).first();
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/admin\/settings/);
  });

  test("TC-1802: Trang /admin/settings hiển thị đúng cho Admin", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await expect(
      page.getByRole("heading", { name: "Cài đặt hệ thống" })
    ).toBeVisible();
    await expect(page.getByText("Vùng nguy hiểm")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Xóa tất cả dữ liệu/ })
    ).toBeVisible();
  });

  test("TC-1803: Nút Xóa mở dialog xác nhận với đầy đủ thông tin", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: /Xóa tất cả dữ liệu/ }).click();

    // Dialog hiển thị
    await expect(
      page.getByText("Xóa tất cả dữ liệu hệ thống")
    ).toBeVisible();

    // Cảnh báo không thể hoàn tác
    await expect(page.getByText(/KHÔNG THỂ hoàn tác/)).toBeVisible();

    // Liệt kê dữ liệu bị xóa
    await expect(page.getByText(/Khách hàng, đơn hàng/)).toBeVisible();

    // Input xác nhận
    await expect(page.getByLabel(/Nhập/)).toBeVisible();

    // Nút xác nhận bị disabled khi chưa nhập
    await expect(
      page.getByRole("button", { name: "Xác nhận xóa" })
    ).toBeDisabled();
  });

  test("TC-1804: Nhập sai chuỗi xác nhận → nút vẫn disabled", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: /Xóa tất cả dữ liệu/ }).click();

    await page.getByLabel(/Nhập/).fill("xóa tất cả"); // sai (chữ thường)
    await expect(
      page.getByRole("button", { name: "Xác nhận xóa" })
    ).toBeDisabled();

    await page.getByLabel(/Nhập/).fill("XOA TAT CA"); // sai (thiếu dấu)
    await expect(
      page.getByRole("button", { name: "Xác nhận xóa" })
    ).toBeDisabled();
  });

  test("TC-1805: Nhập đúng chuỗi xác nhận → nút Xác nhận được kích hoạt", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: /Xóa tất cả dữ liệu/ }).click();

    await page.getByLabel(/Nhập/).fill("XÓA TẤT CẢ");
    await expect(
      page.getByRole("button", { name: "Xác nhận xóa" })
    ).toBeEnabled();
  });

  test("TC-1806: Nút Hủy đóng dialog và xóa nội dung input", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: /Xóa tất cả dữ liệu/ }).click();

    await page.getByLabel(/Nhập/).fill("XÓA TẤT CẢ");
    await page.getByRole("button", { name: "Hủy" }).click();

    // Dialog đóng
    await expect(
      page.getByRole("button", { name: "Xác nhận xóa" })
    ).not.toBeVisible();

    // Mở lại → input trống
    await page.getByRole("button", { name: /Xóa tất cả dữ liệu/ }).click();
    await expect(page.getByLabel(/Nhập/)).toHaveValue("");
  });

  test("TC-1807: Xóa thành công → redirect về dashboard", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: /Xóa tất cả dữ liệu/ }).click();

    await page.getByLabel(/Nhập/).fill("XÓA TẤT CẢ");
    await page.getByRole("button", { name: "Xác nhận xóa" }).click();

    // Chờ redirect về dashboard
    await page.waitForURL("**/admin", { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin$/);
  });
});
