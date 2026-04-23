import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { StockMovementForm } from "@/components/shared/stock-movement-form";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { name: true, sku: true },
  });
  if (!product) return { title: "Không tìm thấy - BongShop" };
  return {
    title: `${product.name} (${product.sku}) - BongShop`,
    description: `Chi tiết tồn kho sản phẩm ${product.name}`,
  };
}

async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

async function getMovements(productId: string) {
  return prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

function formatCurrency(value: { toString(): string }) {
  return Number(value).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function ProductDetailPage({ params }: Props) {
  const [product, movements] = await Promise.all([
    getProduct(params.id),
    getMovements(params.id),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {product.sku}
          </span>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/inventory/${product.id}/edit`}>Chỉnh sửa</Link>
        </Button>
      </div>

      {/* Product info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Tồn kho</p>
          <p
            className={`text-2xl font-bold ${
              product.quantity === 0
                ? "text-red-600"
                : product.quantity < 10
                ? "text-amber-600"
                : "text-gray-900"
            }`}
          >
            {product.quantity}
          </p>
          <p className="text-xs text-gray-400">{product.unit}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Giá nhập</p>
          <p className="text-xl font-semibold text-gray-900">
            {formatCurrency(product.costPrice)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Giá bán</p>
          <p className="text-xl font-semibold text-gray-900">
            {formatCurrency(product.sellPrice)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              product.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {product.isActive ? "Đang kinh doanh" : "Ngừng kinh doanh"}
          </span>
          {product.description && (
            <p className="text-xs text-gray-500 mt-1">{product.description}</p>
          )}
        </div>
      </div>

      {/* Stock movement form */}
      <StockMovementForm
        productId={product.id}
        productName={product.name}
        currentQuantity={product.quantity}
      />

      {/* Movement history */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Lịch sử nhập/xuất kho</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Loại</th>
                <th className="px-4 py-3 font-medium text-right">Số lượng</th>
                <th className="px-4 py-3 font-medium">Lý do</th>
                <th className="px-4 py-3 font-medium">Người thực hiện</th>
                <th className="px-4 py-3 font-medium">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Chưa có lịch sử nhập/xuất kho
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {m.type === "IN" ? (
                          <ArrowDownCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={
                            m.type === "IN"
                              ? "text-green-700 font-medium"
                              : "text-red-700 font-medium"
                          }
                        >
                          {m.type === "IN" ? "Nhập kho" : "Xuất kho"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {m.type === "IN" ? "+" : "-"}{m.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.reason ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{m.createdBy}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDateTime(m.createdAt)}</td>
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
