import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeleteAllDataButton } from "@/components/shared/delete-all-data-button";
import { BackupRestorePanel } from "@/components/shared/backup-restore-panel";
import { ShieldAlert, DatabaseBackup } from "lucide-react";

export const metadata: Metadata = {
  title: "Cài đặt - BongShop",
  description: "Quản lý cài đặt hệ thống BongShop",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý cấu hình và dữ liệu hệ thống BongShop.
        </p>
      </div>

      {/* Backup & Restore */}
      <div className="border border-blue-200 rounded-lg overflow-hidden">
        <div className="bg-blue-50 px-5 py-4 flex items-center gap-2 border-b border-blue-200">
          <DatabaseBackup className="h-5 w-5 text-blue-600 shrink-0" />
          <h2 className="text-base font-semibold text-blue-700">
            Backup &amp; Restore
          </h2>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Sao lưu và phục hồi dữ liệu
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Tải toàn bộ dữ liệu nghiệp vụ về file JSON để lưu trữ. Restore từ
              file backup để phục hồi dữ liệu khi cần. Tài khoản người dùng
              không được backup/restore vì lý do bảo mật.
            </p>
          </div>
          <BackupRestorePanel />
        </div>
      </div>

      {/* Vùng nguy hiểm */}
      <div className="border border-red-200 rounded-lg overflow-hidden">
        <div className="bg-red-50 px-5 py-4 flex items-center gap-2 border-b border-red-200">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
          <h2 className="text-base font-semibold text-red-700">Vùng nguy hiểm</h2>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Xóa tất cả dữ liệu nghiệp vụ
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Xóa toàn bộ khách hàng, nhân viên, hàng hóa, sổ quỹ và tất cả
                dữ liệu liên quan. Tài khoản người dùng và cài đặt tích điểm
                được giữ nguyên. Hành động không thể hoàn tác.
              </p>
            </div>
            <div className="shrink-0">
              <DeleteAllDataButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
