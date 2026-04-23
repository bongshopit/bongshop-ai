"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  customerCreateSchema,
  customerUpdateSchema,
} from "@/lib/validators/customer";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

function normalizeOptionalString(val: FormDataEntryValue | null): string | undefined {
  if (!val || String(val).trim() === "") return undefined;
  return String(val).trim();
}

export async function createCustomer(formData: FormData): Promise<ActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    phone: normalizeOptionalString(formData.get("phone")),
    email: normalizeOptionalString(formData.get("email")),
    address: normalizeOptionalString(formData.get("address")),
    note: normalizeOptionalString(formData.get("note")),
  };

  const parsed = customerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.phone) {
    const existing = await prisma.customer.findUnique({
      where: { phone: parsed.data.phone },
    });
    if (existing) {
      return { error: "Số điện thoại đã được đăng ký" };
    }
  }

  await prisma.customer.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      note: parsed.data.note ?? null,
    },
  });

  revalidatePath("/admin/customers");
  return null;
}

export async function updateCustomer(
  id: string,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    phone: normalizeOptionalString(formData.get("phone")),
    email: normalizeOptionalString(formData.get("email")),
    address: normalizeOptionalString(formData.get("address")),
    note: normalizeOptionalString(formData.get("note")),
  };

  const parsed = customerUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.phone) {
    const existing = await prisma.customer.findFirst({
      where: { phone: parsed.data.phone, id: { not: id } },
    });
    if (existing) {
      return { error: "Số điện thoại đã được đăng ký" };
    }
  }

  await prisma.customer.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      note: parsed.data.note ?? null,
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id}`);
  return null;
}

export async function deleteCustomer(id: string): Promise<ActionState> {
  const orderCount = await prisma.order.count({ where: { customerId: id } });
  if (orderCount > 0) {
    return { error: "Không thể xóa khách hàng đã có đơn hàng" };
  }
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/admin/customers");
  return null;
}
