"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema, stockInSchema, stockOutSchema } from "@/lib/validators/inventory";
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
