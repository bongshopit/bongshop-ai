# Developer Skill — Implementation

## Thứ tự implementation

1. **Schema** — Kiểm tra Prisma schema. Thêm model/field nếu thiếu, chạy `npx prisma db push`
2. **Validators** — Zod schemas trong `src/lib/validators/<module>.ts`
3. **Server Actions** — `src/actions/<module>.ts` với "use server"
4. **UI** — Server Component page + Client Components khi cần

## Coding Rules — KHÔNG được vi phạm

- Server Components mặc định. `"use client"` chỉ khi có `useState`, `useEffect`, event handlers
- **Không `any`** — dùng Zod `infer<typeof schema>` cho types
- **Zod validate MỌI input** tại Server Actions (formData, params, searchParams)
- **Prisma singleton:** `import { prisma } from "@/lib/prisma"`
- **React 18:** dùng `useFormState` / `useFormStatus` từ `react-dom` — KHÔNG dùng `useActionState`
- `next/image` với width/height bắt buộc
- `next/link` cho navigation
- Boundary files: `error.tsx`, `not-found.tsx`, `loading.tsx` cho mỗi route segment
- SEO: export `metadata` hoặc `generateMetadata` trên mọi page

## Cấu trúc thư mục

```
src/
├── app/(admin)/admin/[module]/
│   ├── page.tsx          # Server Component
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── actions/[module].ts   # Server Actions ("use server")
├── lib/validators/[module].ts  # Zod schemas
└── components/shared/    # Reusable business components
```

## Naming conventions

- PascalCase: components, types
- camelCase: functions, variables, props
- kebab-case: file names, folder names

## Server Action template

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { moduleSchema } from "@/lib/validators/module";

export type ActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

export async function createItem(formData: FormData): Promise<ActionState> {
  const parsed = moduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await prisma.item.create({ data: parsed.data });
  revalidatePath("/admin/[module]");
  return null;
}
```

## Code phải hoàn chỉnh — không TODO, không placeholder