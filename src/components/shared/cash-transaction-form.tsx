"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTransaction, type ActionState } from "@/actions/cashbook";

type TransactionType = "INCOME" | "EXPENSE";

interface CashTransactionFormProps {
  defaultType?: TransactionType;
  onSuccess?: () => void;
}

const INCOME_CATEGORIES = ["Bán hàng", "Thu nợ", "Vốn góp", "Khác"];
const EXPENSE_CATEGORIES = ["Nhập hàng", "Lương", "Tiền điện nước", "Vận chuyển", "Khác"];

export function CashTransactionForm({
  defaultType = "INCOME",
  onSuccess,
}: CashTransactionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<TransactionType>(defaultType);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState<string>("");

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("type", type);
    setError("");
    setFieldErrors({});
    setSuccess("");

    startTransition(async () => {
      const result: ActionState = await createTransaction(formData);
      if (result === null) {
        const label = type === "INCOME" ? "phiếu thu" : "phiếu chi";
        setSuccess(`Tạo ${label} thành công!`);
        form.reset();
        router.refresh();
        if (onSuccess) onSuccess();
        return;
      }
      if (result?.error) setError(result.error);
      if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-lg border bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Tạo phiếu thu / chi</h2>

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

      {/* Type toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={type === "INCOME" ? "default" : "outline"}
          className={type === "INCOME" ? "bg-green-600 hover:bg-green-700" : ""}
          onClick={() => setType("INCOME")}
        >
          Phiếu thu
        </Button>
        <Button
          type="button"
          variant={type === "EXPENSE" ? "default" : "outline"}
          className={type === "EXPENSE" ? "bg-red-600 hover:bg-red-700" : ""}
          onClick={() => setType("EXPENSE")}
        >
          Phiếu chi
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <input type="hidden" name="type" value={type} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Số tiền (VNĐ) <span className="text-red-500">*</span>
            </label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="1"
              step="1000"
              placeholder="100000"
              required
            />
            {fieldErrors.amount?.map((err) => (
              <p key={err} className="text-xs text-red-500">{err}</p>
            ))}
          </div>

          <div className="space-y-1">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Ngày giao dịch <span className="text-red-500">*</span>
            </label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={todayStr}
              max={todayStr}
              required
            />
            {fieldErrors.date?.map((err) => (
              <p key={err} className="text-xs text-red-500">{err}</p>
            ))}
          </div>

          <div className="space-y-1 md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <Input
              id="description"
              name="description"
              placeholder={type === "INCOME" ? "Thu tiền bán hàng ngày..." : "Chi mua hàng nhập kho..."}
              required
            />
            {fieldErrors.description?.map((err) => (
              <p key={err} className="text-xs text-red-500">{err}</p>
            ))}
          </div>

          <div className="space-y-1">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Danh mục
            </label>
            <select
              id="category"
              name="category"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Chọn danh mục —</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {fieldErrors.category?.map((err) => (
              <p key={err} className="text-xs text-red-500">{err}</p>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className={type === "EXPENSE" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
        >
          {isPending
            ? "Đang lưu..."
            : type === "INCOME"
            ? "Tạo phiếu thu"
            : "Tạo phiếu chi"}
        </Button>
      </form>
    </div>
  );
}
