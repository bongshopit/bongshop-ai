import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ca làm việc - BongShop",
  description: "Quản lý ca làm việc BongShop",
};

export default function ShiftsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ca làm việc</h1>
      <p className="text-gray-600">Module ca làm việc — sẽ triển khai ở Sprint 1 (TASK-005).</p>
    </div>
  );
}
