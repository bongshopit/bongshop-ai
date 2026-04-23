import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/shared/product-form";
import { updateProduct } from "@/actions/inventory";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  return {
    title: product ? `Sửa ${product.name} - BongShop` : "Không tìm thấy - BongShop",
  };
}

export default async function EditProductPage({ params }: Props) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });

  if (!product) notFound();

  const action = updateProduct.bind(null, params.id);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/admin/inventory/${params.id}`}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
      </div>

      <div className="max-w-2xl rounded-lg border bg-white p-6">
        <ProductForm
          product={product}
          action={action}
          cancelHref={`/admin/inventory/${params.id}`}
        />
      </div>
    </div>
  );
}
