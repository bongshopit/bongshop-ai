import { Metadata } from "next";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tồn kho - BongShop",
  description: "Quản lý tồn kho BongShop",
};

interface SearchParams {
  q?: string;
  status?: string;
}

async function getProducts(params: SearchParams) {
  return prisma.product.findMany({
    where: {
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: "insensitive" } },
              { sku: { contains: params.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(params.status === "active"
        ? { isActive: true }
        : params.status === "inactive"
        ? { isActive: false }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

function formatCurrency(value: { toString(): string }) {
  return Number(value).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const products = await getProducts(searchParams);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tồn kho</h1>
        <Button asChild>
          <Link href="/admin/inventory/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm sản phẩm
          </Link>
        </Button>
      </div>

      {/* Search bar */}
      <form method="GET" className="flex gap-3 mb-4">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Tìm theo tên hoặc SKU..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả</option>
          <option value="active">Đang kinh doanh</option>
          <option value="inactive">Ngừng kinh doanh</option>
        </select>
        <Button type="submit" variant="outline">Tìm kiếm</Button>
      </form>

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Tên sản phẩm</th>
                <th className="px-4 py-3 font-medium">Đơn vị</th>
                <th className="px-4 py-3 font-medium text-right">Tồn kho</th>
                <th className="px-4 py-3 font-medium text-right">Giá nhập</th>
                <th className="px-4 py-3 font-medium text-right">Giá bán</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    <Package className="mx-auto h-8 w-8 mb-2 opacity-40" />
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600">{product.unit}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          product.quantity === 0
                            ? "text-red-600 font-semibold"
                            : product.quantity < 10
                            ? "text-amber-600 font-semibold"
                            : "text-gray-900 font-semibold"
                        }
                      >
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(product.costPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(product.sellPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.isActive ? "Đang KD" : "Ngừng KD"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/inventory/${product.id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Chi tiết
                        </Link>
                        <Link
                          href={`/admin/inventory/${product.id}/edit`}
                          className="text-gray-600 hover:underline text-xs"
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
      </div>
    </div>
  );
}
