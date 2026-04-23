import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CustomerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <h2 className="text-xl font-semibold text-gray-800">Không tìm thấy khách hàng</h2>
      <p className="text-gray-500 text-sm">Khách hàng không tồn tại hoặc đã bị xóa.</p>
      <Button asChild variant="outline">
        <Link href="/admin/customers">Quay lại danh sách</Link>
      </Button>
    </div>
  );
}
