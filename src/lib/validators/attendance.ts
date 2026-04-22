import { z } from "zod";

export const checkInSchema = z.object({
  note: z.string().max(255).optional(),
});

export const checkOutSchema = z.object({
  note: z.string().max(255).optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
