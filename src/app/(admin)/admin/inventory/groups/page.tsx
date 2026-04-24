import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ProductGroupCategoryForm } from "@/components/shared/product-group-category-form";

export const metadata: Metadata = {
  title: "Nhóm hàng - BongShop",
  description: "Quản lý nhóm hàng và phân loại tích điểm",
};

const LOYALTY_LABEL: Record<string, string> = {
  DEFAULT: "Mặc định",
  SUA: "Sữa",
  TA_BIM: "Tã bỉm",
};

const LOYALTY_BADGE: Record<string, string> = {
  DEFAULT: "bg-gray-100 text-gray-600",
  SUA: "bg-blue-100 text-blue-700",
  TA_BIM: "bg-purple-100 text-purple-700",
};

export default async function ProductGroupsPage() {
  const groups = await prisma.productGroup.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhóm hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Phân loại nhóm hàng → tích điểm tương ứng (Mặc định / Sữa / Tã bỉm)
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Chưa có nhóm hàng nào. Import hàng hóa từ KiotViet để tạo nhóm tự động.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium">Tên nhóm</th>
                <th className="px-4 py-3 font-medium">Số sản phẩm</th>
                <th className="px-4 py-3 font-medium">Phân loại tích điểm</th>
                <th className="px-4 py-3 font-medium">Đổi phân loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {group.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {group._count.products}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        LOYALTY_BADGE[group.loyaltyCategory] ?? LOYALTY_BADGE.DEFAULT
                      }`}
                    >
                      {LOYALTY_LABEL[group.loyaltyCategory] ?? group.loyaltyCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProductGroupCategoryForm
                      id={group.id}
                      current={group.loyaltyCategory}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
