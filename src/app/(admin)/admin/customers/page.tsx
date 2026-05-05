import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Users } from "lucide-react";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CustomerSearch } from "@/components/shared/customer-search";
import { CustomerImportDialog } from "@/components/shared/customer-import-dialog";
import { Pagination } from "@/components/shared/pagination";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { DeleteAllCustomersButton } from "@/components/shared/delete-all-customers-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Khách hàng - BongShop",
  description: "Quản lý khách hàng BongShop",
};

const PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  page?: string;
}

async function getCustomers(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const where: Prisma.CustomerWhereInput = {};

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { phone: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [data, total, totalAll] = await Promise.all([
    prisma.customer.findMany({
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        loyaltyPointsDefault: true,
        loyaltyPointsSua: true,
        loyaltyPointsTaBim: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          where: { status: "COMPLETED" },
          select: { totalAmount: true },
        },
      },
    }),
    prisma.customer.count({ where }),
    prisma.customer.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const validPage = Math.min(page, totalPages);

  return { data, total, totalAll, page: validPage, totalPages };
}

async function CustomersTable({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ data: customers, total, totalAll, page, totalPages }, session] = await Promise.all([
    getCustomers(searchParams),
    getServerSession(authOptions),
  ]);
  const canImport =
    session?.user?.role === "MANAGER" || session?.user?.role === "ADMIN";
  // Filter out undefined/empty values to avoid "undefined" appearing in URL params
  const spParams = Object.fromEntries(
    Object.entries({ q: searchParams.q }).filter(
      ([, v]) => v !== undefined && v !== ""
    )
  ) as Record<string, string>;
  const isFiltered = Boolean(searchParams.q);

  return (
    <>
      {canImport && <CustomerImportDialog />}
      {/* Tổng số khách hàng */}
      <div className="mt-3 mb-3 flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-gray-400" />
          Tổng khách:{" "}
          <span className="font-semibold text-gray-900">
            {totalAll.toLocaleString("vi-VN")}
          </span>{" "}
          khách hàng
        </span>
        {isFiltered && total !== totalAll && (
          <span className="text-blue-600">
            ({total.toLocaleString("vi-VN")} kết quả lọc)
          </span>
        )}
      </div>
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Tên khách hàng</th>
                <th className="px-4 py-3 font-medium">SĐT</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Địa chỉ</th>
                <th className="px-4 py-3 font-medium">Điểm tích lũy</th>
                <th className="px-4 py-3 font-medium">Số đơn hàng</th>
                <th className="px-4 py-3 font-medium">Tổng chi tiêu</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    Không tìm thấy khách hàng nào
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const totalSpent = customer.orders.reduce(
                    (sum, o) => sum + Number(o.totalAmount),
                    0
                  );
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {customer.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {customer.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                        {customer.address ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-blue-600">
                          {customer.loyaltyPointsDefault + customer.loyaltyPointsSua + customer.loyaltyPointsTaBim}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-center">
                        {customer._count.orders}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {totalSpent.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(customer.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Xem
                          </Link>
                          <Link
                            href={`/admin/customers/${customer.id}/edit`}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Sửa
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={PAGE_SIZE}
        baseUrl="/admin/customers"
        searchParams={spParams}
      />
    </>
  );
}

export default function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h1>
        <div className="flex items-center gap-2">
          <DeleteAllCustomersButton />
          <Button asChild>
            <Link href="/admin/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              Thêm khách hàng
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<div className="h-10 w-80 bg-gray-200 rounded animate-pulse" />}>
        <CustomerSearch />
      </Suspense>

      <Suspense fallback={<TableSkeleton columns={9} rows={10} />}>
        <CustomersTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
