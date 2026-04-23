"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { stockIn, stockOut, type ActionState } from "@/actions/inventory";

type MovementType = "IN" | "OUT";

interface StockMovementFormProps {
  productId: string;
  productName: string;
  currentQuantity: number;
}

export function StockMovementForm({
  productId,
  productName,
  currentQuantity,
}: StockMovementFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<MovementType>("IN");
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("productId", productId);
    setError("");
    setFieldErrors({});
    setSuccess("");

    const action = type === "IN" ? stockIn : stockOut;

    startTransition(async () => {
      const result: ActionState = await action(formData);
      if (result === null) {
        setSuccess(type === "IN" ? "Nhập kho thành công!" : "Xuất kho thành công!");
        form.reset();
        router.refresh();
        return;
      }
      if (result?.error) setError(result.error);
      if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
    });
  }

  return (
    <div className="rounded-lg border bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Nhập / Xuất kho</h2>
      <p className="text-sm text-gray-500">
        Sản phẩm: <span className="font-medium text-gray-700">{productName}</span>
        {" — "}Tồn hiện tại: <span className="font-medium text-gray-900">{currentQuantity}</span>
      </p>

      {success && (
        <div className="bg-green-50 text-green-700 text-sm p-3 rounded-md border border-green-200">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={type === "IN" ? "default" : "outline"}
          onClick={() => setType("IN")}
        >
          Nhập kho
        </Button>
        <Button
          type="button"
          variant={type === "OUT" ? "default" : "outline"}
          onClick={() => setType("OUT")}
        >
          Xuất kho
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <input type="hidden" name="productId" value={productId} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Số lượng <span className="text-red-500">*</span>
            </label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              placeholder="1"
              required
            />
            {fieldErrors.quantity?.map((err) => (
              <p key={err} className="text-xs text-red-500">{err}</p>
            ))}
          </div>

          <div className="space-y-1">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Lý do
            </label>
            <Input
              id="reason"
              name="reason"
              placeholder={type === "IN" ? "Nhập hàng từ nhà cung cấp" : "Bán hàng / Hư hỏng"}
            />
            {fieldErrors.reason?.map((err) => (
              <p key={err} className="text-xs text-red-500">{err}</p>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Đang xử lý..."
            : type === "IN"
            ? "Xác nhận nhập kho"
            : "Xác nhận xuất kho"}
        </Button>
      </form>
    </div>
  );
}
