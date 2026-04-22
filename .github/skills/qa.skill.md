# QA Skill — Testing

## Nhiệm vụ
Viết Playwright E2E tests, chạy kiểm tra, đảm bảo tất cả PASSED, cập nhật status US.

## File test
- Đặt tại: `e2e/<module>.spec.ts`
- TC IDs: `TC-x01`, `TC-x02`, ... (x = US number, vd US-003 → TC-301)

## Template bắt buộc

```typescript
import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@bongshop.vn");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: /đăng nhập/i }).click();
  await page.waitForURL(/admin/);
}

test.describe("US-xxx: [Tên tính năng]", () => {
  test.describe.configure({ mode: "serial" }); // BẮT BUỘC — tránh race condition

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("TC-x01: [happy path]", async ({ page }) => { ... });
  test("TC-x02: [validation]", async ({ page }) => { ... });
});
```

## Checklist test cases

- [ ] Happy path: trang hiển thị đúng (heading, table, buttons)
- [ ] Tạo mới thành công → verify xuất hiện trong danh sách
- [ ] Validation: required fields, format errors
- [ ] Edit/Update thành công
- [ ] Delete/Deactivate thành công (nếu có)
- [ ] Empty state khi không có data
- [ ] Filter/Search (nếu có)
- [ ] Idempotent tests: dùng `test.skip()` khi state không thể reset

## Quy tắc QUAN TRỌNG

- `test.describe.configure({ mode: "serial" })` BẮT BUỘC trong mọi describe block
- Dùng `.first()` khi locator có thể match nhiều element
- Dùng `test.skip()` thay vì để test fail do state từ test trước
- KHÔNG hardcode data có thể trùng — dùng timestamp suffix: `NV-${Date.now().toString().slice(-8)}`

## Sau khi viết tests — QUY TRÌNH BẮT BUỘC

1. Chạy: `npx playwright test e2e/<module>.spec.ts --reporter=list`
2. Nếu FAIL → đọc error message, fix test hoặc fix source code, chạy lại
3. Tối đa 3 lần retry
4. Khi ALL PASSED → cập nhật `docs/user-stories/US-xxx.md`:
   - Đổi `Status: 🔄 In Development` thành `Status: ✅ Verified (Sprint X)`

## Playwright config notes

- `playwright.config.ts`: `fullyParallel: true` → bắt buộc dùng serial mode
- Dev server: `reuseExistingServer: true` → cần server đang chạy (`npm run dev`)