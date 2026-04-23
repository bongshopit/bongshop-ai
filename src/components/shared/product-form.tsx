"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/actions/inventory";

interface ProductFormProps {
  product?: Product;
  action: (formData: FormData) => Promise<ActionState>;
  cancelHref: string;
}

export function ProductForm({ product, action, cancelHref }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await action(formData);
      if (result === null) {
        router.push("/admin/inventory");
        router.refresh();
        return;
      }
      if (result?.error) setError(result.error);
      if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
            Mã SKU <span className="text-red-500">*</span>
          </label>
          <Input
            id="sku"
            name="sku"
            placeholder="SP001"
            defaultValue={product?.sku ?? ""}
            required
          />
          {fieldErrors.sku?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Tên sản phẩm <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Áo thun trắng M"
            defaultValue={product?.name ?? ""}
            required
          />
          {fieldErrors.name?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
            Đơn vị <span className="text-red-500">*</span>
          </label>
          <Input
            id="unit"
            name="unit"
            placeholder="cái"
            defaultValue={product?.unit ?? "cái"}
            required
          />
          {fieldErrors.unit?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700">
            Giá nhập (VNĐ) <span className="text-red-500">*</span>
          </label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            min="0"
            step="1000"
            placeholder="50000"
            defaultValue={product?.costPrice?.toString() ?? "0"}
            required
          />
          {fieldErrors.costPrice?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="sellPrice" className="block text-sm font-medium text-gray-700">
            Giá bán (VNĐ) <span className="text-red-500">*</span>
          </label>
          <Input
            id="sellPrice"
            name="sellPrice"
            type="number"
            min="0"
            step="1000"
            placeholder="80000"
            defaultValue={product?.sellPrice?.toString() ?? "0"}
            required
          />
          {fieldErrors.sellPrice?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Mô tả
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Mô tả sản phẩm..."
            defaultValue={product?.description ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {fieldErrors.description?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : product ? "Cập nhật" : "Thêm sản phẩm"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
