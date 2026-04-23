import { z } from "zod";

export const customerCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Tên không được trống")
    .max(100, "Tối đa 100 ký tự"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{10,11}$/.test(val), {
      message: "SĐT không hợp lệ (10-11 chữ số)",
    }),
  email: z
    .string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Email không hợp lệ",
    }),
  address: z.string().max(200, "Tối đa 200 ký tự").optional(),
  note: z.string().max(500, "Tối đa 500 ký tự").optional(),
});

export const customerUpdateSchema = customerCreateSchema;

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
