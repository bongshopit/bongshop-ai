import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sổ quỹ - BongShop",
  description: "Quản lý sổ quỹ BongShop",
};

export default function CashbookPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sổ quỹ</h1>
      <p className="text-gray-600">Module sổ quỹ — sẽ triển khai ở Sprint 2 (TASK-009).</p>
    </div>
  );
}
