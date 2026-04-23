import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CustomerSearch } from "@/components/shared/customer-search";

export const metadata: Metadata = {
  title: "Khách hàng - BongShop",
  description: "Quản lý khách hàng BongShop",
};

interface SearchParams {
  q?: string;
}

async function getCustomers(params: SearchParams) {
  const where: Prisma.CustomerWhereInput = {};

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { phone: { contains: params.q, mode: "insensitive" } },
    ];
  }

  return prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
      orders: {
        where: { status: "COMPLETED" },
        select: { totalAmount: true },
      },
    },
  });
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const customers = await getCustomers(searchParams);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h1>
        <Button asChild>
          <Link href="/admin/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khách hàng
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="h-10 w-80 bg-gray-200 rounded animate-pulse" />}>
        <CustomerSearch />
      </Suspense>

      <div className="mt-4 rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Tên khách hàng</th>
                <th className="px-4 py-3 font-medium">SĐT</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Địa chỉ</th>
                <th className="px-4 py-3 font-medium">Số đơn hàng</th>
                <th className="px-4 py-3 font-medium">Tổng chi tiêu</th>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
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
    </div>
  );
}
