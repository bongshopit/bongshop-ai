"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteAllCustomers } from "@/actions/customer";

const CONFIRM_PHRASE = "XÓA";

export function DeleteAllCustomersButton() {
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
    if (confirm !== CONFIRM_PHRASE) {
      toast.error(`Vui lòng nhập chính xác "${CONFIRM_PHRASE}" để xác nhận`);
      return;
    }
    startTransition(async () => {
      const result = await deleteAllCustomers();
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa toàn bộ khách hàng");
        handleClose();
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Xóa tất cả
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-red-600">Xóa tất cả khách hàng</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 font-medium mb-1">
                ⚠️ Hành động này không thể hoàn tác
              </p>
              <p className="text-sm text-red-600">
                Toàn bộ khách hàng, phiếu gửi hàng và lịch sử tích điểm sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhập{" "}
                  <span className="font-mono font-bold text-red-600">{CONFIRM_PHRASE}</span>{" "}
                  để xác nhận
                </label>
                <input
                  type="text"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={CONFIRM_PHRASE}
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isPending || confirm !== CONFIRM_PHRASE}
                >
                  {isPending ? "Đang xóa..." : "Xóa tất cả"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
