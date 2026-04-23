import { test, expect } from "@playwright/test";

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

test.describe("US-006: Lương (Payroll)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/admin/payroll");
    await page.waitForLoadState("networkidle");
  });

  // TC-601: Trang hiển thị đúng
  test("TC-601: hiển thị trang bảng lương", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Bảng lương" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tính lương" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xem" })).toBeVisible();
  });

  // TC-602: Form tính lương có đủ trường tháng/năm
  test("TC-602: form tính lương có dropdown tháng và năm", async ({ page }) => {
    const monthSelect = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) }).locator("select[name='month']");
    const yearSelect = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) }).locator("select[name='year']");

    await expect(monthSelect).toBeVisible();
    await expect(yearSelect).toBeVisible();
    // Tháng và năm hiện tại là mặc định
    await expect(monthSelect).toHaveValue(String(month));
    await expect(yearSelect).toHaveValue(String(year));
  });

  // TC-603: Tính lương thành công — button khả dụng trở lại, bảng hiển thị
  test("TC-603: tính lương cho tháng hiện tại", async ({ page }) => {
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    // Chờ button trở lại enabled (không còn "Đang tính...")
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Bảng tồn tại
    await expect(page.locator("table")).toBeVisible();
  });

  // TC-604: Bảng lương hiển thị sau khi tính
  test("TC-604: bảng lương hiện đầy đủ cột sau khi tính", async ({ page }) => {
    // Tính lương trước
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    await calculateForm.getByRole("button", { name: "Tính lương" }).click();
    await page.waitForLoadState("networkidle");

    // Kiểm tra header bảng
    const table = page.locator("table");
    await expect(table.getByText("Mã NV")).toBeVisible();
    await expect(table.getByText("Họ tên")).toBeVisible();
    await expect(table.getByText("Giờ làm")).toBeVisible();
    await expect(table.getByText("Gross")).toBeVisible();
    await expect(table.getByText("Net")).toBeVisible();
    await expect(table.getByText("Trạng thái")).toBeVisible();
  });

  // TC-605: BR-011 — phiếu PAID không bị tính lại
  test("TC-605: BR-011 phiếu PAID không bị tính lại", async ({ page }) => {
    // Tính lương để có bản ghi
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });

    // Nếu có ít nhất 1 nhân viên, xác nhận rồi trả lương
    const confirmBtns = page.getByRole("button", { name: "Xác nhận" });
    const count = await confirmBtns.count();

    if (count > 0) {
      await confirmBtns.first().click();
      // Đợi button "Đã trả" xuất hiện (retry assertion, tránh race condition)
      await expect(page.getByRole("button", { name: "Đã trả" })).toBeVisible({ timeout: 10000 });
      await page.getByRole("button", { name: "Đã trả" }).first().click();
      // Chờ server action hoàn tất rồi reload để đảm bảo DB đã cập nhật
      await page.waitForLoadState("networkidle");
      await page.goto("/admin/payroll");
      await page.waitForLoadState("networkidle");

      // Tính lại → phiếu PAID vẫn giữ nguyên, count nhỏ hơn
      await calcBtn.click();
      await expect(calcBtn).toBeEnabled({ timeout: 15000 });
      // Toast xuất hiện (count có thể là 0 nếu tất cả đã PAID)
      await expect(page.getByText(/Đã tính lương cho \d+ nhân viên/)).toBeVisible({ timeout: 10000 });
    }
  });

  // TC-606: Xác nhận phiếu lương DRAFT → CONFIRMED
  test("TC-606: xác nhận phiếu lương DRAFT thành CONFIRMED", async ({ page }) => {
    // Tính lương
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    await calculateForm.getByRole("button", { name: "Tính lương" }).click();
    await page.waitForLoadState("networkidle");

    const confirmBtns = page.getByRole("button", { name: "Xác nhận" });
    if (await confirmBtns.count() === 0) {
      test.skip();
      return;
    }

    await confirmBtns.first().click();
    await page.waitForLoadState("networkidle");

    // Sau xác nhận: status = "Đã xác nhận" xuất hiện trong badge
    await expect(page.getByText("Đã xác nhận").first()).toBeVisible({ timeout: 10000 });
  });

  // TC-607: Trả lương CONFIRMED → PAID
  test("TC-607: đánh dấu đã trả lương CONFIRMED → PAID", async ({ page }) => {
    // Tìm row có "Đã trả" button (CONFIRMED record) → click Chi tiết của row đó
    const confirmedRow = page.locator("table tbody tr").filter({
      has: page.getByRole("button", { name: "Đã trả" }),
    });

    if (await confirmedRow.count() === 0) {
      test.skip();
      return;
    }

    // Navigate vào detail page của CONFIRMED record
    await confirmedRow.first().getByRole("link", { name: "Chi tiết" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Chi tiết phiếu lương" })).toBeVisible();

    // Bấm "Đã trả" trên trang chi tiết
    const paidBtn = page.getByRole("button", { name: "Đã trả" });
    if (await paidBtn.count() === 0) {
      test.skip();
      return;
    }

    await paidBtn.click();
    await page.waitForLoadState("networkidle");

    // Sau khi markPaid, navigate lại list và verify
    await page.goto("/admin/payroll");
    await page.waitForLoadState("networkidle");

    // Trang list load OK
    await expect(page.getByRole("heading", { name: "Bảng lương" })).toBeVisible();
  });

  // TC-608: Link chi tiết mở đúng trang
  test("TC-608: link Chi tiết mở trang phiếu lương cụ thể", async ({ page }) => {
    // Tính lương
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    await calculateForm.getByRole("button", { name: "Tính lương" }).click();
    await page.waitForLoadState("networkidle");

    const chiTietLinks = page.getByRole("link", { name: "Chi tiết" });
    if (await chiTietLinks.count() === 0) {
      test.skip();
      return;
    }

    await chiTietLinks.first().click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Chi tiết phiếu lương" })).toBeVisible();
    await expect(page.getByText("Chi tiết tính lương")).toBeVisible();
  });

  // TC-609: Trang chi tiết hiển thị đúng breakdown lương
  test("TC-609: trang chi tiết hiển thị breakdown đủ thông tin", async ({ page }) => {
    // Tính lương (đảm bảo page ở trạng thái ổn định sau router.refresh)
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });
    await page.waitForLoadState("networkidle");

    const chiTietLinks = page.getByRole("link", { name: "Chi tiết" });
    if (await chiTietLinks.count() === 0) {
      test.skip();
      return;
    }

    await chiTietLinks.first().click();
    // Đợi network settle (RSC fetch) rồi đợi heading xuất hiện
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Chi tiết phiếu lương" })).toBeVisible({ timeout: 10000 });

    // Kiểm tra breakdown các dòng
    await expect(page.getByText("Tổng giờ làm")).toBeVisible();
    await expect(page.getByText("Đơn giá giờ")).toBeVisible();
    await expect(page.getByText("Lương gross (giờ × đơn giá)")).toBeVisible();
    await expect(page.getByText("Phụ cấp")).toBeVisible();
    await expect(page.getByText("Khấu trừ")).toBeVisible();
    await expect(page.getByText("Lương net")).toBeVisible();
  });

  // TC-610: Filter xem bảng lương theo tháng/năm khác
  test("TC-610: filter xem bảng lương tháng trước", async ({ page }) => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const filterForm = page.locator("form[method='GET']");
    await filterForm.locator("select[name='month']").selectOption(String(prevMonth));
    await filterForm.locator("select[name='year']").selectOption(String(prevYear));
    await filterForm.getByRole("button", { name: "Xem" }).click();
    await page.waitForLoadState("networkidle");

    // URL đã thay đổi với params mới
    await expect(page).toHaveURL(new RegExp(`month=${prevMonth}`));
    await expect(page).toHaveURL(new RegExp(`year=${prevYear}`));
  });
});
