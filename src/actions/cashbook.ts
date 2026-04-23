"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cashTransactionSchema } from "@/lib/validators/cashbook";
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

export async function getBalance(): Promise<number> {
  const result = await prisma.cashTransaction.groupBy({
    by: ["type"],
    _sum: { amount: true },
  });

  let income = 0;
  let expense = 0;

  for (const row of result) {
    const val = Number(row._sum.amount ?? 0);
    if (row.type === "INCOME") income = val;
    if (row.type === "EXPENSE") expense = val;
  }

  return income - expense;
}

export async function createTransaction(formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = cashTransactionSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // BR-005: kiểm tra số dư khi chi
  if (parsed.data.type === "EXPENSE") {
    const balance = await getBalance();
    if (balance < parsed.data.amount) {
      return {
        error: `Số dư quỹ không đủ (hiện có: ${balance.toLocaleString("vi-VN")} VNĐ)`,
      };
    }
  }

  const createdBy = await getSessionUser();

  await prisma.cashTransaction.create({
    data: {
      type: parsed.data.type,
      amount: parsed.data.amount,
      description: parsed.data.description,
      category: parsed.data.category ?? null,
      date: parsed.data.date,
      createdBy,
    },
  });

  revalidatePath("/admin/cashbook");
  return null;
}

export async function deleteTransaction(id: string): Promise<void> {
  await prisma.cashTransaction.delete({ where: { id } });
  revalidatePath("/admin/cashbook");
}
