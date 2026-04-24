"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmLoyaltyImport } from "@/actions/loyalty";
import type { ParsePreviewResponse, CustomerPreviewRow } from "@/lib/validators/loyalty";

export function LoyaltyImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<ParsePreviewResponse | null>(null);
  const [isParsing, startParsing] = useTransition();
  const [isConfirming, startConfirming] = useTransition();
  const [parseError, setParseError] = useState<string>("");
  const [confirmResult, setConfirmResult] = useState<{
    imported?: number;
    error?: string;
  } | null>(null);
  const [forceImport, setForceImport] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setPreview(null);
      setParseError("");
      setConfirmResult(null);
      setForceImport(false);
    }
  }

  function handleParse() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setParseError("Vui lòng chọn file trước");
      return;
    }

    setParseError("");
    setPreview(null);
    setConfirmResult(null);
    setForceImport(false);

    startParsing(async () => {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/loyalty/parse-import", {
        method: "POST",
        body: fd,
      });

      const data: ParsePreviewResponse = await res.json();

      if (!res.ok || data.error) {
        setParseError(data.error ?? "Lỗi khi phân tích file");
        return;
      }

      setPreview(data);
    });
  }

  function handleConfirm() {
    if (!preview) return;

    const matchedRows = preview.rows.filter((r) => r.matched);
    const importRows = matchedRows.map((r) => ({
      customerId: r.customerId!,
      pointsDefault: r.pointsDefault,
      pointsSua: r.pointsSua,
      pointsTaBim: r.pointsTaBim,
      invoiceIds: r.invoiceIds,
    }));

    startConfirming(async () => {
      const result = await confirmLoyaltyImport(importRows, fileName);
      setConfirmResult(result);
      if (!result?.error) {
        setPreview(null);
        if (fileRef.current) fileRef.current.value = "";
        setFileName("");
      }
    });
  }

  const matchedRows = preview?.rows.filter((r) => r.matched) ?? [];
  const hasDuplicates =
    (preview?.duplicateInvoices?.length ?? 0) > 0 && !forceImport;
  const canConfirm = matchedRows.length > 0 && !hasDuplicates;

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 mb-1">
          Chọn file{" "}
          <span className="font-semibold text-blue-600">
            DanhSachChiTietHoaDon.xlsx
          </span>{" "}
          xuất từ KiotViet
        </p>
        <p className="text-xs text-gray-400 mb-4">Tối đa 5MB</p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          id="loyalty-file"
          onChange={handleFileChange}
        />
        <label
          htmlFor="loyalty-file"
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Chọn file
        </label>
        {fileName && (
          <p className="mt-3 text-sm text-green-600 font-medium">
            ✓ {fileName}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleParse}
          disabled={!fileName || isParsing}
          className="flex-1 sm:flex-none"
        >
          {isParsing ? "Đang phân tích..." : "Phân tích file"}
        </Button>
      </div>

      {parseError && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {parseError}
        </div>
      )}

      {confirmResult && (
        <div
          className={`flex items-start gap-2 p-4 rounded-lg border text-sm ${
            confirmResult.error
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          {confirmResult.error ? (
            <>
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {confirmResult.error}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Đã cộng điểm thành công cho{" "}
              <strong>{confirmResult.imported}</strong> khách hàng
            </>
          )}
        </div>
      )}

      {/* Preview section */}
      {preview && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Hóa đơn", value: preview.stats.totalInvoices },
              {
                label: "Khách khớp",
                value: preview.stats.matchedCustomers,
                color: "text-green-600",
              },
              {
                label: "Không khớp",
                value: preview.stats.unmatchedCustomers,
                color: "text-orange-500",
              },
              {
                label: "Tổng điểm",
                value: preview.stats.totalPoints,
                color: "text-blue-600",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-gray-50 rounded-lg p-3 text-center border"
              >
                <div
                  className={`text-xl font-bold ${stat.color ?? "text-gray-900"}`}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Duplicate warning */}
          {preview.duplicateInvoices.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2 text-amber-700 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {preview.duplicateInvoices.length} hóa đơn đã được import trước
                đó:{" "}
                <span className="font-mono">
                  {preview.duplicateInvoices.slice(0, 5).join(", ")}
                  {preview.duplicateInvoices.length > 5 ? "..." : ""}
                </span>
              </div>
              {!forceImport && (
                <button
                  onClick={() => setForceImport(true)}
                  className="text-xs text-amber-700 underline hover:text-amber-900"
                >
                  Vẫn import (bỏ qua cảnh báo)
                </button>
              )}
              {forceImport && (
                <p className="text-xs text-amber-600 italic">
                  Đã bỏ qua cảnh báo — bạn có thể xác nhận import
                </p>
              )}
            </div>
          )}

          {/* Preview table */}
          {preview.rows.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Không có dữ liệu để preview
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium text-left">
                        Khách hàng
                      </th>
                      <th className="px-4 py-3 font-medium text-left">SĐT</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Mặc định
                      </th>
                      <th className="px-4 py-3 font-medium text-right">Sữa</th>
                      <th className="px-4 py-3 font-medium text-right">
                        Tã bỉm
                      </th>
                      <th className="px-4 py-3 font-medium text-right">
                        Tổng
                      </th>
                      <th className="px-4 py-3 font-medium text-center">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {preview.rows.map((row: CustomerPreviewRow) => (
                      <tr
                        key={row.phone}
                        className={
                          row.matched ? "hover:bg-gray-50" : "bg-orange-50/50"
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-sm">
                            {row.customerDbName ?? row.customerName}
                          </div>
                          {row.customerDbName &&
                            row.customerDbName !== row.customerName && (
                              <div className="text-xs text-gray-400">
                                xlsx: {row.customerName}
                              </div>
                            )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          {row.phone}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.matched && row.pointsDefault > 0 ? (
                            <span className="font-medium text-gray-900">
                              +{row.pointsDefault}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.matched && row.pointsSua > 0 ? (
                            <span className="font-medium text-blue-600">
                              +{row.pointsSua}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.matched && row.pointsTaBim > 0 ? (
                            <span className="font-medium text-purple-600">
                              +{row.pointsTaBim}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {row.matched
                            ? `+${row.pointsDefault + row.pointsSua + row.pointsTaBim}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.matched ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Khớp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              <AlertCircle className="h-3 w-3" />
                              Không tìm thấy
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Confirm button */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-500">
              {matchedRows.length > 0
                ? `${matchedRows.length} khách hàng sẽ được cộng điểm`
                : "Không có khách hàng nào được cộng điểm"}
            </p>
            <Button
              onClick={handleConfirm}
              disabled={
                !canConfirm &&
                !(forceImport && matchedRows.length > 0) ||
                isConfirming
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConfirming
                ? "Đang xử lý..."
                : `Xác nhận import (${matchedRows.length} khách)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
