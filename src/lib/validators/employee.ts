import { z } from "zod";

export const employeeSchema = z
  .object({
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
    salaryType: z.enum(["HOURLY", "MONTHLY"], {
      errorMap: () => ({ message: "Loại lương không hợp lệ" }),
    }),
    hourlyRate: z.coerce
      .number({ invalid_type_error: "Lương giờ phải là số" })
      .min(0, "Lương giờ phải >= 0")
      .optional()
      .default(0),
    monthlySalary: z.coerce
      .number({ invalid_type_error: "Lương tháng phải là số" })
      .min(0, "Lương tháng phải >= 0")
      .optional()
      .default(0),
  })
  .superRefine((data, ctx) => {
    if (data.salaryType === "HOURLY" && (!data.hourlyRate || data.hourlyRate <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hourlyRate"],
        message: "Lương giờ phải > 0 khi chọn lương theo giờ",
      });
    }
    if (data.salaryType === "MONTHLY" && (!data.monthlySalary || data.monthlySalary <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["monthlySalary"],
        message: "Lương tháng phải > 0 khi chọn lương theo tháng",
      });
    }
  });

export type EmployeeInput = z.infer<typeof employeeSchema>;
