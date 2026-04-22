"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AttendanceActionState = { error: string } | null;

export async function checkIn(
  _prev: AttendanceActionState,
  _formData: FormData
): Promise<AttendanceActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Chưa đăng nhập" };

  // Tìm employee liên kết với user
  const employee = await prisma.employee.findFirst({
    where: { user: { id: session.user.id } },
  });
  if (!employee) return { error: "Không tìm thấy thông tin nhân viên" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Kiểm tra đã check-in hôm nay chưa
  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  if (existing?.checkIn) {
    return { error: "Bạn đã check-in hôm nay rồi" };
  }

  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
    update: { checkIn: new Date() },
    create: { employeeId: employee.id, date: today, checkIn: new Date() },
  });

  revalidatePath("/admin/attendance");
  return null;
}

export async function checkOut(
  _prev: AttendanceActionState,
  _formData: FormData
): Promise<AttendanceActionState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Chưa đăng nhập" };

  const employee = await prisma.employee.findFirst({
    where: { user: { id: session.user.id } },
  });
  if (!employee) return { error: "Không tìm thấy thông tin nhân viên" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const record = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: today } },
  });

  if (!record?.checkIn) {
    return { error: "Bạn chưa check-in hôm nay" };
  }
  if (record.checkOut) {
    return { error: "Bạn đã check-out hôm nay rồi" };
  }

  const checkOutTime = new Date();
  const totalHours =
    (checkOutTime.getTime() - record.checkIn.getTime()) / 3_600_000;

  await prisma.attendance.update({
    where: { id: record.id },
    data: {
      checkOut: checkOutTime,
      totalHours: Math.round(totalHours * 100) / 100,
    },
  });

  revalidatePath("/admin/attendance");
  return null;
}
