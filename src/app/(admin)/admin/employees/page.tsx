import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { EmployeeSearch } from "@/components/shared/employee-search";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton } from "@/components/shared/table-skeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nhân viên - BongShop",
  description: "Quản lý nhân viên BongShop",
};

const PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  page?: string;
}

async function getEmployees(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const where: Prisma.EmployeeWhereInput = { isActive: true };

  if (params.q) {
    where.OR = [
      { firstName: { contains: params.q, mode: "insensitive" } },
      { lastName: { contains: params.q, mode: "insensitive" } },
      { employeeCode: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      orderBy: { createdAt: "desc" },
    }),
    prisma.employee.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const validPage = Math.min(page, totalPages);

  return { data, total, page: validPage, totalPages };
}

async function EmployeesTable({ searchParams }: { searchParams: SearchParams }) {
  const { data: employees, total, page, totalPages } = await getEmployees(searchParams);
  const spParams = { q: searchParams.q } as Record<string, string>;

  return (
    <>
      <div className="mt-4 rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Mã NV</th>
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">SĐT</th>
                <th className="px-4 py-3 font-medium">Loại lương</th>
                <th className="px-4 py-3 font-medium">Mức lương</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.employeeCode}</td>
                    <td className="px-4 py-3 text-gray-700">{emp.lastName} {emp.firstName}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.email}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        emp.salaryType === "MONTHLY"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {emp.salaryType === "MONTHLY" ? "Theo tháng" : "Theo giờ"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {emp.salaryType === "MONTHLY"
                        ? `${Number(emp.monthlySalary).toLocaleString("vi-VN")}đ/tháng`
                        : `${Number(emp.hourlyRate).toLocaleString("vi-VN")}đ/giờ`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/employees/${emp.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Xem
                        </Link>
                        <Link href={`/admin/employees/${emp.id}/edit`} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                          Sửa
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
          Tổng: {total} nhân viên
        </div>
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={PAGE_SIZE}
        baseUrl="/admin/employees"
        searchParams={spParams}
      />
    </>
  );
}

export default function EmployeesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
        <Button asChild>
          <Link href="/admin/employees/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhân viên
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={<div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />}
      >
        <EmployeeSearch />
      </Suspense>

      <Suspense fallback={<TableSkeleton columns={7} rows={10} />}>
        <EmployeesTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}