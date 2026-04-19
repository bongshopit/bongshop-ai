import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khách hàng - BongShop",
  description: "Quản lý khách hàng BongShop",
};

export default function CustomersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Khách hàng
      </h1>
      <p className="text-gray-600">Module khách hàng — sẽ triển khai ở Sprint 2 (TASK-008).</p>
    </div>
  );
}
