import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeForm } from "@/components/shared/employee-form";
import { updateEmployee } from "@/actions/employee";

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
    title: `Sửa: ${employee.lastName} ${employee.firstName} - BongShop`,
  };
}

export default async function EditEmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
  });

  if (!employee) notFound();

  const boundUpdateEmployee = updateEmployee.bind(null, employee.id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/employees/${employee.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quay lại chi tiết
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Sửa nhân viên: {employee.lastName} {employee.firstName}
        </h1>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Cập nhật thông tin</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            employee={employee}
            action={boundUpdateEmployee}
            cancelHref={`/admin/employees/${employee.id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
