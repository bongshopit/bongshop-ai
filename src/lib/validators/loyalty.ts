import { z } from "zod";

export const LOYALTY_CATEGORIES = ["DEFAULT", "SUA", "TA_BIM"] as const;
export type LoyaltyCategory = (typeof LOYALTY_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<LoyaltyCategory, string> = {
  DEFAULT: "Mặc định",
  SUA: "Sữa",
  TA_BIM: "Tã bỉm",
};

export const CATEGORY_FIELD_MAP: Record<
  LoyaltyCategory,
  "loyaltyPointsDefault" | "loyaltyPointsSua" | "loyaltyPointsTaBim"
> = {
  DEFAULT: "loyaltyPointsDefault",
  SUA: "loyaltyPointsSua",
  TA_BIM: "loyaltyPointsTaBim",
};

export const addLoyaltyPointsSchema = z.object({
  category: z.enum(LOYALTY_CATEGORIES, { required_error: "Chọn danh mục" }),
  points: z.coerce
    .number()
    .int("Số điểm phải là số nguyên")
    .min(1, "Số điểm phải lớn hơn 0"),
  reason: z
    .string()
    .min(1, "Lý do là bắt buộc")
    .max(200, "Tối đa 200 ký tự"),
});

export const adjustLoyaltyPointsSchema = z.object({
  category: z.enum(LOYALTY_CATEGORIES, { required_error: "Chọn danh mục" }),
  type: z.enum(["ADJUST", "EXPIRE"], { required_error: "Chọn loại" }),
  delta: z.coerce.number().int("Số điểm phải là số nguyên"),
  reason: z
    .string()
    .min(1, "Lý do là bắt buộc")
    .max(200, "Tối đa 200 ký tự"),
});

export type AddLoyaltyPointsInput = z.infer<typeof addLoyaltyPointsSchema>;
export type AdjustLoyaltyPointsInput = z.infer<typeof adjustLoyaltyPointsSchema>;

// ─── Import types ─────────────────────────────────────────────────────────────

export type CustomerPreviewRow = {
  phone: string;
  customerName: string;
  customerId: string | null;
  customerDbName: string | null;
  pointsDefault: number;
  pointsSua: number;
  pointsTaBim: number;
  invoiceIds: string[];
  matched: boolean;
};

export type ParsePreviewResponse = {
  rows: CustomerPreviewRow[];
  stats: {
    totalInvoices: number;
    matchedCustomers: number;
    unmatchedCustomers: number;
    noPhoneRows: number;
    totalPoints: number;
  };
  duplicateInvoices: string[];
  error?: string;
};

export const confirmImportRowSchema = z.object({
  customerId: z.string().min(1),
  pointsDefault: z.number().int().min(0),
  pointsSua: z.number().int().min(0),
  pointsTaBim: z.number().int().min(0),
  invoiceIds: z.array(z.string()),
});

export type ConfirmImportRow = z.infer<typeof confirmImportRowSchema>;
