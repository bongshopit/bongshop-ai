"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
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

  const { employeeCode, firstName, lastName, email, phone, salaryType, hourlyRate, monthlySalary } = parsed.data;

  const [codeConflict, emailConflict] = await Promise.all([
    prisma.employee.findUnique({ where: { employeeCode } }),
    prisma.employee.findUnique({ where: { email } }),
  ]);

  if (codeConflict) return { error: "Mã nhân viên đã tồn tại" };
  if (emailConflict) return { error: "Email đã được sử dụng" };

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { error: "Email đã được sử dụng bởi tài khoản khác" };

  const passwordHash = await bcrypt.hash("bongshop", 12);

  await prisma.user.create({
    data: {
      email,
      name: `${lastName} ${firstName}`,
      passwordHash,
      role: "STAFF",
      employee: {
        create: {
          employeeCode,
          firstName,
          lastName,
          email,
          phone,
          salaryType,
          hourlyRate: salaryType === "HOURLY" ? hourlyRate ?? 0 : 0,
          monthlySalary: salaryType === "MONTHLY" ? monthlySalary ?? 0 : 0,
        },
      },
    },
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

  const { employeeCode, firstName, lastName, email, phone, salaryType, hourlyRate, monthlySalary } = parsed.data;

  const codeConflict = await prisma.employee.findFirst({
    where: { employeeCode, id: { not: id } },
  });

  if (codeConflict) return { error: "Mã nhân viên đã tồn tại" };

  await prisma.employee.update({
    where: { id },
    data: {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      salaryType,
      hourlyRate: salaryType === "HOURLY" ? hourlyRate ?? 0 : 0,
      monthlySalary: salaryType === "MONTHLY" ? monthlySalary ?? 0 : 0,
    },
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
