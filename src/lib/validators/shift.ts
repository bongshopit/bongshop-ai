import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const shiftSchema = z.object({
  name: z.string().min(1, "Tên ca không được trống").max(50, "Tối đa 50 ký tự"),
  startTime: z.string().regex(timeRegex, "Giờ bắt đầu không hợp lệ (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Giờ kết thúc không hợp lệ (HH:mm)"),
});

export const shiftAssignmentSchema = z.object({
  employeeId: z.string().min(1, "Vui lòng chọn nhân viên"),
  shiftId: z.string().min(1, "Vui lòng chọn ca"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
});

export type ShiftInput = z.infer<typeof shiftSchema>;
export type ShiftAssignmentInput = z.infer<typeof shiftAssignmentSchema>;
