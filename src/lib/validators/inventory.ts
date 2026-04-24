import { z } from "zod";

export const productSchema = z.object({
  sku: z
    .string()
    .min(1, "Mã SKU không được trống")
    .max(50, "Tối đa 50 ký tự")
    .regex(/^[A-Za-z0-9_\-/.]+$/, "SKU chỉ chứa chữ cái, số, gạch dưới, gạch ngang, dấu chấm, gạch chéo"),
  name: z.string().min(1, "Tên sản phẩm không được trống").max(200, "Tối đa 200 ký tự"),
  description: z.string().max(1000, "Tối đa 1000 ký tự").optional(),
  unit: z.string().min(1, "Đơn vị không được trống").max(20, "Tối đa 20 ký tự"),
  costPrice: z.coerce
    .number({ invalid_type_error: "Giá nhập phải là số" })
    .min(0, "Giá nhập phải >= 0"),
  sellPrice: z.coerce
    .number({ invalid_type_error: "Giá bán phải là số" })
    .min(0, "Giá bán phải >= 0"),
  productGroupId: z.string().optional(),
  brand: z.string().max(100).optional(),
  barcode: z.string().max(50).optional(),
  allowLoyalty: z.coerce.boolean().default(true),
  isActive: z.coerce.boolean().default(true),
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

// US-010: Import từ KiotViet xlsx
export const productImportRowSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  groupName: z.string().default(""),
  brand: z.string().optional(),
  sellPrice: z.number().min(0).default(0),
  costPrice: z.number().min(0).default(0),
  quantity: z.number().int().min(0).default(0),
  unit: z.string().default("cái"),
  imageUrl: z.string().nullable().optional(),
  allowLoyalty: z.boolean().default(true),
  isActive: z.boolean().default(true),
  description: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
});

export const productGroupUpdateSchema = z.object({
  loyaltyCategory: z.enum(["DEFAULT", "SUA", "TA_BIM"]),
});

export type ProductInput = z.infer<typeof productSchema>;
export type StockInInput = z.infer<typeof stockInSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
export type ProductImportRow = z.infer<typeof productImportRowSchema>;
export type ProductGroupUpdateInput = z.infer<typeof productGroupUpdateSchema>;
