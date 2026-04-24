import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Upload } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { LoyaltyImportClient } from "@/components/shared/loyalty-import-client";

export const metadata: Metadata = {
  title: "Import tích điểm - BongShop",
  description: "Import điểm tích lũy từ file báo cáo bán hàng KiotViet",
};

export default async function LoyaltyImportPage() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")
  ) {
    redirect("/admin");
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/customers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quay lại khách hàng
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Upload className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Import tích điểm từ KiotViet
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Upload file{" "}
              <span className="font-mono bg-gray-100 px-1 rounded">
                DanhSachChiTietHoaDon.xlsx
              </span>{" "}
              để tự động cộng điểm theo 3 danh mục
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Hướng dẫn
          </h2>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
            <li>
              Xuất file <strong>Danh sách chi tiết hóa đơn</strong> từ KiotViet
              (cuối ngày)
            </li>
            <li>
              Chỉ các hóa đơn có trạng thái <strong>Hoàn thành</strong> mới
              được tính điểm
            </li>
            <li>
              Tỷ lệ: <strong>1 điểm / 10.000 VNĐ</strong> (thành tiền từng mặt
              hàng)
            </li>
            <li>
              Danh mục điểm xác định theo nhóm hàng:{" "}
              <span className="text-blue-600 font-medium">Sữa</span>,{" "}
              <span className="text-purple-600 font-medium">Tã bỉm</span>,{" "}
              <span className="text-gray-600 font-medium">Mặc định</span>
            </li>
            <li>
              Khách hàng được khớp theo <strong>số điện thoại</strong> —{" "}
              không tạo khách hàng mới tự động
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <LoyaltyImportClient />
        </div>
      </div>
    </div>
  );
}
