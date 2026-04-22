import { z } from "zod";

export const employeeSchema = z.object({
  employeeCode: z
    .string()
    .min(1, "Mã nhân viên không được trống")
    .max(20, "Tối đa 20 ký tự"),
  firstName: z.string().min(1, "Tên không được trống").max(50, "Tối đa 50 ký tự"),
  lastName: z.string().min(1, "Họ không được trống").max(50, "Tối đa 50 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "SĐT không hợp lệ (10-11 chữ số)"),
  department: z
    .string()
    .min(1, "Phòng ban không được trống")
    .max(100, "Tối đa 100 ký tự"),
  position: z
    .string()
    .min(1, "Chức vụ không được trống")
    .max(100, "Tối đa 100 ký tự"),
  hourlyRate: z.coerce
    .number({ invalid_type_error: "Lương giờ phải là số" })
    .min(0, "Lương giờ phải >= 0"),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
