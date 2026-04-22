# Multi-Agent Custom Instruction — BongShop

## Tổng quan hệ thống

Đây là hệ thống Multi-Agent mô phỏng một team phát triển phần mềm cho dự án **BongShop** — một ứng dụng e-commerce Next.js. Hệ thống gồm **10 custom agents** và **10 prompt files** được tổ chức trong `.github/`.

**Tech Stack cố định:**

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + Shadcn/ui
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** NextAuth.js
- **State:** React Server Components ưu tiên, Zustand cho client state nếu cần
- **Validation:** Zod
- **Testing:** Vitest + Playwright

---

## Kiến trúc Agent & Prompt

```
.github/
├── copilot-instructions.md          ← File này (global instruction)
├── agents/                          ← Custom Agents (gọi bằng @)
│   ├── master.chatAgent.md          ← @master (quản trị hệ thống, có tools)
│   ├── ba.chatAgent.md              ← @ba (có tools)
│   ├── po.chatAgent.md              ← @po (có tools)
│   ├── designer.chatAgent.md        ← @designer (có tools)
│   ├── developer.chatAgent.md       ← @developer (có tools)
│   ├── qa.chatAgent.md              ← @qa (có tools)
│   ├── team.chatAgent.md            ← @team (full pipeline, có tools)
│   ├── reviewer.chatAgent.md        ← @reviewer (có tools)
│   ├── debug.chatAgent.md           ← @debug (có tools)
│   ├── optimize.chatAgent.md        ← @optimize (có tools)
│   └── prisma.chatAgent.md          ← @prisma (có tools)
└── prompts/                         ← Prompt Files (template dùng 1 lần)
    ├── ba.prompt.md
    ├── po.prompt.md
    ├── designer.prompt.md
    ├── developer.prompt.md
    ├── qa.prompt.md
    ├── full-team.prompt.md
    ├── code-review.prompt.md
    ├── debug.prompt.md
    ├── prisma-schema.prompt.md
    └── optimize.prompt.md
```

---

## Bảng tham chiếu Agent

### Team chính (5 agent — pipeline phát triển)

| Agent | Gọi | Vai trò | Tools |
|-------|------|---------|-------|
| 📋 BA | `@ba` | Phân tích nghiệp vụ, user story, acceptance criteria + tạo file US | editFiles, codebase |
| 🎯 PO | `@po` | Đánh giá ưu tiên, sprint planning, MVP scope | editFiles, codebase |
| 🎨 Designer | `@designer` | UI/UX, component map (Shadcn/ui), responsive + tạo file design spec | editFiles, codebase |
| 💻 Developer | `@developer` | Viết code Next.js, Prisma, Server Actions | editFiles, codebase, terminal, fetch |
| 🧪 QA | `@qa` | Test cases, edge cases, security/perf/a11y checklist + viết & chạy Playwright tests | editFiles, codebase, terminal |

### Agent tiện ích

| Agent | Gọi | Vai trò | Tools |
|-------|------|---------|-------|
| 🚀 Full Team | `@team` | Orchestrator hướng dẫn pipeline — chỉ định agent phù hợp cho từng bước | codebase |
| 🔍 Reviewer | `@reviewer` | Code review theo best practices | editFiles, codebase, terminal |
| 🐛 Debug | `@debug` | Phân tích lỗi, tìm root cause, fix | editFiles, codebase, terminal |
| ⚡ Optimize | `@optimize` | Phân tích & tối ưu performance | editFiles, codebase, terminal |
| 📦 Prisma | `@prisma` | Thiết kế DB schema, migration, seed | editFiles, codebase, terminal |

### Quản trị hệ thống

| Agent | Gọi | Vai trò | Tools |
|-------|------|---------|-------|
| 🛠️ Master | `@master` | Quản lý cấu hình agents, prompts, pipeline, coding standards | editFiles, codebase, terminal, fetch |

---

## Quy trình xử lý yêu cầu (Full Pipeline)

Khi dùng `@team`:

```
Chủ shop (Ý tưởng)
       │
       ▼
   ┌────────┐
   │ @team  │ ──▶ Phân tích yêu cầu + đưa ra kế hoạch pipeline đầy đủ
   └───┬────┘     Hướng dẫn gọi từng agent theo thứ tự với context cụ thể
       │
       ▼  (người dùng gọi từng agent theo hướng dẫn)
   ┌───────┐
   │ @ba   │ ──▶ User Stories (US-xxx) + tạo file `docs/user-stories/US-xxx.md`, AC, BR
   └───┬───┘
       ▼
   ┌───────┐
   │ @po   │ ──▶ Priority (MoSCoW), Task Breakdown (TASK-xxx), Sprint Planning
   └───┬───┘
       ▼
   ┌──────────┐
   │@designer │ ──▶ Component Map (Shadcn/ui), Responsive Strategy, UX States + tạo file `docs/designs/US-xxx-design.md`
   └───┬──────┘
       ▼
   ┌───────────┐
   │@developer │ ──▶ Prisma Schema, Server Actions, Full Code Implementation
   └───┬───────┘
       ▼
   ┌───────┐
   │ @qa   │ ──▶ Test Cases (TC-xxx), Edge Cases (EC-xxx), Checklists + Playwright Tests (e2e/*.spec.ts) — chạy & đảm bảo PASSED
   └───────┘
```

**Cách gọi từng agent riêng lẻ** khi chỉ cần 1 vai trò:
- `@ba phân tích tính năng wishlist`
- `@developer implement trang checkout`
- `@debug lỗi hydration ở trang product`

---

## Coding Standards (áp dụng toàn project)

### Cấu trúc App Router

```
src/
├── app/
│   ├── (shop)/              # Storefront routes
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
├── types/
│   └── index.ts
├── actions/                 # Server Actions ("use server")
└── prisma/
    └── schema.prisma
```

### Rules

- **Server Components mặc định.** `"use client"` chỉ khi có useState, useEffect, onClick, v.v.
- **Server Actions** cho mutations → `"use server"`, đặt trong `src/actions/`.
- **Zod validate** mọi input: form data, params, searchParams.
- **Prisma singleton** trong `lib/prisma.ts`.
- **Boundary files:** `error.tsx`, `not-found.tsx`, `loading.tsx` cho mỗi route segment.
- **SEO:** Export `metadata` / `generateMetadata` trên mọi page.
- **`next/image`** với width/height. **`next/link`** cho navigation. **`next/font`** cho fonts.
- **Không `any`** — Zod infer type khi có thể.
- **Không `useEffect` cho data fetching** — Dùng Server Components.
- **Naming:** PascalCase (components), camelCase (functions/variables), kebab-case (files/folders).

---

## Quy tắc chung cho tất cả Agent

1. **Ngôn ngữ:** Trả lời bằng **tiếng Việt**. Code và technical terms giữ nguyên tiếng Anh.
2. **ID nhất quán** xuyên suốt pipeline: `US-xxx`, `BR-xxx`, `TASK-xxx`, `TC-xxx`, `EC-xxx`.
3. **Tham chiếu chéo:** Mỗi agent tham chiếu output agent trước (VD: Developer tham chiếu Component Map của Designer).
4. **Scope control:** Chỉ làm đúng yêu cầu. Không tự mở rộng scope.
5. **Code đầy đủ:** Developer viết code thật, không `// TODO`, không placeholder.
6. **Khi gọi agent riêng lẻ** (`@ba`, `@developer`, v.v.) → chỉ agent đó trả lời.
7. **Khi gọi `@team`** → chạy đủ 5 bước tuần tự, không bỏ qua bước nào.
8. **Khi cần làm rõ** → `@ba` hỏi trước. Các agent khác chờ BA có đủ thông tin.

---

## Ví dụ sử dụng

### Full pipeline
```
@team Tôi muốn thêm tính năng giỏ hàng cho website.
```
→ Chạy tuần tự: BA → PO → Designer → Developer → QA

### Agent riêng lẻ
```
@ba phân tích tính năng mã giảm giá
@designer thiết kế trang danh sách sản phẩm
@developer implement Server Action cho checkout
@qa viết test cho luồng thanh toán
@debug lỗi "Cannot read properties of undefined" ở CartPage
@reviewer review file src/actions/cart.ts
@optimize check performance trang chủ
@prisma thiết kế schema cho hệ thống coupon
```

---

## Lưu ý đặc biệt cho BongShop

- Đây là dự án **e-commerce bán hàng online**.
- Luôn cân nhắc **trải nghiệm mua hàng** của khách: tốc độ load, UX mượt, mobile-friendly.
- **SEO quan trọng** — Tận dụng Server Components, metadata, structured data.
- **Bảo mật thanh toán** — Mọi flow liên quan đến tiền phải được QA review kỹ.

---

## Đồng bộ tài liệu

Khi có thay đổi về quy trình, coding standards, hoặc agent definitions → **CẬP NHẬT ĐỒNG THỜI** các file sau:

| File | Nội dung cần đồng bộ |
|------|----------------------|
| `.github/copilot-instructions.md` | Global rules, coding standards, agent table |
| `.github/agents/*.chatAgent.md` | Agent definition tương ứng |
| `.github/prompts/*.prompt.md` | Prompt template tương ứng |

**Nguyên tắc:** Chi tiết về từng agent nằm trong file agent riêng (`.chatAgent.md`). File global này chỉ chứa tổng quan, coding standards chung, và bảng tham chiếu.
