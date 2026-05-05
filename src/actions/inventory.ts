"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  productSchema,
  stockInSchema,
  stockOutSchema,
  productImportRowSchema,
  productGroupUpdateSchema,
  type ProductImportRow,
} from "@/lib/validators/inventory";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.name ?? "unknown";
}

// ==================== PRODUCT ====================

export async function createProduct(formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.product.findUnique({
    where: { sku: parsed.data.sku },
  });

  if (existing) {
    return { error: "Mã SKU đã tồn tại" };
  }

  await prisma.product.create({
    data: {
      sku: parsed.data.sku,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      unit: parsed.data.unit,
      costPrice: parsed.data.costPrice,
      sellPrice: parsed.data.sellPrice,
      quantity: 0,
    },
  });

  revalidatePath("/admin/inventory");
  return null;
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.product.findFirst({
    where: { sku: parsed.data.sku, id: { not: id } },
  });

  if (existing) {
    return { error: "Mã SKU đã tồn tại" };
  }

  await prisma.product.update({
    where: { id },
    data: {
      sku: parsed.data.sku,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      unit: parsed.data.unit,
      costPrice: parsed.data.costPrice,
      sellPrice: parsed.data.sellPrice,
    },
  });

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${id}`);
  revalidatePath(`/admin/inventory/${id}/edit`);
  return null;
}

export async function toggleProductStatus(
  id: string,
  isActive: boolean
): Promise<void> {
  await prisma.product.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${id}`);
}

// ==================== STOCK MOVEMENTS ====================

export async function stockIn(formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = stockInSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const createdBy = await getSessionUser();

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        productId: parsed.data.productId,
        type: "IN",
        quantity: parsed.data.quantity,
        reason: parsed.data.reason ?? null,
        createdBy,
      },
    });

    await tx.product.update({
      where: { id: parsed.data.productId },
      data: { quantity: { increment: parsed.data.quantity } },
    });
  });

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${parsed.data.productId}`);
  return null;
}

export async function stockOut(formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = stockOutSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { quantity: true },
  });

  if (!product) {
    return { error: "Sản phẩm không tồn tại" };
  }

  if (product.quantity < parsed.data.quantity) {
    return { error: `Tồn kho không đủ (hiện có: ${product.quantity})` };
  }

  const createdBy = await getSessionUser();

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        productId: parsed.data.productId,
        type: "OUT",
        quantity: parsed.data.quantity,
        reason: parsed.data.reason ?? null,
        createdBy,
      },
    });

    await tx.product.update({
      where: { id: parsed.data.productId },
      data: { quantity: { decrement: parsed.data.quantity } },
    });
  });

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/${parsed.data.productId}`);
  return null;
}

// ==================== US-010: IMPORT PRODUCTS ====================

function detectLoyaltyCategory(groupName: string): "DEFAULT" | "SUA" | "TA_BIM" {
  const SUA_GROUPS = new Set([
    "SỮA",
    "SỮA BỘT",
    "SỮA NƯỚC(SỮA BỘT PHA SẴN)",
  ]);
  const TA_BIM_GROUPS = new Set(["BỈM TẢ"]);
  const normalized = groupName.trim().toUpperCase();
  if (TA_BIM_GROUPS.has(normalized)) return "TA_BIM";
  if (SUA_GROUPS.has(normalized)) return "SUA";
  return "DEFAULT";
}

export type ImportProductsResult =
  | { created: number; updated: number; skipped: number }
  | { error: string };

export async function importProducts(
  rows: unknown[]
): Promise<ImportProductsResult> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: "Không có dữ liệu để import" };
  }

  // Validate rows
  const validRows: ProductImportRow[] = [];
  for (const row of rows) {
    const parsed = productImportRowSchema.safeParse(row);
    if (parsed.success) {
      validRows.push(parsed.data);
    }
  }

  if (validRows.length === 0) {
    return { error: "Không có dòng hợp lệ để import" };
  }

  // Upsert product groups (sequential, few unique groups per batch)
  const uniqueGroupNames = Array.from(
    new Set(validRows.map((r) => r.groupName).filter((n): n is string => Boolean(n)))
  );
  const groupMap = new Map<string, string>(); // name → id

  for (const name of uniqueGroupNames) {
    const category = detectLoyaltyCategory(name);
    const group = await prisma.productGroup.upsert({
      where: { name },
      update: {},
      create: { name, loyaltyCategory: category },
    });
    groupMap.set(name, group.id);
  }

  // Fetch all existing SKUs in a single query to track created vs updated
  const skus = validRows.map((r) => r.sku);
  const existingSkuSet = new Set(
    (
      await prisma.product.findMany({
        where: { sku: { in: skus } },
        select: { sku: true },
      })
    ).map((p) => p.sku)
  );

  const created = validRows.filter((r) => !existingSkuSet.has(r.sku)).length;
  const updated = validRows.filter((r) => existingSkuSet.has(r.sku)).length;

  // Single bulk INSERT ... ON CONFLICT DO UPDATE — 1 SQL statement per batch
  // (replaces prisma.$transaction([...N upserts]) which generated N SQL statements)
  const valueFragments = validRows.map((row) => {
    const productGroupId = row.groupName
      ? (groupMap.get(row.groupName) ?? null)
      : null;
    return Prisma.sql`(
      gen_random_uuid(),
      ${row.sku},
      ${row.name},
      ${row.description ?? null},
      ${row.unit || "cái"},
      ${row.sellPrice},
      ${row.costPrice},
      ${row.quantity},
      ${productGroupId},
      ${row.brand ?? null},
      ${row.imageUrl ?? null},
      ${row.barcode ?? null},
      ${row.allowLoyalty},
      ${row.isActive},
      NOW(),
      NOW()
    )`;
  });

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "products" (
        id, sku, name, description, unit,
        "sellPrice", "costPrice", quantity, "productGroupId",
        brand, "imageUrl", barcode, "allowLoyalty", "isActive",
        "createdAt", "updatedAt"
      )
      VALUES ${Prisma.join(valueFragments)}
      ON CONFLICT (sku) DO UPDATE SET
        name        = EXCLUDED.name,
        description = EXCLUDED.description,
        unit        = EXCLUDED.unit,
        "sellPrice"      = EXCLUDED."sellPrice",
        "costPrice"      = EXCLUDED."costPrice",
        quantity         = EXCLUDED.quantity,
        "productGroupId" = EXCLUDED."productGroupId",
        brand       = EXCLUDED.brand,
        "imageUrl"  = EXCLUDED."imageUrl",
        barcode     = EXCLUDED.barcode,
        "allowLoyalty" = EXCLUDED."allowLoyalty",
        "isActive"  = EXCLUDED."isActive",
        "updatedAt" = NOW()
    `
  );

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/groups");

  return { created, updated, skipped: rows.length - validRows.length };
}

// ==================== US-010: PRODUCT GROUPS ====================

export async function updateProductGroup(
  id: string,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    loyaltyCategory: String(formData.get("loyaltyCategory") ?? ""),
  };
  const parsed = productGroupUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await prisma.productGroup.update({
    where: { id },
    data: { loyaltyCategory: parsed.data.loyaltyCategory },
  });
  revalidatePath("/admin/inventory/groups");
  return null;
}

