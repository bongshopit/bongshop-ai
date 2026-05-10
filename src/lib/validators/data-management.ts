import { z } from "zod";

export const CONFIRM_DELETE_PHRASE = "XÓA TẤT CẢ";
export const CONFIRM_RESTORE_PHRASE = "RESTORE";
export const BACKUP_VERSION = "1";
// Giới hạn upload: 10MB cho gzip (~80MB JSON tương đương), 50MB cho raw JSON (backward compat)
export const MAX_GZIP_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_JSON_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
/** @deprecated dùng MAX_GZIP_SIZE_BYTES / MAX_JSON_SIZE_BYTES */
export const MAX_BACKUP_SIZE_BYTES = MAX_JSON_SIZE_BYTES;

export const deleteAllDataSchema = z.object({
  confirmPhrase: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val === CONFIRM_DELETE_PHRASE, {
      message: `Vui lòng nhập chính xác "${CONFIRM_DELETE_PHRASE}" để xác nhận`,
    }),
});

const recordArray = z.array(z.record(z.unknown())).default([]);

export const backupFileSchema = z.object({
  version: z.literal(BACKUP_VERSION, {
    errorMap: () => ({
      message: "File backup không tương thích (version khác)",
    }),
  }),
  exportedAt: z.string(),
  data: z.object({
    loyaltySettings: recordArray,
    productGroups: recordArray,
    products: recordArray,
    shifts: recordArray,
    employees: recordArray,
    shiftAssignments: recordArray,
    attendances: recordArray,
    payrolls: recordArray,
    payrollAdjustments: recordArray,
    customers: recordArray,
    orders: recordArray,
    orderItems: recordArray,
    loyaltyLogs: recordArray,
    customerStorages: recordArray,
    customerStorageItems: recordArray,
    cashTransactions: recordArray,
  }),
});

export type BackupFile = z.infer<typeof backupFileSchema>;
