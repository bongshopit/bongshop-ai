import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CustomerForm } from "@/components/shared/customer-form";
import { updateCustomer } from "@/actions/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  if (!customer) return { title: "Không tìm thấy - BongShop" };
  return {
    title: `Sửa ${customer.name} - BongShop`,
    description: `Cập nhật thông tin khách hàng ${customer.name}`,
  };
}

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
  });

  if (!customer) notFound();

  async function updateAction(formData: FormData) {
    "use server";
    return updateCustomer(params.id, formData);
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/customers/${customer.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quay lại chi tiết
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Sửa thông tin: {customer.name}
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Thông tin khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            customer={customer}
            action={updateAction}
            cancelHref={`/admin/customers/${customer.id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
