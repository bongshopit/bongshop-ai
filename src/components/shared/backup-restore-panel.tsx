"use client";

import { useRef, useState } from "react";
import { Download, Upload, X, AlertTriangle, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CONFIRM_RESTORE_PHRASE,
  backupFileSchema,
  MAX_GZIP_SIZE_BYTES,
  MAX_JSON_SIZE_BYTES,
} from "@/lib/validators/data-management";
import type { BackupFile } from "@/lib/validators/data-management";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Giải nén gzip trong browser dùng DecompressionStream (Chrome 80+, Firefox 113+, Safari 16.4+) */
async function decompressGzip(buffer: ArrayBuffer): Promise<string> {
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();
  writer.write(new Uint8Array(buffer));
  writer.close();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(combined);
}

function isGzipBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

// ── Backup metadata summary ───────────────────────────────────────────────────────

function BackupSummary({
  backup,
  compressedSize,
  rawSize,
}: {
  backup: BackupFile;
  compressedSize?: number;
  rawSize?: number;
}) {
  const { data, exportedAt } = backup;
  const tableRows = [
    ["Nhân viên", data.employees.length],
    ["Khách hàng", data.customers.length],
    ["Sản phẩm", data.products.length],
    ["Đơn hàng", data.orders.length],
    ["Giao dịch quỹ", data.cashTransactions.length],
    ["Chấm công", data.attendances.length],
    ["Tích điểm logs", data.loyaltyLogs.length],
    ["Phiếu gửi hàng", data.customerStorages.length],
  ] as const;

  const ratio =
    compressedSize && rawSize
      ? Math.round((1 - compressedSize / rawSize) * 100)
      : null;

  return (
    <div className="rounded-md border bg-gray-50 p-3 text-sm space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <p className="text-xs text-gray-500">
          Xuất lúc:{" "}
          {new Date(exportedAt).toLocaleString("vi-VN", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
        {compressedSize && rawSize && ratio !== null && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <Zap className="h-3 w-3" />
            {formatBytes(compressedSize)} → {formatBytes(rawSize)} (nén -{ratio}%)
          </span>
        )}
        {!compressedSize && rawSize && (
          <span className="text-xs text-gray-500">{formatBytes(rawSize)}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {tableRows.map(([label, count]) => (
          <div key={label} className="flex justify-between">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium">{(count as number).toLocaleString("vi-VN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────────

export function BackupRestorePanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawSize, setRawSize] = useState<number | undefined>();
  const [confirmInput, setConfirmInput] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [fileError, setFileError] = useState("");

  // ── Download backup (.json.gz) ───────────────────────────────────────────

  async function handleDownloadBackup() {
    setIsDownloading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Tải backup thất bại");
        return;
      }
      const blob = await res.blob();
      const date = new Date().toISOString().split("T")[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bongshop-backup-${date}.json.gz`;
      a.click();
      URL.revokeObjectURL(url);
      const compressedSize = blob.size;
      const uncompressedHeader = res.headers.get("x-uncompressed-size");
      const uncompressedSize = uncompressedHeader ? parseInt(uncompressedHeader, 10) : null;
      if (uncompressedSize) {
        const ratio = Math.round((1 - compressedSize / uncompressedSize) * 100);
        toast.success(
          `Đã tải backup — ${formatBytes(compressedSize)} (nén ${ratio}% từ ${formatBytes(uncompressedSize)})`
        );
      } else {
        toast.success(`Đã tải backup — ${formatBytes(compressedSize)}`);
      }
    } catch {
      toast.error("Không thể kết nối server");
    } finally {
      setIsDownloading(false);
    }
  }

  // ── File selection (hỗ trợ .json và .json.gz) ─────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    setSelectedBackup(null);
    setRawSize(undefined);
    const file = e.target.files?.[0];
    if (!file) return;

    const fileArrayBuffer = await file.arrayBuffer();
    const isGz = isGzipBuffer(fileArrayBuffer);

    const sizeLimit = isGz ? MAX_GZIP_SIZE_BYTES : MAX_JSON_SIZE_BYTES;
    if (file.size > sizeLimit) {
      setFileError(`File vượt quá giới hạn ${isGz ? "10MB" : "50MB"}`);
      return;
    }

    try {
      let jsonText: string;
      if (isGz) {
        jsonText = await decompressGzip(fileArrayBuffer);
      } else {
        jsonText = new TextDecoder().decode(fileArrayBuffer);
      }

      const raw = JSON.parse(jsonText);
      const parsed = backupFileSchema.safeParse(raw);
      if (!parsed.success) {
        setFileError(parsed.error.errors[0]?.message ?? "File backup không hợp lệ");
        return;
      }
      setSelectedFile(file);
      setSelectedBackup(parsed.data);
      setRawSize(jsonText.length);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setFileError("File backup không phải JSON hợp lệ");
      } else {
        setFileError("Không thể đọc file backup");
      }
    }
  }

  function handleOpenRestore() {
    setRestoreOpen(true);
    setSelectedBackup(null);
    setSelectedFile(null);
    setRawSize(undefined);
    setConfirmInput("");
    setFileError("");
  }

  function handleCloseRestore() {
    setRestoreOpen(false);
    setSelectedBackup(null);
    setSelectedFile(null);
    setRawSize(undefined);
    setConfirmInput("");
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Restore submit ────────────────────────────────────────────────────────────────────────

  async function handleRestore() {
    if (!selectedFile || confirmInput.trim() !== CONFIRM_RESTORE_PHRASE) return;

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/backup", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? "Restore thất bại");
        return;
      }
      toast.success("Restore dữ liệu thành công");
      handleCloseRestore();
      // Dùng full page reload để bypass Next.js Router Cache (client-side cache)
      // router.push + router.refresh chỉ clear cache của route hiện tại, không phải /admin đích đến
      window.location.href = "/admin";
    } catch {
      toast.error("Không thể kết nối server");
    } finally {
      setIsRestoring(false);
    }
  }

  const isGzFile = selectedFile ? selectedFile.name.endsWith(".gz") : false;
  const isConfirmValid =
    !!selectedFile && !!selectedBackup && confirmInput.trim() === CONFIRM_RESTORE_PHRASE;

  return (
    <>
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={handleDownloadBackup}
          disabled={isDownloading}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isDownloading ? "Đang tải..." : "Tải Backup (.json.gz)"}
        </Button>
        <Button
          variant="outline"
          onClick={handleOpenRestore}
          className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          <Upload className="h-4 w-4" />
          Restore từ Backup
        </Button>
      </div>

      {/* Restore Dialog */}
      {restoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-600" />
                <h3 className="text-base font-semibold">Restore dữ liệu</h3>
              </div>
              <button
                onClick={handleCloseRestore}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Warning */}
              <div className="flex gap-2 rounded-md bg-orange-50 border border-orange-200 p-3">
                <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-sm text-orange-800">
                  Toàn bộ dữ liệu hiện có sẽ bị xóa và thay bằng dữ liệu trong
                  file backup. Tài khoản người dùng được giữ nguyên.
                </p>
              </div>

              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Chọn file backup{" "}
                  <span className="text-gray-400 font-normal">(.json.gz hoặc .json)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json.gz,.gz,.json,application/gzip,application/json"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-gray-100 file:text-sm file:font-medium hover:file:bg-gray-200 cursor-pointer"
                />
                {fileError && (
                  <p className="text-xs text-red-600 mt-1">{fileError}</p>
                )}
              </div>

              {/* Backup preview */}
              {selectedBackup && selectedFile && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1.5">
                    Nội dung backup:
                  </p>
                  <BackupSummary
                    backup={selectedBackup}
                    compressedSize={isGzFile ? selectedFile.size : undefined}
                    rawSize={rawSize}
                  />
                </div>
              )}

              {/* Confirm input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nhập{" "}
                  <code className="bg-gray-100 px-1 rounded text-orange-700">
                    {CONFIRM_RESTORE_PHRASE}
                  </code>{" "}
                  để xác nhận
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={CONFIRM_RESTORE_PHRASE}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <Button
                variant="outline"
                onClick={handleCloseRestore}
                disabled={isRestoring}
              >
                Hủy
              </Button>
              <Button
                onClick={handleRestore}
                disabled={!isConfirmValid || isRestoring}
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRestoring ? "animate-spin" : ""}`}
                />
                {isRestoring ? "Đang restore..." : "Xác nhận Restore"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
