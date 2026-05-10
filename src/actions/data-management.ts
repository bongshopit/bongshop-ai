"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteAllDataSchema } from "@/lib/validators/data-management";

export type ActionState = { error?: string } | null;

export async function deleteAllData(formData: FormData): Promise<ActionState> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return { error: "Không có quyền thực hiện thao tác này" };
  }

  const parsed = deleteAllDataSchema.safeParse({
    confirmPhrase: String(formData.get("confirmPhrase") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Xác nhận không hợp lệ" };
  }

  try {
    await prisma.$transaction([
      // 1. Lịch sử tích điểm
      prisma.loyaltyLog.deleteMany(),
      // 2. Phiếu gửi hàng (CustomerStorageItem cascade khi xóa CustomerStorage)
      prisma.customerStorage.deleteMany(),
      // 3. Đơn hàng (OrderItem cascade khi xóa Order)
      prisma.order.deleteMany(),
      // 4. Khách hàng
      prisma.customer.deleteMany(),
      // 5. Phân ca
      prisma.shiftAssignment.deleteMany(),
      // 6. Chấm công
      prisma.attendance.deleteMany(),
      // 7. Bảng lương
      prisma.payroll.deleteMany(),
      // 8. Nhân viên
      prisma.employee.deleteMany(),
      // 9. Ca làm việc
      prisma.shift.deleteMany(),
      // 10. Biến động kho
      prisma.stockMovement.deleteMany(),
      // 11. Hàng hóa
      prisma.product.deleteMany(),
      // 12. Nhóm hàng
      prisma.productGroup.deleteMany(),
      // 13. Giao dịch sổ quỹ
      prisma.cashTransaction.deleteMany(),
    ]);

    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi không xác định";
    return { error: `Xóa dữ liệu thất bại: ${message}` };
  }
}
