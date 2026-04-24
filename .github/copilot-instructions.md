# BongShop — Custom Instruction

## Tổng quan

Dự án **BongShop** — ứng dụng e-commerce Next.js. Hệ thống sử dụng **1 agent duy nhất** (`@dev-team`) kết hợp 3 skill files để mô phỏng một development team cơ bản: BA, Developer, QA.

**Tech Stack cố định:**
- Framework: Next.js 14+ (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS + Shadcn/ui
- ORM: Prisma | Database: PostgreSQL
- Auth: NextAuth.js (JWT, Credentials provider)
- Validation: Zod | Testing: Playwright

---

## Kiến trúc hệ thống

```
.github/
├── copilot-instructions.md       <- File này (global instruction)
├── agents/
│   └── development-team.chatAgent.md   <- @dev-team (agent duy nhất)
└── skills/
    ├── ba.skill.md               <- Business Analysis skill
    ├── developer.skill.md        <- Implementation skill
    └── qa.skill.md               <- Testing skill
```

---

## Agent: @dev-team

Một agent duy nhất tích hợp BA, Developer, QA.

### Prefix routing

| Prefix | Role | Hành động |
|--------|------|-----------|
| `[BA]` | Business Analyst | Phân tích, viết US file, AC, BR |
| `[DEV]` | Developer | Schema, validators, actions, UI |
| `[QA]` | QA Engineer | Playwright tests, chạy, verify PASSED |
| `[FULL]` | Full pipeline | BA -> Developer -> QA tuần tự |
| (không prefix) | Auto-detect | Suy luận từ context |

### Ví dụ sử dụng

```
@dev-team [FULL] tính năng giỏ hàng
@dev-team [BA] phân tích mã giảm giá
@dev-team [DEV] implement trang checkout, tham khảo US-005
@dev-team [QA] viết test cho US-003 ca làm việc
@dev-team fix lỗi "Cannot read properties of undefined" ở CartPage
```

---

## Skills

### BA Skill (`skills/ba.skill.md`)
- Phân tích yêu cầu, viết User Story, AC, BR, Happy/Exception flows
- Output: `docs/user-stories/US-xxx.md`
- IDs: US-xxx, AC-x.x, BR-xxx

### Developer Skill (`skills/developer.skill.md`)
- Implement: Prisma schema, Zod validators, Server Actions, UI components
- Tuân thủ React 18 compat (`useFormState`/`useFormStatus` từ `react-dom`)
- Code đầy đủ: không TODO, không placeholder

### QA Skill (`skills/qa.skill.md`)
- Viết Playwright E2E tests (`e2e/<module>.spec.ts`)
- **Bắt buộc** chạy test và đảm bảo ALL PASSED trước khi báo cáo xong
- Sau khi PASSED: cập nhật Status trong US file

---

## Coding Standards

### Cấu trúc App Router

```
src/
├── app/
│   ├── (admin)/             # Admin panel routes
│   ├── api/                 # Route Handlers (webhook, external API only)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                  # Shadcn/ui generated
│   └── shared/              # Business components
├── lib/
│   ├── prisma.ts            # Singleton
│   ├── utils.ts
│   └── validators/          # Zod schemas
├── types/index.ts
└── actions/                 # Server Actions ("use server")
```

### Rules bắt buộc

- **Server Components mặc định.** `"use client"` chỉ khi có `useState`, `useEffect`, event handlers
- **Server Actions** cho mutations → `"use server"`, đặt trong `src/actions/`
- **Zod validate** mọi input: form data, params, searchParams
- **Prisma singleton** trong `lib/prisma.ts`
- **React 18:** dùng `useFormState`/`useFormStatus` từ `react-dom` — **KHÔNG** dùng `useActionState`
- **Boundary files:** `error.tsx`, `not-found.tsx`, `loading.tsx` cho mỗi route segment
- **SEO:** Export `metadata` / `generateMetadata` trên mọi page
- `next/image` với `width`/`height` | `next/link` cho navigation | `next/font` cho fonts
- **Không `any`** — dùng Zod `infer<typeof schema>` cho types
- **Không `useEffect` cho data fetching** — dùng Server Components
- **Naming:** PascalCase (components), camelCase (functions/variables), kebab-case (files/folders)

---

## Quy tắc chung

1. **Ngôn ngữ:** Trả lời bằng **tiếng Việt**. Code và technical terms giữ tiếng Anh.
2. **ID nhất quán** xuyên suốt pipeline: US-xxx, BR-xxx, TC-xxx
3. **Code đầy đủ:** Developer viết code thật, không TODO, không placeholder
4. **QA bắt buộc chạy test** và báo cáo kết quả trước khi kết thúc
5. **Hỏi trước nếu mơ hồ** — scope không rõ → xác nhận với user trước

---

## Tiến độ dự án

| US | Tên tính năng | Status |
|----|---------------|--------|
| US-001 | Quản lý nhân viên | Completed |
| US-002 | Chấm công | Verified |
| US-003 | Ca làm việc | Verified |
| US-004 | Tồn kho | Verified |
| US-005 | Sổ quỹ | Verified |
| US-006 | Lương | Verified |
| US-007 | Khách hàng | Verified |
| US-008 | Nhập KH từ KiotViet xlsx | Verified (Sprint 2 — amendment loyaltyPointsDefault) |
| US-009 | Tích điểm khách hàng | Verified (Sprint 2 — hiển thị 3 nhóm điểm) |
| US-010 | Hàng hóa + nhóm hàng | Verified (Sprint 2 — import KiotViet + groups page) |
| US-011 | Pagination cho bảng dữ liệu | Verified |
| US-012 | Tích điểm thủ công + import từ báo cáo bán hàng KiotViet | Verified |

---

## Lưu ý đặc biệt cho BongShop

- E-commerce → UX mua hàng phải **nhanh, trực quan, ít bước**
- **SEO quan trọng** — tận dụng Server Components, metadata, structured data
- **Bảo mật thanh toán** — mọi flow liên quan đến tiền phải kiểm tra kỹ