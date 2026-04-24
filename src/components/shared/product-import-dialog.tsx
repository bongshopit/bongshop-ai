"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { importProducts } from "@/actions/inventory";
import type { ProductImportRow } from "@/lib/validators/inventory";

// ─── Types ──────────────────────────────────────────────────────────────────

type ImportRowStatus = "valid" | "error";

interface ImportRowResult {
  rowIndex: number;
  sku: string;
  name: string;
  groupName: string;
  status: ImportRowStatus;
  errors: string[];
  parsed?: ProductImportRow;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeStr(val: unknown): string {
  return String(val ?? "").trim();
}

function toNumber(val: unknown): number {
  const n = parseFloat(String(val ?? "").replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseKiotVietProductRows(data: unknown[][]): ImportRowResult[] {
  // Find header row: contains "Mã hàng" at column index 2
  const headerIdx = data.findIndex(
    (row) => normalizeStr(row[2]) === "Mã hàng"
  );
  if (headerIdx === -1) return [];

  const rows = data.slice(headerIdx + 1);
  const seenSkus = new Set<string>();
  const results: ImportRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const sku = normalizeStr(row[2]);
    const name = normalizeStr(row[4]);
    const groupName = normalizeStr(row[1]);

    if (!sku && !name) continue; // skip empty rows

    const errors: string[] = [];
    if (!sku) errors.push("Thiếu Mã hàng");
    if (!name) errors.push("Thiếu Tên hàng");

    // Detect duplicates in file
    if (sku && seenSkus.has(sku)) {
      errors.push(`Trùng SKU trong file (${sku})`);
    } else if (sku) {
      seenSkus.add(sku);
    }

    const sellPrice = toNumber(row[6]);
    const costPrice = toNumber(row[7]);
    const quantity = Math.floor(toNumber(row[8]));
    const unit = normalizeStr(row[13]) || "cái";
    const barcode = normalizeStr(row[3]);
    const brand = normalizeStr(row[5]);
    const description = normalizeStr(row[24]);

    // imageUrl: column 18, split by "," take first
    const imageRaw = normalizeStr(row[18]);
    const imageUrl = imageRaw ? imageRaw.split(",")[0].trim() : "";

    // allowLoyalty: column 21, 1 = true
    const allowLoyalty = String(row[21] ?? "").trim() !== "0";
    // isActive: column 22, 1 = true (empty = true)
    const isActiveRaw = String(row[22] ?? "").trim();
    const isActive = isActiveRaw === "" || isActiveRaw === "1";

    const parsed: ProductImportRow = {
      sku,
      name,
      groupName,
      brand: brand || undefined,
      sellPrice,
      costPrice,
      quantity,
      unit,
      imageUrl: imageUrl || undefined,
      allowLoyalty,
      isActive,
      description: description || undefined,
      barcode: barcode || undefined,
    };

    results.push({
      rowIndex: headerIdx + 1 + i + 1, // 1-based row in sheet
      sku,
      name,
      groupName,
      status: errors.length === 0 ? "valid" : "error",
      errors,
      parsed: errors.length === 0 ? parsed : undefined,
    });
  }

  return results;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductImportDialog() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportRowResult[]>([]);
  const [fileName, setFileName] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => r.status === "valid" && r.parsed);
  const errorRows = rows.filter((r) => r.status === "error");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn (tối đa 10MB)");
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: "",
        });

        if (data.length > 20001) {
          toast.error("File có quá nhiều dòng (tối đa 20.000 sản phẩm)");
          return;
        }

        const parsed = parseKiotVietProductRows(data as unknown[][]);
        if (parsed.length === 0) {
          toast.error('Không tìm thấy dữ liệu. Kiểm tra cột "Mã hàng" ở vị trí C.');
          return;
        }
        setRows(parsed);
      } catch {
        toast.error("Không thể đọc file. Vui lòng kiểm tra định dạng xlsx.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleClose() {
    setOpen(false);
    setRows([]);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleImport() {
    if (validRows.length === 0) return;
    startTransition(async () => {
      const result = await importProducts(validRows.map((r) => r.parsed));
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Import thành công: ${result.created} mới, ${result.updated} cập nhật, ${result.skipped} bỏ qua`
      );
      handleClose();
    });
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Import KiotViet
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Import hàng hóa từ KiotViet</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn file Excel (.xlsx)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              File xuất từ KiotViet → Hàng hóa → Xuất Excel. Cột C phải có tiêu đề "Mã hàng".
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {fileName && (
              <p className="mt-1 text-xs text-gray-500">File: {fileName}</p>
            )}
          </div>

          {/* Summary */}
          {rows.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                {validRows.length} hợp lệ
              </span>
              {errorRows.length > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {errorRows.length} lỗi (sẽ bỏ qua)
                </span>
              )}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div className="overflow-x-auto border rounded-md max-h-80">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Dòng</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">SKU</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Tên hàng</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Nhóm</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.slice(0, 100).map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.status === "error" ? "bg-red-50" : "bg-white"
                      }
                    >
                      <td className="px-3 py-1.5 text-gray-500">{row.rowIndex}</td>
                      <td className="px-3 py-1.5 font-mono text-gray-900">{row.sku}</td>
                      <td className="px-3 py-1.5 text-gray-800">{row.name}</td>
                      <td className="px-3 py-1.5 text-gray-500">{row.groupName}</td>
                      <td className="px-3 py-1.5">
                        {row.status === "valid" ? (
                          <span className="text-green-600 font-medium">✓ OK</span>
                        ) : (
                          <span className="text-red-500">{row.errors.join("; ")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length > 100 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-center text-gray-400">
                        ... và {rows.length - 100} dòng khác (preview tối đa 100 dòng)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Hủy
          </Button>
          <Button
            onClick={handleImport}
            disabled={validRows.length === 0 || isPending}
          >
            {isPending ? "Đang import..." : `Import ${validRows.length} sản phẩm`}
          </Button>
        </div>
      </div>
    </div>
  );
}
