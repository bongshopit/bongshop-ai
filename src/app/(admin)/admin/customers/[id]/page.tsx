import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, Pencil } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddLoyaltyPointsDialog } from "@/components/shared/add-loyalty-points-dialog";
import { AdjustLoyaltyPointsDialog } from "@/components/shared/adjust-loyalty-points-dialog";
import { LoyaltyLogTable } from "@/components/shared/loyalty-log-table";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  if (!customer) return { title: "Không tìm thấy - BongShop" };
  return {
    title: `${customer.name} - BongShop`,
    description: `Chi tiết khách hàng ${customer.name}`,
  };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [customer, session] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!customer) notFound();

  const canManageLoyalty =
    session?.user?.role === "MANAGER" || session?.user?.role === "ADMIN";

  const fields = [
    { label: "Tên khách hàng", value: customer.name },
    { label: "Số điện thoại", value: customer.phone ?? "—" },
    { label: "Email", value: customer.email ?? "—" },
    { label: "Địa chỉ", value: customer.address ?? "—" },
    { label: "Ghi chú", value: customer.note ?? "—" },
    {
      label: "Ngày tạo",
      value: new Date(customer.createdAt).toLocaleDateString("vi-VN"),
    },
  ];

  const statusLabels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-gray-100 text-gray-500",
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/customers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quay lại danh sách
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <Button asChild size="sm">
            <Link href={`/admin/customers/${customer.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Sửa thông tin
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {fields.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs text-gray-500">{f.label}</dt>
                  <dd className="text-sm font-medium text-gray-900 mt-0.5">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* US-012: Tích điểm */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Điểm tích lũy</CardTitle>
              {canManageLoyalty && (
                <div className="flex items-center gap-2">
                  <AddLoyaltyPointsDialog customerId={customer.id} />
                  <AdjustLoyaltyPointsDialog customerId={customer.id} />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Tổng điểm</span>
                <span className="text-xl font-bold text-blue-600">
                  {customer.loyaltyPointsDefault + customer.loyaltyPointsSua + customer.loyaltyPointsTaBim}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Mặc định</span>
                  <span className="font-medium text-gray-900">
                    {customer.loyaltyPointsDefault} điểm
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Sữa</span>
                  <span className="font-medium text-blue-700">
                    {customer.loyaltyPointsSua} điểm
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Tã bỉm</span>
                  <span className="font-medium text-purple-700">
                    {customer.loyaltyPointsTaBim} điểm
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* US-012: Lịch sử điểm */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lịch sử tích điểm (10 gần nhất)</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-24 animate-pulse bg-gray-100 rounded" />}>
              <LoyaltyLogTable customerId={customer.id} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              Lịch sử đơn hàng ({customer.orders.length} gần nhất)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.orders.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Chưa có đơn hàng nào
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-gray-500 text-xs">
                      <th className="pb-2 text-left font-medium">Mã đơn</th>
                      <th className="pb-2 text-left font-medium">Ngày tạo</th>
                      <th className="pb-2 text-right font-medium">Tổng tiền</th>
                      <th className="pb-2 text-center font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customer.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="py-2 font-mono text-xs text-gray-600">
                          {order.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="py-2 text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="py-2 text-right font-medium text-gray-900">
                          {Number(order.totalAmount).toLocaleString("vi-VN")}đ
                        </td>
                        <td className="py-2 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              statusColors[order.status] ?? "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {statusLabels[order.status] ?? order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
