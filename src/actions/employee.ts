"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validators/employee";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function createEmployee(formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = employeeSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.employee.findUnique({
    where: { employeeCode: parsed.data.employeeCode },
  });

  if (existing) {
    return { error: "Mã nhân viên đã tồn tại" };
  }

  await prisma.employee.create({
    data: parsed.data,
  });

  revalidatePath("/admin/employees");
  return null;
}

export async function updateEmployee(
  id: string,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = employeeSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.employee.findFirst({
    where: { employeeCode: parsed.data.employeeCode, id: { not: id } },
  });

  if (existing) {
    return { error: "Mã nhân viên đã tồn tại" };
  }

  await prisma.employee.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${id}`);
  revalidatePath(`/admin/employees/${id}/edit`);
  return null;
}

export async function deactivateEmployee(id: string): Promise<void> {
  await prisma.employee.update({
    where: { id },
    data: { isActive: false },
  });
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${id}`);
}

export async function activateEmployee(id: string): Promise<void> {
  await prisma.employee.update({
    where: { id },
    data: { isActive: true },
  });
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${id}`);
}
