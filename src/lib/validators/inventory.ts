import { z } from "zod";

export const productSchema = z.object({
  sku: z
    .string()
    .min(1, "Mã SKU không được trống")
    .max(50, "Tối đa 50 ký tự")
    .regex(/^[A-Za-z0-9_-]+$/, "SKU chỉ chứa chữ cái, số, gạch dưới, gạch ngang"),
  name: z.string().min(1, "Tên sản phẩm không được trống").max(200, "Tối đa 200 ký tự"),
  description: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
  unit: z.string().min(1, "Đơn vị không được trống").max(20, "Tối đa 20 ký tự"),
  costPrice: z.coerce
    .number({ invalid_type_error: "Giá nhập phải là số" })
    .min(0, "Giá nhập phải >= 0"),
  sellPrice: z.coerce
    .number({ invalid_type_error: "Giá bán phải là số" })
    .min(0, "Giá bán phải >= 0"),
});

export const stockInSchema = z.object({
  productId: z.string().min(1, "Chọn sản phẩm"),
  quantity: z.coerce
    .number({ invalid_type_error: "Số lượng phải là số" })
    .int("Số lượng phải là số nguyên")
    .min(1, "Số lượng phải >= 1"),
  reason: z.string().max(500, "Tối đa 500 ký tự").optional(),
});

export const stockOutSchema = z.object({
  productId: z.string().min(1, "Chọn sản phẩm"),
  quantity: z.coerce
    .number({ invalid_type_error: "Số lượng phải là số" })
    .int("Số lượng phải là số nguyên")
    .min(1, "Số lượng phải >= 1"),
  reason: z.string().max(500, "Tối đa 500 ký tự").optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type StockInInput = z.infer<typeof stockInSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
