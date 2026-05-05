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

  // TC-708: Tổng số khách hàng hiển thị trên trang danh sách
  test("TC-708: Tổng số khách hàng hiển thị", async ({ page }) => {
    await page.goto("/admin/customers");
    // Tổng khách phải hiển thị (số ≥ 0)
    await expect(page.locator("text=/Tổng khách/")).toBeVisible();
    // Phải có số kèm theo
    const totalText = await page.locator("text=/Tổng khách/").textContent();
    expect(totalText).toMatch(/\d/);
  });

  // TC-709: Pagination trang 2 không có "undefined" trong URL
  test("TC-709: Pagination không sinh URL chứa 'undefined'", async ({ page }) => {
    await page.goto("/admin/customers");
    // Chỉ kiểm tra được nếu có đủ data để hiện pagination
    // Kiểm tra bằng search: không set q → URL phải không có "undefined"
    await page.goto("/admin/customers?page=1");
    const url = page.url();
    expect(url).not.toContain("undefined");

    // Nếu có pagination, click sang trang 2 và kiểm tra URL
    const nextBtn = page.locator("nav[aria-label='Phân trang'] a", { hasText: "2" }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForURL(/page=2/, { timeout: 5000 });
      expect(page.url()).not.toContain("undefined");
    }
  });

  // TC-710: Duplicate check bằng tên (không có SĐT)
  test("TC-710: Thêm KH không SĐT trùng tên → báo lỗi", async ({ page }) => {
    const noPhoneName = `NoPhone-${ts}`;

    // Tạo KH đầu tiên không có SĐT
    await page.goto("/admin/customers/new");
    await page.getByLabel("Tên khách hàng").fill(noPhoneName);
    await page.getByRole("button", { name: "Lưu" }).click();
    await page.waitForURL("**/admin/customers", { timeout: 10000 });

    // Thêm KH thứ 2 cùng tên, không SĐT → phải báo lỗi
    await page.goto("/admin/customers/new");
    await page.getByLabel("Tên khách hàng").fill(noPhoneName);
    await page.getByRole("button", { name: "Lưu" }).click();

    await expect(
      page.locator("text=Khách hàng với tên này đã tồn tại")
    ).toBeVisible({ timeout: 5000 });
  });

  test("TC-711: Xóa tất cả khách hàng — confirmation nhập XÓA", async ({ page }) => {
    await page.goto("/admin/customers");

    // Nút "Xóa tất cả" hiển thị trên header
    const deleteAllBtn = page.getByRole("button", { name: /Xóa tất cả/ });
    await expect(deleteAllBtn).toBeVisible();

    // Click → dialog mở
    await deleteAllBtn.click();
    await expect(page.getByRole("heading", { name: "Xóa tất cả khách hàng", exact: true })).toBeVisible();

    // Nút submit trong dialog bị disabled khi chưa nhập
    const submitBtn = page.locator("form").getByRole("button", { name: "Xóa tất cả", exact: true });
    await expect(submitBtn).toBeDisabled();

    // Nhập sai → vẫn disabled
    await page.getByPlaceholder("XÓA").fill("xoa");
    await expect(submitBtn).toBeDisabled();

    // Nhập đúng → enabled
    await page.getByPlaceholder("XÓA").fill("XÓA");
    await expect(submitBtn).toBeEnabled();

    // Hủy → dialog đóng, không xóa
    await page.getByRole("button", { name: "Hủy" }).click();
    await expect(page.getByRole("heading", { name: "Xóa tất cả khách hàng", exact: true })).not.toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });
});

test.describe("US-016: Gửi hàng khách hàng", () => {
  test.describe.configure({ mode: "serial" });

  const storageTs = Date.now().toString().slice(-8);
  const storagePhone = `08${storageTs.padStart(8, "0")}`.slice(0, 10);
  const storageName = `StorageKH-${storageTs}`;
  let customerUrl = "";

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-1601: Setup - Tạo KH và kiểm tra section Gửi hàng", async ({ page }) => {
    // Tạo KH mới
    await page.goto("/admin/customers/new");
    await page.getByLabel("Tên khách hàng").fill(storageName);
    await page.getByLabel("Số điện thoại").fill(storagePhone);
    await page.getByRole("button", { name: "Lưu" }).click();
    await page.waitForURL("**/admin/customers", { timeout: 10000 });

    // Vào trang chi tiết
    const row = page.locator("table tbody tr", { hasText: storageName });
    await expect(row).toBeVisible();
    await row.getByRole("link", { name: "Xem" }).click();
    await page.waitForURL("**/admin/customers/**", { timeout: 8000 });

    customerUrl = page.url();

    // Section "Gửi hàng" phải hiển thị
    await expect(page.getByRole("heading", { name: "Gửi hàng", exact: true })).toBeVisible();
    // Nút tạo phiếu phải hiển thị với ADMIN
    await expect(page.getByRole("button", { name: /Tạo phiếu gửi hàng/ })).toBeVisible();
  });

  test("TC-1602: Tạo phiếu gửi hàng với 2 sản phẩm → phiếu OPEN xuất hiện", async ({ page }) => {
    await page.goto(customerUrl);

    await page.getByRole("button", { name: /Tạo phiếu gửi hàng/ }).click();
    await expect(page.getByRole("heading", { name: "Tạo phiếu gửi hàng", exact: true })).toBeVisible();

    // Nhập ghi chú
    await page.getByPlaceholder("VD: Khách đã thanh toán, chờ mang về").fill("Test phiếu e2e");

    // Nhập sản phẩm đầu tiên
    const nameInputs = page.getByPlaceholder("Tên hàng *");
    await nameInputs.first().fill("Áo thun trắng");

    // Thêm dòng thứ 2
    await page.getByText("Thêm dòng").click();
    await nameInputs.nth(1).fill("Quần jean xanh");

    // Submit
    await page.getByRole("button", { name: "Tạo phiếu", exact: true }).click();

    // Toast success
    await expect(
      page.locator("[data-sonner-toast]", { hasText: /Đã tạo phiếu gửi hàng/ })
    ).toBeVisible({ timeout: 10000 });

    // Phiếu OPEN xuất hiện
    await expect(page.locator("text=Đang gửi")).toBeVisible({ timeout: 5000 });
  });

  test("TC-1604: Lấy hàng một phần → còn lại giảm, phiếu vẫn OPEN", async ({ page }) => {
    await page.goto(customerUrl);

    // Click "Lấy hàng" cho sản phẩm đầu tiên
    const takeBtn = page.getByRole("button", { name: "Lấy hàng" }).first();
    await expect(takeBtn).toBeVisible({ timeout: 5000 });
    await takeBtn.click();

    await expect(page.getByRole("heading", { name: "Ghi nhận lấy hàng", exact: true })).toBeVisible();
    // Nhập qty = 1 (lấy một phần)
    const qtyInput = page.locator("input[type='number']").last();
    await qtyInput.fill("1");
    await page.getByRole("button", { name: "Xác nhận" }).click();

    await expect(
      page.locator("[data-sonner-toast]", { hasText: /Đã ghi nhận lấy hàng/ })
    ).toBeVisible({ timeout: 10000 });

    // Phiếu vẫn OPEN (vì còn sản phẩm khác)
    await expect(page.locator("text=Đang gửi")).toBeVisible();
  });

  test("TC-1605: Đóng phiếu thủ công → trạng thái Hoàn tất", async ({ page }) => {
    await page.goto(customerUrl);

    // Đóng phiếu
    const closeBtn = page.getByRole("button", { name: "Đóng phiếu" }).first();
    await expect(closeBtn).toBeVisible({ timeout: 5000 });
    await closeBtn.click();

    // Toast success và trạng thái CLOSED
    await expect(
      page.locator("[data-sonner-toast]", { hasText: /Đã đóng phiếu/ })
    ).toBeVisible({ timeout: 10000 });

    // Badge "Hoàn tất" xuất hiện
    await expect(page.locator("text=Hoàn tất").first()).toBeVisible({ timeout: 5000 });
  });

  test("TC-1603: Lấy hết hàng → phiếu tự động CLOSED", async ({ page }) => {
    await page.goto(customerUrl);

    // Tạo phiếu mới với 1 sản phẩm, số lượng 1
    await page.getByRole("button", { name: /Tạo phiếu gửi hàng/ }).click();
    const nameInputs = page.getByPlaceholder("Tên hàng *");
    await nameInputs.first().fill("Sản phẩm lấy hết");
    // Đặt SL = 1
    const qtyInputs = page.getByPlaceholder("SL");
    await qtyInputs.first().fill("1");
    await page.getByRole("button", { name: "Tạo phiếu", exact: true }).click();
    await expect(
      page.locator("[data-sonner-toast]", { hasText: /Đã tạo phiếu/ })
    ).toBeVisible({ timeout: 10000 });

    // Lấy hết (qty = 1 = toàn bộ)
    const takeBtns = page.getByRole("button", { name: "Lấy hàng" });
    await expect(takeBtns.first()).toBeVisible({ timeout: 5000 });
    await takeBtns.first().click();

    await expect(page.getByRole("heading", { name: "Ghi nhận lấy hàng", exact: true })).toBeVisible();
    // Số lượng đã pre-fill = còn lại = 1 → không cần sửa
    await page.getByRole("button", { name: "Xác nhận" }).click();

    await expect(
      page.locator("[data-sonner-toast]", { hasText: /Đã ghi nhận lấy hàng/ })
    ).toBeVisible({ timeout: 10000 });

    // Phiếu phải tự CLOSED (badge Hoàn tất xuất hiện)
    await expect(page.locator("text=Hoàn tất").first()).toBeVisible({ timeout: 8000 });
  });

  test("TC-1606: Xóa tất cả phiếu gửi hàng — confirmation nhập XÓA", async ({ page }) => {
    await page.goto(customerUrl);

    // Nút "Xóa tất cả" phải hiển thị (có phiếu từ TC-1602/TC-1603)
    const deleteAllBtn = page.getByRole("button", { name: /Xóa tất cả/ });
    await expect(deleteAllBtn).toBeVisible({ timeout: 5000 });

    // Click → dialog mở
    await deleteAllBtn.click();
    await expect(page.getByRole("heading", { name: "Xóa tất cả phiếu gửi hàng", exact: true })).toBeVisible();

    // Nút "Xóa tất cả" trong dialog bị disabled khi chưa nhập
    const submitBtn = page.locator("form").getByRole("button", { name: "Xóa tất cả", exact: true });
    await expect(submitBtn).toBeDisabled();

    // Nhập sai → vẫn disabled
    await page.getByPlaceholder("XÓA").fill("xoa");
    await expect(submitBtn).toBeDisabled();

    // Nhập đúng → enabled
    await page.getByPlaceholder("XÓA").fill("XÓA");
    await expect(submitBtn).toBeEnabled();

    // Submit
    await submitBtn.click();

    // Toast thành công
    await expect(
      page.locator("[data-sonner-toast]", { hasText: /Đã xóa toàn bộ phiếu gửi hàng/ })
    ).toBeVisible({ timeout: 10000 });

    // Không còn phiếu nào
    await expect(page.getByText("Chưa có phiếu gửi hàng nào")).toBeVisible({ timeout: 5000 });

    // Nút "Xóa tất cả" biến mất (không còn phiếu)
    await expect(deleteAllBtn).not.toBeVisible();
  });
});
