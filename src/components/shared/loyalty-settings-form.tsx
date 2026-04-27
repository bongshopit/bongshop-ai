"use client";

import { useState, useTransition } from "react";
import { updateLoyaltySetting } from "@/actions/loyalty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LoyaltyCategory, RateType, LoyaltySettingData } from "@/lib/validators/loyalty";
import { CATEGORY_LABELS, RATE_TYPE_LABELS } from "@/lib/validators/loyalty";

type Props = {
  setting: LoyaltySettingData;
};

export function LoyaltySettingsForm({ setting }: Props) {
  const [open, setOpen] = useState(false);
  const [rateType, setRateType] = useState<RateType>(setting.rateType);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setOpen(true);
    setRateType(setting.rateType);
    setError("");
    setFieldErrors({});
    setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateLoyaltySetting(formData);
      if (result === null) {
        setOpen(false);
        setSuccess(true);
      } else if (result.error) {
        setError(result.error);
      } else if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
    });
  }

  const categoryLabel = CATEGORY_LABELS[setting.loyaltyCategory as LoyaltyCategory];

  const categoryColor: Record<string, string> = {
    DEFAULT: "bg-gray-50 border-gray-200",
    SUA: "bg-blue-50 border-blue-200",
    TA_BIM: "bg-purple-50 border-purple-200",
  };

  const badgeColor: Record<string, string> = {
    DEFAULT: "text-gray-700",
    SUA: "text-blue-700",
    TA_BIM: "text-purple-700",
  };

  return (
    <div className={`rounded-lg border p-4 ${categoryColor[setting.loyaltyCategory] ?? "bg-gray-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`font-semibold text-sm ${badgeColor[setting.loyaltyCategory] ?? ""}`}>
            {categoryLabel}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {RATE_TYPE_LABELS[setting.rateType as RateType]}
          </p>
          <p className="text-sm font-medium mt-1">
            {setting.rateType === "AMOUNT"
              ? `${setting.amountPerPoint.toLocaleString("vi-VN")} VNĐ = 1 điểm`
              : `1 sản phẩm = ${setting.pointsPerProduct} điểm`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs"
          onClick={handleOpen}
        >
          Chỉnh sửa
        </Button>
      </div>

      {success && (
        <p className="text-xs text-green-600 mt-2">✓ Đã lưu cài đặt</p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold mb-4">
              Cài đặt tỉ lệ — {categoryLabel}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <input type="hidden" name="loyaltyCategory" value={setting.loyaltyCategory} />

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              {/* Loại tỉ lệ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại tỉ lệ
                </label>
                <div className="flex gap-4">
                  {(["AMOUNT", "PRODUCT"] as RateType[]).map((rt) => (
                    <label key={rt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rateType"
                        value={rt}
                        checked={rateType === rt}
                        onChange={() => setRateType(rt)}
                        className="accent-blue-600"
                      />
                      <span className="text-sm">{RATE_TYPE_LABELS[rt]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Theo tiền */}
              {rateType === "AMOUNT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tiền để đạt 1 điểm (VNĐ)
                  </label>
                  <Input
                    type="number"
                    name="amountPerPoint"
                    min={1000}
                    step={1000}
                    defaultValue={setting.amountPerPoint}
                    required
                    className="text-sm"
                  />
                  <input type="hidden" name="pointsPerProduct" value={setting.pointsPerProduct} />
                  {fieldErrors.amountPerPoint && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.amountPerPoint[0]}
                    </p>
                  )}
                </div>
              )}

              {/* Theo sản phẩm */}
              {rateType === "PRODUCT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điểm trên 1 sản phẩm
                  </label>
                  <Input
                    type="number"
                    name="pointsPerProduct"
                    min={0.1}
                    step={0.1}
                    defaultValue={setting.pointsPerProduct}
                    required
                    className="text-sm"
                  />
                  <input type="hidden" name="amountPerPoint" value={setting.amountPerPoint} />
                  {fieldErrors.pointsPerProduct && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.pointsPerProduct[0]}
                    </p>
                  )}
                </div>
              )}

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
                  {isPending ? "Đang lưu..." : "Lưu cài đặt"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
