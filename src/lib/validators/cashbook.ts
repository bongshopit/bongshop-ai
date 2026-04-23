import { z } from "zod";

const today = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const cashTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"], {
    errorMap: () => ({ message: "Loại giao dịch không hợp lệ" }),
  }),
  amount: z.coerce
    .number({ invalid_type_error: "Số tiền phải là số" })
    .positive("Số tiền phải > 0"),
  description: z
    .string()
    .min(1, "Mô tả không được trống")
    .max(500, "Tối đa 500 ký tự"),
  category: z.string().max(100, "Tối đa 100 ký tự").optional(),
  date: z.coerce
    .date({ errorMap: () => ({ message: "Ngày không hợp lệ" }) })
    .refine((d) => d <= today(), {
      message: "Ngày giao dịch không được ở tương lai",
    }),
});

export type CashTransactionInput = z.infer<typeof cashTransactionSchema>;
