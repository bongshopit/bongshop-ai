"use client";

import { useState, useTransition } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adjustLoyaltyPoints } from "@/actions/loyalty";

const CATEGORIES = [
  { value: "DEFAULT", label: "Mặc định" },
  { value: "SUA", label: "Sữa" },
  { value: "TA_BIM", label: "Tã bỉm" },
] as const;

const TYPES = [
  { value: "ADJUST", label: "Điều chỉnh (cộng/trừ)" },
  { value: "EXPIRE", label: "Thu hồi / hết hạn" },
] as const;

interface Props {
  customerId: string;
}

export function AdjustLoyaltyPointsDialog({ customerId }: Props) {
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
      const result = await adjustLoyaltyPoints(customerId, formData);
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
        <Settings className="h-4 w-4 mr-1" />
        Điều chỉnh điểm
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Điều chỉnh điểm tích lũy</h2>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
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
                    Loại <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="ADJUST"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.type?.map((err) => (
                    <p key={err} className="text-xs text-red-500">
                      {err}
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Số điểm{" "}
                  <span className="text-gray-400 text-xs font-normal">
                    (âm = trừ điểm)
                  </span>{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="delta"
                  placeholder="Ví dụ: 50 hoặc -20"
                  required
                />
                {fieldErrors.delta?.map((err) => (
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
                  placeholder="Ví dụ: Bù điểm tháng 3"
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
                  {isPending ? "Đang lưu..." : "Xác nhận"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
