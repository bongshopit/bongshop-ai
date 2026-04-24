"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, X, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { importCustomers } from "@/actions/customer";
import type { CustomerImportRow } from "@/lib/validators/customer";

// ─── Types ──────────────────────────────────────────────────────────────────

type ImportRowStatus = "valid" | "error" | "duplicate_in_file";

interface ImportRowResult {
  rowIndex: number;
  name: string;
  phone: string;
  address: string;
  dateOfBirth: string; // ISO "YYYY-MM-DD" hoặc ""
  gender: string;
  email: string;
  note: string;
  status: ImportRowStatus;
  errors: string[];
  parsed?: CustomerImportRow;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function excelSerialToISODate(serial: number | string): string {
  const num = Number(serial);
  if (!num || isNaN(num) || num <= 0) return "";
  // Excel epoch offset: 25569 days from 1900-01-01 to 1970-01-01
  const date = new Date((num - 25569) * 86400 * 1000);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function normalizeStr(val: unknown): string {
  return String(val ?? "").trim();
}

function parseKiotVietRows(data: unknown[][]): ImportRowResult[] {
  // Find header row index (row containing "Tên khách hàng")
  const headerIdx = data.findIndex((row) =>
    row.some((cell) => normalizeStr(cell) === "Tên khách hàng")
  );
  if (headerIdx === -1) return [];

  const header = data[headerIdx] as unknown[];
  const colName = header.findIndex((c) => normalizeStr(c) === "Tên khách hàng");
  const colPhone = header.findIndex((c) => normalizeStr(c) === "Điện thoại");
  const colAddress = header.findIndex((c) => normalizeStr(c) === "Địa chỉ");
  const colDob = header.findIndex((c) => normalizeStr(c) === "Ngày sinh");
  const colGender = header.findIndex((c) => normalizeStr(c) === "Giới tính");
  const colEmail = header.findIndex((c) => normalizeStr(c) === "Email");
  const colNote = header.findIndex((c) => normalizeStr(c) === "Ghi chú");
  const colLoyalty = header.findIndex((c) => normalizeStr(c) === "Tổng điểm");

  const dataRows = data.slice(headerIdx + 1).filter((row) =>
    row.some((cell) => normalizeStr(cell) !== "")
  );

  const seenPhones = new Set<string>();
  const results: ImportRowResult[] = [];

  dataRows.forEach((row, i) => {
    const name = colName >= 0 ? normalizeStr(row[colName]) : "";
    const phone = colPhone >= 0 ? normalizeStr(row[colPhone]) : "";
    const address = colAddress >= 0 ? normalizeStr(row[colAddress]) : "";
    const dobSerial = colDob >= 0 ? row[colDob] : "";
    const gender = colGender >= 0 ? normalizeStr(row[colGender]) : "";
    const email = colEmail >= 0 ? normalizeStr(row[colEmail]) : "";
    const note = colNote >= 0 ? normalizeStr(row[colNote]) : "";
    const dateOfBirth = dobSerial !== "" ? excelSerialToISODate(dobSerial as number) : "";
    const rawLoyalty = colLoyalty >= 0 ? row[colLoyalty] : "";
    const loyaltyPointsDefault = Math.max(0, Math.floor(Number(rawLoyalty) || 0));

    const errors: string[] = [];

    if (!name) {
      errors.push("Tên không được trống");
    }
    if (phone && !/^[0-9]{10,11}$/.test(phone)) {
      errors.push("SĐT không hợp lệ (10-11 chữ số)");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Email không hợp lệ");
    }

    let status: ImportRowStatus = "valid";

    if (errors.length > 0) {
      status = "error";
    } else if (phone && seenPhones.has(phone)) {
      status = "duplicate_in_file";
    }

    if (status === "valid" && phone) {
      seenPhones.add(phone);
    }

    const parsed: CustomerImportRow | undefined =
      status === "valid"
        ? {
            name,
            phone: phone || undefined,
            address: address || undefined,
            dateOfBirth: dateOfBirth || undefined,
            gender: (gender === "Nam" || gender === "Nữ") ? gender : undefined,
            email: email || undefined,
            note: note || undefined,
            loyaltyPointsDefault,
          }
        : undefined;

    results.push({
      rowIndex: i + 1,
      name,
      phone,
      address,
      dateOfBirth,
      gender,
      email,
      note,
      status,
      errors,
      parsed,
    });
  });

  return results;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ row }: { row: ImportRowResult }) {
  if (row.status === "valid") {
    return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
  }
  if (row.status === "duplicate_in_file") {
    return (
      <div className="flex items-center gap-1">
        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
        <span className="text-xs text-yellow-700">Trùng SĐT</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
      <span className="text-xs text-red-700">{row.errors.join(", ")}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CustomerImportDialog() {
  const [open, setOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRowResult[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => r.status === "valid");
  const errorRows = rows.filter((r) => r.status === "error");
  const duplicateRows = rows.filter((r) => r.status === "duplicate_in_file");
  const previewRows = rows.slice(0, 20);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setRows([]);
    setTotalRows(0);

    if (
      file.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      setFileError("Chỉ chấp nhận file .xlsx");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File quá lớn (tối đa 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<unknown[]>(ws, {
          header: 1,
          defval: "",
        });

        // Check header
        const headerIdx = data.findIndex((row) =>
          (row as unknown[]).some(
            (cell) => String(cell).trim() === "Tên khách hàng"
          )
        );
        if (headerIdx === -1) {
          setFileError(
            "Không nhận diện được định dạng KiotViet. Vui lòng kiểm tra lại file."
          );
          return;
        }

        const dataRows = data.slice(headerIdx + 1).filter((row) =>
          (row as unknown[]).some((cell) => String(cell).trim() !== "")
        );

        if (dataRows.length > 5000) {
          setFileError("File chứa quá nhiều dòng (tối đa 5000)");
          return;
        }

        const parsed = parseKiotVietRows(data as unknown[][]);
        setTotalRows(parsed.length);
        setRows(parsed);
      } catch {
        setFileError("Có lỗi khi đọc file. Vui lòng kiểm tra lại.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleImport() {
    const toSend = validRows.map((r) => r.parsed!);
    startTransition(async () => {
      const result = await importCustomers(toSend);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(
          `Đã nhập ${result.imported} khách hàng thành công. Bỏ qua ${result.skipped} do trùng SĐT.`
        );
        handleClose();
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setRows([]);
    setTotalRows(0);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Nhập từ KiotViet
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Nhập khách hàng từ KiotViet
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* File input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn file Excel (.xlsx) xuất từ KiotViet
            </label>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {fileError && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {fileError}
              </p>
            )}
          </div>

          {/* Summary */}
          {totalRows > 0 && (
            <div className="flex items-center gap-4 text-sm p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">
                Tổng dòng: <strong>{totalRows}</strong>
              </span>
              <span className="text-green-700">
                ✅ Hợp lệ: <strong>{validRows.length}</strong>
              </span>
              {errorRows.length > 0 && (
                <span className="text-red-700">
                  ❌ Lỗi: <strong>{errorRows.length}</strong>
                </span>
              )}
              {duplicateRows.length > 0 && (
                <span className="text-yellow-700">
                  ⚠️ Trùng SĐT trong file: <strong>{duplicateRows.length}</strong>
                </span>
              )}
              {totalRows > 20 && (
                <span className="text-gray-400 text-xs">
                  (hiển thị 20/{totalRows} dòng)
                </span>
              )}
            </div>
          )}

          {/* Preview table */}
          {previewRows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Trạng thái</th>
                    <th className="px-3 py-2 font-medium">Tên KH</th>
                    <th className="px-3 py-2 font-medium">SĐT</th>
                    <th className="px-3 py-2 font-medium">Địa chỉ</th>
                    <th className="px-3 py-2 font-medium">Ngày sinh</th>
                    <th className="px-3 py-2 font-medium">Giới tính</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={
                        row.status === "error"
                          ? "bg-red-50"
                          : row.status === "duplicate_in_file"
                          ? "bg-yellow-50"
                          : ""
                      }
                    >
                      <td className="px-3 py-2 text-gray-400">{row.rowIndex}</td>
                      <td className="px-3 py-2">
                        <StatusBadge row={row} />
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900 max-w-[140px] truncate">
                        {row.name || <span className="text-red-400 italic">trống</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{row.phone || "—"}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[160px] truncate">
                        {row.address || "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{row.dateOfBirth || "—"}</td>
                      <td className="px-3 py-2 text-gray-500">{row.gender || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No valid rows warning */}
          {totalRows > 0 && validRows.length === 0 && (
            <p className="text-sm text-red-600 text-center py-2">
              Không có dòng nào hợp lệ để import
            </p>
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
            {isPending
              ? "Đang import..."
              : `Import ${validRows.length} khách hàng`}
          </Button>
        </div>
      </div>
    </div>
  );
}
