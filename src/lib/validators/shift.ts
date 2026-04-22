import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const shiftSchema = z.object({
  name: z.string().min(1, "Ten ca khong duoc trong").max(50, "Toi da 50 ky tu"),
  startTime: z.string().regex(timeRegex, "Gio bat dau khong hop le (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Gio ket thuc khong hop le (HH:mm)"),
});

export const shiftAssignmentSchema = z.object({
  employeeId: z.string().min(1, "Vui long chon nhan vien"),
  shiftId: z.string().min(1, "Vui long chon ca"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngay khong hop le"),
});

export type ShiftInput = z.infer<typeof shiftSchema>;
export type ShiftAssignmentInput = z.infer<typeof shiftAssignmentSchema>;
