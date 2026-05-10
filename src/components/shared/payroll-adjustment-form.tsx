"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addPayrollAdjustmentBatch, deletePayrollAdjustment, type ActionState } from "@/actions/payroll";

interface Adjustment {
  id: string;
  label: string;
  amount: string | number;
  type: string;
}

interface StagingRow {
  rowId: string;
  label: string;
  amount: string;
  type: "ADD" | "SUBTRACT";
}

interface PayrollAdjustmentFormProps {
  payrollId: string;
  adjustments: Adjustment[];
  canEdit: boolean; // false khi phiếu đã CONFIRMED hoặc PAID
}

function formatCurrency(value: number | string) {
  return Number(value).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

export function PayrollAdjustmentForm({
  payrollId,
  adjustments,
  canEdit,
}: PayrollAdjustmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const rowIdCounter = useRef(1);
  const [rows, setRows] = useState<StagingRow[]>([
    { rowId: "0", label: "", amount: "", type: "ADD" },
  ]);

  const validCount = rows.filter((r) => r.label.trim() && Number(r.amount) > 0).length;

  function addRow() {
    setRows((prev) => [
      ...prev,
      { rowId: String(rowIdCounter.current++), label: "", amount: "", type: "ADD" },
    ]);
  }

  function removeRow(rowId: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  }

  function updateRow(rowId: string, field: keyof Omit<StagingRow, "rowId">, value: string) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)));
  }

  function handleSaveAll() {
    const validRows = rows.filter((r) => r.label.trim() && Number(r.amount) > 0);
    if (validRows.length === 0) {
      setError("Vui lòng điền ít nhất 1 khoản hợp lệ (tên và số tiền).");
      return;
    }
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result: ActionState = await addPayrollAdjustmentBatch(
        payrollId,
        validRows.map((r) => ({
          label: r.label.trim(),
          amount: Number(r.amount),
          type: r.type,
        }))
      );
      if (!result) {
        setSuccess(`Đã thêm ${validRows.length} khoản điều chỉnh.`);
        rowIdCounter.current = 1;
        setRows([{ rowId: "0", label: "", amount: "", type: "ADD" }]);
        router.refresh();
        return;
      }
      if (result.error) setError(result.error);
    });
  }

  function handleDelete(adjustmentId: string) {
    setDeletingId(adjustmentId);
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result: ActionState = await deletePayrollAdjustment(adjustmentId, payrollId);
      setDeletingId(null);
      if (!result) {
        router.refresh();
        return;
      }
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Khoản điều chỉnh</h2>
        <span className="text-xs text-gray-400">Phụ cấp / Thưởng / Phạt / ...</span>
      </div>

      {/* Danh sách khoản đã lưu */}
      <div className="divide-y divide-gray-100">
        {adjustments.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-400 italic">Chưa có khoản điều chỉnh nào.</p>
        ) : (
          adjustments.map((adj) => (
            <div
              key={adj.id}
              className="flex items-center justify-between px-6 py-3 gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                    adj.type === "ADD"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {adj.type === "ADD" ? "+" : "−"}
                </span>
                <span className="text-sm text-gray-700 truncate">{adj.label}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-sm font-semibold ${
                    adj.type === "ADD" ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {adj.type === "ADD" ? "+" : "−"}
                  {formatCurrency(adj.amount)}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(adj.id)}
                    disabled={isPending && deletingId === adj.id}
                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    aria-label="Xóa khoản"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form thêm nhiều khoản — chỉ hiện khi canEdit */}
      {canEdit && (
        <div className="px-6 py-4 border-t bg-gray-50 space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{success}</p>
          )}

          {/* Staging rows */}
          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={row.rowId} className="flex flex-wrap items-center gap-2">
                <input
                  id={index === 0 ? "adj-label" : undefined}
                  name="label"
                  type="text"
                  value={row.label}
                  onChange={(e) => updateRow(row.rowId, "label", e.target.value)}
                  placeholder="VD: Thưởng KPI, Phụ cấp xăng..."
                  className="flex-1 min-w-[150px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  id={index === 0 ? "adj-amount" : undefined}
                  name="amount"
                  type="number"
                  min={1}
                  step={1000}
                  value={row.amount}
                  onChange={(e) => updateRow(row.rowId, "amount", e.target.value)}
                  placeholder="500000"
                  className="w-36 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  id={index === 0 ? "adj-type" : undefined}
                  name="type"
                  value={row.type}
                  onChange={(e) =>
                    updateRow(row.rowId, "type", e.target.value as "ADD" | "SUBTRACT")
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ADD">Cộng (+)</option>
                  <option value="SUBTRACT">Trừ (−)</option>
                </select>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.rowId)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Xóa dòng"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              disabled={isPending}
              className="flex items-center gap-1 text-gray-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm dòng
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAll}
              disabled={isPending || validCount === 0}
              className="flex items-center gap-1"
            >
              {isPending ? "Đang lưu..." : `Lưu ${validCount} khoản`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
