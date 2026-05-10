"use client";

import { useState, useTransition } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteAllData } from "@/actions/data-management";
import { CONFIRM_DELETE_PHRASE } from "@/lib/validators/data-management";

export function DeleteAllDataButton() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClose() {
    setOpen(false);
    setConfirm("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (confirm.trim() !== CONFIRM_DELETE_PHRASE) {
      toast.error(`Vui lòng nhập chính xác "${CONFIRM_DELETE_PHRASE}" để xác nhận`);
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("confirmPhrase", confirm);
      const result = await deleteAllData(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa toàn bộ dữ liệu hệ thống");
        handleClose();
        router.push("/admin");
        router.refresh();
      }
    });
  }

  const isConfirmValid = confirm.trim() === CONFIRM_DELETE_PHRASE;

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Xóa tất cả dữ liệu
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <h3 className="text-base font-semibold text-red-600">
                  Xóa tất cả dữ liệu hệ thống
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 ml-2"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md space-y-2">
              <p className="text-sm text-red-700 font-semibold">
                ⚠️ Hành động này KHÔNG THỂ hoàn tác
              </p>
              <p className="text-sm text-red-700">
                Toàn bộ dữ liệu nghiệp vụ sẽ bị xóa vĩnh viễn, bao gồm:
              </p>
              <ul className="text-sm text-red-600 list-disc list-inside space-y-0.5">
                <li>Khách hàng, đơn hàng, lịch sử tích điểm</li>
                <li>Phiếu gửi hàng</li>
                <li>Nhân viên, chấm công, bảng lương</li>
                <li>Ca làm việc, phân ca</li>
                <li>Hàng hóa, nhóm hàng, biến động kho</li>
                <li>Giao dịch sổ quỹ</li>
              </ul>
              <p className="text-sm text-red-700 font-medium">
                Tài khoản người dùng và cài đặt tích điểm được giữ nguyên.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="confirm-delete"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nhập{" "}
                  <span className="font-mono font-bold text-red-600">
                    {CONFIRM_DELETE_PHRASE}
                  </span>{" "}
                  để xác nhận
                </label>
                <input
                  id="confirm-delete"
                  type="text"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={CONFIRM_DELETE_PHRASE}
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={!isConfirmValid || isPending}
                >
                  {isPending ? "Đang xóa..." : "Xác nhận xóa"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
