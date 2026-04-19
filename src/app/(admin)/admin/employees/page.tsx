import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nhân viên - BongShop",
  description: "Quản lý nhân viên BongShop",
};

export default function EmployeesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Quản lý nhân viên
      </h1>
      <p className="text-gray-600">Module nhân viên — sẽ triển khai ở Sprint 1 (TASK-004).</p>
    </div>
  );
}
