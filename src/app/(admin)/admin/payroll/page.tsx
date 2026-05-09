import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CalculatePayrollForm } from "@/components/shared/calculate-payroll-form";
import { PayrollStatusButton } from "@/components/shared/payroll-status-button";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton } from "@/components/shared/table-skeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lương - BongShop",
  description: "Quản lý bảng lương nhân viên BongShop",
};

const PAGE_SIZE = 25;

interface SearchParams {
  month?: string;
  year?: string;
  page?: string;
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

function formatCurrency(value: number | { toString(): string }) {
  return Number(value).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

async function getPayrolls(month: number, year: number, page: number) {
  const where: Prisma.PayrollWhereInput = { month, year };

  const [data, total] = await Promise.all([
    prisma.payroll.findMany({
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { employee: { employeeCode: "asc" } }],
    }),
    prisma.payroll.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const validPage = Math.min(page, totalPages);

  return { data, total, page: validPage, totalPages };
}



async function PayrollData({ searchParams }: { searchParams: SearchParams }) {
  const now = new Date();
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1), 10);
  const year = parseInt(searchParams.year ?? String(now.getFullYear()), 10);
  const pageNum = Math.max(1, parseInt(searchParams.page ?? "1") || 1);

  const { data: payrolls, total, page, totalPages } = await getPayrolls(month, year, pageNum);

  const totalGross = payrolls.reduce((s, p) => s + Number(p.grossSalary), 0);
  const totalNet = payrolls.reduce((s, p) => s + Number(p.netSalary), 0);

  return (
    <div className="space-y-4">
      {payrolls.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-gray-500">Số nhân viên</p>
            <p className="text-2xl font-bold text-gray-900">{payrolls.length}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-gray-500">Tổng gross</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalGross)}</p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs text-gray-500">Tổng net</p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(totalNet)}</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Mã NV</th>
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Phòng ban</th>
                <th className="px-4 py-3 font-medium text-right">Giờ làm</th>
                <th className="px-4 py-3 font-medium text-right">Đơn giá</th>
                <th className="px-4 py-3 font-medium text-right">Gross</th>
                <th className="px-4 py-3 font-medium text-right">Net</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    Chưa có bảng lương tháng {month}/{year}. Nhấn “Tính lương” để tổng hợp.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {p.employee.employeeCode}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {p.employee.lastName} {p.employee.firstName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.employee.department}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {Number(p.totalHours).toFixed(1)}h
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(p.hourlyRate)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(p.grossSalary)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">
                      {formatCurrency(p.netSalary)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/payroll/${p.id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Chi tiết
                        </Link>
                        <PayrollStatusButton id={p.id} status={p.status} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={PAGE_SIZE}
          baseUrl="/admin/payroll"
          searchParams={{
            month: String(month),
            year: String(year),
          }}
        />
      </div>
    </div>
  );
}

function PayrollDataSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border bg-white p-4 h-16 animate-pulse bg-gray-50" />
        ))}
      </div>
      <TableSkeleton columns={9} rows={10} />
    </div>
  );
}

export default function PayrollPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const now = new Date();
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1), 10);
  const year = parseInt(searchParams.year ?? String(now.getFullYear()), 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bảng lương</h1>

      {/* Calculate payroll form — immediate */}
      <div className="rounded-lg border bg-white p-5">
        <p className="text-sm text-gray-500 mb-3">
          Chọn tháng/năm và nhấn <strong>Tính lương</strong> để tổng hợp giờ làm từ chấm công.
          Phiếu đã <span className="text-green-700 font-medium">Đã trả</span> sẽ không bị tính lại.
        </p>
        <CalculatePayrollForm defaultMonth={month} defaultYear={year} />
      </div>

      {/* Month/year selector — immediate, no DB dependency */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="block text-xs text-gray-500">Xem tháng</label>
          <select
            name="month"
            defaultValue={month}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-gray-500">Năm</label>
          <select
            name="year"
            defaultValue={year}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 6 }, (_, i) => now.getFullYear() - 5 + i + 1).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
        >
          Xem
        </button>
      </form>

      {/* Payroll data — in Suspense */}
      <Suspense fallback={<PayrollDataSkeleton />}>
        <PayrollData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
