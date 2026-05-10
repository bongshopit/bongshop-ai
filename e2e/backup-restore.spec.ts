import { test, expect } from "@playwright/test";
import * as zlib from "zlib";
import { promisify } from "util";

const gunzipAsync = promisify(zlib.gunzip);

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#email").fill("admin@bongshop.vn");
  await page.locator("#password").fill("bongshop");
  await page.locator("button[type='submit']").click();
  await page.waitForURL("**/admin", { timeout: 10000 });
}

/** Tạo backup JSON payload tối thiểu hợp lệ để dùng trong test restore */
function makeMinimalBackupBuffer(): Buffer {
  const payload = {
    version: "1",
    exportedAt: new Date().toISOString(),
    data: {
      loyaltySettings: [],
      productGroups: [],
      products: [],
      shifts: [],
      employees: [],
      shiftAssignments: [],
      attendances: [],
      payrolls: [],
      payrollAdjustments: [],
      customers: [],
      orders: [],
      orderItems: [],
      loyaltyLogs: [],
      customerStorages: [],
      customerStorageItems: [],
      cashTransactions: [],
    },
  };
  return Buffer.from(JSON.stringify(payload));
}

test.describe("US-020: Backup va Restore Du lieu", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // TC-2001: Settings page có section Backup & Restore
  test("TC-2001: Settings page hien thi section Backup Restore", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.locator("h1", { hasText: "Cài đặt hệ thống" })).toBeVisible();
    await expect(page.getByText("Backup").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Tải Backup/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Restore từ Backup/ })).toBeVisible();
  });

  // TC-2002: API GET /api/backup trả về file gzip hợp lệ
  test("TC-2002: API GET /api/backup tra ve file gzip hop le", async ({ page }) => {
    const response = await page.request.get("/api/backup");
    expect(response.status()).toBe(200);
    // Content-Type phải là gzip
    const contentType = response.headers()["content-type"] ?? "";
    expect(contentType).toContain("gzip");
    // Content-Disposition chứa .json.gz
    const contentDisposition = response.headers()["content-disposition"] ?? "";
    expect(contentDisposition).toContain("bongshop-backup-");
    expect(contentDisposition).toContain(".json.gz");
    // Header x-uncompressed-size tồn tại
    const uncompressedSize = response.headers()["x-uncompressed-size"];
    expect(uncompressedSize).toBeTruthy();
    expect(parseInt(uncompressedSize, 10)).toBeGreaterThan(0);
    // Giải nén và parse JSON
    const gzipBytes = await response.body();
    const decompressed = await gunzipAsync(gzipBytes);
    const body = JSON.parse(decompressed.toString("utf8"));
    expect(body).toHaveProperty("version", "1");
    expect(body).toHaveProperty("exportedAt");
    expect(body).toHaveProperty("data");
    expect(body.data).toHaveProperty("employees");
    expect(Array.isArray(body.data.employees)).toBe(true);
    expect(Array.isArray(body.data.customers)).toBe(true);
  });

  // TC-2003: API GET /api/backup trả 401 nếu chưa login
  test("TC-2003: GET /api/backup tra 401 khi khong co session", async ({ page }) => {
    const context = await page.context().browser()!.newContext();
    const noAuthPage = await context.newPage();
    const response = await noAuthPage.request.get("/api/backup");
    expect(response.status()).toBe(401);
    await context.close();
  });

  // TC-2004: Dialog restore mở khi click nút
  test("TC-2004: Dialog restore hien thi khi click nut", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: /Restore từ Backup/ }).click();
    await expect(page.getByText("Restore dữ liệu").first()).toBeVisible();
    // File input tồn tại
    await expect(page.locator("input[type='file']")).toBeVisible();
    // Cảnh báo hiển thị
    await expect(
      page.getByText("Toàn bộ dữ liệu", { exact: false }).first()
    ).toBeVisible();
  });

  // TC-2005: Nút xác nhận bị disabled khi chưa đủ điều kiện
  test("TC-2005: Nut Xac nhan Restore disabled khi chua du dieu kien", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: /Restore từ Backup/ }).click();
    const confirmBtn = page.getByRole("button", { name: /Xác nhận Restore/ });
    // Disabled khi chưa có file
    await expect(confirmBtn).toBeDisabled();
    // Nhập sai confirm phrase → vẫn disabled
    await page.locator("input[placeholder='RESTORE']").fill("restore");
    await expect(confirmBtn).toBeDisabled();
  });

  // TC-2006: Upload file không hợp lệ hiển thị lỗi
  test("TC-2006: Upload file khong phai backup hien thi loi", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: /Restore từ Backup/ }).click();
    const invalidJson = JSON.stringify({ not: "a backup" });
    await page.locator("input[type='file']").setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from(invalidJson),
    });
    await expect(
      page.getByText("không hợp lệ", { exact: false }).or(
        page.getByText("không tương thích", { exact: false })
      ).first()
    ).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole("button", { name: /Xác nhận Restore/ })).toBeDisabled();
  });

  // TC-2007: Upload file .json (backward compat) hiển thị preview
  test("TC-2007: Upload file json hop le hien thi metadata preview", async ({ page }) => {
    await page.goto("/admin/settings");
    const buffer = makeMinimalBackupBuffer();
    await page.getByRole("button", { name: /Restore từ Backup/ }).click();
    await page.locator("input[type='file']").setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer,
    });
    await expect(page.getByText("Nội dung backup").first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Xuất lúc", { exact: false }).first()).toBeVisible();
    const confirmBtn = page.getByRole("button", { name: /Xác nhận Restore/ });
    await expect(confirmBtn).toBeDisabled();
    await page.locator("input[placeholder='RESTORE']").fill("RESTORE");
    await expect(confirmBtn).toBeEnabled();
  });

  // TC-2008: API POST /api/backup trả 401 nếu không có session
  test("TC-2008: POST /api/backup tra 401 khi khong co session", async ({ page }) => {
    const context = await page.context().browser()!.newContext();
    const noAuthPage = await context.newPage();
    const response = await noAuthPage.request.post("/api/backup", {
      multipart: {
        file: {
          name: "test.json",
          mimeType: "application/json",
          buffer: Buffer.from("{}"),
        },
      },
    });
    expect(response.status()).toBe(401);
    await context.close();
  });

  // TC-2009: Nút Hủy đóng dialog restore
  test("TC-2009: Nut Huy dong dialog restore", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: /Restore từ Backup/ }).click();
    await expect(page.getByText("Restore dữ liệu").first()).toBeVisible();
    await page.getByRole("button", { name: "Hủy" }).click();
    await expect(page.getByText("Restore dữ liệu").first()).not.toBeVisible();
  });

  // TC-2010: Tải backup màn hình hiển thị tên file .json.gz
  test("TC-2010: Nut tai backup yeu cau file json.gz", async ({ page }) => {
    await page.goto("/admin/settings");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Tải Backup/ }).click(),
    ]);
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/bongshop-backup-\d{4}-\d{2}-\d{2}\.json\.gz$/);
    await download.cancel();
  });

  // TC-2011: Upload file .json.gz (gzip) được giải nén và hiển thị preview
  test("TC-2011: Upload file json.gz gzip hien thi compression info va preview", async ({ page, browserName }) => {
    // DecompressionStream không hỗ trợ trong mắt định webkit của Playwright
    test.skip(browserName === "webkit", "DecompressionStream không khả dụng trong WebKit CI");

    await page.goto("/admin/settings");
    const minimalJson = makeMinimalBackupBuffer();
    const gzipBuf = await new Promise<Buffer>((resolve, reject) =>
      zlib.gzip(minimalJson, { level: 9 }, (err, buf) => (err ? reject(err) : resolve(buf)))
    );

    await page.getByRole("button", { name: /Restore từ Backup/ }).click();
    await page.locator("input[type='file']").setInputFiles({
      name: "backup.json.gz",
      mimeType: "application/gzip",
      buffer: gzipBuf,
    });
    // Preview hiển thị
    await expect(page.getByText("Nội dung backup").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Xuất lúc", { exact: false }).first()).toBeVisible();
    // Confirm button có thể được enable
    await page.locator("input[placeholder='RESTORE']").fill("RESTORE");
    await expect(page.getByRole("button", { name: /Xác nhận Restore/ })).toBeEnabled();
  });

  // TC-2012: Backward compat — server nhận file .json cũ và trả 200
  test("TC-2012: Server nhan file json cu (khong nen) va tra ve 200", async ({ page }) => {
    const buffer = makeMinimalBackupBuffer();
    const response = await page.request.post("/api/backup", {
      multipart: {
        file: {
          name: "old-backup.json",
          mimeType: "application/json",
          buffer,
        },
      },
    });
    // Phải thành công (200) vì server hỗ trợ cả JSON thuần
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("success", true);
  });

  // TC-2013: Full UI restore flow → navigate /admin qua window.location.href (fresh data)
  test("TC-2013: Full UI restore flow navigate /admin voi fresh data", async ({ page }) => {
    await page.goto("/admin/settings");

    // Tải backup từ API để có file hợp lệ
    const backupRes = await page.request.get("/api/backup");
    const gzipBytes = await backupRes.body();
    // Dùng Node.js gunzip để giải nén
    const decompressed = await gunzipAsync(gzipBytes);

    await page.getByRole("button", { name: /Restore từ Backup/ }).click();

    // Upload file json (decompressed content)
    await page.locator("input[type='file']").setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: decompressed,
    });

    // Đợi preview hiển thị
    await expect(page.getByText("Nội dung backup").first()).toBeVisible({ timeout: 5000 });

    // Điền RESTORE để enable button
    await page.locator("input[placeholder='RESTORE']").fill("RESTORE");
    const confirmBtn = page.getByRole("button", { name: /Xác nhận Restore/ });
    await expect(confirmBtn).toBeEnabled();

    // Click restore — server xử lý, sau đó window.location.href = "/admin"
    await Promise.all([
      page.waitForURL("**/admin", { timeout: 30000 }),
      confirmBtn.click(),
    ]);

    // Verify trang /admin đã load (fresh data, không phải cache)
    await expect(page).toHaveURL(/\/admin$/);
    // Trang admin load thành công — Server Component render đúng
    await expect(page.locator("main")).toBeVisible();
  });
});
