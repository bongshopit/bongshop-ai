import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/shared/product-form";
import { createProduct } from "@/actions/inventory";

export const metadata: Metadata = {
  title: "Thêm sản phẩm - BongShop",
  description: "Thêm sản phẩm mới vào kho BongShop",
};

export default function NewProductPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/inventory"
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm</h1>
      </div>

      <div className="max-w-2xl rounded-lg border bg-white p-6">
        <ProductForm action={createProduct} cancelHref="/admin/inventory" />
      </div>
    </div>
  );
}
