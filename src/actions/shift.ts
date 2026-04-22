"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { shiftSchema, shiftAssignmentSchema } from "@/lib/validators/shift";

export type ShiftActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
} | null;

export async function createShift(
  _prev: ShiftActionState,
  formData: FormData
): Promise<ShiftActionState> {
  const parsed = shiftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await prisma.shift.create({ data: parsed.data });
  revalidatePath("/admin/shifts");
  return { success: true };
}

export async function updateShift(
  _prev: ShiftActionState,
  formData: FormData
): Promise<ShiftActionState> {
  const id = formData.get("id") as string;
  if (!id) return { error: "ID khong hop le" };

  const parsed = shiftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await prisma.shift.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/shifts");
  return { success: true };
}

export async function deleteShift(id: string): Promise<{ error: string } | null> {
  const count = await prisma.shiftAssignment.count({ where: { shiftId: id } });
  if (count > 0) return { error: "Ca dang duoc su dung, khong the xoa" };

  await prisma.shift.delete({ where: { id } });
  revalidatePath("/admin/shifts");
  return null;
}

export async function createShiftAssignment(
  _prev: ShiftActionState,
  formData: FormData
): Promise<ShiftActionState> {
  const parsed = shiftAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { employeeId, shiftId, date } = parsed.data;
  const dateObj = new Date(date + "T00:00:00.000Z");

  const existing = await prisma.shiftAssignment.findUnique({
    where: { employeeId_shiftId_date: { employeeId, shiftId, date: dateObj } },
  });
  if (existing) return { error: "Nhan vien da duoc phan ca nay trong ngay" };

  await prisma.shiftAssignment.create({ data: { employeeId, shiftId, date: dateObj } });
  revalidatePath("/admin/shifts");
  return { success: true };
}

export async function deleteShiftAssignment(id: string): Promise<void> {
  await prisma.shiftAssignment.delete({ where: { id } });
  revalidatePath("/admin/shifts");
}
