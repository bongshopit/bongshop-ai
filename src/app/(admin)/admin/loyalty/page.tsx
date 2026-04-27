import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, Upload } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { LoyaltySettingsForm } from "@/components/shared/loyalty-settings-form";
import {
  CATEGORY_LABELS,
  RATE_TYPE_LABELS,
  type LoyaltyCategory,
  type RateType,
  type LoyaltySettingData,
} from "@/lib/validators/loyalty";

export const metadata: Metadata = {
  title: "Tích điểm - BongShop",
  description: "Quản lý tích điểm khách hàng và cài đặt tỉ lệ qui đổi",
};

const DEFAULT_SETTINGS: Record<string, LoyaltySettingData> = {
  DEFAULT: {
    id: "default",
    loyaltyCategory: "DEFAULT",
    rateType: "AMOUNT",
    amountPerPoint: 10000,
    pointsPerProduct: 1,
  },
  SUA: {
    id: "sua",
    loyaltyCategory: "SUA",
    rateType: "PRODUCT",
    amountPerPoint: 10000,
    pointsPerProduct: 1,
  },
  TA_BIM: {
    id: "tabim",
    loyaltyCategory: "TA_BIM",
    rateType: "PRODUCT",
    amountPerPoint: 10000,
    pointsPerProduct: 1,
  },
};

const CATEGORIES: LoyaltyCategory[] = ["DEFAULT", "SUA", "TA_BIM"];

export default async function LoyaltyPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isManagerOrAdmin =
    session.user.role === "MANAGER" || session.user.role === "ADMIN";

  const dbSettings = await prisma.loyaltySetting.findMany();
  const settingsMap = new Map(dbSettings.map((s) => [s.loyaltyCategory, s]));

  const settings: LoyaltySettingData[] = CATEGORIES.map((cat) => {
    const db = settingsMap.get(cat);
    if (db) {
      return {
        id: db.id,
        loyaltyCategory: db.loyaltyCategory as LoyaltyCategory,
        rateType: db.rateType as RateType,
        amountPerPoint: db.amountPerPoint,
        pointsPerProduct: Number(db.pointsPerProduct),
      };
    }
    return DEFAULT_SETTINGS[cat];
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Star className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tích điểm</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Cài đặt tỉ lệ qui đổi điểm tích lũy theo 3 danh mục
            </p>
          </div>
        </div>
        <Link
          href="/admin/loyalty/import"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Import KiotViet
        </Link>
      </div>

      {/* Settings cards */}
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">
            Tỉ lệ qui đổi điểm
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Mỗi danh mục có thể dùng{" "}
            <span className="font-medium">tỉ lệ theo tiền</span> (VNĐ / điểm) hoặc{" "}
            <span className="font-medium">theo sản phẩm</span> (sản phẩm / điểm).
          </p>

          <div className="space-y-3">
            {isManagerOrAdmin
              ? settings.map((s) => (
                  <LoyaltySettingsForm key={s.loyaltyCategory} setting={s} />
                ))
              : settings.map((s) => (
                  <div
                    key={s.loyaltyCategory}
                    className="rounded-lg border bg-gray-50 p-4"
                  >
                    <p className="font-semibold text-sm text-gray-700">
                      {CATEGORY_LABELS[s.loyaltyCategory as LoyaltyCategory]}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {RATE_TYPE_LABELS[s.rateType as RateType]}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {s.rateType === "AMOUNT"
                        ? `${s.amountPerPoint.toLocaleString("vi-VN")} VNĐ = 1 điểm`
                        : `1 sản phẩm = ${s.pointsPerProduct} điểm`}
                    </p>
                  </div>
                ))}
          </div>
        </div>

        {/* Usage note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            Hướng dẫn áp dụng
          </h3>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>
              <strong>Theo tiền:</strong> điểm = ⌊thành_tiền ÷ số_tiền_mỗi_điểm⌋
            </li>
            <li>
              <strong>Theo sản phẩm:</strong> điểm = ⌊số_lượng × điểm_mỗi_sản_phẩm⌋
            </li>
            <li>Cài đặt áp dụng ngay cho lần import KiotViet tiếp theo.</li>
            <li>
              Danh mục <strong>Mặc định</strong> áp dụng cho các sản phẩm không thuộc
              nhóm Sữa hoặc Tã bỉm.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
