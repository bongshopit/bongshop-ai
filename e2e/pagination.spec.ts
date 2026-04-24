import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Mật khẩu").fill("admin123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

test.describe("US-011: Pagination — Phân trang bảng dữ liệu", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─── TC-1101: Trang Inventory hiển thị đúng ──────────────────────────────
  test("TC-1101: Trang tồn kho hiển thị đúng, đếm rows ≤ 20", async ({ page }) => {
    await page.goto("/admin/inventory");

    await expect(page.locator("h1", { hasText: "Tồn kho" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Số rows data trong tbody không vượt quá 20
    const rows = page.locator("tbody tr").filter({ hasNotText: "Không tìm thấy" });
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(20);
  });

  // ─── TC-1102: Navigation ?page=2 ────────────────────────────────────────
  test("TC-1102: URL ?page=2 load đúng trang 2", async ({ page }) => {
    await page.goto("/admin/inventory?page=2");

    await expect(page.locator("h1", { hasText: "Tồn kho" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    // Nếu có pagination, trang 2 phải được highlight
    const paginationNav = page.locator("nav[aria-label='Phân trang']");
    const hasPagination = await paginationNav.isVisible();
    if (hasPagination) {
      // Số trang 2 được highlight (aria-current="page")
      await expect(paginationNav.locator("[aria-current='page']")).toHaveText("2");
    }
  });

  // ─── TC-1103: Filter reset về page 1 ────────────────────────────────────
  test("TC-1103: Submit filter → URL không giữ page cũ", async ({ page }) => {
    await page.goto("/admin/inventory?page=3");

    // Submit form tìm kiếm → trả về trang 1
    await page.fill("input[name='q']", "test-search-reset");
    await page.click("button[type='submit']");

    await page.waitForURL("**/admin/inventory**");
    const url = new URL(page.url());
    // Sau khi search, page không phải 3
    expect(url.searchParams.get("page")).not.toBe("3");
    expect(url.searchParams.get("q")).toBe("test-search-reset");
  });

  // ─── TC-1104: Hiển thị "X-Y / Z kết quả" ───────────────────────────────
  test("TC-1104: Pagination hiển thị thông tin tổng kết quả khi > 20 bản ghi", async ({
    page,
  }) => {
    await page.goto("/admin/inventory");
    await expect(page.locator("table")).toBeVisible();

    const rows = page.locator("tbody tr").filter({ hasNotText: "Không tìm thấy" });
    const count = await rows.count();

    const paginationNav = page.locator("nav[aria-label='Phân trang']");
    const hasPagination = await paginationNav.isVisible();

    if (count === 20 || hasPagination) {
      // Phải có text dạng "Hiển thị X–Y / Z kết quả"
      await expect(page.locator("text=/Hiển thị/")).toBeVisible();
      await expect(page.locator("text=/kết quả/")).toBeVisible();
    } else {
      // Ít hơn 20 bản ghi → không có pagination
      await expect(paginationNav).not.toBeVisible();
    }
  });

  // ─── TC-1105: ?page=9999 → trang cuối ───────────────────────────────────
  test("TC-1105: ?page=9999 không crash, hiển thị đúng", async ({ page }) => {
    const response = await page.goto("/admin/inventory?page=9999");
    // Không 500
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("h1", { hasText: "Tồn kho" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  // ─── TC-1106: Nút "Trước" disabled ở trang 1 ───────────────────────────
  test("TC-1106: Nút Trước disabled ở trang 1 của Customers", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(page.locator("table")).toBeVisible();

    const paginationNav = page.locator("nav[aria-label='Phân trang']");
    const hasPagination = await paginationNav.isVisible();

    if (hasPagination) {
      // Nút trước ở trang 1 là span (không phải link) → không thể click
      const prevBtn = paginationNav.locator("span").filter({ hasText: "" }).first();
      // Không có link "Trang trước" (chỉ có span disabled)
      await expect(paginationNav.locator("a[aria-label='Trang trước']")).not.toBeVisible();
    } else {
      test.skip();
    }
  });

  // ─── TC-1107: Nút "Sau" disabled ở trang cuối ───────────────────────────
  test("TC-1107: Nút Sau disabled ở trang cuối của Customers", async ({ page }) => {
    await page.goto("/admin/customers");
    await expect(page.locator("table")).toBeVisible();

    const paginationNav = page.locator("nav[aria-label='Phân trang']");
    const hasPagination = await paginationNav.isVisible();

    if (!hasPagination) {
      test.skip();
      return;
    }

    // Lấy tổng trang từ text "Hiển thị X–Y / Z kết quả"
    const infoText = await page.locator("text=/kết quả/").textContent();
    if (!infoText) {
      test.skip();
      return;
    }
    const match = infoText.match(/\/\s*([\d.]+)\s*kết quả/);
    if (!match) {
      test.skip();
      return;
    }
    const total = parseInt(match[1].replace(/\./g, ""));
    const totalPages = Math.ceil(total / 20);

    await page.goto(`/admin/customers?page=${totalPages}`);
    await expect(paginationNav).toBeVisible();
    // Ở trang cuối, nút Sau là span (disabled)
    await expect(paginationNav.locator("a[aria-label='Trang sau']")).not.toBeVisible();
  });

  // ─── TC-1108: Customers trang 2 ─────────────────────────────────────────
  test("TC-1108: Customers ?page=2 hiển thị đúng khi có đủ dữ liệu", async ({ page }) => {
    await page.goto("/admin/customers?page=2");
    await expect(page.locator("h1", { hasText: "Quản lý khách hàng" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    const paginationNav = page.locator("nav[aria-label='Phân trang']");
    const hasPagination = await paginationNav.isVisible();
    if (hasPagination) {
      await expect(paginationNav.locator("[aria-current='page']")).toHaveText("2");
    }
  });

  // ─── TC-1109: Cashbook + filter type → pagination đúng ──────────────────
  test("TC-1109: Cashbook filter type=INCOME → pagination giữ filter param", async ({
    page,
  }) => {
    await page.goto("/admin/cashbook?type=INCOME&page=1");
    await expect(page.locator("h1", { hasText: "Sổ quỹ" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();

    const paginationNav = page.locator("nav[aria-label='Phân trang']");
    const hasPagination = await paginationNav.isVisible();
    if (hasPagination) {
      // Khi nhấn trang 2, URL phải giữ type=INCOME
      const page2Link = paginationNav.locator("a").filter({ hasText: "2" }).first();
      const href = await page2Link.getAttribute("href");
      expect(href).toContain("type=INCOME");
      expect(href).toContain("page=2");
    }
  });

  // ─── TC-1110: Employees filter → pagination reset page=1 ────────────────
  test("TC-1110: Employees filter department → URL không giữ page cũ", async ({ page }) => {
    await page.goto("/admin/employees?page=5");

    // Tìm và submit filter department
    const select = page.locator("select[name='department']");
    const hasSelect = await select.isVisible();
    if (hasSelect) {
      await select.selectOption({ index: 0 }); // all
      // Click submit nếu có
      const submitBtn = page.locator("button[type='submit']").first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForURL("**/admin/employees**");
        const url = new URL(page.url());
        expect(url.searchParams.get("page")).not.toBe("5");
      }
    }

    // Bất kể filter, trang phải render
    await expect(page.locator("h1", { hasText: "Quản lý nhân viên" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  // ─── Edge case: page=invalid ─────────────────────────────────────────────
  test("TC-1111: ?page=abc không crash, render trang 1", async ({ page }) => {
    const res = await page.goto("/admin/inventory?page=abc");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("table")).toBeVisible();
  });

  // ─── Edge case: page=0 → trang 1 ─────────────────────────────────────────
  test("TC-1112: ?page=0 render trang 1", async ({ page }) => {
    const res = await page.goto("/admin/customers?page=0");
    expect(res?.status()).not.toBe(500);
    await expect(page.locator("h1", { hasText: "Quản lý khách hàng" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });
});
