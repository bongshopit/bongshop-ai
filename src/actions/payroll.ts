"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { payrollCalculateSchema, payrollAdjustSchema } from "@/lib/validators/payroll";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  count?: number;
} | null;

// AC-6.1: Tính lương toàn bộ nhân viên đang active cho tháng/năm
export async function calculatePayroll(formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = payrollCalculateSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { month, year } = parsed.data;

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0, 23, 59, 59, 999);

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: {
      id: true,
      hourlyRate: true,
      allowance: true,
    },
  });

  let count = 0;

  for (const emp of employees) {
    // BR-011: bỏ qua phiếu đã PAID
    const existing = await prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId: emp.id, month, year } },
      select: { status: true },
    });

    if (existing?.status === "PAID") continue;

    // Tổng giờ làm trong tháng từ Attendance
    const agg = await prisma.attendance.aggregate({
      where: {
        employeeId: emp.id,
        date: { gte: firstDay, lte: lastDay },
        totalHours: { not: null },
      },
      _sum: { totalHours: true },
    });

    const totalHours = Number(agg._sum.totalHours ?? 0);
    const hourlyRate = Number(emp.hourlyRate);
    const allowance = Number(emp.allowance);
    const deduction = 0;

    // BR-008: gross = totalHours × hourlyRate
    const grossSalary = totalHours * hourlyRate;
    // BR-009: net = gross + allowance - deduction
    const netSalary = grossSalary + allowance - deduction;

    await prisma.payroll.upsert({
      where: { employeeId_month_year: { employeeId: emp.id, month, year } },
      update: {
        totalHours,
        hourlyRate,
        allowance,
        deduction,
        grossSalary,
        netSalary,
        status: "DRAFT",
      },
      create: {
        employeeId: emp.id,
        month,
        year,
        totalHours,
        hourlyRate,
        allowance,
        deduction,
        grossSalary,
        netSalary,
        status: "DRAFT",
      },
    });

    count++;
  }

  revalidatePath("/admin/payroll");
  return { count };
}

// AC-6.3: Xác nhận phiếu lương DRAFT → CONFIRMED
export async function confirmPayroll(id: string): Promise<ActionState> {
  const payroll = await prisma.payroll.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!payroll) return { error: "Không tìm thấy phiếu lương" };
  if (payroll.status === "PAID") return { error: "Phiếu đã thanh toán, không thể thay đổi" };

  await prisma.payroll.update({
    where: { id },
    data: { status: "CONFIRMED" },
  });

  revalidatePath("/admin/payroll");
  revalidatePath(`/admin/payroll/${id}`);
  return null;
}

// AC-6.3: Đánh dấu đã trả CONFIRMED → PAID
export async function markPaid(id: string): Promise<ActionState> {
  const payroll = await prisma.payroll.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!payroll) return { error: "Không tìm thấy phiếu lương" };
  if (payroll.status !== "CONFIRMED") {
    return { error: "Chỉ xác nhận trả lương cho phiếu đã CONFIRMED" };
  }

  await prisma.payroll.update({
    where: { id },
    data: { status: "PAID" },
  });

  revalidatePath("/admin/payroll");
  revalidatePath(`/admin/payroll/${id}`);
  return null;
}

// AC-6.4: Điều chỉnh phụ cấp / khấu trừ cho phiếu DRAFT
export async function adjustPayroll(
  id: string,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = payrollAdjustSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const payroll = await prisma.payroll.findUnique({
    where: { id },
    select: { status: true, totalHours: true, hourlyRate: true },
  });

  if (!payroll) return { error: "Không tìm thấy phiếu lương" };
  if (payroll.status === "PAID") return { error: "Phiếu đã thanh toán, không thể chỉnh sửa" };

  const grossSalary = Number(payroll.totalHours) * Number(payroll.hourlyRate);
  const netSalary = grossSalary + parsed.data.allowance - parsed.data.deduction;

  await prisma.payroll.update({
    where: { id },
    data: {
      allowance: parsed.data.allowance,
      deduction: parsed.data.deduction,
      grossSalary,
      netSalary,
    },
  });

  revalidatePath("/admin/payroll");
  revalidatePath(`/admin/payroll/${id}`);
  return null;
}
