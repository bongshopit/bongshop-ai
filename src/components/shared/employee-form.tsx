"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Employee } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/actions/employee";

interface EmployeeFormProps {
  employee?: Employee;
  action: (formData: FormData) => Promise<ActionState>;
  cancelHref: string;
}

export function EmployeeForm({
  employee,
  action,
  cancelHref,
}: EmployeeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [salaryType, setSalaryType] = useState<"HOURLY" | "MONTHLY">(
    (employee?.salaryType as "HOURLY" | "MONTHLY") ?? "HOURLY"
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError("");
    setFieldErrors({});

    startTransition(async () => {
      const result = await action(formData);
      if (result === null) {
        router.push("/admin/employees");
        router.refresh();
        return;
      }
      if (result?.error) setError(result.error);
      if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700">
            Mã nhân viên <span className="text-red-500">*</span>
          </label>
          <Input
            id="employeeCode"
            name="employeeCode"
            placeholder="NV003"
            defaultValue={employee?.employeeCode ?? ""}
            required
          />
          {fieldErrors.employeeCode?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Họ <span className="text-red-500">*</span>
          </label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Nguyễn"
            defaultValue={employee?.lastName ?? ""}
            required
          />
          {fieldErrors.lastName?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            Tên <span className="text-red-500">*</span>
          </label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Văn A"
            defaultValue={employee?.firstName ?? ""}
            required
          />
          {fieldErrors.firstName?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nhanvien@bongshop.vn"
            defaultValue={employee?.email ?? ""}
            required
          />
          {fieldErrors.email?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="0901234567"
            defaultValue={employee?.phone ?? ""}
            required
          />
          {fieldErrors.phone?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Loại lương <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4 h-10 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="salaryType"
                value="HOURLY"
                checked={salaryType === "HOURLY"}
                onChange={() => setSalaryType("HOURLY")}
                className="accent-blue-600"
              />
              <span className="text-sm">Theo giờ</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="salaryType"
                value="MONTHLY"
                checked={salaryType === "MONTHLY"}
                onChange={() => setSalaryType("MONTHLY")}
                className="accent-blue-600"
              />
              <span className="text-sm">Theo tháng</span>
            </label>
          </div>
          {fieldErrors.salaryType?.map((err) => (
            <p key={err} className="text-xs text-red-500">{err}</p>
          ))}
        </div>

        {salaryType === "HOURLY" && (
          <div className="space-y-1">
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
              Lương giờ (VNĐ) <span className="text-red-500">*</span>
            </label>
            <Input
              id="hourlyRate"
              name="hourlyRate"
              type="number"
              min="0"
              step="1000"
              placeholder="30000"
              defaultValue={employee?.salaryType === "HOURLY" ? employee.hourlyRate.toString() : ""}
            />
            {fieldErrors.hourlyRate?.map((err) => (
              <p key={err} className="text-xs text-red-500">{err}</p>
            ))}
          </div>
        )}

        {salaryType === "MONTHLY" && (
          <div className="space-y-1">
            <label htmlFor="monthlySalary" className="block text-sm font-medium text-gray-700">
              Lương tháng (VNĐ) <span className="text-red-500">*</span>
            </label>
            <Input
              id="monthlySalary"
              name="monthlySalary"
              type="number"
              min="0"
              step="100000"
              placeholder="5000000"
              defaultValue={employee?.salaryType === "MONTHLY" ? (employee as Employee & { monthlySalary: { toString(): string } }).monthlySalary.toString() : ""}
            />
            {fieldErrors.monthlySalary?.map((err) => (
              <p key={err} className="text-xs text-red-500">{err}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang lưu..." : employee ? "Cập nhật" : "Tạo nhân viên"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Hủy</Link>
        </Button>
      </div>
    </form>
  );
}
