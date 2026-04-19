import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tồn kho - BongShop",
  description: "Quản lý tồn kho BongShop",
};

export default function InventoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tồn kho</h1>
      <p className="text-gray-600">Module tồn kho — sẽ triển khai ở Sprint 2 (TASK-007).</p>
    </div>
  );
}
