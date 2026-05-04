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

  // Batch fetch: lấy toàn bộ payroll hiện có + tổng giờ chấm công song song
  const [existingPayrolls, attendanceAggs] = await Promise.all([
    prisma.payroll.findMany({
      where: {
        employeeId: { in: employees.map((e) => e.id) },
        month,
        year,
      },
      select: { employeeId: true, status: true },
    }),
    prisma.attendance.groupBy({
      by: ["employeeId"],
      where: {
        employeeId: { in: employees.map((e) => e.id) },
        date: { gte: firstDay, lte: lastDay },
        totalHours: { not: null },
      },
      _sum: { totalHours: true },
    }),
  ]);

  const paidSet = new Set(
    existingPayrolls.filter((p) => p.status === "PAID").map((p) => p.employeeId)
  );
  const hoursMap = new Map(
    attendanceAggs.map((a) => [a.employeeId, Number(a._sum.totalHours ?? 0)])
  );

  // Chạy tất cả upsert song song với Promise.all
  const results = await Promise.all(
    employees
      .filter((emp) => !paidSet.has(emp.id))
      .map((emp) => {
        const totalHours = hoursMap.get(emp.id) ?? 0;
        const hourlyRate = Number(emp.hourlyRate);
        const allowance = Number(emp.allowance);
        const deduction = 0;
        const grossSalary = totalHours * hourlyRate;
        const netSalary = grossSalary + allowance - deduction;

        return prisma.payroll.upsert({
          where: { employeeId_month_year: { employeeId: emp.id, month, year } },
          update: { totalHours, hourlyRate, allowance, deduction, grossSalary, netSalary, status: "DRAFT" },
          create: { employeeId: emp.id, month, year, totalHours, hourlyRate, allowance, deduction, grossSalary, netSalary, status: "DRAFT" },
        });
      })
  );

  revalidatePath("/admin/payroll");
  return { count: results.length };
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
