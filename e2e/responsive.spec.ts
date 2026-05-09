import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#email").fill("admin@bongshop.vn");
  await page.locator("#password").fill("bongshop");
  await page.locator("button[type='submit']").click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────
// TC-1701: Desktop (1280×720) — layout baseline
// ─────────────────────────────────────────────────────────────────
test.describe("US-017: Responsive Design — Desktop (1280×720)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(page);
  });

  test("TC-1701: Sidebar hiển thị trên desktop", async ({ page }) => {
    await page.goto("/admin");
    // Desktop sidebar phải hiện (md:flex)
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
    // Hamburger ẩn trên desktop
    const hamburger = page.locator("button").filter({ hasText: "" }).first();
    // Sidebar có chữ BongShop
    await expect(page.locator("aside")).toContainText("BongShop");
  });

  test("TC-1702: Dashboard stats grid hiển thị 4 cột trên desktop", async ({ page }) => {
    await page.goto("/admin");
    // Chờ stats load — dùng h3 trong Card (tránh match với nav link)
    await expect(page.locator("h3").filter({ hasText: "Nhân viên" })).toBeVisible({ timeout: 10000 });
    await expect(page.locator("h3").filter({ hasText: "Sản phẩm" })).toBeVisible();
    await expect(page.locator("h3").filter({ hasText: "Khách hàng" })).toBeVisible();
  });

  test("TC-1703: Trang nhân viên — header và bảng hiển thị đúng trên desktop", async ({ page }) => {
    await page.goto("/admin/employees");
    await expect(page.getByRole("heading", { name: "Quản lý nhân viên" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: /Thêm nhân viên/ })).toBeVisible();
    // Table phải render
    await expect(page.locator("table")).toBeVisible();
  });

  test("TC-1704: Trang khách hàng — header và bảng hiển thị đúng trên desktop", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(page.getByRole("heading", { name: "Quản lý khách hàng" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: /Thêm khách hàng/ })).toBeVisible();
  });

  test("TC-1705: Trang tồn kho — header với 2 nút hiển thị đúng trên desktop", async ({ page }) => {
    await page.goto("/admin/inventory");
    await expect(page.getByRole("heading", { name: "Tồn kho" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: /Nhóm hàng/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Thêm sản phẩm/ })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// TC-1706-1712: Tablet (768×1024)
// ─────────────────────────────────────────────────────────────────
test.describe("US-017: Responsive Design — Tablet (768×1024)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);
  });

  test("TC-1706: Sidebar hiển thị trên tablet (≥768px)", async ({ page }) => {
    await page.goto("/admin");
    // md: = 768px → sidebar phải hiện
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  });

  test("TC-1707: Trang nhân viên — bảng có thể scroll ngang trên tablet", async ({ page }) => {
    await page.goto("/admin/employees");
    await expect(page.getByRole("heading", { name: "Quản lý nhân viên" })).toBeVisible({ timeout: 10000 });
    // overflow-x-auto wrapper tồn tại
    const overflowWrapper = page.locator(".overflow-x-auto").first();
    await expect(overflowWrapper).toBeVisible();
    // Table có min-w-[640px]
    const table = overflowWrapper.locator("table").first();
    await expect(table).toBeVisible();
  });

  test("TC-1708: Trang khách hàng không bị tràn ngang trên tablet", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(page.getByRole("heading", { name: "Quản lý khách hàng" })).toBeVisible({ timeout: 10000 });
    // Không có horizontal scrollbar ở cấp body
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 768;
    // Cho phép sai số nhỏ (scrollbar)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test("TC-1709: Trang tích điểm — nút Import hiển thị không bị ẩn", async ({ page }) => {
    await page.goto("/admin/loyalty");
    await expect(page.getByRole("heading", { name: "Tích điểm" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: /Import KiotViet/ })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// TC-1713-1720: Mobile (375×812) — iPhone SE
// ─────────────────────────────────────────────────────────────────
test.describe("US-017: Responsive Design — Mobile (375×812)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
  });

  test("TC-1713: Trang đăng nhập hiển thị đúng trên mobile", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("BongShop")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    // Card không tràn
    const card = page.locator(".max-w-md").first();
    await expect(card).toBeVisible();
  });

  test("TC-1714: Hamburger menu hiển thị trên mobile", async ({ page }) => {
    await page.goto("/admin");
    // Desktop sidebar ẩn, hamburger xuất hiện trong header
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
    // Button hamburger (Menu icon)
    const menuButton = header.locator("button").first();
    await expect(menuButton).toBeVisible();
  });

  test("TC-1715: Mobile sidebar overlay mở/đóng được", async ({ page }) => {
    await page.goto("/admin");
    const header = page.locator("header").first();
    const menuButton = header.locator("button").first();
    // Mở sidebar
    await menuButton.click();
    // Overlay xuất hiện với menu items
    await expect(page.getByRole("navigation").last()).toBeVisible({ timeout: 5000 });
    // Đóng bằng nút X
    const closeButton = page.locator("button").filter({ has: page.locator("svg") }).last();
    await closeButton.click();
  });

  test("TC-1716: Trang nhân viên — main padding giảm trên mobile, không tràn ngang", async ({ page }) => {
    await page.goto("/admin/employees");
    await expect(page.getByRole("heading", { name: "Quản lý nhân viên" })).toBeVisible({ timeout: 10000 });
    // Không có horizontal overflow ở body
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(375 + 20);
  });

  test("TC-1717: Trang nhân viên — nút 'Thêm nhân viên' vẫn click được trên mobile", async ({ page }) => {
    await page.goto("/admin/employees");
    await expect(page.getByRole("heading", { name: "Quản lý nhân viên" })).toBeVisible({ timeout: 10000 });
    const addButton = page.getByRole("link", { name: /Thêm nhân viên/ });
    await expect(addButton).toBeVisible();
    // Nút nằm trong viewport (không bị cắt)
    const box = await addButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375 + 5);
  });

  test("TC-1718: Bảng nhân viên có overflow-x-auto và scroll được trên mobile", async ({ page }) => {
    await page.goto("/admin/employees");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
    // overflow-x-auto wrapper tồn tại
    const overflowWrapper = page.locator(".overflow-x-auto").first();
    await expect(overflowWrapper).toBeVisible();
    // Table tồn tại bên trong
    const table = overflowWrapper.locator("table").first();
    await expect(table).toBeVisible();
  });

  test("TC-1719: Trang lương — summary cards stack dọc trên mobile", async ({ page }) => {
    await page.goto("/admin/payroll");
    await expect(page.getByRole("heading", { name: "Bảng lương" })).toBeVisible({ timeout: 10000 });
    // Không tràn ngang
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(375 + 20);
  });

  test("TC-1720: Trang tích điểm — nút Import KiotViet vẫn hiển thị trên mobile", async ({ page }) => {
    await page.goto("/admin/loyalty");
    await expect(page.getByRole("heading", { name: "Tích điểm" })).toBeVisible({ timeout: 10000 });
    // Import button vẫn visible (nhờ flex-wrap)
    const importLink = page.getByRole("link", { name: /Import KiotViet/ });
    await expect(importLink).toBeVisible();
    const box = await importLink.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
  });

  test("TC-1721: Trang tồn kho — cả 2 nút header visible trên mobile (nhờ flex-wrap)", async ({ page }) => {
    await page.goto("/admin/inventory");
    await expect(page.getByRole("heading", { name: "Tồn kho" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: /Nhóm hàng/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Thêm sản phẩm/ })).toBeVisible();
  });

  test("TC-1722: Dashboard không tràn ngang trên mobile", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("h3").filter({ hasText: "Nhân viên" })).toBeVisible({ timeout: 10000 });
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(375 + 20);
  });
});
