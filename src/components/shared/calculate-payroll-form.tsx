"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { calculatePayroll, type ActionState } from "@/actions/payroll";

interface CalculatePayrollFormProps {
  defaultMonth: number;
  defaultYear: number;
}

export function CalculatePayrollForm({
  defaultMonth,
  defaultYear,
}: CalculatePayrollFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError("");
    setFieldErrors({});
    setSuccess("");

    startTransition(async () => {
      const result: ActionState = await calculatePayroll(formData);
      if (result === null || (result && !result.error && !result.fieldErrors)) {
        setSuccess(`Đã tính lương cho ${result?.count ?? 0} nhân viên.`);
        router.refresh();
        return;
      }
      if (result?.error) setError(result.error);
      if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
    });
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 6 }, (_, i) => defaultYear - 5 + i + 1);

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3" noValidate>
      {success && (
        <div className="w-full bg-green-50 text-green-700 text-sm p-3 rounded-md border border-green-200">
          {success}
        </div>
      )}
      {error && (
        <div className="w-full bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="month" className="block text-xs text-gray-500">Tháng</label>
        <select
          id="month"
          name="month"
          defaultValue={defaultMonth}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {months.map((m) => (
            <option key={m} value={m}>Tháng {m}</option>
          ))}
        </select>
        {fieldErrors.month?.map((err) => (
          <p key={err} className="text-xs text-red-500">{err}</p>
        ))}
      </div>

      <div className="space-y-1">
        <label htmlFor="year" className="block text-xs text-gray-500">Năm</label>
        <select
          id="year"
          name="year"
          defaultValue={defaultYear}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        {fieldErrors.year?.map((err) => (
          <p key={err} className="text-xs text-red-500">{err}</p>
        ))}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang tính..." : "Tính lương"}
      </Button>
    </form>
  );
}
