import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeForm } from "@/components/shared/employee-form";
import { createEmployee } from "@/actions/employee";

export const metadata: Metadata = {
  title: "Thêm nhân viên - BongShop",
  description: "Thêm nhân viên mới vào hệ thống BongShop",
};

export default function NewEmployeePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/employees"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Thêm nhân viên mới</h1>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Thông tin nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm action={createEmployee} cancelHref="/admin/employees" />
        </CardContent>
      </Card>
    </div>
  );
}
