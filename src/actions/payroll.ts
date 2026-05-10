"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { payrollCalculateSchema, payrollAdjustmentSchema, payrollAdjustmentBatchSchema } from "@/lib/validators/payroll";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  count?: number;
} | null;

async function recalcPayroll(payrollId: string): Promise<void> {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    select: { grossSalary: true, adjustments: { select: { type: true, amount: true } } },
  });
  if (!payroll) return;

  const allowance = payroll.adjustments
    .filter((a) => a.type === "ADD")
    .reduce((s, a) => s + Number(a.amount), 0);
  const deduction = payroll.adjustments
    .filter((a) => a.type === "SUBTRACT")
    .reduce((s, a) => s + Number(a.amount), 0);
  const netSalary = Number(payroll.grossSalary) + allowance - deduction;

  await prisma.payroll.update({
    where: { id: payrollId },
    data: { allowance, deduction, netSalary },
  });
}

export async function calculatePayroll(formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = payrollCalculateSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { month, year, employeeId } = parsed.data;

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0, 23, 59, 59, 999);

  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      ...(employeeId ? { id: employeeId } : {}),
    },
    select: {
      id: true,
      salaryType: true,
      hourlyRate: true,
      monthlySalary: true,
    },
  });

  const [existingPayrolls, attendanceAggs] = await Promise.all([
    prisma.payroll.findMany({
      where: {
        employeeId: { in: employees.map((e) => e.id) },
        month,
        year,
      },
      select: {
        id: true,
        employeeId: true,
        status: true,
        adjustments: { select: { id: true, type: true, amount: true } },
      },
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

  const payrollMap = new Map(existingPayrolls.map((p) => [p.employeeId, p]));
  const hoursMap = new Map(
    attendanceAggs.map((a) => [a.employeeId, Number(a._sum.totalHours ?? 0)])
  );

  let processedCount = 0;

  await Promise.all(
    employees.map(async (emp) => {
      const existing = payrollMap.get(emp.id);
      if (existing?.status === "PAID") return;

      const totalHours = emp.salaryType === "MONTHLY" ? 0 : (hoursMap.get(emp.id) ?? 0);
      const hourlyRate = Number(emp.hourlyRate);
      const monthlySalary = Number(emp.monthlySalary ?? 0);
      const grossSalary =
        emp.salaryType === "MONTHLY" ? monthlySalary : totalHours * hourlyRate;

      if (existing) {
        const allowance = existing.adjustments
          .filter((a) => a.type === "ADD")
          .reduce((s, a) => s + Number(a.amount), 0);
        const deduction = existing.adjustments
          .filter((a) => a.type === "SUBTRACT")
          .reduce((s, a) => s + Number(a.amount), 0);
        const netSalary = grossSalary + allowance - deduction;

        await prisma.payroll.update({
          where: { id: existing.id },
          data: { totalHours, hourlyRate, grossSalary, allowance, deduction, netSalary, status: "DRAFT" },
        });
      } else {
        await prisma.payroll.create({
          data: {
            employeeId: emp.id,
            month,
            year,
            totalHours,
            hourlyRate,
            grossSalary,
            allowance: 0,
            deduction: 0,
            netSalary: grossSalary,
            status: "DRAFT",
          },
        });
      }
      processedCount++;
    })
  );

  revalidatePath("/admin/payroll");
  return { count: processedCount };
}

export async function confirmPayroll(id: string): Promise<ActionState> {
  const payroll = await prisma.payroll.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!payroll) return { error: "Kh\u00f4ng t\u00ecm th\u1ea5y phi\u1ebfu l\u01b0\u01a1ng" };
  if (payroll.status === "PAID") return { error: "Phi\u1ebfu \u0111\u00e3 thanh to\u00e1n, kh\u00f4ng th\u1ec3 thay \u0111\u1ed5i" };

  await prisma.payroll.update({
    where: { id },
    data: { status: "CONFIRMED" },
  });

  revalidatePath("/admin/payroll");
  revalidatePath(`/admin/payroll/${id}`);
  return null;
}

export async function markPaid(id: string): Promise<ActionState> {
  const payroll = await prisma.payroll.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!payroll) return { error: "Kh\u00f4ng t\u00ecm th\u1ea5y phi\u1ebfu l\u01b0\u01a1ng" };
  if (payroll.status !== "CONFIRMED") {
    return { error: "Ch\u1ec9 x\u00e1c nh\u1eadn tr\u1ea3 l\u01b0\u01a1ng cho phi\u1ebfu \u0111\u00e3 CONFIRMED" };
  }

  await prisma.payroll.update({
    where: { id },
    data: { status: "PAID" },
  });

  revalidatePath("/admin/payroll");
  revalidatePath(`/admin/payroll/${id}`);
  return null;
}

export async function addPayrollAdjustment(
  payrollId: string,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = payrollAdjustmentSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    select: { status: true },
  });

  if (!payroll) return { error: "Kh\u00f4ng t\u00ecm th\u1ea5y phi\u1ebfu l\u01b0\u01a1ng" };
  if (payroll.status !== "DRAFT") return { error: "Ch\u1ec9 \u0111\u01b0\u1ee3c ch\u1ec9nh s\u1eeda phi\u1ebfu \u1edf tr\u1ea1ng th\u00e1i Nh\u00e1p" };

  await prisma.payrollAdjustment.create({
    data: {
      payrollId,
      label: parsed.data.label,
      amount: parsed.data.amount,
      type: parsed.data.type,
    },
  });

  await recalcPayroll(payrollId);
  revalidatePath(`/admin/payroll/${payrollId}`);
  revalidatePath("/admin/payroll");
  return null;
}

export async function deletePayrollAdjustment(
  adjustmentId: string,
  payrollId: string
): Promise<ActionState> {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    select: { status: true },
  });

  if (!payroll) return { error: "Kh\u00f4ng t\u00ecm th\u1ea5y phi\u1ebfu l\u01b0\u01a1ng" };
  if (payroll.status !== "DRAFT") return { error: "Ch\u1ec9 \u0111\u01b0\u1ee3c ch\u1ec9nh s\u1eeda phi\u1ebfu \u1edf tr\u1ea1ng th\u00e1i Nh\u00e1p" };

  await prisma.payrollAdjustment.delete({ where: { id: adjustmentId } });

  await recalcPayroll(payrollId);
  revalidatePath(`/admin/payroll/${payrollId}`);
  revalidatePath("/admin/payroll");
  return null;
}

// AC-6.7: Thêm nhiều khoản điều chỉnh cùng lúc
export async function addPayrollAdjustmentBatch(
  payrollId: string,
  items: { label: string; amount: number; type: string }[]
): Promise<ActionState> {
  const parsed = payrollAdjustmentBatchSchema.safeParse(items);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    select: { status: true },
  });

  if (!payroll) return { error: "Không tìm thấy phiếu lương" };
  if (payroll.status !== "DRAFT") return { error: "Chỉ được chỉnh sửa phiếu ở trạng thái Nháp" };

  await prisma.$transaction(
    parsed.data.map((item) =>
      prisma.payrollAdjustment.create({
        data: { payrollId, label: item.label, amount: item.amount, type: item.type },
      })
    )
  );

  await recalcPayroll(payrollId);
  revalidatePath(`/admin/payroll/${payrollId}`);
  revalidatePath("/admin/payroll");
  return null;
}