import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeStatusButton } from "@/components/shared/employee-status-button";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    select: { firstName: true, lastName: true },
  });
  if (!employee) return { title: "Không tìm thấy - BongShop" };
  return {
    title: `${employee.lastName} ${employee.firstName} - BongShop`,
    description: `Chi tiết nhân viên ${employee.lastName} ${employee.firstName}`,
  };
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
  });

  if (!employee) notFound();

  const fields = [
    { label: "Mã nhân viên", value: employee.employeeCode },
    { label: "Họ tên", value: `${employee.lastName} ${employee.firstName}` },
    { label: "Email", value: employee.email },
    { label: "Số điện thoại", value: employee.phone },
    { label: "Phòng ban", value: employee.department },
    { label: "Chức vụ", value: employee.position },
    {
      label: "Lương giờ",
      value: `${Number(employee.hourlyRate).toLocaleString("vi-VN")}đ`,
    },
    {
      label: "Ngày tạo",
      value: new Date(employee.createdAt).toLocaleDateString("vi-VN"),
    },
  ];

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {employee.lastName} {employee.firstName}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                employee.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {employee.isActive ? "Đang làm" : "Đã nghỉ"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/employees/${employee.id}/edit`}>
                <Pencil className="h-4 w-4 mr-1" />
                Sửa
              </Link>
            </Button>
            <EmployeeStatusButton id={employee.id} isActive={employee.isActive} />
          </div>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {field.label}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{field.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
