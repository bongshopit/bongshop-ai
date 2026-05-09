import { test, expect } from "@playwright/test";

async function login(page) {
  await page.goto("/login");
  await page.locator("#email").fill("admin@bongshop.vn");
  await page.locator("#password").fill("bongshop");
  await page.locator("button[type='submit']").click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

const testCode = "NV-" + String(Date.now()).slice(-8);

test.describe("US-001: Quan ly nhan vien (optimize)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-101: Trang danh sach hien thi dung", async ({ page }) => {
    await page.goto("/admin/employees");
    await expect(page.locator("h1").last()).toBeVisible();
    await expect(page.locator("a[href='/admin/employees/new']")).toBeVisible();
    await expect(page.locator("input[type='search']").first()).toBeVisible();
    // No department/status filter selects
    await expect(page.locator("select[name='department']")).not.toBeVisible();
    await expect(page.locator("select[name='status']")).not.toBeVisible();
  });

  test("TC-102: Search nhan vien theo ten/ma", async ({ page }) => {
    await page.goto("/admin/employees");
    const searchInput = page.locator("input[type='search']").first();
    await searchInput.fill("Admin");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/q=Admin/);
  });

  test("TC-103: Trang them nhan vien co du field moi", async ({ page }) => {
    await page.goto("/admin/employees/new");
    await expect(page.locator("h1").last()).toBeVisible();
    await expect(page.locator("#employeeCode")).toBeVisible();
    await expect(page.locator("input[name='salaryType'][value='HOURLY']")).toBeVisible();
    await expect(page.locator("input[name='salaryType'][value='MONTHLY']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("TC-104: Tao nhan vien moi - luong theo gio thanh cong", async ({ page }) => {
    await page.goto("/admin/employees/new");
    await page.locator("#employeeCode").fill(testCode);
    await page.locator("#lastName").fill("Tran");
    await page.locator("#firstName").fill("Van Test");
    await page.locator("#email").fill(testCode + "@bongshop.vn");
    await page.locator("#phone").fill("0912345678");
    await page.locator("input[name='salaryType'][value='HOURLY']").check();
    await page.locator("#hourlyRate").fill("35000");
    await page.locator("button[type='submit']").click();
    await expect(page).toHaveURL(/\/admin\/employees$/, { timeout: 8000 });
    await expect(page.locator("table tbody")).toContainText(testCode);
  });

  test("TC-105: Danh sach hien loai luong dung", async ({ page }) => {
    await page.goto("/admin/employees");
    const tbody = page.locator("table tbody");
    await expect(tbody).toContainText(testCode);
  });

  test("TC-106: Validation - thieu field bat buoc khong submit", async ({ page }) => {
    await page.goto("/admin/employees/new");
    await page.locator("button[type='submit']").click();
    await expect(page).toHaveURL(/\/admin\/employees\/new/);
  });

  test("TC-107: Validation - ma NV trung hien loi", async ({ page }) => {
    await page.goto("/admin/employees/new");
    await page.locator("#employeeCode").fill(testCode);
    await page.locator("#lastName").fill("Test");
    await page.locator("#firstName").fill("Duplicate");
    await page.locator("#email").fill("dup@bongshop.vn");
    await page.locator("#phone").fill("0900000099");
    await page.locator("input[name='salaryType'][value='HOURLY']").check();
    await page.locator("#hourlyRate").fill("10000");
    await page.locator("button[type='submit']").click();
    await expect(page.locator("[data-error], .text-red-500, [role='alert']").first()).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/admin\/employees\/new/);
  });

  test("TC-108: Tao nhan vien - luong theo thang thanh cong", async ({ page }) => {
    const monthlyCode = "NV-M" + String(Date.now()).slice(-6);
    await page.goto("/admin/employees/new");
    await page.locator("#employeeCode").fill(monthlyCode);
    await page.locator("#lastName").fill("Nguyen");
    await page.locator("#firstName").fill("Thang Test");
    await page.locator("#email").fill(monthlyCode + "@bongshop.vn");
    await page.locator("#phone").fill("0978123456");
    await page.locator("input[name='salaryType'][value='MONTHLY']").check();
    await page.locator("#monthlySalary").fill("6000000");
    await page.locator("button[type='submit']").click();
    await expect(page).toHaveURL(/\/admin\/employees$/, { timeout: 8000 });
    const tbody = page.locator("table tbody");
    await expect(tbody).toContainText(monthlyCode);
  });

  test("TC-109: Xem chi tiet nhan vien", async ({ page }) => {
    await page.goto("/admin/employees");
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.locator("a").first().click();
    await expect(page).toHaveURL(/\/admin\/employees\//);
    await expect(page.locator("h1").last()).toBeVisible();
  });

  test("TC-110: Sua nhan vien thanh cong", async ({ page }) => {
    await page.goto("/admin/employees");
    const firstRow = page.locator("table tbody tr").first();
    const editLink = firstRow.locator("a[href*='/edit']");
    await editLink.click();
    await expect(page).toHaveURL(/\/admin\/employees\/[a-z0-9]+\/edit/);
    await expect(page.locator("input[name='salaryType'][value='HOURLY']")).toBeVisible();
    await expect(page.locator("input[name='salaryType'][value='MONTHLY']")).toBeVisible();
    await page.locator("button[type='submit']").click();
    await expect(page).toHaveURL(/\/admin\/employees$/, { timeout: 5000 });
  });
});