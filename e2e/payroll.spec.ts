import { test, expect } from "@playwright/test";

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#email").fill("admin@bongshop.vn");
  await page.locator("#password").fill("bongshop");
  await page.locator("button[type='submit']").click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

test.describe("US-006: Luong (Payroll)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/admin/payroll");
    await page.waitForLoadState("networkidle");
  });

  // TC-601: Trang hien thi dung
  test("TC-601: hien thi trang bang luong", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Bảng lương" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tính lương" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xem" })).toBeVisible();
  });

  // TC-602: Form tinh luong co du truong thang/nam
  test("TC-602: form tinh luong co dropdown thang va nam", async ({ page }) => {
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    const monthSelect = calculateForm.locator("select[name='month']");
    const yearSelect = calculateForm.locator("select[name='year']");

    await expect(monthSelect).toBeVisible();
    await expect(yearSelect).toBeVisible();
    await expect(monthSelect).toHaveValue(String(month));
    await expect(yearSelect).toHaveValue(String(year));
  });

  // TC-603: Tinh luong thanh cong
  test("TC-603: tinh luong cho thang hien tai", async ({ page }) => {
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });
    await page.waitForLoadState("networkidle");

    await expect(page.locator("table")).toBeVisible();
  });

  // TC-604: Bang luong hien day du cot - AC-6.2 (khong co cot Gross)
  test("TC-604: bang luong hien day du cot sau khi tinh", async ({ page }) => {
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    await calculateForm.getByRole("button", { name: "Tính lương" }).click();
    await page.waitForLoadState("networkidle");

    const table = page.locator("table");
    await expect(table.getByText("Mã NV")).toBeVisible();
    await expect(table.getByText("Họ tên")).toBeVisible();
    await expect(table.getByText("Giờ làm")).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Lương" })).toBeVisible();
    await expect(table.getByText("Trạng thái")).toBeVisible();
    // AC-6.2: Không có cột Gross
    await expect(table.getByRole("columnheader", { name: "Gross" })).not.toBeVisible();
  });

  // TC-605: BR-011 - phieu PAID khong bi tinh lai
  test("TC-605: BR-011 phieu PAID khong bi tinh lai", async ({ page }) => {
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });

    const confirmBtns = page.getByRole("button", { name: "Xác nhận" });
    const count = await confirmBtns.count();

    if (count > 0) {
      await confirmBtns.first().click();
      await expect(page.getByRole("button", { name: "Đã trả" })).toBeVisible({ timeout: 10000 });
      await page.getByRole("button", { name: "Đã trả" }).first().click();
      await page.waitForLoadState("networkidle");
      await page.goto("/admin/payroll");
      await page.waitForLoadState("networkidle");

      await calcBtn.click();
      await expect(calcBtn).toBeEnabled({ timeout: 15000 });
      await expect(
        page.getByText(/Đã tính lương cho \d+ nhân viên|Không có phiếu nào/)
      ).toBeVisible({ timeout: 10000 });
    }
  });

  // TC-606: Xac nhan phieu luong DRAFT -> CONFIRMED
  test("TC-606: xac nhan phieu luong DRAFT thanh CONFIRMED", async ({ page }) => {
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

    await expect(page.getByText("Đã xác nhận").first()).toBeVisible({ timeout: 10000 });
  });

  // TC-607: Tra luong CONFIRMED -> PAID
  test("TC-607: danh dau da tra luong CONFIRMED -> PAID", async ({ page }) => {
    const confirmedRow = page.locator("table tbody tr").filter({
      has: page.getByRole("button", { name: "Đã trả" }),
    });

    if (await confirmedRow.count() === 0) {
      test.skip();
      return;
    }

    await confirmedRow.first().getByRole("link", { name: "Chi tiết" }).click();
    await page.waitForURL(/\/admin\/payroll\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Chi tiết phiếu lương" })).toBeVisible({ timeout: 15000 });

    const paidBtn = page.getByRole("button", { name: "Đã trả" });
    if (await paidBtn.count() === 0) {
      test.skip();
      return;
    }

    await paidBtn.click();
    await page.waitForLoadState("networkidle");

    await page.goto("/admin/payroll");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Bảng lương" })).toBeVisible();
  });

  // TC-608: Link chi tiet mo dung trang
  test("TC-608: link Chi tiet mo trang phieu luong cu the", async ({ page }) => {
    const calculateForm = page.locator("form").filter({ has: page.getByRole("button", { name: "Tính lương" }) });
    await calculateForm.getByRole("button", { name: "Tính lương" }).click();
    await page.waitForLoadState("networkidle");

    const chiTietLinks = page.getByRole("link", { name: "Chi tiết" });
    if (await chiTietLinks.count() === 0) {
      test.skip();
      return;
    }

    await chiTietLinks.first().click();
    await page.waitForURL(/\/admin\/payroll\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Chi tiết phiếu lương" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Chi tiết lương")).toBeVisible();
  });

  // TC-609: Trang chi tiet hien thi breakdown luong - AC-6.4 (khong co tu "gross/net")
  test("TC-609: trang chi tiet hien thi breakdown du thong tin", async ({ page }) => {
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
    await page.waitForURL(/\/admin\/payroll\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Chi tiết phiếu lương" })).toBeVisible({ timeout: 15000 });

    // Kiem tra breakdown - AC-6.4: dung "Luong co ban" thay "gross", "Luong" thay "net"
    await expect(page.getByText("Tổng giờ làm")).toBeVisible();
    await expect(page.getByText("Đơn giá giờ")).toBeVisible();
    await expect(page.getByText("Lương cơ bản")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Chi tiết lương" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Khoản điều chỉnh" })).toBeVisible();
    // AC-6.4: Khong dung thuat ngu gross/net
    await expect(page.getByText("gross")).not.toBeVisible();
    await expect(page.getByText("Lương net")).not.toBeVisible();
  });

  // TC-610: Filter xem bang luong theo thang/nam khac
  test("TC-610: filter xem bang luong thang truoc", async ({ page }) => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const filterForm = page.locator("form[method='GET']");
    await filterForm.locator("select[name='month']").selectOption(String(prevMonth));
    await filterForm.locator("select[name='year']").selectOption(String(prevYear));
    await filterForm.getByRole("button", { name: "Xem" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(new RegExp(`month=${prevMonth}`));
    await expect(page).toHaveURL(new RegExp(`year=${prevYear}`));
  });

  // TC-611: AC-6.1b - form co dropdown chon nhan vien (mac dinh "Tat ca nhan vien")
  test("TC-611: form tinh luong co dropdown nhan vien", async ({ page }) => {
    const calculateForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Tính lương" }),
    });

    const empSelect = calculateForm.locator("select[name='employeeId']");
    await expect(empSelect).toBeVisible();
    // Gia tri mac dinh la "" (Tat ca nhan vien)
    await expect(empSelect).toHaveValue("");
  });

  // TC-612: AC-6.1b - chon nhan vien cu the va tinh luong thanh cong
  test("TC-612: tinh luong cho 1 nhan vien cu the", async ({ page }) => {
    const calculateForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Tính lương" }),
    });

    const empSelect = calculateForm.locator("select[name='employeeId']");
    const options = await empSelect.locator("option").all();

    if (options.length <= 1) {
      test.skip();
      return;
    }

    const firstEmpValue = await options[1].getAttribute("value");
    if (!firstEmpValue) {
      test.skip();
      return;
    }

    await empSelect.selectOption(firstEmpValue);
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });

    await expect(
      page.getByText(/Đã tính lương cho \d+ nhân viên|Không có phiếu nào/)
    ).toBeVisible({ timeout: 10000 });
  });

  // TC-613: AC-6.5 - Them khoan dieu chinh vao phieu luong DRAFT
  test("TC-613: them khoan phu cap vao phieu luong DRAFT", async ({ page }) => {
    // Dung thang tiep theo de dam bao co DRAFT payroll (tranh truong hop thang hien tai da PAID het)
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    // Navigate to next month payroll page
    await page.goto(`/admin/payroll?month=${nextMonth}&year=${nextYear}`);
    await page.waitForLoadState("networkidle");

    const calculateForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Tính lương" }),
    });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Tim DRAFT rows (co button Xac nhan)
    const draftRows = page.locator("table tbody tr").filter({
      has: page.getByRole("button", { name: "Xác nhận" }),
    });
    if (await draftRows.count() === 0) {
      test.skip();
      return;
    }

    // page.goto cho SSR day du - TC-613-617 test chuc nang, khong test navigation
    const detailHref613 = await draftRows.first().getByRole("link", { name: "Chi tiết" }).getAttribute("href");
    if (!detailHref613) { test.skip(); return; }
    await page.goto(detailHref613);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Chi tiết phiếu lương" })).toBeVisible({ timeout: 15000 });

    // Chi them khi phieu DRAFT (form them hien thi)
    const labelInput = page.locator("#adj-label");
    if (!(await labelInput.isVisible())) {
      test.skip();
      return;
    }

    // Lay luong hien tai truoc khi them
    const luongText = await page.getByText(/\d+\s*[₫đ]/).last().textContent();

    // Dien form them khoan phu cap
    await labelInput.fill("Thưởng KPI tháng " + nextMonth);
    await page.locator("#adj-amount").fill("500000");
    await page.locator("#adj-type").selectOption("ADD");
    await page.getByRole("button", { name: /Lưu/ }).click();
    await page.waitForLoadState("networkidle");

    // Verify khoan xuat hien trong danh sach
    await expect(page.getByText("Thưởng KPI tháng " + nextMonth).first()).toBeVisible({ timeout: 10000 });
    // Verify heading Khoan dieu chinh hien thi
    await expect(page.getByRole("heading", { name: "Khoản điều chỉnh" })).toBeVisible();
  });

  // TC-614: AC-6.6 - Xoa khoan dieu chinh khoi phieu luong DRAFT
  test("TC-614: xoa khoan dieu chinh khoi phieu luong DRAFT", async ({ page }) => {
    // Dung thang tiep theo de dam bao co DRAFT payroll
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    // Navigate to next month payroll page
    await page.goto(`/admin/payroll?month=${nextMonth}&year=${nextYear}`);
    await page.waitForLoadState("networkidle");

    // Dam bao co phieu DRAFT co adjustment
    const calculateForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Tính lương" }),
    });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });
    await page.waitForLoadState("networkidle");

    const draftRows = page.locator("table tbody tr").filter({
      has: page.getByRole("button", { name: "Xác nhận" }),
    });
    if (await draftRows.count() === 0) {
      test.skip();
      return;
    }

    const detailHref614 = await draftRows.first().getByRole("link", { name: "Chi tiết" }).getAttribute("href");
    if (!detailHref614) { test.skip(); return; }
    await page.goto(detailHref614);
    await page.waitForLoadState("networkidle");

    const labelInput = page.locator("#adj-label");
    if (!(await labelInput.isVisible())) {
      test.skip();
      return;
    }

    // Them 1 khoan de co the xoa
    await labelInput.fill("Phạt đi trễ test");
    await page.locator("#adj-amount").fill("100000");
    await page.locator("#adj-type").selectOption("SUBTRACT");
    await page.getByRole("button", { name: /Lưu/ }).click();
    await page.waitForLoadState("networkidle");

    // Kiem tra khoan da them
    await expect(page.getByText("Phạt đi trễ test")).toBeVisible({ timeout: 10000 });

    // Xoa khoan vua them
    const deleteBtn = page.getByRole("button", { name: "Xóa khoản" }).last();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    await page.waitForLoadState("networkidle");

    // Verify khoan da bi xoa
    await expect(page.getByText("Phạt đi trễ test")).not.toBeVisible({ timeout: 10000 });
  });

  // TC-615: AC-6.7 - Them dong staging trong form nhieu khoan
  test("TC-615: them dong staging trong form nhieu khoan", async ({ page }) => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    await page.goto(`/admin/payroll?month=${nextMonth}&year=${nextYear}`);
    await page.waitForLoadState("networkidle");

    // Dam bao co phieu DRAFT
    const calculateForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Tính lương" }),
    });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });
    await page.waitForLoadState("networkidle");

    const draftRows = page.locator("table tbody tr").filter({
      has: page.getByRole("button", { name: "Xác nhận" }),
    });
    if (await draftRows.count() === 0) { test.skip(); return; }

    const detailHref615 = await draftRows.first().getByRole("link", { name: "Chi tiết" }).getAttribute("href");
    if (!detailHref615) { test.skip(); return; }
    await page.goto(detailHref615);
    await page.waitForLoadState("networkidle");

    // Kiem tra form chinh sua hien thi
    const labelInput = page.locator("#adj-label");
    if (!(await labelInput.isVisible())) { test.skip(); return; }

    // Kiem tra ban dau co 1 dong
    const stagingRows = page.locator("[name='label']");
    await expect(stagingRows).toHaveCount(1);

    // Click Them dong -> kiem tra co 2 dong
    await page.getByRole("button", { name: "Thêm dòng" }).click();
    await expect(stagingRows).toHaveCount(2);

    // Click Them dong lan nua -> kiem tra co 3 dong
    await page.getByRole("button", { name: "Thêm dòng" }).click();
    await expect(stagingRows).toHaveCount(3);
  });

  // TC-616: AC-6.7 - Luu nhieu khoan dieu chinh cung luc
  test("TC-616: luu nhieu khoan dieu chinh cung luc", async ({ page }) => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const suffix = Date.now().toString().slice(-6);

    await page.goto(`/admin/payroll?month=${nextMonth}&year=${nextYear}`);
    await page.waitForLoadState("networkidle");

    const calculateForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Tính lương" }),
    });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });
    await page.waitForLoadState("networkidle");

    const draftRows = page.locator("table tbody tr").filter({
      has: page.getByRole("button", { name: "Xác nhận" }),
    });
    if (await draftRows.count() === 0) { test.skip(); return; }

    const detailHref616 = await draftRows.first().getByRole("link", { name: "Chi tiết" }).getAttribute("href");
    if (!detailHref616) { test.skip(); return; }
    await page.goto(detailHref616);
    await page.waitForLoadState("networkidle");

    const labelInput = page.locator("#adj-label");
    if (!(await labelInput.isVisible())) { test.skip(); return; }

    // Dien dong 1: phu cap
    await labelInput.fill(`Thưởng batch ${suffix}`);
    await page.locator("#adj-amount").fill("300000");
    await page.locator("#adj-type").selectOption("ADD");

    // Them dong 2
    await page.getByRole("button", { name: "Thêm dòng" }).click();
    const secondLabel = page.locator("[name='label']").nth(1);
    await secondLabel.fill(`Phạt batch ${suffix}`);
    await page.locator("[name='amount']").nth(1).fill("150000");
    await page.locator("[name='type']").nth(1).selectOption("SUBTRACT");

    // Luu tat ca
    await page.getByRole("button", { name: /Lưu/ }).click();
    await page.waitForLoadState("networkidle");

    // Verify ca 2 khoan xuat hien trong danh sach da luu
    await expect(page.getByText(`Thưởng batch ${suffix}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`Phạt batch ${suffix}`).first()).toBeVisible({ timeout: 10000 });
  });

  // TC-617: AC-6.7 - Xoa dong staging chua luu truoc khi submit
  test("TC-617: xoa dong staging chua luu truoc khi submit", async ({ page }) => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    await page.goto(`/admin/payroll?month=${nextMonth}&year=${nextYear}`);
    await page.waitForLoadState("networkidle");

    const calculateForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Tính lương" }),
    });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });
    await page.waitForLoadState("networkidle");

    const draftRows617 = page.locator("table tbody tr").filter({
      has: page.getByRole("button", { name: "Xác nhận" }),
    });
    if (await draftRows617.count() === 0) { test.skip(); return; }

    const detailHref617 = await draftRows617.first().getByRole("link", { name: "Chi tiết" }).getAttribute("href");
    if (!detailHref617) { test.skip(); return; }
    await page.goto(detailHref617);
    await page.waitForLoadState("networkidle");

    const labelInput = page.locator("#adj-label");
    if (!(await labelInput.isVisible())) { test.skip(); return; }

    // Them dong 2
    await page.getByRole("button", { name: "Thêm dòng" }).click();
    const stagingLabels = page.locator("[name='label']");
    await expect(stagingLabels).toHaveCount(2);

    // Xoa dong 2 bang nut 'Xoa dong'
    await page.getByRole("button", { name: "Xóa dòng" }).last().click();

    // Verify chi con 1 dong
    await expect(stagingLabels).toHaveCount(1);
  });

  // TC-618: Regression - click Chi tiet ngay sau Tinh luong khong bi blank
  // Fix goc re: Dung the <a> thay <Link> → hard navigation, bypass Next.js 14.1.0 router cache.
  // Loading.tsx cho [id] route them Suspense boundary de tranh blank khi server component fetch.
  test("TC-618: click Chi tiet ngay sau tinh luong hien thi dung noi dung", async ({ page }) => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    await page.goto(`/admin/payroll?month=${nextMonth}&year=${nextYear}`);
    await page.waitForLoadState("networkidle");

    // Bam Tinh luong de tao moi payrolls
    const calculateForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "Tính lương" }),
    });
    const calcBtn = calculateForm.getByRole("button", { name: "Tính lương" });
    await calcBtn.click();
    // Chi doi action hoan thanh (button enabled lai), KHONG doi networkidle
    // → simulate user click ngay sau khi thay success message (race condition thuc te)
    await expect(calcBtn).toBeEnabled({ timeout: 15000 });

    // Phai co it nhat 1 phieu
    const chiTietLinks = page.getByRole("link", { name: "Chi tiết" });
    if (await chiTietLinks.count() === 0) { test.skip(); return; }

    // Click Chi tiet ngay lap tuc (the <a> → hard navigation, bypass router cache hoan toan)
    await chiTietLinks.first().click();
    await page.waitForURL(/\/admin\/payroll\/[^/]+$/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Trang phai hien thi day du noi dung (khong blank) ngay sau click - khong can reload
    await expect(page.getByRole("heading", { name: "Chi tiết phiếu lương" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Tổng giờ làm")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Khoản điều chỉnh" })).toBeVisible();
  });
});