import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CustomerForm } from "@/components/shared/customer-form";
import { createCustomer } from "@/actions/customer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Thêm khách hàng - BongShop",
  description: "Tạo khách hàng mới",
};

export default function NewCustomerPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/customers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Thêm khách hàng</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Thông tin khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm action={createCustomer} cancelHref="/admin/customers" />
        </CardContent>
      </Card>
    </div>
  );
}
