"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addLoyaltyPoints } from "@/actions/loyalty";

const CATEGORIES = [
  { value: "DEFAULT", label: "Mặc định" },
  { value: "SUA", label: "Sữa" },
  { value: "TA_BIM", label: "Tã bỉm" },
] as const;

interface Props {
  customerId: string;
}

export function AddLoyaltyPointsDialog({ customerId }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await addLoyaltyPoints(customerId, formData);
      if (result === null) {
        setOpen(false);
      } else if (result.error) {
        setError(result.error);
      } else if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
    });
  }

  function handleOpen() {
    setOpen(true);
    setError("");
    setFieldErrors({});
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleOpen}>
        <Plus className="h-4 w-4 mr-1" />
        Thêm điểm
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Thêm điểm tích lũy</h2>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="DEFAULT"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.category?.map((err) => (
                  <p key={err} className="text-xs text-red-500">
                    {err}
                  </p>
                ))}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Số điểm <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="points"
                  min={1}
                  placeholder="Nhập số điểm"
                  required
                />
                {fieldErrors.points?.map((err) => (
                  <p key={err} className="text-xs text-red-500">
                    {err}
                  </p>
                ))}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Lý do <span className="text-red-500">*</span>
                </label>
                <Input
                  name="reason"
                  placeholder="Ví dụ: Bù điểm cho đơn tháng 3"
                  maxLength={200}
                  required
                />
                {fieldErrors.reason?.map((err) => (
                  <p key={err} className="text-xs text-red-500">
                    {err}
                  </p>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Hủy
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "Đang lưu..." : "Thêm điểm"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
