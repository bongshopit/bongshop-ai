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
});

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
