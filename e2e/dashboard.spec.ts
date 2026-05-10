import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("M\u1eadt kh\u1ea9u").fill("bongshop");
  await page.getByRole("button", { name: "\u0110\u0103ng nh\u1eadp" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

test.describe("US-019: C\u1ea3i thi\u1ec7n Dashboard", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // TC-1901: 6 stat cards hi\u1ec3n th\u1ecb
  test("TC-1901: Dashboard hi\u1ec3n th\u1ecb 6 stat cards", async ({ page }) => {
    await expect(page.locator("h1", { hasText: "Dashboard" })).toBeVisible();

    const main = page.locator("main");
    await expect(main.getByText("Nh\u00e2n vi\u00ean").first()).toBeVisible();
    await expect(main.getByText("Ch\u1ea5m c\u00f4ng h\u00f4m nay").first()).toBeVisible();
    await expect(main.getByText("S\u1ea3n ph\u1ea9m").first()).toBeVisible();
    await expect(main.getByText("Kh\u00e1ch h\u00e0ng").first()).toBeVisible();
    await expect(main.getByText("S\u1ed1 d\u01b0 qu\u1ef9").first()).toBeVisible();
    await expect(main.getByText("G\u1eedi h\u00e0ng \u0111ang m\u1edf").first()).toBeVisible();
  });

  // TC-1902: S\u1ed1 d\u01b0 qu\u1ef9 c\u00f3 k\u00fd hi\u1ec7u ti\u1ec1n
  test("TC-1902: S\u1ed1 d\u01b0 qu\u1ef9 hi\u1ec3n th\u1ecb \u0111\u1ecbnh d\u1ea1ng VN\u0110", async ({ page }) => {
    const main = page.locator("main");
    const cashCard = main.locator("div", { hasText: "S\u1ed1 d\u01b0 qu\u1ef9" }).first();
    await expect(cashCard).toBeVisible();
  });

  // TC-1903: Section s\u1ea3n ph\u1ea9m s\u1eafp h\u1ebft h\u00e0ng
  test("TC-1903: Section s\u1ea3n ph\u1ea9m s\u1eafp h\u1ebft h\u00e0ng hi\u1ec3n th\u1ecb", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("S\u1ea3n ph\u1ea9m s\u1eafp h\u1ebft h\u00e0ng").first()).toBeVisible();
    const viewAllLink = main
      .locator("a[href='/admin/inventory']", { hasText: "Xem t\u1ea5t c\u1ea3" })
      .first();
    await expect(viewAllLink).toBeVisible();
  });

  // TC-1904: Section giao d\u1ecbch g\u1ea7n nh\u1ea5t
  test("TC-1904: Section giao d\u1ecbch g\u1ea7n nh\u1ea5t hi\u1ec3n th\u1ecb", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("Giao d\u1ecbch g\u1ea7n nh\u1ea5t").first()).toBeVisible();
    const viewAllLink = main
      .locator("a[href='/admin/cashbook']", { hasText: "Xem t\u1ea5t c\u1ea3" })
      .first();
    await expect(viewAllLink).toBeVisible();
  });

  // TC-1905: Section nh\u00e2n vi\u00ean ch\u01b0a ch\u1ea5m c\u00f4ng
  test("TC-1905: Section nh\u00e2n vi\u00ean ch\u01b0a ch\u1ea5m c\u00f4ng hi\u1ec3n th\u1ecb", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.getByText("Ch\u01b0a ch\u1ea5m c\u00f4ng h\u00f4m nay").first()).toBeVisible();
    const viewAllLink = main
      .locator("a[href='/admin/attendance']", { hasText: "Xem t\u1ea5t c\u1ea3" })
      .first();
    await expect(viewAllLink).toBeVisible();
  });

  // TC-1906: Click stat card navigate
  test("TC-1906: Click stat card Nh\u00e2n vi\u00ean navigate \u0111\u1ebfn employees", async ({ page }) => {
    const main = page.locator("main");
    const employeeCard = main.locator("a[href='/admin/employees']").first();
    await expect(employeeCard).toBeVisible();
    await employeeCard.click();
    await expect(page).toHaveURL(/\/admin\/employees/);
  });

  // TC-1907: Sidebar navigation
  test("TC-1907: Sidebar navigation ho\u1ea1t \u0111\u1ed9ng", async ({ page }) => {
    const sidebarLinks = [
      "Nh\u00e2n vi\u00ean",
      "Ch\u1ea5m c\u00f4ng",
      "Ca l\u00e0m vi\u1ec7c",
      "T\u1ed3n kho",
      "S\u1ed5 qu\u1ef9",
      "L\u01b0\u01a1ng",
      "Kh\u00e1ch h\u00e0ng",
    ];

    for (const text of sidebarLinks) {
      await expect(page.locator("aside a", { hasText: text })).toBeVisible();
    }

    await page.locator("aside a", { hasText: "Nh\u00e2n vi\u00ean" }).click();
    await expect(page).toHaveURL(/\/admin\/employees/);
    await expect(
      page.locator("h1", { hasText: "Qu\u1ea3n l\u00fd nh\u00e2n vi\u00ean" })
    ).toBeVisible();
  });
});
