import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { EmployeeSearch } from "@/components/shared/employee-search";
import { Pagination } from "@/components/shared/pagination";

export const metadata: Metadata = {
  title: "Nhân viên - BongShop",
  description: "Quản lý nhân viên BongShop",
};

const PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  department?: string;
  status?: string;
  page?: string;
}

async function getEmployees(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const where: Prisma.EmployeeWhereInput = {};

  if (params.q) {
    where.OR = [
      { firstName: { contains: params.q, mode: "insensitive" } },
      { lastName: { contains: params.q, mode: "insensitive" } },
      { employeeCode: { contains: params.q, mode: "insensitive" } },
    ];
  }

  if (params.department) {
    where.department = params.department;
  }

  if (params.status === "active") {
    where.isActive = true;
  } else if (params.status === "inactive") {
    where.isActive = false;
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

async function getDepartments() {
  const result = await prisma.employee.findMany({
    select: { department: true },
    distinct: ["department"],
    orderBy: { department: "asc" },
  });
  return result.map((r) => r.department).filter((d): d is string => d !== null);
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ data: employees, total, page, totalPages }, departments] = await Promise.all([
    getEmployees(searchParams),
    getDepartments(),
  ]);
  const spParams = {
    q: searchParams.q,
    department: searchParams.department,
    status: searchParams.status,
  } as Record<string, string>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
        <Button asChild>
          <Link href="/admin/employees/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhân viên
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="h-10 w-96 bg-gray-200 rounded animate-pulse" />
        }
      >
        <EmployeeSearch departments={departments} />
      </Suspense>

      <div className="mt-4 rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Mã NV</th>
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">SĐT</th>
                <th className="px-4 py-3 font-medium">Phòng ban</th>
                <th className="px-4 py-3 font-medium">Chức vụ</th>
                <th className="px-4 py-3 font-medium">Lương/giờ</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {emp.employeeCode}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {emp.lastName} {emp.firstName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{emp.email}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.phone}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {emp.department}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{emp.position}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {Number(emp.hourlyRate).toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          emp.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {emp.isActive ? "Đang làm" : "Đã nghỉ"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/employees/${emp.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Xem
                        </Link>
                        <Link
                          href={`/admin/employees/${emp.id}/edit`}
                          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                        >
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
    </div>
  );
}
