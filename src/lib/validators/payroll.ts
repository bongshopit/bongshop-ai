import { z } from "zod";

const currentYear = new Date().getFullYear();

export const payrollCalculateSchema = z.object({
  month: z.coerce
    .number({ invalid_type_error: "Tháng phải là số" })
    .int()
    .min(1, "Tháng từ 1–12")
    .max(12, "Tháng từ 1–12"),
  year: z.coerce
    .number({ invalid_type_error: "Năm phải là số" })
    .int()
    .min(2020, "Năm phải >= 2020")
    .max(currentYear, `Năm không được vượt quá ${currentYear}`),
  // AC-6.1b: optional — khi rỗng/không truyền thì tính tất cả nhân viên
  employeeId: z.string().optional(),
});

// AC-6.5: Thêm khoản điều chỉnh
export const payrollAdjustmentSchema = z.object({
  label: z.string().min(1, "Tên khoản không được để trống").max(100, "Tên khoản tối đa 100 ký tự"),
  amount: z.coerce
    .number({ invalid_type_error: "Số tiền phải là số" })
    .positive("Số tiền phải lớn hơn 0"),
  type: z.enum(["ADD", "SUBTRACT"], {
    errorMap: () => ({ message: "Loại phải là Cộng hoặc Trừ" }),
  }),
});

// AC-6.7: Thêm nhiều khoản điều chỉnh cùng lúc
export const payrollAdjustmentBatchSchema = z
  .array(payrollAdjustmentSchema)
  .min(1, "Cần ít nhất 1 khoản hợp lệ");

export type PayrollAdjustmentInput = z.infer<typeof payrollAdjustmentSchema>;
export type PayrollAdjustmentBatchInput = z.infer<typeof payrollAdjustmentBatchSchema>;

export const payrollAdjustSchema = z.object({
  allowance: z.coerce
    .number({ invalid_type_error: "Phụ cấp phải là số" })
    .min(0, "Phụ cấp phải >= 0"),
  deduction: z.coerce
    .number({ invalid_type_error: "Khấu trừ phải là số" })
    .min(0, "Khấu trừ phải >= 0"),
});

export type PayrollCalculateInput = z.infer<typeof payrollCalculateSchema>;
export type PayrollAdjustInput = z.infer<typeof payrollAdjustSchema>;
