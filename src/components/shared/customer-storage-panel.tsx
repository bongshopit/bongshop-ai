"use client";

import { useState, useTransition, useRef } from "react";
import { Plus, PackageOpen, PackageCheck, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createCustomerStorage,
  takeStorageItem,
  closeCustomerStorage,
  deleteAllCustomerStorages,
} from "@/actions/customer";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StorageItem {
  id: string;
  productName: string;
  quantity: number;
  takenQty: number;
  note: string | null;
}

interface Storage {
  id: string;
  note: string | null;
  status: string;
  createdAt: Date;
  items: StorageItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StorageBadge({ status }: { status: string }) {
  if (status === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <PackageOpen className="h-3 w-3" />
        Đang gửi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <PackageCheck className="h-3 w-3" />
      Hoàn tất
    </span>
  );
}

// ─── Take Item Dialog ─────────────────────────────────────────────────────────

function TakeItemDialog({
  item,
  customerId,
  onClose,
}: {
  item: StorageItem;
  customerId: string;
  onClose: () => void;
}) {
  const remaining = item.quantity - item.takenQty;
  const [qty, setQty] = useState<string>(String(remaining));
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(qty);
    if (isNaN(n) || n < 1 || n > remaining) {
      toast.error(`Số lượng lấy phải từ 1 đến ${remaining}`);
      return;
    }
    const fd = new FormData();
    fd.set("itemId", item.id);
    fd.set("qty", String(n));
    startTransition(async () => {
      const result = await takeStorageItem(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã ghi nhận lấy hàng thành công");
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Ghi nhận lấy hàng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Sản phẩm: <span className="font-medium text-gray-900">{item.productName}</span>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Còn lại: <span className="font-medium text-blue-600">{remaining}</span> / {item.quantity}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng lấy
            </label>
            <input
              type="number"
              min={1}
              max={remaining}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Xác nhận"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Storage Dialog ────────────────────────────────────────────────────

interface ItemRow { productName: string; quantity: string; note: string }

function CreateStorageDialog({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ productName: "", quantity: "1", note: "" }]);
  const [isPending, startTransition] = useTransition();

  function addItem() {
    setItems((prev) => [...prev, { productName: "", quantity: "1", note: "" }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof ItemRow, value: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mapped = items.map((r) => ({
      productName: r.productName.trim(),
      quantity: parseInt(r.quantity) || 1,
      note: r.note.trim() || undefined,
    }));

    if (mapped.some((r) => !r.productName)) {
      toast.error("Vui lòng nhập tên hàng cho tất cả dòng");
      return;
    }
    if (mapped.some((r) => r.quantity < 1)) {
      toast.error("Số lượng phải ít nhất là 1");
      return;
    }

    const fd = new FormData();
    fd.set("customerId", customerId);
    fd.set("note", note.trim());
    fd.set("items", JSON.stringify(mapped));

    startTransition(async () => {
      const result = await createCustomerStorage(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã tạo phiếu gửi hàng thành công");
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-semibold text-gray-900">Tạo phiếu gửi hàng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú phiếu</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách đã thanh toán, chờ mang về"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Danh sách hàng gửi</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Thêm dòng
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => updateItem(idx, "productName", e.target.value)}
                      placeholder="Tên hàng *"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      placeholder="SL"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => updateItem(idx, "note", e.target.value)}
                      placeholder="Ghi chú (tùy chọn)"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="mt-1.5 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              const form = e.currentTarget.closest("div")?.previousElementSibling as HTMLFormElement | null;
              if (form) form.requestSubmit();
              else {
                // fallback: trigger submit manually
                const mapped = items.map((r) => ({
                  productName: r.productName.trim(),
                  quantity: parseInt(r.quantity) || 1,
                  note: r.note.trim() || undefined,
                }));
                if (mapped.some((r) => !r.productName)) {
                  toast.error("Vui lòng nhập tên hàng cho tất cả dòng");
                  return;
                }
                const fd = new FormData();
                fd.set("customerId", customerId);
                fd.set("note", note.trim());
                fd.set("items", JSON.stringify(mapped));
                startTransition(async () => {
                  const result = await createCustomerStorage(fd);
                  if (result?.error) toast.error(result.error);
                  else { toast.success("Đã tạo phiếu gửi hàng thành công"); onClose(); }
                });
              }
            }}
          >
            {isPending ? "Đang lưu..." : "Tạo phiếu"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete All Dialog ────────────────────────────────────────────────────────

const CONFIRM_PHRASE = "XÓA";

function DeleteAllStoragesDialog({
  customerId,
  storageCount,
  onClose,
}: {
  customerId: string;
  storageCount: number;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== CONFIRM_PHRASE) {
      toast.error(`Vui lòng nhập chính xác "${CONFIRM_PHRASE}" để xác nhận`);
      return;
    }
    startTransition(async () => {
      const result = await deleteAllCustomerStorages(customerId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Đã xóa toàn bộ phiếu gửi hàng");
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-red-600">Xóa tất cả phiếu gửi hàng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700 font-medium mb-1">
            ⚠️ Hành động này không thể hoàn tác
          </p>
          <p className="text-sm text-red-600">
            Toàn bộ <strong>{storageCount} phiếu gửi hàng</strong> cùng tất cả sản phẩm trong
            đó sẽ bị xóa vĩnh viễn.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhập <span className="font-mono font-bold text-red-600">{CONFIRM_PHRASE}</span> để xác nhận
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
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
  );
}

// ─── Storage Card ─────────────────────────────────────────────────────────────

function StorageCard({
  storage,
  customerId,
  canManage,
}: {
  storage: Storage;
  customerId: string;
  canManage: boolean;
}) {
  const [collapsed, setCollapsed] = useState(storage.status === "CLOSED");
  const [takeItem, setTakeItem] = useState<StorageItem | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    startTransition(async () => {
      const result = await closeCustomerStorage(storage.id);
      if (result?.error) toast.error(result.error);
      else toast.success("Đã đóng phiếu gửi hàng");
    });
  }

  const totalItems = storage.items.reduce((s, i) => s + i.quantity, 0);
  const totalTaken = storage.items.reduce((s, i) => s + i.takenQty, 0);
  const remaining = totalItems - totalTaken;

  return (
    <>
      {takeItem && (
        <TakeItemDialog
          item={takeItem}
          customerId={customerId}
          onClose={() => setTakeItem(null)}
        />
      )}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setCollapsed((c) => !c)}
        >
          <div className="flex items-center gap-3">
            <StorageBadge status={storage.status} />
            <span className="text-sm text-gray-600">
              {new Date(storage.createdAt).toLocaleDateString("vi-VN")}
            </span>
            {storage.note && (
              <span className="text-sm text-gray-500 italic truncate max-w-[200px]">
                {storage.note}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {totalTaken}/{totalItems} đã lấy
            </span>
          </div>
          <div className="flex items-center gap-2">
            {storage.status === "OPEN" && canManage && (
              <button
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                disabled={isPending}
                className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Đóng phiếu
              </button>
            )}
            {collapsed ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronUp className="h-4 w-4 text-gray-400" />}
          </div>
        </div>

        {/* Items table */}
        {!collapsed && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tên hàng</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Gửi</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Đã lấy</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Còn lại</th>
                  {canManage && storage.status === "OPEN" && (
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {storage.items.map((item) => {
                  const rem = item.quantity - item.takenQty;
                  return (
                    <tr key={item.id} className={rem === 0 ? "bg-gray-50" : ""}>
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {item.productName}
                        {item.note && (
                          <span className="ml-2 text-xs text-gray-400 italic">{item.note}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-2 text-center text-gray-700">{item.takenQty}</td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={
                            rem === 0
                              ? "text-gray-400"
                              : "font-semibold text-blue-600"
                          }
                        >
                          {rem}
                        </span>
                      </td>
                      {canManage && storage.status === "OPEN" && (
                        <td className="px-4 py-2">
                          {rem > 0 ? (
                            <button
                              onClick={() => setTakeItem(item)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Lấy hàng
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Đã lấy hết</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface CustomerStoragePanelProps {
  customerId: string;
  storages: Storage[];
  canManage: boolean;
}

export function CustomerStoragePanel({
  customerId,
  storages,
  canManage,
}: CustomerStoragePanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const openStorages = storages.filter((s) => s.status === "OPEN");
  const closedStorages = storages.filter((s) => s.status === "CLOSED");

  return (
    <>
      {showCreate && (
        <CreateStorageDialog
          customerId={customerId}
          onClose={() => setShowCreate(false)}
        />
      )}
      {showDeleteAll && (
        <DeleteAllStoragesDialog
          customerId={customerId}
          storageCount={storages.length}
          onClose={() => setShowDeleteAll(false)}
        />
      )}
      <div className="space-y-3">
        {canManage && (
          <div className="flex items-center justify-between">
            <div>
              {storages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowDeleteAll(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa tất cả
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Tạo phiếu gửi hàng
            </Button>
          </div>
        )}

        {storages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            Chưa có phiếu gửi hàng nào
          </p>
        )}

        {/* OPEN storages */}
        {openStorages.map((s) => (
          <StorageCard
            key={s.id}
            storage={s}
            customerId={customerId}
            canManage={canManage}
          />
        ))}

        {/* CLOSED storages — collapsed by default */}
        {closedStorages.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase mb-2">
              Đã hoàn tất ({closedStorages.length})
            </p>
            {closedStorages.map((s) => (
              <StorageCard
                key={s.id}
                storage={s}
                customerId={customerId}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
