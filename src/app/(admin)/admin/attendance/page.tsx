import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chấm công - BongShop",
  description: "Quản lý chấm công BongShop",
};

export default function AttendancePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chấm công</h1>
      <p className="text-gray-600">Module chấm công — sẽ triển khai ở Sprint 1 (TASK-006).</p>
    </div>
  );
}
