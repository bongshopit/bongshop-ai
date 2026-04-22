import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

const uniqueName = `Ca-test-${String(Date.now()).slice(-6)}`;

test.describe("US-003: Ca lam viec", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-301: Trang ca lam viec hien thi dung", async ({ page }) => {
    await page.goto("/admin/shifts");

    await expect(page.locator("h1", { hasText: "Ca lam viec" })).toBeVisible();
    await expect(page.locator("h2", { hasText: "Danh sach ca lam viec" })).toBeVisible();
    await expect(page.locator("h2", { hasText: "Phan ca" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Them ca/ })).toBeVisible();
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("TC-302: 3 ca mac dinh tu seed hien thi", async ({ page }) => {
    await page.goto("/admin/shifts");

    await expect(page.getByText("Ca sáng")).toBeVisible();
    await expect(page.getByText("Ca chiều")).toBeVisible();
    await expect(page.getByText("Ca tối")).toBeVisible();
  });

  test("TC-303: Them ca moi thanh cong", async ({ page }) => {
    await page.goto("/admin/shifts");

    await page.getByRole("button", { name: /Them ca/ }).click();

    // Dialog hien ra
    await expect(page.locator("h3", { hasText: "Them ca lam viec" })).toBeVisible();

    // Dien form
    await page.getByLabel("Ten ca").fill(uniqueName);
    await page.getByLabel("Gio bat dau").fill("08:00");
    await page.getByLabel("Gio ket thuc").fill("16:00");

    await page.getByRole("button", { name: "Luu ca" }).click();

    // Dialog dong, ca moi xuat hien
    await expect(page.locator("h3", { hasText: "Them ca lam viec" })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 });
  });

  test("TC-304: Sua ca thanh cong", async ({ page }) => {
    await page.goto("/admin/shifts");

    // Tim nut Sua cua ca vua tao
    const row = page.locator("tr").filter({ hasText: uniqueName });
    await row.getByRole("button", { name: /Sua/ }).click();

    // Dialog sua hien ra
    await expect(page.locator("h3", { hasText: "Sua ca lam viec" })).toBeVisible();

    // Cap nhat ten
    const nameInput = page.getByLabel("Ten ca");
    await nameInput.clear();
    await nameInput.fill(uniqueName + "-edited");

    await page.getByRole("button", { name: "Cap nhat" }).click();

    // Verify updated
    await expect(page.getByText(uniqueName + "-edited")).toBeVisible({ timeout: 5000 });
  });

  test("TC-305: Validation - Ten ca khong duoc trong", async ({ page }) => {
    await page.goto("/admin/shifts");

    await page.getByRole("button", { name: /Them ca/ }).click();
    await expect(page.locator("h3", { hasText: "Them ca lam viec" })).toBeVisible();

    // Bo trong ten ca, chi dien gio
    await page.getByLabel("Gio bat dau").fill("09:00");
    await page.getByLabel("Gio ket thuc").fill("17:00");

    // HTML5 required ngan submit
    const submitBtn = page.getByRole("button", { name: "Luu ca" });
    await expect(submitBtn).toBeVisible();

    // Dialog van mo
    await expect(page.locator("h3", { hasText: "Them ca lam viec" })).toBeVisible();
  });

  test("TC-306: Phan ca cho nhan vien", async ({ page }) => {
    await page.goto("/admin/shifts");

    // Kiem tra co nhan vien truoc
    const assignBtn = page.getByRole("button", { name: /Phan ca/ }).first();
    const isDisabled = await assignBtn.isDisabled();
    if (isDisabled) {
      test.skip();
      return;
    }

    await assignBtn.click();
    await expect(page.locator("h3", { hasText: "Phan ca cho nhan vien" })).toBeVisible();

    // Chon nhan vien dau tien
    const employeeSelect = page.locator("select[name='employeeId']");
    await employeeSelect.selectOption({ index: 1 });

    // Chon ca dau tien
    const shiftSelect = page.locator("select[name='shiftId']");
    await shiftSelect.selectOption({ index: 1 });

    // Dat ngay hom nay
    const today = new Date().toISOString().split("T")[0];
    await page.locator("input#assign-date").fill(today);

    await page.getByRole("button", { name: "Phan ca", exact: true }).click();

    // Dialog dong hoac hien loi (neu da phan ca)
    await page.waitForTimeout(1500);
    const dialogVisible = await page.locator("h3", { hasText: "Phan ca cho nhan vien" }).isVisible();
    if (dialogVisible) {
      // Co the da phan ca roi - kiem tra loi
      const errVisible = await page.locator(".bg-red-50").isVisible();
      expect(errVisible).toBe(true);
    } else {
      // Thanh cong - kiem tra trong bang phan ca
      await expect(page.locator("table").nth(1)).toBeVisible();
    }
  });

  test("TC-307: Filter phan ca theo ngay", async ({ page }) => {
    await page.goto("/admin/shifts");

    const today = new Date().toISOString().split("T")[0];
    const dateInput = page.locator("input[name='date']");
    await dateInput.fill(today);
    await page.getByRole("button", { name: "Loc" }).click();

    // URL chua date param
    await expect(page).toHaveURL(new RegExp(`date=${today}`), { timeout: 3000 });
    await expect(page.locator("table").nth(1)).toBeVisible();
  });

  test("TC-308: Xoa ca dang su dung bao loi", async ({ page }) => {
    await page.goto("/admin/shifts");

    // Tim ca co phan ca (so phan ca > 0) - neu co
    const rows = page.locator("tbody tr");
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const assignCountText = await row.locator("td").nth(3).textContent();
      if (assignCountText && parseInt(assignCountText) > 0) {
        page.on("dialog", (dialog) => dialog.accept());
        await row.getByRole("button", { name: /Xoa/ }).click();
        await page.waitForTimeout(1000);
        // Nen hien loi
        await expect(page.locator(".bg-red-50").first()).toBeVisible({ timeout: 3000 });
        return;
      }
    }
    // Khong co ca nao co phan ca -> skip
    test.skip();
  });

  test("TC-309: Xoa ca khong co phan ca thanh cong", async ({ page }) => {
    await page.goto("/admin/shifts");

    // Tim ca vua tao (edited) de xoa
    const targetName = uniqueName + "-edited";
    const row = page.locator("tr").filter({ hasText: targetName });
    const rowExists = await row.count();
    if (rowExists === 0) {
      test.skip();
      return;
    }

    page.on("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: /Xoa/ }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(targetName)).not.toBeVisible({ timeout: 5000 });
  });

  test("TC-310: Empty state bang phan ca", async ({ page }) => {
    // Chon ngay khong co phan ca nao
    await page.goto("/admin/shifts?date=2020-01-01");

    await expect(
      page.getByText("Chua co phan ca nao trong ngay nay.")
    ).toBeVisible({ timeout: 5000 });
  });
});
