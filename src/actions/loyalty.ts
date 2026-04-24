"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addLoyaltyPointsSchema,
  adjustLoyaltyPointsSchema,
  confirmImportRowSchema,
  CATEGORY_LABELS,
  CATEGORY_FIELD_MAP,
  type LoyaltyCategory,
  type ConfirmImportRow,
} from "@/lib/validators/loyalty";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export type ConfirmImportState = {
  imported?: number;
  error?: string;
} | null;

function requireManagerOrAdmin(role: string): boolean {
  return role === "MANAGER" || role === "ADMIN";
}

// ─── Thêm điểm thủ công (EARN, chỉ số dương) ─────────────────────────────────

export async function addLoyaltyPoints(
  customerId: string,
  formData: FormData
): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session || !requireManagerOrAdmin(session.user.role)) {
    return { error: "Không có quyền thực hiện thao tác này" };
  }

  const parsed = addLoyaltyPointsSchema.safeParse({
    category: formData.get("category"),
    points: formData.get("points"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { category, points, reason } = parsed.data;
  const field = CATEGORY_FIELD_MAP[category as LoyaltyCategory];

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customerId },
      data: { [field]: { increment: points } },
    });
    await tx.loyaltyLog.create({
      data: {
        customerId,
        loyaltyCategory: category,
        type: "EARN",
        points,
        reason,
        createdBy: session.user.id,
      },
    });
  });

  revalidatePath(`/admin/customers/${customerId}`);
  return null;
}

// ─── Điều chỉnh điểm (ADJUST / EXPIRE, có thể âm) ────────────────────────────

export async function adjustLoyaltyPoints(
  customerId: string,
  formData: FormData
): Promise<ActionState> {
  const session = await getServerSession(authOptions);
  if (!session || !requireManagerOrAdmin(session.user.role)) {
    return { error: "Không có quyền thực hiện thao tác này" };
  }

  const parsed = adjustLoyaltyPointsSchema.safeParse({
    category: formData.get("category"),
    type: formData.get("type"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { category, type, delta, reason } = parsed.data;
  const categoryLabel = CATEGORY_LABELS[category as LoyaltyCategory];

  try {
    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: {
          loyaltyPointsDefault: true,
          loyaltyPointsSua: true,
          loyaltyPointsTaBim: true,
        },
      });
      if (!customer) throw new Error("Không tìm thấy khách hàng");

      const currentPoints =
        category === "SUA"
          ? customer.loyaltyPointsSua
          : category === "TA_BIM"
          ? customer.loyaltyPointsTaBim
          : customer.loyaltyPointsDefault;

      const newPoints = currentPoints + delta;
      if (newPoints < 0) {
        throw new Error(
          `Không đủ điểm ${categoryLabel} (hiện có ${currentPoints} điểm)`
        );
      }

      const field = CATEGORY_FIELD_MAP[category as LoyaltyCategory];
      await tx.customer.update({
        where: { id: customerId },
        data: { [field]: newPoints },
      });
      await tx.loyaltyLog.create({
        data: {
          customerId,
          loyaltyCategory: category,
          type,
          points: delta,
          reason,
          createdBy: session.user.id,
        },
      });
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Lỗi không xác định",
    };
  }

  revalidatePath(`/admin/customers/${customerId}`);
  return null;
}

// ─── Xác nhận import bulk ─────────────────────────────────────────────────────

export async function confirmLoyaltyImport(
  rows: ConfirmImportRow[],
  fileName: string
): Promise<ConfirmImportState> {
  const session = await getServerSession(authOptions);
  if (!session || !requireManagerOrAdmin(session.user.role)) {
    return { error: "Không có quyền thực hiện thao tác này" };
  }

  const validRows: ConfirmImportRow[] = [];
  for (const row of rows) {
    const parsed = confirmImportRowSchema.safeParse(row);
    if (parsed.success) validRows.push(parsed.data);
  }

  if (validRows.length === 0) {
    return { error: "Không có dữ liệu hợp lệ để import" };
  }

  if (validRows.length > 500) {
    return { error: "Mỗi batch tối đa 500 khách hàng" };
  }

  let importedCount = 0;

  try {
    await prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        const invoiceRef = row.invoiceIds.slice(0, 10).join(", ");
        const reasonBase = `Import KiotViet: ${fileName} [${invoiceRef}]`.slice(
          0,
          500
        );

        const hasDefault = row.pointsDefault > 0;
        const hasSua = row.pointsSua > 0;
        const hasTaBim = row.pointsTaBim > 0;

        if (!hasDefault && !hasSua && !hasTaBim) continue;

        await tx.customer.update({
          where: { id: row.customerId },
          data: {
            ...(hasDefault
              ? { loyaltyPointsDefault: { increment: row.pointsDefault } }
              : {}),
            ...(hasSua
              ? { loyaltyPointsSua: { increment: row.pointsSua } }
              : {}),
            ...(hasTaBim
              ? { loyaltyPointsTaBim: { increment: row.pointsTaBim } }
              : {}),
          },
        });

        const logs: { category: string; points: number }[] = [];
        if (hasDefault) logs.push({ category: "DEFAULT", points: row.pointsDefault });
        if (hasSua) logs.push({ category: "SUA", points: row.pointsSua });
        if (hasTaBim) logs.push({ category: "TA_BIM", points: row.pointsTaBim });

        for (const log of logs) {
          await tx.loyaltyLog.create({
            data: {
              customerId: row.customerId,
              loyaltyCategory: log.category,
              type: "EARN",
              points: log.points,
              reason: reasonBase,
              createdBy: session.user.id,
            },
          });
        }

        importedCount++;
      }
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Lỗi khi ghi điểm",
    };
  }

  revalidatePath("/admin/customers");
  return { imported: importedCount };
}
