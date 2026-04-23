import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PayrollStatusButton } from "@/components/shared/payroll-status-button";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const payroll = await prisma.payroll.findUnique({
    where: { id: params.id },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });
  if (!payroll) return { title: "Không tìm thấy - BongShop" };
  return {
    title: `Phiếu lương — ${payroll.employee.lastName} ${payroll.employee.firstName} ${payroll.month}/${payroll.year} - BongShop`,
  };
}

function formatCurrency(value: number | { toString(): string }) {
  return Number(value).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  CONFIRMED: "Đã xác nhận",
  PAID: "Đã trả",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
};

export default async function PayrollDetailPage({ params }: Props) {
  const payroll = await prisma.payroll.findUnique({
    where: { id: params.id },
    include: {
      employee: {
        select: {
          employeeCode: true,
          firstName: true,
          lastName: true,
          department: true,
          position: true,
        },
      },
    },
  });

  if (!payroll) notFound();

  const rows = [
    { label: "Tổng giờ làm", value: `${Number(payroll.totalHours).toFixed(2)} giờ` },
    { label: "Đơn giá giờ", value: formatCurrency(payroll.hourlyRate) },
    { label: "Lương gross (giờ × đơn giá)", value: formatCurrency(payroll.grossSalary), bold: true },
    { label: "Phụ cấp", value: `+ ${formatCurrency(payroll.allowance)}`, color: "text-green-700" },
    { label: "Khấu trừ", value: `- ${formatCurrency(payroll.deduction)}`, color: "text-red-700" },
    { label: "Lương net", value: formatCurrency(payroll.netSalary), bold: true, color: "text-blue-700" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/payroll"
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Chi tiết phiếu lương</h1>
      </div>

      {/* Employee info */}
      <div className="rounded-lg border bg-white p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {payroll.employee.lastName} {payroll.employee.firstName}
            </p>
            <p className="text-sm text-gray-500">
              {payroll.employee.employeeCode} · {payroll.employee.department} · {payroll.employee.position}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              Tháng {payroll.month}/{payroll.year}
            </p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[payroll.status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {STATUS_LABEL[payroll.status] ?? payroll.status}
            </span>
          </div>
        </div>
      </div>

      {/* Salary breakdown — AC-6.4 */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="font-semibold text-gray-700">Chi tiết tính lương</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-6 py-3">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span
                className={`text-sm ${row.bold ? "font-bold" : "font-medium"} ${row.color ?? "text-gray-900"}`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <PayrollStatusButton id={payroll.id} status={payroll.status} />
      </div>
    </div>
  );
}
